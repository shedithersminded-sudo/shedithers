/* SHEDITHERS — the artist's work. READ-ONLY.
 * Files in assets/archive/ are byte-exact copies of the originals. Never filter, crop,
 * recolour, re-encode or process them — style the interface around them instead. */
const ARCHIVE_DIR = 'assets/archive/';
const COLLECTIONS = [
  { id: 'collage', code: 'CODE_001', name: 'NO IDENTITY', sub: 'DIGITAL COLLAGE', color: '#c9c2ad', ink: '#1d1b16' },
  { id: 'drawing', code: 'CODE_002', name: 'BLOOM / DECAY', sub: 'MIXED MEDIA', color: '#8f8a6c', ink: '#151510' },
  { id: 'signal', code: 'CODE_003', name: 'SIGNALS', sub: 'DIGITAL', color: '#3b3b38', ink: '#e9e4d6' },
  { id: 'motion', code: 'CODE_004', name: 'MOTION', sub: 'MOVING IMAGE', color: '#5e6a73', ink: '#f1eee6' },
  { id: 'objects', code: 'CODE_005', name: 'SMALL THINGS', sub: 'OBJECTS + MARKS', color: '#d8d1bd', ink: '#1d1b16' },
];
const ARTWORKS = [
  { id: 'not-in-my-nature', file: 'not-in-my-nature.png', w: 1080, h: 1350, title: 'NOT IN MY NATURE', col: 'collage', date: '2025-11-15', medium: 'Digital collage', words: 'I don’t want ordinary. It’s not in my nature.' },
  { id: 'you-keep-forgetting', file: 'you-keep-forgetting.png', w: 1080, h: 1350, title: 'YOU KEEP FORGETTING', col: 'collage', date: '2025-11-15', medium: 'Digital collage', words: 'you keep forgetting' },
  { id: 'click-to-be-saved', file: 'click-to-be-saved.png', w: 1080, h: 1350, title: 'CLICK TO BE SAVED', col: 'collage', date: '2025-11-17', medium: 'Digital collage', words: 'click to apologize · click to be saved · click to forgive' },
  { id: 'no-identity', file: 'no-identity.png', w: 1080, h: 1350, title: 'NO IDENTITY', col: 'collage', date: '2025-11-20', medium: 'Digital collage', words: 'becoming and unbecoming so I can become who I always have been and never was' },
  { id: 'bloom', file: 'bloom.png', w: 1944, h: 2592, title: 'BLOOM', col: 'drawing', date: '2026-10-30', medium: 'Mixed media drawing', words: 'shedithers' },
  { id: 'gold', file: 'gold.png', w: 1728, h: 2304, title: 'GOLD', col: 'drawing', date: '2026-11-03', medium: 'Mixed media drawing', words: '' },
  { id: 'the-end', file: 'the-end.png', w: 1728, h: 2304, title: 'THE END?', col: 'drawing', date: '2026-11-03', medium: 'Mixed media collage', words: 'dream without action is hallucination' },
  { id: 'all-signs-point-to-yes', file: 'all-signs-point-to-yes.png', w: 2160, h: 2880, title: 'ALL SIGNS POINT TO YES', col: 'signal', date: '2026-10-09', medium: 'Digital', words: 'dreams aren’t dreams' },
  { id: 'become-unmarketable', file: 'become-unmarketable.mp4', type: 'video', w: 1080, h: 1350, title: 'BECOME UNMARKETABLE', col: 'motion', date: '2026-03-21', medium: 'Moving image', words: 'become unmarketable' },
  { id: 'motion-01', file: 'shedithers-motion-01.mp4', type: 'video', w: 0, h: 0, title: 'SHEDITHERS · MOTION 01', col: 'motion', date: '2026-07-03', medium: 'Moving image', words: '' },
  { id: 'motion-02', file: 'shedithers-motion-02.mp4', type: 'video', w: 0, h: 0, title: 'SHEDITHERS · MOTION 02', col: 'motion', date: '2026-03-10', medium: 'Moving image', words: '' },
  { id: 's-gems', file: 's-gems.png', w: 1728, h: 2304, title: 'S', col: 'objects', date: '2026-11-02', medium: 'Object study', words: '' },
  /* ---- portfolio additions (byte-exact originals) ---- */
  { id: 'to-see-and-be-seen', file: 'to-see-and-be-seen.png', w: 1728, h: 2304, title: 'TO SEE AND BE SEEN', col: 'collage', date: '2026-02-24', medium: 'Digital collage', words: 'to see and be seen' },
  { id: 'stop-asking', file: 'stop-asking-me-about-my-future.png', w: 1080, h: 1350, title: 'STOP ASKING ME ABOUT MY FUTURE', col: 'collage', date: '2026-03-06', medium: 'Digital collage', words: 'stop asking me about my future' },
  { id: 'mad-women-and-poets', file: 'mad-women-and-poets.png', w: 1728, h: 2304, title: 'MAD WOMEN & POETS', col: 'collage', date: '2026-03-12', medium: 'Digital collage', words: 'mistresses, mad women & poets' },
  { id: 'all-alone', file: 'all-alone-in-this-together.png', w: 1080, h: 1350, title: 'ALL ALONE IN THIS TOGETHER', col: 'collage', date: '2025-11-26', medium: 'Digital collage', words: 'we’re all alone in this together' },
  { id: 'i-stand-alone', file: 'i-stand-alone.png', w: 1024, h: 1536, title: 'I STAND ALONE', col: 'collage', date: '2026-11-04', medium: 'Digital collage', words: 'I stand alone but I’m not lonely' },
  { id: 'i-love-shedithers', file: 'i-love-shedithers.png', w: 759, h: 948, title: 'I ♥ SHEDITHERS', col: 'collage', date: '2025-11-15', medium: 'Digital collage', words: 'I don’t want ordinary' },
  { id: 'are-we-alive-yet', file: 'are-we-alive-yet.png', w: 1728, h: 2304, title: 'ARE WE ALIVE YET?', col: 'collage', date: '2026-11-01', medium: 'Digital collage', words: 'are we alive yet?' },
  { id: 'when-you-rain', file: 'when-you-rain.png', w: 1944, h: 2592, title: 'WHEN YOU RAIN YOU POUR', col: 'collage', date: '2026-11-05', medium: 'Mixed media', words: 'when you rain you pour' },
  { id: 'who-will-you-be', file: 'who-will-you-be.png', w: 1728, h: 2304, title: 'WHO WILL YOU BE?', col: 'collage', date: '2026-10-30', medium: 'Mixed media', words: 'and when it’s all over who will be there and who will you be?' },
  { id: 'trauma-or-checkpoints', file: 'trauma-or-checkpoints.jpg', w: 1080, h: 1350, title: 'TRAUMA OR CHECKPOINTS', col: 'drawing', date: '2026-03-29', medium: 'Drawing + digital', words: 'people are either trauma or checkpoints' },
  { id: 'dream-without-action', file: 'dream-without-action.png', w: 1728, h: 2304, title: 'DREAM WITHOUT ACTION', col: 'drawing', date: '2026-11-03', medium: 'Mixed media collage', words: 'dream without action is hallucination' },
  { id: 'all-signs-yellow', file: 'all-signs-point-to-yes-yellow.png', w: 1728, h: 2304, title: 'ALL SIGNS POINT TO YES (YELLOW)', col: 'signal', date: '2026-05-19', medium: 'Digital', words: 'dreams aren’t dreams' },
  { id: 'persona-ego-shadow', file: 'persona-ego-shadow.png', w: 1920, h: 1080, title: 'PERSONA / EGO / SHADOW', col: 'signal', date: '2025-12-14', medium: 'Digital diagram', words: 'persona · ego · shadow · self' },
  { id: 'openness-without-end', file: 'openness-without-end.jpg', w: 1920, h: 1080, title: 'OPENNESS WITHOUT END', col: 'signal', date: '2026-02-19', medium: 'Digital', words: 'understanding openness without end' },
  { id: 'untitled-wide-01', file: 'untitled-wide-01.jpg', w: 1920, h: 1080, title: 'UNTITLED · WIDE 01', col: 'screens', date: '2026-02-25', medium: 'Digital collage', words: '' },
  { id: 'untitled-wide-02', file: 'untitled-wide-02.jpg', w: 1920, h: 1080, title: 'UNTITLED · WIDE 02', col: 'screens', date: '2025-12-05', medium: 'Digital collage', words: '' },
  { id: 'a-lot-of-emotion', file: 'a-lot-of-emotion.jpg', w: 1920, h: 1080, title: 'A LOT OF EMOTION FOR SO LITTLE SUBSTANCE', col: 'screens', date: '2026-02-20', medium: 'Digital collage', words: 'a lot of emotion for so little substance' },
  { id: 'im-sorry-again', file: 'im-sorry-again.png', w: 2592, h: 1245, title: 'I’M SORRY I’M SORRY AGAIN', col: 'screens', date: '2026-11-05', medium: 'Handwriting', words: 'I’m sorry I’m sorry again' },
  { id: 'knives-in-my-throat', file: 'knives-in-my-throat.mp4', type: 'video', w: 0, h: 0, title: 'KNIVES IN MY THROAT', col: 'motion', date: '2026-11-01', medium: 'Moving image', words: '' },
  { id: 'shed-secrets', file: 'shed-secrets-ithers.mp4', type: 'video', w: 0, h: 0, title: 'SHED SECRETS ITHERS', col: 'motion', date: '2026-07-19', medium: 'Moving image', words: '' },
  { id: 'red-and-black', file: 'red-and-black.mp4', type: 'video', w: 0, h: 0, title: 'RED AND BLACK', col: 'motion', date: '2026-03-23', medium: 'Moving image', words: '' },
  { id: '0m2', file: '0m2.mp4', type: 'video', w: 0, h: 0, title: '0M2', col: 'motion', date: '2026-03-23', medium: 'Moving image', words: '' },
  { id: '0wwwwwm2', file: '0wwwwwm2.mp4', type: 'video', w: 0, h: 0, title: '0WWWWWM2', col: 'motion', date: '2026-04-21', medium: 'Moving image', words: '' },
  { id: '12f5', file: '12f5.mp4', type: 'video', w: 0, h: 0, title: '12F5', col: 'motion', date: '2026-03-24', medium: 'Moving image', words: '' },
  { id: 'ditherer-0703', file: 'ditherer-0703.webm', type: 'video', w: 0, h: 0, title: 'DITHERER · 07.03', col: 'motion', date: '2026-07-03', medium: 'Dithered moving image', words: '' },
  { id: 'ditherer-0704a', file: 'ditherer-0704a.webm', type: 'video', w: 0, h: 0, title: 'DITHERER · 07.04 A', col: 'motion', date: '2026-07-04', medium: 'Dithered moving image', words: '' },
  { id: 'ditherer-0704b', file: 'ditherer-0704b.mp4', type: 'video', w: 0, h: 0, title: 'DITHERER · 07.04 B', col: 'motion', date: '2026-07-04', medium: 'Dithered moving image', words: '' },
  { id: 'ditherer-0704c', file: 'ditherer-0704c.mp4', type: 'video', w: 0, h: 0, title: 'DITHERER · 07.04 C', col: 'motion', date: '2026-07-04', medium: 'Dithered moving image', words: '' },
  { id: 'ditherer-0704d', file: 'ditherer-0704d.webm', type: 'video', w: 0, h: 0, title: 'DITHERER · 07.04 D', col: 'motion', date: '2026-07-04', medium: 'Dithered moving image', words: '' },
];
COLLECTIONS.push({ id: 'screens', code: 'CODE_006', name: 'WIDESCREEN', sub: 'LANDSCAPE WORKS', color: '#a9a28a', ink: '#1d1b16' });
ARTWORKS.forEach((a, i) => { a.src = ARCHIVE_DIR + a.file; a.n = i + 1; });
const artById = id => ARTWORKS.find(a => a.id === id);
/* Little Guy is an interface character (animated around the UI), not an exhibit piece */
const LIL_GUY = ARCHIVE_DIR + 'little-guy.png';
