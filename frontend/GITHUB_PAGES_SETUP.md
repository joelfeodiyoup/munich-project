# GitHub Pages Setup Guide

## Local Testing (Do this first!)

### 1. Build the static site
```bash
npm run build:static
```

This creates a `dist/` folder with:
- `index.html` - Entry point
- `assets/` - CSS and JavaScript bundles
- `sql-wasm.wasm` - SQLite WebAssembly
- Your data files

### 2. Preview locally
```bash
npm run preview:static
```

Then open http://localhost:4173 (or whatever port it says)

Test everything:
- Map loads
- Filters work
- Data shows up
- Pan/zoom works
- Clusters appear

### 3. Test with a local HTTP server (alternative)
```bash
cd dist
python3 -m http.server 8000
# or
npx serve
```

Open http://localhost:8000

---

## GitHub Pages Deployment

Once local testing works:

### Option 1: Deploy from dist folder (Recommended)

1. **Create/update `.gitignore`** to NOT ignore `dist/` for your main branch:
   ```
   # Remove dist from .gitignore or use a separate gh-pages branch
   ```

2. **Build and commit**:
   ```bash
   npm run build:static
   git add dist
   git commit -m "Build static site for GitHub Pages"
   git push
   ```

3. **GitHub Settings**:
   - Go to your repo → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` → `/dist` folder
   - Save

### Option 2: Use gh-pages branch (Cleaner)

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**:
   ```json
   "scripts": {
     "deploy": "npm run build:static && gh-pages -d dist"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

   This creates/updates a `gh-pages` branch with just your built files.

4. **GitHub Settings**:
   - Go to repo → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` → `/ (root)`
   - Save

---

## Custom Domain (Optional)

1. Add a `CNAME` file to `public/` folder:
   ```
   your-domain.com
   ```

2. In your DNS settings, add a CNAME record pointing to `username.github.io`

3. In GitHub Settings → Pages, enter your custom domain

---

## Base Path (If deploying to username.github.io/repo-name)

If your site is at `https://username.github.io/repo-name/` (not the root):

1. Edit `vite.config.static.ts`:
   ```typescript
   base: '/repo-name/',
   ```

2. Rebuild:
   ```bash
   npm run build:static
   ```

---

## Troubleshooting

**Map doesn't load:**
- Check browser console for errors
- Verify `sql-wasm.wasm` file is in `dist/` root
- Check data files are included

**404 on refresh:**
- GitHub Pages doesn't support SPA routing by default
- Add a `404.html` that redirects to `index.html` (we're SPA so this works)

**Blank page:**
- Check base path in vite config matches your URL structure
- Check browser console for loading errors

---

## File Size Warning

The bundle is ~4.4MB because it includes your entire kitas dataset. This is fine for:
- Static hosting (no per-request cost)
- One-time download (cached after first visit)
- No database needed

If you want to reduce it:
- Move data to a separate JSON file
- Load data on-demand
- Use code splitting for the map component
