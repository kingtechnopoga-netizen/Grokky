# Grokky

A tiny single-page chat app that uses [Grok](https://x.ai/) via [Puter.js](https://developer.puter.com/tutorials/free-unlimited-grok-api/) — no API key, no backend, no signup for you.

## How it works

Puter.js uses a **"User-Pays"** model: your end-user signs in to their (free) Puter account once in the browser, and Grok usage is billed to them — not to you. That means you can ship `index.html` as a static file with zero server-side setup.

The page calls `puter.ai.chat()` with streaming + multi-turn history:

```js
const response = await puter.ai.chat(history, {
  model: 'x-ai/grok-4.3',
  stream: true,
});

for await (const part of response) {
  console.log(part.text);
}
```

## Deploy to Render (free)

This repo includes a [`render.yaml`](./render.yaml) Blueprint that deploys it as a **Static Site** — free tier, no spin-down, auto-deploys on every push to `main`.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kingtechnopoga-netizen/Grokky)

Or manually:

1. Go to <https://dashboard.render.com/> → **New** → **Blueprint**
2. Connect your GitHub and pick `kingtechnopoga-netizen/Grokky`
3. Render reads `render.yaml`, creates the static site, and deploys it
4. After ~30 seconds you get a live URL like `https://grokky.onrender.com`

That's it — no build command, no env vars, no backend. Puter.js handles auth and billing in the user's browser.

> Note: don't pick the **Web Service** option — this app is pure HTML/JS, so a Static Site is faster, free, and never sleeps.

## Run it locally

It's just one HTML file. Pick whichever is easiest:

**Option 1 — open directly**

```bash
# macOS
open index.html
# Linux
xdg-open index.html
# Windows
start index.html
```

**Option 2 — serve locally** (recommended; some browsers restrict `file://` for fetch/auth popups)

```bash
# Python
python3 -m http.server 8000

# Node (no install)
npx --yes serve .
```

Then visit <http://localhost:8000>.

The first time you send a message, Puter will open a popup asking you to sign in / approve. After that it just works.

## Models available

Edit the `<select>` in `index.html` or pass any of these to `model:`

- `x-ai/grok-4.3`
- `x-ai/grok-4-1-fast`
- `x-ai/grok-3`
- `x-ai/grok-3-mini`
- `x-ai/grok-2`
- `x-ai/grok-2-image` (image generation — different API: `puter.ai.txt2img`)

See the full tutorial: <https://developer.puter.com/tutorials/free-unlimited-grok-api/>
