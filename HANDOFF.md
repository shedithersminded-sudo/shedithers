# SHEDITHERS — handoff (2026-11-07, live version v2.9.4)

Paste this into a new chat, or say "read C:\CODE\shedithers\HANDOFF.md".

## What this is
- **Editor** (`index.html`): the artist's dither/glitch photo and video editor, called the DITHER LAB.
- **Artist Archive** (`archive.html`): a view-only gallery of the artist's work. Short link: `/art`.
- **Tech:** vanilla JS with no build step. Run it locally with `start.bat` (python http.server on port 8737).
- **Deploys:** pushing `main` to github.com/shedithersminded-sudo/shedithers auto-deploys to https://shedithers.netlify.app and https://shedithersminded-sudo.github.io/shedithers/. The user always wants both sites updated and verified.

## Release steps (every change)
1. Bump `?v=` in `archive.html` and `index.html`, and `VERSION` in `sw.js`. The current values are v=294 and v2.9.4 (index.html had fallen behind at v=220; both pages now match). Stale caches have crashed the site before.
2. Commit, ending the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, then push.
3. Check that both live sites serve the new `sw.js` version.

## Artwork rules (from the artist, strict)
- Art may be used anywhere in the site's design: backgrounds, crops, stickers, player skin.
- Visitors must never be able to save, export or edit it. Decorative uses go in CSS backgrounds.
- Originals in `assets/archive/` stay byte-exact (check md5). The viewer shows them untouched.
- Little Guy (`little-guy.png`) is allowed as an animated UI character.

## Style direction (latest feedback)
- **Do:** use the artist's own art style. That means blood red `#c3141c`, black `#0b0a09`, torn off-white paper `#e9e3d1`, scrawl and handwriting, collage, stars, eyes, "ERROR: NO IDENTITY".
- **Don't:** no polka dots, nothing "too girly", no candy pink, no cyan or navy folder UI.
- Layer changes on top of what exists; don't redesign. Keep it messy and interactive, with no blank folders and no long lists.
- Keep the Dither Lab prominent. A floating `.lab-float` button and a portal module do this today.

## Archive layers (load order in archive.html)
| File | What it does |
| --- | --- |
| config.js | links: tiktok `shedithers`, YouTube, email, Cash App `$olace6`, `redbubble:''`, `tiktokVideos` (16 videos from the profile, 2026-11-07) |
| artworks.js | art data |
| archive-portal.js | Y2K home |
| archive.js | core: router, viewer, player, THE EDIT montage |
| archive-plus.js | discoveries, cassette, Little Guy |
| archive-mess.js | another session's work: messy wall, hands video |
| archive-cute.js | another session's work: TikTok TV, peeking eyes |
| archive-artui.js | UI bits cut from the art, plus the **relic player**: an arch shape with a spinning art disc in a red spiky star; the mini player is a blade shape |
| archive-pop.js | CD intro and the NOW SPINNING row |
| archive-watch.js | on-site TikTok theater, Dither Lab button, intro song "Sorry" by evo & crevo (pause/mute/volume/stop chip), `SHD_MOVE` drag helper (player, song chip, TikTok TV; positions saved per device), art skins for chip + TV |

- **Matching CSS:** `css/archive-*.css`. Asset URLs in CSS must be `../assets/...`. URLs set from JS use `absU()`.
- **Intro song:** `assets/ui/intro.mp3` ("Sorry crevo.mp3", byte-exact). It plays only when a visitor taps ENTER, and visitors can switch it off with the SOUND toggle.
- **Other sessions edit these files too.** Check `git log` before editing.

## Sharing
- Link previews: `assets/share-card-2.png` (collage of art details, made at the artist's request; og:image points at GitHub Pages) + og/twitter tags on both pages. Short links: `/art` (archive), `/lab` (editor) on both hosts.

## Still waiting on the user
1. To refresh TikToks, re-pull video links from tiktok.com/@shedithers into `tiktokVideos`.
2. **Two artwork originals I couldn't find:** the phone piece "My phone is full of ghosts with usernames" and the falling diptych "some descents are inherited".
3. **Redbubble username** (user will do this last) goes in `config.js`. Redbubble blocks the built-in browser, so the user makes Redbubble edits in Chrome themselves.

## Small open items
- Gate: the other session's `gate-hands` sits at 22% opacity, greyscale, behind the intro. Remove it if the user dislikes it.
- At 3 seconds the intro screenshot looks faded because the entrance animations are still running. It settles by about 5 seconds.

## v2.6.2 notes
- CD intro: whole disc = NO IDENTITY art (grayscale + red), words curve round the rim (`.pg-ring` SVG in archive.html).
- Softer UI (pills, soft red glow instead of hard block shadows) + words glow on hover: end of `css/archive-pop.css`.
- Phones: no overscroll bounce, svh instead of dvh, bobbing animations off, sideways overflow clipped (`html{overflow-x:clip}`).
- v2.6.3: editor (index.html) + its intro recoloured to match the archive: lime → red gels, pink → paper gels, silver chrome → black lacquer, teal → red, torn red "ERROR: NO IDENTITY" band on the intro (`css/skin-chrome.css`, end of file). Effect default colours (engine.js) left alone on purpose.
- v2.6.4: About page = torn paper card + every quote from the art (pulled from `words` in artworks.js); wall/sparkle inks red+paper (no pink/lime/teal). Speed: dust canvas ~25fps and paused when hidden, ink trail idle when still, visualiser stops when music paused, grain no longer blends, no backdrop blur, `content-visibility` on home modules.
- Netlify stopped auto-deploying after v2.6.2 (GitHub Pages fine). Check the Netlify dashboard (build minutes / auto publishing / deploy log).
- v2.6.5: BUY ME A DRINK on the archive: red tab on the right edge of every page + ♥ DRINK in the menu; opens the same drink menu as the Dither Lab (config.drinks, Cash App, QR on desktop). Code at the end of archive-watch.js / archive-pop.css.
- v2.6.6: editor right-click on the picture has EDIT (undo, redo, randomize, duplicate/hide/reset selected effect) and DELETE (delete effect, delete all effects, close media, delete from library) — `editMenuItems()` + `closeMedia()` in app.js. Disabled menu items no longer run.
- v2.6.7: star-runner cursor from the artist (assets/ui/cursor-star*.png, red-glow version on links/buttons) on both pages; new art-collage share card; tip panel on both pages uses art (NO IDENTITY heart banner, drink cards on torn art scraps, Little Guy peeking); editor tip button is now a big red "BUY ME A DRINK".
- v2.6.8: second song `assets/ui/you-kno-u.mp3` ("you kno u" by evo, byte-exact copy, md5 4bbe40e6…) plays after "Sorry"; song list is `SONGS` in archive-watch.js.
- v2.6.9: About page rewritten in the artist's voice (lowercase, "hi. it's me."), a ransom-note cut-up poem made only of words from the art, "what i make" checklist (ordinary crossed out), torn-ticket links, tip jar, and an inline suggestion box (formsubmit, same inbox as the editor). New tipLine in config.js. Export thank-you: "SAVED. IT'S YOURS NOW", red marker, torn paper, new lines.
- v2.7.0: visitor + art counter via GoatCounter (`js/stats.js`, off until `goatcounter` is set in config.js — the user must create the free account themselves). Events: made-art/<ext>, tip-jar-opened, suggestion-sent, tiktok-theater-opened. "made something? post it + tag @shedithers or #shedithers" on the editor start screen and in both export windows.
- v2.7.1: counter ON — goatcounter: 'shedithers' (stats at https://shedithers.goatcounter.com, user owns the account).
- v2.7.2: intro music starts quieter (30%, was 75%) and fades in over ~3s; a visitor's saved volume still wins.
- v2.7.3: no fade — intro music simply starts at 30%; visitors turn it up with the slider.
- v2.7.4: drink doodles (assets/ui/drinks/*.svg — slushy w/ eye, fruit cup w/ eyeball strawberry, cocktail w/ eyeball olive, bottle w/ torn S label) replace emojis on both tip panels (config.drinks[].icon); new tipLine.
- v2.8.0: editor effects library sorted into PICTURE LOOKS / MAKE IT MOVE (turns it into GIF/video) / ADD ON TOP (FX_SECTIONS in panels.js), plain-words help for every effect (FX_HELP), the selected effect is pinned on top of the layers as NOW EDITING while ALL LAYERS keeps process order, starry red/paper styling, star toggles. Fixed #main growing past the window (layers panel was off-screen at 1440px).
- v2.8.1: THE DECK on the archive home (js/archive-deck.js + css/archive-deck.css): 12 newest artworks as 3D trading cards on a spinning ring; drag/swipe/arrows to spin, hover tilt + glare, tap front card to flip (title, words, medium, date, "look closer"), shuffle/pause/flip buttons; only spins while on screen.
- v2.9.0: 22 SHEDITHERS-original effects in engine.js (block before CATS): bloodink, stardither, heartdither, scrawl, tornpixels, inkdrip, starmosaic, tornpaper, tape, xerox, crumple, redroom, lightleak, halo, searchlight/leakdrift/flarepass (`moves: true` → auto motion), eyes, channelsurf, papertear, stopmotion, starrays — 91 effects total. Library groups collapsible (state in localStorage shd.fxOpen), search opens matching groups, collage styling with art-scrap section banners. NOTE: no `-x ** 2` (unary before **) — it breaks the whole engine.
- v2.9.1: bug sweep (all 91 effects × default/min/max run clean; every editor panel/modal + archive route opened clean). Fixed: editor unusable on phones (now one column: picture, layers, library), keyboard handlers crashing on document-level key events, pink THE LAB nav tag. Slop check: removed "neon glow on everything" — hard offset ink/red shadows + tags instead of glowing pills. Editor frame now matches the archive (kraft torn top bar, paper panel headers, ink tags).
- v2.9.2: reading font is now Patrick Hand (+3px) on both pages (was Special Elite); muted palette vars (--rust --mustard --moss --teal --dblue --plum --violet --rose) beside red/ink/paper; each effect group has its own colour; stronger hover glow in a random muted colour per word (js/glow.js); hand-drawn "sketch" border-radius shapes, star-burst counts, flag NOW EDITING. Style rule update: colours are welcome if muted (not neon).
- v2.9.3: one of each effect by default (libAdd in panels.js: clicking one you have opens it; "allow the same effect more than once" switch = localStorage shd.allowDoubles; Shift+click forces). Library + layers restyled as tinted glass over a random blurred artwork (--lib-art on #left/#right), straight rows, no tilt/torn cards; bigger card buttons (32px); "what it does" = frosted label with cut corner.
- v2.9.4: editor library click → chooser (add / preview on top; Shift+click adds) — preview uses S.override + #pvBar. Archive: walk-in intro (js/archive-walk.js, css/archive-walk.css) from the artist's WANTED street drawing, split into assets/ui/walk-bg.jpg (street, hands filled in, graded ink→blood→acid) + walk-fg.png (hands + flyer, recoloured paper/blood) — made at the artist's request; once per visit, tap flyer/skip/6.5s. Gate restyled to the inside's lime render (.g-render reuses portal .pr-* layers), lime #d4ff00 accents.
