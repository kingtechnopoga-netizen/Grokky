// grokky-api — minimal Anthropic proxy.
//
// Why this exists:
//   The frontend is a static site. Embedding an Anthropic key there would
//   leak it to anyone who opens DevTools, and the Anthropic API blocks
//   browser requests by default (CORS). So we keep the key on the server
//   and expose one tiny endpoint:  POST /api/enhance  { prompt }  ->  { enhanced }
//
// Env vars:
//   ANTHROPIC_API_KEY   (required) your Anthropic key, set in Render dashboard
//   ALLOWED_ORIGINS     (optional) comma-separated list of allowed CORS origins,
//                                  e.g. "https://grokky.onrender.com,http://localhost:8000"
//                                  default "*" (lock this down once you have a domain)
//   CLAUDE_MODEL        (optional) default "claude-3-5-haiku-latest"
//   PORT                (optional) default 10000
//
// Health check:  GET /healthz

import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const port = Number(process.env.PORT) || 10000;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '32kb' }));

// Trust the proxy in front of us (Render adds X-Forwarded-For etc.) so req.ip works.
app.set('trust proxy', 1);

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    '[grokky-api] WARNING: ANTHROPIC_API_KEY is not set. /api/enhance will return 500 until you set it.'
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest';

// System prompt for the enhancer. Tight rules so Claude returns exactly one
// usable image-gen prompt and nothing else.
const SYSTEM_PROMPT = `You are an expert text-to-image prompt engineer.

Given a short user idea, expand it into ONE single rich, vivid, detailed prompt
suitable for a modern text-to-image model.

Rules:
- Output ONLY the prompt itself. No preamble, no quotes, no explanations, no labels.
- Stay under 80 words.
- Stay faithful to the user's intent. Do not invent unrelated subjects.
- Include, where it helps: subject, action, setting, mood, lighting, color
  palette, art style or medium, and camera details (lens, angle) if photographic.
- Refuse anything that would generate sexual content involving minors,
  non-consensual sexual content, or instructions for real-world harm. In those
  cases, output exactly: REFUSED`;

// --- simple per-IP sliding-window rate limit -------------------------------
const buckets = new Map();
const LIMIT = 30; // requests
const WINDOW_MS = 60_000; // per minute

function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    res.set('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests. Wait a minute.' });
  }
  recent.push(now);
  buckets.set(ip, recent);
  next();
}

// Periodically prune empty buckets so the map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of buckets) {
    const fresh = times.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) buckets.delete(ip);
    else buckets.set(ip, fresh);
  }
}, WINDOW_MS).unref();

// --- routes ----------------------------------------------------------------
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post('/api/enhance', rateLimit, async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    if (prompt.length > 1000) return res.status(400).json({ error: 'prompt too long (max 1000 chars)' });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY.' });
    }

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (msg.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!text) return res.status(502).json({ error: 'Empty response from Claude.' });
    if (text === 'REFUSED') {
      return res.status(400).json({ error: 'Prompt was refused by the safety filter.' });
    }

    return res.json({
      enhanced: text,
      model: msg.model,
      usage: msg.usage, // input_tokens / output_tokens — handy for cost monitoring
    });
  } catch (err) {
    console.error('[enhance] error:', err);
    const status = Number(err?.status) || 500;
    const message = err?.message || 'internal error';
    return res.status(status).json({ error: message });
  }
});

// 404 for anything else under /api
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(port, () => {
  console.log(`[grokky-api] listening on :${port}  model=${MODEL}  origins=${ALLOWED_ORIGINS.join(',')}`);
});
