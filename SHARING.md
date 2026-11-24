# Sharing & selling SHEDITHERS

SHEDITHERS is a static web app: plain HTML/CSS/JS files with no server code. Any free static host can serve it, and once it's online people can **install it as an app** from their browser (the INSTALL button appears in the top bar).

## 1. Build the package
Double-click **`package.bat`**. It creates `dist/shedithers-web.zip` (~4 MB) containing everything, including your art in `assets/art/`.

> Bump `VERSION` in `sw.js` whenever you change the app, so installed copies pick up the update.

## 2. Share it free (public link)
**Netlify Drop (easiest, ~1 minute)**
1. Go to https://app.netlify.com/drop
2. Unzip `shedithers-web.zip` and drag the folder onto the page.
3. You get a link like `https://something.netlify.app`. Send it to friends. You can rename it in site settings.

**GitHub Pages**: create a repo, upload the unzipped files, then Settings → Pages → deploy from `main`.

## 3. Sell it
**itch.io** (made for indie tools/games, handles payment)
1. Create a project → *Kind of project:* **HTML**.
2. Upload `shedithers-web.zip` and tick **"This file will be played in the browser"**.
3. Set the price (fixed, or "No payments" / pay-what-you-want), and set the viewport to 1600×900 with the **fullscreen button** on.
4. Optional: also upload the zip as a downloadable file so buyers can host or install it themselves.

**Gumroad / Ko-fi / Payhip**: sell `shedithers-web.zip` as a digital download. Buyers unzip it and run `start.bat` (needs Python), or host it themselves (see step 2).

## Before you sell, decide
- **License**: what buyers may do (personal use? commercial use of exports? redistribution?). Put it in a `LICENSE.txt` inside the zip.
- **Your art**: `assets/art/01M.mp4` and `collage.png` ship inside the app. Remove or replace them first if you don't want them distributed.
- **Fonts**: Barlow, Barlow Condensed and JetBrains Mono are free (SIL Open Font License), so you can use them commercially.
- **Online needs**: the app works offline after the first visit, but MP4/WEBM export downloads a small muxer library from jsDelivr the first time.

## Running locally
Double-click `start.bat` and the app opens at http://localhost:8737. Opening `index.html` directly from disk (file://) blocks pixel access, so use the server.
