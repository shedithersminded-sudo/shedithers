# SHEDITHERS: handoff

**This is the only handoff.** Written 2026-11-20 at **v4.2.0** (the finished site). Give this file to whoever picks the work up next, human or AI: paste it, or say "read C:\CODE\shedithers\HANDOFF.md". Add one line to the version log at the bottom on every release.

---

## 1. The project in one minute

- **What:** SHEDITHERS, the artist's own site. `archive.html` is the **Artist Archive** (the main site, most work happens here). `index.html` is the **Dither Lab**, a free dither/glitch photo and video editor with its own stained-glass look (`css/skin-glass.css`).
- **Where:** `C:\CODE\shedithers` (git, branch `main`, repo `shedithersminded-sudo/shedithers`).
- **Live:** https://shedithersminded-sudo.github.io/shedithers/archive.html (GitHub Pages deploys on every push to `main`, 1 to 3 minutes). Netlify (shedithers.netlify.app) is stale, ignore it.
- **Stack:** plain HTML/CSS/JS, no build step. The archive is many layered files (`js/archive-*.js`, `css/archive-*.css`). **Later files override earlier ones.** New work goes in the files that load last (section 4).
- **Sister site:** SHELOOPS, the artist's free music studio: https://shedithersminded-sudo.github.io/sheloops/ (`C:\CODE\sheloops`). It has a panel on the archive home.

## 2. The artist (read before changing anything)

- SHEDITHERS is always one word. The artist is niche and wants the site to feel niche: their own art IS the interface.
- **Look:** blood red `#c3141c`, ink black `#0b0a09`, torn off-white paper `#e9e3d1`, acid lime `#d4ff00`, warm orange; muted jewel tones (rust, mustard, moss, teal, faded blue, plum). Panels are dark glass with a red or blue glow. Scrawl, handwriting, collage, tape, polaroids, dither.
- **Never:** polka dots, "too girly", candy pink, cyan/navy folder UI, cookie-cutter or "AI-looking" layouts.
- **Only the artist's own art on the site.** Pictures of their own work = assets. Pinterest or other people's pictures = layout/style inspiration only, never on the site.
- **Art rules:** originals in `assets/archive/` are byte-exact copies, shown untouched in the viewer. Art can be used anywhere in the design (backgrounds, crops, cutouts, stickers, UI) as CSS backgrounds so visitors can't right-click save it. Little Guy (`little-guy.png`) is an animated UI character.
- **Writing:** no em dashes, no flowery copy. Short, plain, lowercase-ish, in the artist's voice ("not ordinary. not in my nature.", "doing it scared is just being brave."). The about page line "i don't want ordinary. ~~it's not~~ it was never in my nature." is crossed out on purpose.
- **Priorities now:** smoothness, a finished professional feel, interactive bits made of their art, layered on top of what exists (enhance, don't replace).
- **Never show the Cash App name.** Tips go through the drink window: QR first, the name only if the visitor taps "show my cash app name".

## 3. Run, test, release

**Run locally:** `.claude/launch.json` has a server named `shedithers` (Python http.server). Or `python -m http.server 8739 --directory C:/CODE/shedithers` and open `/archive.html`.

**Skip the intro while testing:** in the console, `sessionStorage.setItem('shd.archive.in','1'); location.reload()`. Clear `sessionStorage` to see it again.

**Cache:** a service worker caches files. If changes don't show, fetch the changed files with `{cache:'reload'}` then reload, or unregister the worker and clear caches. Big media (mp3/mp4/mov) is never cached by the worker.

**Test sizes:** 1440x900, 1024x768, 768x1024, 375x812. Check: no sideways scroll (`document.documentElement.scrollWidth === innerWidth`), nothing over the menu bar, no console errors, no broken images/videos, on home, `#/works`, `#/col/<id>`, `#/about`, and the viewer `#/work/<id>`.

**Release (every time):**
1. `sed -i 's/?v=420/?v=421/g' index.html archive.html` (bump the cache number on every css/js link in both pages)
2. Bump `VERSION` in `sw.js` (`shedithers-v4.2.0` becomes `shedithers-v4.2.1`)
3. Add one line to the version log at the bottom of this file
4. Commit (end the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` if an AI made it), push `main`
5. Wait until `https://shedithersminded-sudo.github.io/shedithers/sw.js` serves the new VERSION

**Traps for AI sessions:**
- The Claude Code shell safety check sometimes blocks inline `python - <<EOF` / `-c` commands containing `$` patterns. Write the edit as a `.py` file in the scratchpad and run it.
- The desktop app's Browser pane runs pages as background pages while the pane is **hidden** (animations freeze, screenshots go stale). Show the pane before testing animation or measuring frame rate. Synthetic events can't start audio; use a real click (`computer` tool) to test sound.
- ffmpeg isn't installed system-wide; `pip install imageio-ffmpeg` gives a binary (`imageio_ffmpeg.get_ffmpeg_exe()`). Phone videos are often HEVC, which shows black in Chrome/Brave: always re-encode to H.264 (`-c:v libx264 -pix_fmt yuv420p`, max 720 wide, `-movflags +faststart`).

## 4. Files

| File | What it is |
|---|---|
| `archive.html` | loads everything; head script adds `html.dg-pre` so the old gate never flashes before the intro |
| `js/archive-intro.js` + `css/archive-intro.css` | the intro: dithered art morphing behind (`js/blob-screen.js`), throw the logo to enter, pulse rings, synthesized sounds |
| `js/archive-song.js` | the site song: `assets/ui/site-song.mp3` through Web Audio, muffled in the intro, clear inside, volume control, words-only line |
| `js/archive-remaster.js` + `css/archive-remaster.css` | loads last; most of the current site. Numbered sections in the JS: 1 code rain, 2 glow edges, 3 drink tab, 4 collections showcase, 5 peek, 6 collab title, 7 music button, 8 discovery notes, 9 smoothness, 10 comment wall video, 11 SHELOOPS, 12 floating players below the bar, 13 inside pages look, 14 NOW PLAYING, 15 THE WALL, 16 the work (style note) |
| `js/archive-tip.js` + `css/archive-tip.css` | buy me a drink window |
| `js/archive-deck.js` | THE DECK; `RIDDLES` (by artwork id) for the readings |
| `js/archive-voices.js` | THE COMMENT SECTION |
| `js/archive-portal.js` | builds the home panels |
| `js/archive-collab.js` | COLLABS, WHERE TO FIND ME, collab form (FormSubmit to the artist's inbox, works on the GitHub Pages address) |
| `js/archive-watch.js` | the visitor's own music player, tuck tabs, TikTok TV, drink spots |
| `js/archive.js` | router, viewer, THE EDIT page, about page |
| `js/archive-walk.js`, `js/archive-captcha.js` | the OLD walk + door check; still loaded, skipped (`window.SHD_DRAGINTRO`) |
| `js/config.js` | settings: links, `cashapp`, `youtube`, `youtubeShorts`, `tiktokVideos`, `tiktokComments` (45), `tipLines`, `drinks`, `siteSong` |
| `js/artworks.js` | every piece (`ARTWORKS`) and the collections; files in `assets/archive/` |
| `assets/ui/art2/` | UI-ready cuts of the artist's art: `no-face`, `thumbprint`, `leaves`, `leaf0-2`, `brave`, `sky`, videos `dreams.mp4`, `understand.mp4` |
| `assets/ui/site-song.mp3` | "somewhere in between" (leyline hex), 96 kbps, 17 MB, 24 min. The artist confirmed they can use it |

## 5. What's on the site (v4.2.0)

- **Intro:** only the drag intro. The artist's art morphs in dither behind the HD logo; the logo pulses red/lime rings and shakes until grabbed. First press: low bass buzz and the song starts muffled. Dragging: glitter sparkle sounds + a red/lime dither trail. Throw it: rising shimmer, the screen dithers shut along the throw, the archive opens and dithers open, the song opens up clear. Arrow keys / Enter / skip work too. A timer makes sure it always opens.
- **Music:** starts at 22%, soft in the background (the artist asked twice for quieter; saved as `shd.songVol2`, a new key so old saved 40% values are ignored). Without the intro (same visit) it starts on the first tap anywhere. Inside: a tiny handwritten "now playing" line above the round red MUSIC button (play/pause), and a play button + quiet/loud slider in NOW PLAYING. The volume and a "paused" choice are remembered (`shd.songVol2`, `shd.songOff`). The visitor's own file player still exists (hint bar MUSIC) and pauses the song when used.
- **Top bar:** the logo, dark glass, red/blue glow line, lowercase mono links, lime underline, the lab as a lime pill.
- **Home, top to bottom (PC grid over 1100px, one column below):** logo + NO IDENTITY block with "the work" (how the artist makes things, in their words: they work fast; older pieces pull from things found online, the newer work starts with photos they take themselves; then layers of torn paper, old computer windows, handwriting and drawings, pushed through dither and glitch; a row of process steps lights up one after another, lines slide in, a light scans across) / news / THE DECK / NOW PLAYING / THE COMMENT SECTION + COLLABS / COLLECTIONS / file directory + Dither Lab promo / instant photo / SHELOOPS / THE WALL / the archive film / wallpaper + links / motion lab + sign the list / word ticker / footer.
- **Panels:** dark glass, steady red or blue glow, a light travelling around each border. "shedithers" code rain falls behind everything.
- **Fonts:** titles Syne 800, reading text Space Grotesk, labels JetBrains Mono, handwriting Patrick Hand (`--rm-title` / `--rm-body` in `archive-remaster.css` swap them).
- **THE DECK:** the 12 newest pictures except the ids in `DECK_SKIP` in `archive-deck.js` (PLAY ONLINE? is skipped at the artist's request). Pieces that aren't card-shaped (wider than 0.92 or taller than 0.6 width/height) show whole on a blurred copy of themselves (`.d3-fit`) instead of being cropped. Big 3D cards, light holo foil, a light sweep on the front card, cards sway, the ring leans to the mouse. Tap the front card or "draw a card" for a reading: a riddle made from the piece, the answer behind "turn it over".
- **NEWS:** newest first, in `archive-portal.js` (the list of `[date, tag, [text and links]]`). 11/20/26 entries: new pieces, THE WALL, the site song, SHELOOPS, the deck riddles. Add a line there when something new lands.
- **v4.2.0 changes (newest wins over anything older below):**
  - **Deck readings** are tarot pulls (`READ` in `archive-deck.js`): a card name that is NOT the title, a cryptic verse from what's in the piece, then "turn it over" shows upright or reversed (random) plus the other meaning, and the real title last. The artist asked that the first words never give the answer away. Write one for each new deck piece.
  - **NOW PLAYING** sits above THE DECK (desktop: beside NEWS; phone: right after the logo) so the volume is right there when the music starts.
  - **THE DARKROOM** replaced THE WALL (section 15, class `.p-wallpin.p-dark`): prints on lines under a red safelight, the cursor/finger is the light, tap a print to develop it, tap again to open it. Uses the 11/20 pieces that aren't in the deck. The YouTube polaroid is gone.
  - **THANK YOU** panel above the footer (section 15b).
  - **The tip window is now "keep me dreaming"** (dream jar) everywhere: top bar, news, collab card, about ticket, deck button. The $3 riddle uses the flower (`assets/ui/art2/bloom.webp`). The Cash App name still stays hidden behind its button.
  - **MAKE A MESS is removed** (button, stickers and saved stamps). The artist wants a new interactive toy in its place; options were offered, nothing chosen yet. Section 17-18 code for stickers is gone; the `mess-btn` slot top right is free.
- **FILE DIRECTORY:** an old hacker screen (`archive-remaster.js` section 17, CSS under "v4.1.0: FILE DIRECTORY"). Green phosphor, a typed `dir` command, a preview box of the selected file (small copies from `assets/ui/intro-art/` first, the full piece if none), a glitch tear every few seconds while on screen, ACCESS GRANTED before a file opens. The list itself is still built in `archive-nfo.js`.
- **MAKE A MESS** (top right button): tapping or dragging anywhere sticks the artist's art ON TOP of the page: cutouts (`assets/ui/stickers/`, made from their own art), little taped prints (intro-art), words on paper. Saved per page in `shd.mess2`; CLEAN UP peels them off. Section 18. The old stamps (behind the panels, so nobody saw them) are retired.
- **OTHER THINGS I MADE:** one section with both free studios, Dither Lab (index.html) and SHELOOPS (section 11). Replaced the separate DITHER LAB and SHELOOPS panels. INSTANT-PHOTO now sits beside the directory as a 4x4 grid.
- **NOW PLAYING:** volume control, the spinning seal with the artist's red logo and "doing it scared is just being brave", the NEW ART folder.
- **THE COMMENT SECTION:** the "understand?" video on the wall, a rolling film reel matched to the list, real TikTok comments as different objects (notebook scrap, black sticker, receipt, red tape, polaroid) in mixed fonts, about 7 at a time. Tap to blow one up, heart it.
- **COLLABS / WHERE TO FIND ME:** the form, the stops (TIP JAR says "scan or tap", no name).
- **COLLECTIONS:** a showcase crossfades each collection's pieces with its name and words.
- **SHELOOPS:** a record spinning with the no-face painting as label, a ring of light bars, the leaves, the features as track lanes, "your songs are yours" text, link out.
- **THE WALL:** the newest pieces pinned up loose as polaroids. Drag them anywhere, tap to look closer, "mess it up" / "line them up", the YouTube short pinned up, "follow on youtube".
- **Buy me a drink:** no side tab any more (the artist was done with it). Plain words open the window: "drink" in the top bar, the NEWS line, TIP JAR in WHERE TO FIND ME, the footer, the about page ticket (`#/tip`). The window: "meet me in my dreams" video in a taped polaroid, the sky drifting, the artist's leaves falling, the note in their voice, four riddle drinks wearing their pieces ($3 / $5 / $10 / $25), QR first.
- **Discovery notes:** dark glass, a strip of a random piece on top, handwriting. Bottom of the page: "this is the bottom. i kept going anyway. so did you."
- **THE EDIT (`#/works`), collections, about:** the artist's pieces as a slow dithered backdrop, Syne titles on the orange cut label, glowing pill buttons; THE EDIT screen is a glowing panel with the leaves on its corner and taped-polaroid rows (row videos only play on hover).
- **Archive:** 94 pieces. Newest (2026-11-20): 20 pictures (THE ENCIRCLED ONE, I SOLD MY WINGS, OFFLINE IS THE NEW LUXURY, SORRY I DISAPPEARED, DOPAMINE, PLAY ONLINE?, I DESERVE TO HAVE CONNECTION, AUTO-REPLY: REINCARNATING, WHICH IS OK, FAIRY DUST HATES DUST BUNNIES, SHE, NOT ME I + II, SIGNAL LOST MEANING FOUND, THE ETERNAL SEEDLING, HELLO MY NAME IS, DREAM VOL.3, SELF.EXE STILL INSTALLING, NOSTALGIA'S COOL, CTRL, SAD ANGELS NEED FRIENDS TOO) and videos (WURRISUM, CONLOVED, WARPED WORDS, ME YOU WE, WAKE UP THEY ARE TAKING ALL THE COLOR AWAY I + II, PRESENTED BY SHEDITHERS, AM I BECOMING SOMEONE NEW, HOLD ON, PLEASE NO MORE, MEET ME IN MY DREAMS), plus I DONT WANT A FACE, DOING IT SCARED, UNTITLED (SKY). Titles came from the artist.
- **Checked at v4.0.0:** every page loads with no console errors, no broken pictures/videos, no sideways scroll at 1440 or 375; the intro → archive → song path works with a real drag.

## 6. Keeping it smooth (don't undo these)

Measured in the test browser at 1440 wide: ~35 fps went to 60 to 117 fps everywhere (the bottom of the page went from 3 to ~90).
- Animate only `transform`, `opacity`, `rotate`/`scale`/`translate`. Never animate `box-shadow`, `filter`, `left/top`, `@property` gradients, or big blurs on things that always move.
- No `backdrop-filter` on panels. No `mix-blend-mode` on full-screen layers that change every frame.
- Off-screen home panels pause their animations (`.rm-off`); decorative loops pause while scrolling (`body.rm-scrolling`).
- Don't autoplay many videos at once; hover-to-play or a small copy.
- To find a cost: count `requestAnimationFrame` calls over 1.5 s at a scroll position (pane visible), hide a suspect element with `visibility:hidden`, measure again.

## 7. Ideas / open items

1. More TikTok comments: TikTok hides them when logged out; the artist can paste more into `tiktokComments`.
2. Fonts are a first try (Syne + Space Grotesk); the artist hasn't said yes or no.
3. The artist mentioned sending Pinterest pictures for more UI ideas (inspiration only).
4. The collection page (book spread) and about page (paper card) keep their older layouts under the new titles and backdrop; a deeper remaster is possible.
5. The Dither Lab (`index.html`) has its own opening animation, untouched.
6. "The work" note (`archive-remaster.js` section 16) was rewritten with the artist's input: most of the art starts as their own photos. They may still tweak the words.
7. Little Guy no longer scoots along the bottom (the artist asked; `.lil-scoot` hidden). He still peeks on some page headers.

## 8. Don't break (the artist likes these)

The drag intro and the blob screen, the deck, the comment section concept, NOW PLAYING seal, the drink window (polaroid video, riddle drinks, QR), collab form, WHERE TO FIND ME, the mess layer, TikTok TV, tuck tabs (`js/tuck.js`), discovery notes and the FOUND counter, puzzle knobs (small, in the gaps), THE WALL, the Dither Lab skin.

## 9. Version log (short)

- v2.x to v3.0 (2026-11-07): Dither Lab editor, Artist Archive, Y2K portal home, art rules, Little Guy, discoveries, mess layer.
- v3.1 to v3.4 (2026-11-08 to 11-11): walk-in intro, heaven intro, blob tracking screen and house tracking style, Blob Tracking editor effect, tip jar note, captcha door, puzzle home, tuck-away players.
- v3.5.0 to v3.5.1: remaster (one clean home grid, glowing edges, code rain, drink tab), collab overflow, collections showcase.
- v3.6.0 to v3.6.1: drag-the-logo intro, red/blue glow, new fonts, music button, 3 TikToks.
- v3.7.0 to v3.7.2: drink window rebuilt from the artist's art, 5 new pieces, old gate flash removed.
- v3.8.0 to v3.9.0: deck remaster with riddle readings, discovery notes restyled, big smoothness pass.
- v3.9.1 to v3.9.4: intro sounds, comment section remaster, SHELOOPS panel, THE EDIT remaster, new top bar, NOW PLAYING volume control, words-only muffled song.
- v3.9.5 to v3.9.8: 20 pictures + 9 videos, THE WALL with the YouTube short, the artist's titles, style note, site check.
- v4.0.0 (2026-11-20): the site song is published (96 kbps), big media never cached by the service worker, final check; one handoff (this file), old handoffs removed.
- v4.0.1 (2026-11-20): "the work" note rewritten (own photos first) with animated process steps; Little Guy's bottom scoot removed; the side drink tab removed, the drink window opens from words.
- v4.0.2 (2026-11-20): PLAY ONLINE? out of the deck (DECK_SKIP), five 11/20 news entries, "the work" note rewritten in the artist's words (fast, found things in older pieces, own photos now).
- v4.0.3 (2026-11-20): deck cards fit their piece (wide/tall pieces show whole on a blurred copy), site song quieter (22%, new storage key).
- v4.0.4 (2026-11-20): the dead netlify address under the home logo is now the real live link (github.io).
- v4.1.0 (2026-11-20): hacker-screen file directory, MAKE A MESS sticks the artist's art on top of the page, OTHER THINGS I MADE section (Dither Lab + SHELOOPS).
- v4.1.1 (2026-11-20): 5 new pieces (IT'S ALL IN YOUR HEAD, STRANGERS WITH FAMILIAR EYES, THE CIRCLE OF BECOMING, INNER WORLD, UNTITLED (SKY II)) + 2 moving (LET THE LIGHT IN, WAKE UP ... III). Titles taken from the words in each piece; the artist can rename them in `artworks.js`. They lead the deck with riddles, join the mess stickers, the sky photo sits behind OTHER THINGS I MADE, and there's a news line. Every image piece now has a small copy in `assets/ui/intro-art/` (used by the directory preview and stickers); make one for each new piece.
- v4.2.0 (2026-11-20): tarot deck readings, NOW PLAYING above the deck, THE DARKROOM, thank you panel, tip window renamed keep me dreaming, make a mess removed.
