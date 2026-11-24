# SHEDITHERS — renders an HD stained-glass window from one of the artist's pieces.
# Voronoi glass pieces coloured from the art (pushed to jewel tones), hammered-glass texture, glow in each pane,
# the art's dark lines painted on like grisaille, and thick bevelled lead cames.
# usage: python tools/glass-window.py <art.png> <out.jpg> <width> <height> [cells] [seed]
import sys, numpy as np
from PIL import Image, ImageFilter
src, out, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
N = int(sys.argv[5]) if len(sys.argv) > 5 else 320
rng = np.random.default_rng(int(sys.argv[6]) if len(sys.argv) > 6 else 7)

def F(a): return Image.fromarray(np.asarray(a, np.float32), 'F')
def rs(a, w, h): return np.asarray(F(a).resize((w, h), Image.BICUBIC), np.float32)
def noise(h, w, cell):
    s = rng.random((h // cell + 3, w // cell + 3)).astype(np.float32)
    return rs(s, (w // cell + 3) * cell, (h // cell + 3) * cell)[cell:cell + h, cell:cell + w]
def fract(h, w, cells):
    a = sum(noise(h, w, c) * (0.6 ** i) for i, c in enumerate(cells)); return a / sum(0.6 ** i for i in range(len(cells)))
def blur(a, r):
    if a.ndim == 3: return np.dstack([blur(a[..., i], r) for i in range(3)])
    return np.asarray(F(a).filter(ImageFilter.GaussianBlur(r)), np.float32) if False else rs(rs(a, max(1, a.shape[1] // r), max(1, a.shape[0] // r)), a.shape[1], a.shape[0])

art = Image.open(src).convert('RGB')
# cover-crop the art to the window
s = max(W / art.width, H / art.height); art = art.resize((int(art.width * s) + 1, int(art.height * s) + 1), Image.LANCZOS)
l, t = (art.width - W) // 2, (art.height - H) // 2; art = np.asarray(art.crop((l, t, l + W, t + H)), np.float32) / 255

# ---- glass pieces: more, smaller pieces toward the middle (where the light is) ----
pts = []
while len(pts) < N:
    x, y = rng.random() * W, rng.random() * H
    d = np.hypot((x - W / 2) / W, (y - H * .45) / H)
    if rng.random() < 1.15 - d * 1.2: pts.append((x, y))
pts = np.array(pts, np.float32)
lab = np.zeros((H, W), np.int32)
xs = np.arange(W, dtype=np.float32)
for y0 in range(0, H, 48):
    ys = np.arange(y0, min(H, y0 + 48), dtype=np.float32)
    best = np.full((len(ys), W), 1e12, np.float32); bi = np.zeros((len(ys), W), np.int32)
    for i, (px, py) in enumerate(pts):
        d = (xs[None, :] - px) ** 2 + ((ys[:, None] - py) * 1.0) ** 2
        m = d < best; best[m] = d[m]; bi[m] = i
    lab[y0:y0 + len(ys)] = bi

# ---- colour of each piece: mean art colour, pushed to the nearest jewel tone ----
JEWELS = np.array([[.70, .04, .10], [.86, .16, .12], [.95, .52, .05], [.98, .78, .18], [.10, .55, .25], [.05, .45, .45],
                   [.10, .28, .78], [.20, .16, .62], [.48, .14, .70], [.78, .20, .48], [.98, .62, .30], [.30, .62, .90]], np.float32)
cnt = np.bincount(lab.ravel(), minlength=len(pts)).astype(np.float32) + 1e-6
mean = np.stack([np.bincount(lab.ravel(), art[..., c].ravel(), minlength=len(pts)) / cnt for c in range(3)], 1)
def sat(c, k):
    g = c.mean(1, keepdims=True); return np.clip(g + (c - g) * k, 0, 1)
m2 = sat(mean, 3.0)
near = JEWELS[np.argmin(((m2[:, None, :] - JEWELS[None]) ** 2).sum(2) - JEWELS[None].std(2) * .2, 1)]
col = near * .78 + m2 * .22
col *= (0.82 + 0.3 * rng.random((len(pts), 1))).astype(np.float32)
glass = col[lab]

# ---- lead cames: where the piece changes ----
edge = np.zeros((H, W), bool)
edge[:, 1:] |= lab[:, 1:] != lab[:, :-1]; edge[1:, :] |= lab[1:, :] != lab[:-1, :]
lw = max(5, int(round(W / 330)))
leadI = Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(lw | 1))
lead = np.asarray(leadI.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255
# glass darkens toward its lead and glows in its middle (light coming through)
near_lead = np.asarray(leadI.filter(ImageFilter.GaussianBlur(lw * 2.2)), np.float32) / 255
glow = 1.0 - np.clip(near_lead * 1.6, 0, .6)

# ---- hammered / seedy glass texture + streaks ----
ham = fract(H, W, (18, 9, 4))[..., None]
streak = rs(rng.random((max(2, H // 90), W // 3)).astype(np.float32), W, H)[..., None]
seeds = (rng.random((H, W)) > .9993).astype(np.float32)
seeds = (np.asarray(Image.fromarray((seeds * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)), np.float32) / 255)[..., None]
tex = (0.78 + 0.36 * ham) * (0.9 + 0.18 * streak) + seeds * .35

# ---- grisaille: the art's own dark lines painted onto the glass ----
lum = art @ np.array([.3, .59, .11], np.float32)
lines = np.clip((0.42 - lum) * 2.6, 0, 1)
lines = (np.asarray(Image.fromarray((lines * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255)[..., None]

# ---- the light behind: brightest just above centre ----
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
back = 0.55 + 0.75 * np.exp(-(((xx - W * .5) / (W * .42)) ** 2 + ((yy - H * .42) / (H * .5)) ** 2))[..., None]

img = glass * tex * glow[..., None] * back
img = img * (1 - lines * .62)
img = img / (1 + img * .35) * 1.25          # soft highlight roll-off
# bloom: the brightest glass bleeds light a little
bloom = blur(np.clip(img - .55, 0, 1), 18) * .55
img = img + bloom
# lead on top, with a bevel highlight on its upper-left edge
bev = np.clip(np.roll(lead, (-2, -2), (0, 1)) - lead, 0, 1)[..., None]
leadc = np.array([.035, .03, .04], np.float32)
img = img * (1 - lead[..., None]) + leadc * lead[..., None] + bev * np.array([.42, .38, .46], np.float32) * lead.max()
img = np.clip(img, 0, 1)
Image.fromarray((img * 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(1.2, 70, 2)).save(out, quality=86, optimize=True, progressive=True)
print(out, W, H)
