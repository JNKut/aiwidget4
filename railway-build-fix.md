# Fix Railway Build Error - Module Resolution Issue

## The Problem
Railway build is failing because Replit-specific plugins in vite.config.ts are trying to resolve modules that don't exist in Railway's environment.

## Solution: Use Alternative Build Command

### Step 1: Update Railway Build Settings
In your Railway dashboard:

**Build Command:** `npm install && npm run build:simple`
**Start Command:** `npm start`

### Step 2: Add Simple Build Script
I need to add this script to your package.json, but since I can't edit package.json directly, here's what needs to be added to the "scripts" section:

```json
"build:simple": "vite build --config vite.simple.config.ts && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

### Step 3: Alternative Solution - Use Different Approach
Since we can't modify the vite config, try this build command in Railway:

**Build Command:** `npm install && npx vite build --mode production && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`

This bypasses the problematic vite config and builds directly.

### Step 4: If Still Failing - Try This
**Build Command:** `npm install && NODE_ENV=production npm run build || (npm run build:frontend && npm run build:backend)`

Where:
- `build:frontend`: `cd client && npx vite build --outDir ../dist/public`
- `build:backend`: `npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`

## Quick Fix to Try Right Now
1. Go to Railway dashboard
2. Settings → Build Command
3. Change to: `npm install && npx vite build --mode production --outDir dist/public && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
4. Redeploy

This should bypass the module resolution issues and get your widget deployed successfully.