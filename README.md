# Grokky

A free single-page chat & image generation app, with an **optional Claude prompt-enhancer** that turns short ideas into rich image-generation prompts.

- **Chat & images:** Free, keyless [Pollinations.ai](https://pollinations.ai)
- **Optional ✨ prompt enhancer:** Anthropic Claude (your key, your bill, kept safe on a tiny backend)

## What you get

| | Pollinations only | Pollinations + Claude enhancer |
|---|---|---|
| Cost to run | Free | A few cents per 1000 prompts (Claude Haiku) |
| API key needed? | None | Anthropic key (server-side only) |
| Image quality | Good | **Much better** — Claude expands "a cat astronaut" into a rich detailed prompt before generation |

## Architecture

```
            ┌─────────────────────────────────┐
  Browser ──┤ index.html  (static, on Render) │
            └────────┬────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
  Pollinations.ai             grokky-api  (Node, on Render)
  text + image                 │   ANTHROPIC_API_KEY (secret)
  (no key)                     ▼
                           Anthropic API
                           (Claude Haiku)
```

**The Anthropic key never touches the browser.** The frontend posts the user's short prompt to `grokky-api`, which calls Claude server-side and returns the enhanced text. That enhanced prompt is then sent to Pollinations as a normal URL.

## Features

- **Chat mode** with streaming responses, full markdown, and code highlighting
- **Image mode** — toggle the picture icon to generate any prompt
- **✨ Claude enhancer** — optional toggle (next to the picture icon, image mode only) that asks Claude to expand short ideas into detailed image prompts. Original + enhanced prompts are both shown above each image
- **Per-image actions:** Download · Copy URL · Open · New seed (regenerate)
- **Per-message actions:** Copy · Retry
- **Dark / light theme**, follows system preference, saved to localStorage
- **Multi-turn history** persists across reloads
- **Stop button** mid-stream
- **Mobile-first**: safe-area insets, virtual keyboard handling, no iOS zoom on focus

## Deploy on Render

This repo includes a [`render.yaml`](./render.yaml) Blueprint that deploys both services in one click.

1. Click **Deploy to Render** (or: dashboard → **New** → **Blueprint** → pick this repo → **Apply**).
2. Render creates **two** services:
   - `grokky` — the static frontend (free, no spin-down)
   - `grokky-api` — the Node backend (free, **does** spin down after 15 min idle, ~30s cold start)
3. Open the `grokky-api` service in the dashboard → **Environment** → set `ANTHROPIC_API_KEY` to your key from <https://console.anthropic.com/>.
4. Copy the `grokky-api` URL (e.g. `https://grokky-api.onrender.com`).
5. Open your deployed `grokky` site, click the **gear icon** in the header, and paste that URL. Done — the ✨ button now lights up the enhancer.

> Alternative: edit `<meta name="grokky-api" content="">` in `index.html` before deploying so the URL ships baked in.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kingtechnopoga-netizen/Grokky)

## Run it locally

```bash
git clone https://github.com/kingtechnopoga-netizen/Grokky.git
cd Grokky

# Frontend (just static files)
python3 -m http.server 8000
# Now open http://localhost:8000

# Backend (only if you want the Claude enhancer)
cd server
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm install
npm start
# listening on :10000
```

When the page is on `localhost`, it auto-points the enhancer at `http://localhost:10000`. No config needed.

## ⚠️ A few honest warnings

- **Pollinations is community-funded.** Usually fast, sometimes slow. No SLA. The free chat model is `openai-fast` (GPT-OSS 20B) — capable but not GPT-5/Claude.
- **Render free backend cold starts.** The first enhancer call after 15 minutes of inactivity takes ~30 seconds. Subsequent calls are instant.
- **Lock down `ALLOWED_ORIGINS`.** Out of the box it's `*` for convenience. After deploy, set it to your static site's URL (e.g. `https://grokky.onrender.com`) so random websites can't burn your Anthropic credits.
- **Watch your usage.** Claude Haiku is cheap (~$0.25 / $1.25 per million tokens in/out) but a runaway loop or scraper could still rack up bills. The backend has a per-IP rate limit (30 req/min) but you should also set a monthly spending cap in the [Anthropic console](https://console.anthropic.com/settings/limits).

## How the API integration looks

**Frontend → backend** (only when ✨ enhancer is on):
```js
fetch(`${API_BASE}/api/enhance`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a cat astronaut' }),
}).then(r => r.json());
// → { enhanced: "A photorealistic ginger tabby in a NASA spacesuit...", model, usage }
```

**Backend → Anthropic** (server-side, key never leaves):
```js
const msg = await anthropic.messages.create({
  model: 'claude-3-5-haiku-latest',
  max_tokens: 300,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: prompt }],
});
```

**Frontend → Pollinations** (no key, no proxy):
```js
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true`;
document.body.innerHTML = `<img src="${url}">`;
```

## Want to swap providers?

The enhancer is one fetch call to one endpoint. You can replace the backend with any LLM (OpenAI, Gemini, Groq, Ollama) by changing ~30 lines in `server/server.js`. Open an issue and I'll wire it up.

## Credits

UI: vanilla HTML/CSS/JS. Markdown via [marked](https://marked.js.org), sanitized with [DOMPurify](https://github.com/cure53/DOMPurify), syntax highlighting via [highlight.js](https://highlightjs.org). Image generation by [Pollinations.ai](https://pollinations.ai). Prompt enhancement by [Anthropic Claude](https://www.anthropic.com/).
