# Grokky

A free, single-page chat & image generation app. **No API key. No signup. No paid credits.**

Powered by [Pollinations.ai](https://pollinations.ai), an open-source AI platform that exposes anonymous-tier endpoints with no auth required.

## What you get

| | Pollinations.ai (this app) | Puter.js | OpenAI / xAI direct |
|---|---|---|---|
| Cost to you (developer) | Free | Free | Pay per token |
| Cost to end users | **$0** | $0.005-$0.07 per image | N/A |
| User signup | **None** | Required | Required |
| API key | **None** | None (uses user's account) | Required |
| Image generation | ✅ Unlimited | ✅ Per-credit | ✅ Per-credit |
| Streaming chat | ✅ | ✅ | ✅ |

## How it works

Two endpoints, both keyless:

```js
// Chat — OpenAI-compatible, streaming
fetch('https://text.pollinations.ai/openai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'openai-fast',          // GPT-OSS 20B (anonymous tier)
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  }),
});

// Image — just a URL, no code needed
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent('a red cat')}?width=1024&height=1024&nologo=true`;
document.body.innerHTML = `<img src="${url}">`;
```

That's the whole "API integration." Images are returned as JPEG directly; you can drop the URL into any `<img>` tag.

## Features

- **Chat mode** with streaming responses and full markdown / code highlighting
- **Image mode** — toggle the picture icon to generate any prompt
- **Per-image actions:** Download · Copy URL · Open · New seed (regenerate)
- **Per-message:** Copy · Retry
- **Dark / light theme**, follows system preference, saved to localStorage
- **Multi-turn history** persists across reloads
- **Stop button** mid-stream
- **Mobile-first**: safe-area insets, virtual keyboard handling, 16px input (no iOS zoom)

## Deploy on Render (free)

This repo includes a [`render.yaml`](./render.yaml) Blueprint. Static Site, free tier, no spin-down.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kingtechnopoga-netizen/Grokky)

Or manually: <https://dashboard.render.com/> → **New** → **Blueprint** → pick this repo → **Apply**.

## Run it locally

```bash
git clone https://github.com/kingtechnopoga-netizen/Grokky.git
cd Grokky
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` in a browser — both endpoints are CORS-enabled.

## Limits and trade-offs

Being honest about what "free unlimited" actually means here:

- **One chat model**: `openai-fast` (GPT-OSS 20B). It's a capable open model, but not GPT-5 or Claude. If you want premium models, you'll need a free Pollinations.ai account at <https://enter.pollinations.ai> for a key.
- **Image model**: Pollinations routes to whatever's available (currently **Sana**). Quality is good for casual use, not photoreal-pro.
- **No SLA**: Pollinations is community-funded. It's been reliable for years but it's not Google.
- **Generous but not literally infinite**: They don't publish hard rate limits for the anonymous tier, but be reasonable.

## Want premium models without paying?

Other free options to swap in:

- **Groq** — generous free tier, signup required, fast Llama / Mixtral
- **Google Gemini** free tier — 1M tokens/day
- **OpenRouter** — has free models (Qwen, Llama variants), signup required
- **Self-host Ollama** — fully free, runs on your own machine

I can rebuild the app on any of these — just say which.

## Credits

UI built with vanilla HTML/CSS/JS. Markdown via [marked](https://marked.js.org), sanitized with [DOMPurify](https://github.com/cure53/DOMPurify), syntax highlighting via [highlight.js](https://highlightjs.org). AI courtesy of [Pollinations.ai](https://pollinations.ai).
