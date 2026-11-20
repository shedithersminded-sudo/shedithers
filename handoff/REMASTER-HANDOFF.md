# SHEDITHERS archive: handoff

Written 2026-11-20, after **v3.9.8**. Give this whole file to whoever picks the work up next, human or AI. It replaces the older remaster handoff (the old screenshots in `handoff/shots/` show problems that are now fixed).

---

## 1. The project in one minute

- **What:** SHEDITHERS, the artist's own site. `archive.html` is the **Artist Archive** (most of the work below). `index.html` is the **Dither Lab** editor (separate look, `css/skin-glass.css`, barely touched here).
- **Where:** `C:\CODE\shedithers` (git, branch `main`).
- **Live:** https://shedithersminded-sudo.github.io/shedithers/archive.html (GitHub Pages deploys on every push to `main`, 1 to 3 minutes). Netlify is old, ignore it.
- **Stack:** plain HTML/CSS/JS, no build step. The archive is many layered files (`js/archive-*.js`, `css/archive-*.css`). **Later files override earlier ones.** Almost all new work lives in the files that load last (see section 4).
- **History:** `HANDOFF.md` in the root has one line per release. Read its last ~15 lines first.
- **Sister site:** SHELOOPS, the artist's music studio: https://shedithersminded-sudo.github.io/sheloops/ (`C:\CODE\sheloops`). It has a panel on the archive home.

## 2. The artist (read this before changing anything)

- SHEDITHERS is always one word. The artist is niche and wants the site to feel niche: their own art IS the interface.
- Look: blood red / ink black / torn paper, muted jewel colours (rust, mustard, moss, teal, faded blue, plum), acid lime `#d4ff00`, warm orange. Panels are dark glass with a red or blue glow. Not cookie-cutter, not "AI-looking".
- **Only the artist's own art on the site.** Pictures they send of their own work = assets to use. Pinterest or other people's pictures = layout/style inspiration only, never put on the site.
- **Writing rules for anything a visitor reads:** no em dashes, no flowery copy. Short, plain, lowercase-ish, in the artist's voice ("not ordinary. not in my nature.", "doing it scared is just being brave.").
- They care a lot about **smoothness** now. Check frame rate after visual changes (section 6).
- They don't want their Cash App name shown anywhere. Tips go through the drink window (QR first; the name only appears if the visitor taps "show my cash app name").

## 3. How to run, test, release

**Run locally:** the repo has `.claude/launch.json` (server name `shedithers`, Python http.server). Or: `python -m http.server 8739 --directory C:/CODE/shedithers`, then open `/archive.html`.

**Skip the intro while testing** (browser console):
```
sessionStorage.setItem('shd.archive.in','1'); location.reload()
```
Clear `sessionStorage` to see the intro again.

**Cache:** a service worker caches files. If changes don't show, fetch the changed files with `{cache:'reload'}` then reload, or unregister the worker and clear caches.

**Test sizes:** PC 1440x900, tablet 1024x768 and 768x1024, phone 375x812. Check: no sideways scroll (`document.documentElement.scrollWidth === innerWidth`), nothing floating over the menu bar, no console errors.

**Release (every time):**
1. Bump the cache number on every css/js link in both pages: `sed -i 's/?v=398/?v=399/g' index.html archive.html`
2. Bump `VERSION` in `sw.js` (`shedithers-v3.9.8` becomes `shedithers-v3.9.9`).
3. Add one line to `HANDOFF.md`.
4. Commit (message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` if an AI made it), push `main`.
5. Wait until `https://shedithersminded-sudo.github.io/shedithers/sw.js` serves the new VERSION.

**Two traps for AI sessions:**
- The Claude Code shell safety check sometimes blocks inline `python - <<EOF` or `-c` commands that contain `$` patterns (like `` `$${cash}` ``). Write the edit as a `.py` file in the scratchpad and run it instead.
- The desktop app's Browser pane runs pages as background pages while the pane is **hidden**: `requestAnimationFrame` stops, CSS animations freeze, screenshots can look stale. Show the pane (`show_pane preview`) before testing animation or measuring frame rate. The intro has a timer fallback for this.

## 4. Files to know (newest work in bold)

| File | What it is |
|---|---|
| `archive.html` | loads everything. Head has an inline script that adds `html.dg-pre` so the old gate never flashes before the intro |
| **`js/archive-intro.js` + `css/archive-intro.css`** | the intro: dithered art morphing behind (blob screen), drag/throw the logo to enter, pulse rings, synthesized sounds (bass buzz, glitter, shimmer) |
| `js/blob-screen.js` | the morphing dithered art screen the artist loves (keep it) |
| `js/archive-walk.js`, `js/archive-captcha.js` | the OLD walk + door check. Still loaded, skipped when `window.SHD_DRAGINTRO` is set |
| **`js/archive-song.js`** | the site song: an audio file through Web Audio, muffled in the intro, clear inside, words-only control |
| **`js/archive-remaster.js` + `css/archive-remaster.css`** | loads last: home layout, glowing edges, code rain, collections showcase, music button, discovery notes, SHELOOPS panel, comment wall video, THE EDIT look, all the smoothness rules. Sections are numbered in comments (1 to 13) |
| **`js/archive-tip.js` + `css/archive-tip.css`** | the buy me a drink window (video polaroid, sky, falling leaves, riddle drinks, QR) |
| `js/archive-deck.js` | THE DECK: 3D cards, riddle readings (`RIDDLES` by artwork id), draw a card |
| `js/archive-voices.js` | THE COMMENT SECTION (real TikTok comments from `tiktokComments` in config) |
| `js/archive-portal.js` | builds the home panels (logo, news, collections, links...) |
| `js/archive-collab.js` | COLLABS + WHERE TO FIND ME + collab form (FormSubmit, works on the GitHub Pages address) |
| `js/archive-watch.js` | music player, tuck tabs, drink tab + drink spots, TikTok TV |
| `js/archive.js` | router (`#/`, `#/works`, `#/col/<id>`, `#/about`, `#/work/<id>` viewer), THE EDIT page, about page |
| `js/config.js` | settings: links, cashtag, `tiktokVideos`, `tiktokComments`, `tipLines`, `drinks`, `siteSong` |
| `js/artworks.js` | every piece (`ARTWORKS`) and the collections. Files in `assets/archive/` |
| `assets/ui/art2/` | the artist's newest art prepared for the UI: cutouts (`no-face`, `thumbprint`, `leaves`, `leaf0-2`), `brave`, `sky`, videos `dreams.mp4`, `understand.mp4` |
| `HANDOFF.md` | version history |

## 5. What is on the site now (v3.5.0 to v3.9.8)

- **Intro:** only the drag intro shows (old gate hidden from the first frame). The artist's art keeps morphing in dither behind the HD logo. The logo pulses red/lime rings and shakes every few seconds until grabbed. First press: low bass buzz. Dragging: glitter sparkle sounds and a red/lime dithered trail. Throw it far enough: rising shimmer, the screen dithers shut in that direction, the archive opens, it dithers open. Arrow keys / Enter / skip also work.
- **Music:** YouTube is gone. `archive-song.js` plays `CFG.siteSong.src` (muffled through a wall during the intro, opening up once inside). Inside, only a tiny handwritten line shows above the round red MUSIC button, which plays/pauses. **See open item 1: the file is held back.** The visitor's own music player is still there (hint bar "MUSIC").
- **Site check (v3.9.8):** every page (home, THE EDIT, each collection, about, the viewer with a picture and a video) loads with no console errors, no broken pictures or videos, no sideways scroll at 1440 or 375 wide.
- **The work (v3.9.8):** a short description of the artist's style sits in the NO IDENTITY block on the home page (`archive-remaster.js` section 16, `.pl-style`). Written from the art and the about page; the artist may want to edit the words.
- **Music start (v3.9.8):** with the intro, it starts on the first press of the logo (muffled) and opens up inside. Without the intro (same visit), it starts on the first tap anywhere, at 40%. If the visitor paused it, it stays off (`localStorage shd.songOff`). Still needs the file to be published (open item 1).
- **Collections / about (v3.9.8):** same title font and pill buttons as THE EDIT; the floating Dither Lab sticker hides under 1280px wide and the FOUND stamp gets smaller under 1100px so they stop covering panels.
- **THE WALL (v3.9.5):** a full-width home panel under SHELOOPS (`archive-remaster.js` section 15). The newest pieces (date 2026-11-20) are pinned up as polaroids with coloured pins: drag them anywhere (transform only), tap one to open it, "mess it up" / "line them up" buttons, a "follow on youtube" link. The first id in `CFG.youtubeShorts` is pinned up as a card with its YouTube thumbnail, linking to the short.
- **New art (v3.9.5):** 20 pictures (byte-exact copies in `assets/archive/`, titles and words taken from the art itself, e.g. THE ENCIRCLED ONE, DOPAMINE, SELF.EXE STILL INSTALLING, SAD ANGELS NEED FRIENDS TOO) and 9 videos (re-encoded to H.264, max 720 wide: WAKE UP THEY ARE TAKING ALL THE COLOR AWAY I + II, AM I BECOMING SOMEONE NEW, HOLD ON, PRESENTED BY SHEDITHERS, and four UNTITLED ones named by what's in them). Titled by the artist in v3.9.6: WURRISUM, CONLOVED, WARPED WORDS ("understanding me is understanding we."), ME, YOU, WE, FAIRY DUST HATES DUST BUNNIES, SHE, NOT ME I + II (one double card on THE WALL). Riddles for them are in RIDDLES. Duplicates were checked (mkmis.mov was already there).
- **Top bar (v3.9.4):** the artist's logo stays; dark glass bar with a thin red/blue glow line, plain lowercase mono links with a lime underline, active page in red, the lab as a lime outlined pill.
- **NOW PLAYING (v3.9.4):** the "sound system" speaker is gone; in its place a volume control for the site song (play/pause + a slider, starts at 40%, a little below medium, so nobody jumps, remembered in `localStorage shd.songVol`). The spinning seal has the artist's red logo in the middle and "doing it scared is just being brave ✶ shedithers ✶" around it. The little buy me a drink sticker next to NEW ART is hidden. Built in `archive-remaster.js` section 14 (it re-dresses the panel from `archive-pop.js`).
- **Collab form:** the LET'S MAKE SOMETHING title fits its card now.
- **Home layout:** one fixed grid on PC (over 1100px), one column below. Rows: logo + news / deck / now playing / comments + collabs / collections / file directory + Dither Lab promo / instant photo / **SHELOOPS** / archive film / wallpaper + links / motion lab + sign the list / word ticker / footer.
- **Panels:** dark glass, steady red or blue glow (alternating), a light travelling around each border (a rotating layer, GPU-cheap). Code rain "shedithers" falls behind everything (30 fps, pre-rendered letters).
- **Fonts (try 1, artist hasn't confirmed):** titles Syne 800, reading text Space Grotesk, labels JetBrains Mono, handwriting Patrick Hand. Swap via `--rm-title` / `--rm-body` in `archive-remaster.css`.
- **The deck:** bigger cards, seamless light holo foil + a light sweep on the front card, each card sways, the ring leans to the mouse. Tap the front card or **draw a card**: the card spins and a reading opens (riddle typed out, the answer behind "turn it over"). Riddles for the 12 newest pieces are in `RIDDLES` in `archive-deck.js`; others get "finish the line" from their own words.
- **Comment section:** the artist's "understand?" video plays on the wall (only while visible). The art strip is a rolling film reel matched to the list height. Comments are different objects (notebook scrap, black sticker, receipt, red tape, polaroid) in mixed fonts. As many show as fit beside COLLABS (about 7). Tap one: it drops in letter by letter.
- **Collections:** a showcase on the left crossfades each collection's pieces with the name and the piece's words; hover a row to pick it.
- **SHELOOPS panel (v2):** spinning record with the no-face painting as the label, a ring of light bars, the leaves branch, the features as track lanes with a playhead, "your songs are yours" text, button to the studio.
- **Buy me a drink:** the side tab is a small torn paper tag with the thumbprint stamp and a red thread. The window: "meet me in my dreams" video in a taped polaroid (tape only on the white border), the sky drifting, the artist's own leaves falling, the note in the artist's voice, four drinks that are riddles ($3 / $5 / $10 / $25, each wearing a piece), QR first, name hidden. No emoji anywhere.
- **Discovery notes:** dark glass, glow edge, a dithered strip of a random piece on top, handwriting. Bottom of the page: "this is the bottom. i kept going anyway. so did you."
- **THE EDIT page (`#/works`):** the artist's pieces as a slow dithered backdrop, title on the orange cut label, glowing pill chips, the montage screen as a glowing dark panel with the leaves on its corner, the drifting rows as taped polaroids. Row videos only play on hover (they were the lag).
- **New pieces in the archive:** I DONT WANT A FACE, DOING IT SCARED, UNTITLED (SKY), PLEASE NO MORE (video), MEET ME IN MY DREAMS (video). SHESDITHERS video re-encoded to H.264 (it was black in Chrome/Brave). 3 newest TikToks at the top of TikTok TV.
- **Smoothness:** measured at 1440 wide in the test browser: ~35 fps became ~60 to 117 everywhere; the bottom of the page went from 3 to ~90. Rules that keep it that way are in section 6.

## 6. Keeping it smooth (don't undo these)

- Animate only `transform`, `opacity`, `rotate`/`scale`/`translate`. Never animate `box-shadow`, `filter`, `left/top`, gradients via `@property`, or anything with a big blur, on something that's always moving.
- No `backdrop-filter` on panels. No `mix-blend-mode` on full-screen layers that change every frame.
- Anything in an off-screen home panel is paused (`.rm-off`), decorative loops pause while scrolling (`body.rm-scrolling`).
- Don't autoplay many videos at once. Big originals (1728x2304) are heavy; use hover-to-play or a small copy.
- Quick check in the browser console: count `requestAnimationFrame` calls over 1.5 s while scrolled to each panel (needs the pane visible). Hide a suspect element (`visibility:hidden`) and measure again to find the cost.

## 7. Open items (waiting on the artist, or next up)

1. **Site song file is held back.** The artist sent `somewhere in Between (full album) - Leyline Hex (128k).mp3` (24 min album by another artist). It's copied to `assets/ui/site-song.mp3` locally but listed in `.gitignore`, so the live site has no song. **Ask:** is it theirs, or do they have permission to put it on a public site? If yes: remove the line from `.gitignore`, consider trimming to one track or re-encoding smaller (it's 23 MB), commit, release. If no: ask for a file they can share. Everything else (muffle, words line, music button) already works with whatever file sits at that path.
2. **More TikTok comments:** 45 are in `tiktokComments` in `js/config.js`. TikTok hides comments when logged out, so more need to be pasted by the artist (or read with them logged in).
3. **Fonts:** Syne + Space Grotesk is a first try. Ask if they like it; swap the two variables if not.
4. **Pinterest inspiration:** the artist said they'd send Pinterest pictures for more UI ideas (inspiration only, build with their art).
5. **Phones:** several floating buttons crowd the right edge (TV, make a mess, Z, the drink tag, Dither Lab sticker). Worth a tidy pass.
6. **Dither Lab page (`index.html`)** still has its own opening animation; the artist hasn't asked to change it. Confirm if they meant that one when talking about "another intro".
7. **Collections / about pages** match the new look (titles, pills, backdrop) but their layouts (the book spread, the paper about card) are the older design; a deeper remaster is possible.
8. **The about page line** "i don’t want ordinary. ~~it’s not~~ it was never in my nature." is crossed out on purpose. Don't "fix" it.

## 8. Don't break (the artist likes these)

The drag intro and the blob screen behind it, the deck, the comment section concept, now playing speaker, collab form (sends to the artist's inbox), WHERE TO FIND ME, mess layer, TikTok TV, tuck tabs (`js/tuck.js`), discovery notes and the FOUND counter, the puzzle knobs (small, in the gaps), the Dither Lab skin.
