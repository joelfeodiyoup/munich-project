# CORS Proxy Setup for Munich Kitas API

The Munich Kitas API (`kitafinder.muenchen.de`) doesn't include CORS headers, so browser requests from other domains are blocked. Here are your options:

## Option 1: Public CORS Proxy (Current - Quick Fix)

**Current implementation uses `corsproxy.io`:**
- ✅ Works immediately, no setup required
- ✅ Free
- ⚠️ Not recommended for production (rate limits, reliability concerns)
- ⚠️ Third-party service processes your requests

The code will try to use `VITE_CORS_PROXY` env variable or fallback to `https://corsproxy.io/?`

**Alternative public proxies you can try:**
- `https://api.allorigins.win/raw?url=`
- `https://corsproxy.io/?`
- `https://api.codetabs.com/v1/proxy?quest=`

To switch proxies, set in your `.env` file:
```bash
VITE_CORS_PROXY=https://api.allorigins.win/raw?url=
```

## Option 2: Cloudflare Workers (Recommended for Production)

Free, reliable, and you control it. Setup takes 5 minutes:

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler login
```

### Step 3: Create Worker
```bash
mkdir cors-proxy-worker
cd cors-proxy-worker
wrangler init
```

### Step 4: Add this code to `src/index.js`:
```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Only allow Munich Kitas API
    if (!targetUrl.startsWith('https://kitafinder.muenchen.de/')) {
      return new Response('Unauthorized domain', { status: 403 });
    }

    const response = await fetch(targetUrl);
    const newResponse = new Response(response.body, response);

    // Add CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return newResponse;
  }
};
```

### Step 5: Deploy
```bash
wrangler deploy
```

You'll get a URL like: `https://cors-proxy.YOUR-SUBDOMAIN.workers.dev`

### Step 6: Update your app
In `/home/joel/munich-project/frontend/.env`:
```bash
VITE_CORS_PROXY=https://cors-proxy.YOUR-SUBDOMAIN.workers.dev/?url=
```

## Option 3: Vercel/Netlify Serverless Function

If you deploy to Vercel or Netlify instead of GitHub Pages, you can add a serverless function:

**Vercel:** Create `/api/proxy.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  if (!url.startsWith('https://kitafinder.muenchen.de/')) {
    return res.status(403).json({ error: 'Unauthorized domain' });
  }

  const response = await fetch(url);
  const data = await response.json();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}
```

Then update `VITE_CORS_PROXY=https://your-app.vercel.app/api/proxy?url=`

## Current Status

The app currently uses `corsproxy.io` which works but is not ideal for production. Consider setting up Cloudflare Workers (Option 2) before going live.
