# SHEDITHERS — handoff (2026-11-07, live version v2.6.2)

Paste this into a new chat, or say "read C:\CODE\shedithers\HANDOFF.md".

## What this is
- **Editor** (`index.html`): the artist's dither/glitch photo and video editor, called the DITHER LAB.
- **Artist Archive** (`archive.html`): a view-only gallery of the artist's work. Short link: `/art`.
- **Tech:** vanilla JS with no build step. Run it locally with `start.bat` (python http.server on port 8737).
- **Deploys:** pushing `main` to github.com/shedithersminded-sudo/shedithers auto-deploys to https://shedithers.netlify.app and https://shedithersminded-sudo.github.io/shedithers/. The user always wants both sites updated and verified.

## Release steps (every change)
1. Bump `?v=` in `archive.html` and `index.html`, and `VERSION` in `sw.js`. The current values are v=262 and v2.6.2 (index.html had fallen behind at v=220; both pages now match). Stale caches have crashed the site before.
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
- Link previews: `assets/share-card.png` (text only, no artwork) + og/twitter tags on both pages. Short links: `/art` (archive), `/lab` (editor) on both hosts.

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
