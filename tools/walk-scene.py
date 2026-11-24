# SHEDITHERS walk-in scene: a night alley to an underground warehouse rave, built from the artist's own art + doodles.
import sys, os, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont, ImageChops
ROOT = sys.argv[1]; OUT = sys.argv[2]
ART = os.path.join(ROOT, 'assets', 'archive'); UI = os.path.join(ROOT, 'assets', 'ui')
rng = np.random.default_rng(11)

def F(a): return Image.fromarray(np.asarray(a, np.float32), 'F')
def rs(a, w, h, m=Image.BICUBIC): return np.asarray(F(a).resize((w, h), m), np.float32)
def vnoise(h, w, cell):
    s = rng.random((h // cell + 3, w // cell + 3)).astype(np.float32)
    big = rs(s, (w // cell + 3) * cell, (h // cell + 3) * cell)
    return big[cell:cell + h, cell:cell + w]
def fract(h, w, cells=(256, 128, 64, 32, 16, 8, 4), fall=.55):
    acc = np.zeros((h, w), np.float32); wt = 1; tot = 0
    for c in cells: acc += vnoise(h, w, c) * wt; tot += wt; wt *= fall
    return acc / tot
def blur(a, r):
    if a.ndim == 3: return np.dstack([blur(a[..., i], r) for i in range(a.shape[2])])
    h, w = a.shape; k = max(1, int(r))
    return rs(rs(a, max(1, w // k), max(1, h // k), Image.BILINEAR), w, h)
def load(name, mode='RGB'): return Image.open(os.path.join(ART, name)).convert(mode)
def arr(im): return np.asarray(im, np.float32) / 255

# ---------- upscaled doodles (also saved for the site) ----------
DD = os.path.join(UI, 'doodles'); os.makedirs(DD, exist_ok=True)
def upscale(im, f=2):
    im = im.resize((im.width * f, im.height * f), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=2))
def lineart(name, out, f=2, keep_color=True, cut=36, gain=2.4):
    im = upscale(load(name), f); a = arr(im); lum = a @ np.array([.3, .59, .11], np.float32)
    sat = a.max(2) - a.min(2)
    al = np.clip(np.maximum((1 - lum) * 255 - cut, sat * 255 * 1.4 - 40) * gain / 255, 0, 1)
    rgba = np.dstack([a, al]); Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(os.path.join(DD, out), optimize=True)
    return rgba
DOOD = {
    'bloom': lineart('bloom.png', 'bloom.png', 1),
    'gold': lineart('gold.png', 'gold.png', 1),
    'guy': lineart('little-guy.png', 'little-guy.png', 3, cut=60),
}
fl = upscale(Image.open(os.path.join(UI, 'flower-cut.png')).convert('RGBA'), 2); fl.save(os.path.join(DD, 'flower.png'), optimize=True)
DOOD['flower'] = arr(fl)

# ---------- brick wall texture ----------
def brick_wall(TW, TH, seed):
    global rng; rng = np.random.default_rng(seed)
    bh, bw, m = 30, 84, 4
    y, x = np.mgrid[0:TH, 0:TW]
    row = y // bh; off = (row % 2) * (bw // 2); col = (x + off) // bw
    ids = (row * 997 + col * 131) % 4096
    pal = rng.random((4096, 3)).astype(np.float32)
    base = np.array([.36, .16, .12], np.float32)
    bc = base * (0.6 + 0.6 * pal[ids][..., :1]) + (pal[ids] - .5) * np.array([.08, .05, .04], np.float32)
    mort = ((y % bh) < m) | (((x + off) % bw) < m)
    surf = fract(TH, TW, (32, 16, 8, 4, 2))[..., None]
    col_ = bc * (0.7 + 0.6 * surf)
    col_ = np.where(mort[..., None], np.array([.30, .28, .25], np.float32) * (0.6 + 0.5 * surf), col_)
    # recess shading under each brick
    sh = ((y % bh) >= m) & ((y % bh) < m + 3); col_ = np.where(sh[..., None], col_ * .55, col_)
    g = fract(TH, TW)[..., None]
    col_ *= (0.45 + 0.9 * g)                                   # big grime
    damp = np.clip((y / TH - .62) * 2.6, 0, 1)[..., None]; col_ *= 1 - .55 * damp
    streak = rs(rng.random((8, TW // 6)).astype(np.float32), TW, TH)[..., None]
    col_ *= 0.8 + 0.35 * streak
    return np.clip(col_, 0, 1)

def paste(dst, src_rgba, x, y, op=1.0, mul_shade=None):
    h, w = src_rgba.shape[:2]; H, W = dst.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    s = src_rgba[y0 - y:y1 - y, x0 - x:x1 - x]; a = s[..., 3:4] * op; c = s[..., :3]
    if mul_shade is not None: c = c * mul_shade[y0:y1, x0:x1, None]
    dst[y0:y1, x0:x1] = dst[y0:y1, x0:x1] * (1 - a) + c * a

def poster(name, w, rot=0.0):
    im = load(name); h = int(w * im.height / im.width); im = im.resize((w, h), Image.LANCZOS)
    a = arr(im); wr = fract(h, w, (64, 32, 16, 8))[..., None]
    a = a * (0.78 + 0.32 * wr)                                     # paste wrinkles
    a = a * .9 + .1 * a.mean(2, keepdims=True)                     # sun-faded
    yy, xx = np.mgrid[0:h, 0:w]; d = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]).astype(np.float32)
    jit = fract(h, w, (16, 8, 4)) * 14
    al = (d > jit).astype(np.float32)
    if rng.random() < .55:                                         # torn / peeled corner
        cx, cy = (w if rng.random() < .5 else 0), (h if rng.random() < .5 else 0); r = rng.uniform(.15, .38) * w
        tear = np.hypot(xx - cx, yy - cy) + jit * 3 < r; al[tear] = 0
    if rng.random() < .35:                                         # a torn strip
        y0 = int(rng.uniform(.2, .8) * h); band = (np.abs(yy - y0 - jit * 2) < rng.uniform(6, 20)) & (xx < w * rng.uniform(.3, 1)); al[band] = 0
    rgba = np.dstack([np.clip(a, 0, 1), al])
    if rot:
        im = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').rotate(rot, Image.BICUBIC, expand=True); rgba = arr(im)
    return rgba

def spray(dst, dood, x, y, scale, color=None, op=.9):
    h, w = dood.shape[:2]; nw, nh = int(w * scale), int(h * scale)
    d = arr(Image.fromarray((dood * 255).astype(np.uint8), 'RGBA').resize((nw, nh), Image.LANCZOS))
    a = d[..., 3]
    halo = np.clip(blur(a, 6) * 1.2, 0, 1) * .35
    c = d[..., :3] if color is None else np.broadcast_to(np.array(color, np.float32), d[..., :3].shape)
    # drips
    drip = np.zeros_like(a)
    cols = np.where(a.max(0) > .6)[0]
    for cx in rng.choice(cols, size=min(len(cols), max(3, nw // 60)), replace=False) if len(cols) else []:
        ys = np.where(a[:, cx] > .6)[0];
        if not len(ys): continue
        y0 = ys.max(); L = int(rng.uniform(10, 70) * scale * 3); drip[y0:min(nh, y0 + L), max(0, cx - 1):cx + 2] = 1
    al = np.clip(np.maximum(a, drip * .85) + halo * (1 - a), 0, 1)
    paste(dst, np.dstack([c, al]), x, y, op)

def wall_texture(TW, TH, seed, posters, doodles):
    t = brick_wall(TW, TH, seed)
    shade = t.mean(2) / max(t.mean(), 1e-3); shade = np.clip(.75 + .25 * shade, .5, 1.2)
    for name, u, v, w, rot, rep in posters:
        p = poster(name, w, rot); ph, pw = p.shape[:2]
        for k in range(rep):
            ox = int(u + k * (pw * .97)); oy = int(v + rng.uniform(-6, 6))
            q = poster(name, w, rot + rng.uniform(-1.5, 1.5)) if k else p
            paste(t, q, ox, oy, 1, shade)
    for key, u, v, sc, color in doodles: spray(t, DOOD[key], u, v, sc, color)
    # grime over everything
    g = fract(TH, TW, (128, 64, 32, 16))[..., None]; t *= (0.75 + 0.4 * g)
    tag = np.clip((fract(TH, TW, (8, 4, 2)) - .62) * 6, 0, 1)[..., None] * (np.mgrid[0:TH, 0:TW][0] > TH * .55)[..., None]
    t = t * (1 - tag * .35)
    return np.clip(t, 0, 1)

# ---------- warehouse facade (frontal) ----------
def font(name, size):
    for p in (os.path.join('C:/Windows/Fonts', name),):
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()
def facade(FW, FH, S):
    global rng; rng = np.random.default_rng(5)
    y, x = np.mgrid[0:FH, 0:FW].astype(np.float32)
    corr = .5 + .5 * np.sin(x / (9 * S) * np.pi)
    base = np.array([.22, .21, .2], np.float32) * (0.75 + .35 * corr[..., None])
    rust = np.clip((fract(FH, FW, (64, 32, 16, 8)) - .45) * 3, 0, 1)[..., None]
    base = base * (1 - rust) + np.array([.36, .17, .07], np.float32) * rust * (0.7 + .5 * corr[..., None])
    base *= (0.6 + .6 * fract(FH, FW, (128, 64, 16))[..., None])
    run = rs(rng.random((6, FW // 4)).astype(np.float32), FW, FH)[..., None]; base *= .75 + .4 * run
    img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8)); d = ImageDraw.Draw(img)
    # door opening (roll-up door raised to ~55%)
    dx0, dx1 = int(FW * .30), int(FW * .70); dy0, dy1 = int(FH * .40), FH
    open_y = int(dy0 + (dy1 - dy0) * .38)
    d.rectangle([dx0 - 6 * S, dy0 - 8 * S, dx1 + 6 * S, dy1], fill=(18, 17, 16))
    # slats of the raised door
    for k in range(dy0, open_y, int(7 * S)):
        d.rectangle([dx0, k, dx1, k + int(5 * S)], fill=(int(70 + rng.random() * 20), int(66 + rng.random() * 14), 60))
    d.rectangle([dx0, open_y - 3 * S, dx1, open_y + 3 * S], fill=(30, 28, 26))
    a = arr(img)
    # the inside: hot lime haze, red wash, crowd silhouettes
    iy, ix = np.mgrid[open_y:dy1, dx0:dx1].astype(np.float32)
    u = (ix - dx0) / (dx1 - dx0); v = (iy - open_y) / (dy1 - open_y)
    inside = np.zeros(iy.shape + (3,), np.float32)
    inside += np.array([.83, 1, .05], np.float32) * np.exp(-((u - .55) ** 2) / .05)[..., None] * (1.3 - v[..., None] * .6)
    inside += np.array([.9, .1, .1], np.float32) * np.exp(-((u - .15) ** 2) / .03)[..., None] * .9
    inside += np.array([1, .45, .1], np.float32) * .25
    crowd = np.zeros(iy.shape, np.float32)
    for k in range(26):
        cx = rng.uniform(0, 1); hgt = rng.uniform(.25, .62); r = rng.uniform(.035, .06)
        head = ((u - cx) / r) ** 2 + ((v - (1 - hgt)) / (r * 2.4)) ** 2 < 1
        body = (np.abs(u - cx) < r * 1.6 * (0.6 + (v - (1 - hgt)) * 1.2)) & (v > 1 - hgt + r * 1.5)
        arm = (rng.random() < .25) & (np.abs((u - cx) - (1 - hgt - v) * .5 * (1 if k % 2 else -1)) < r * .22) & (v < 1 - hgt + .05) & (v > 1 - hgt - .2)
        crowd = np.maximum(crowd, (head | body | arm).astype(np.float32))
    crowd = blur(crowd, 2 * S)
    inside = inside * (1 - crowd[..., None] * .93)
    a[open_y:dy1, dx0:dx1] = inside
    emis = np.zeros_like(a); emis[open_y:dy1, dx0:dx1] = inside * .9
    # caged red bulb
    bx, by = FW // 2, int(dy0 - 34 * S)
    yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32); bulb = np.exp(-((xx - bx) ** 2 + (yy - by) ** 2) / (2 * (7 * S) ** 2))
    emis += bulb[..., None] * np.array([1.6, .15, .1], np.float32)
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)); d = ImageDraw.Draw(img)
    for k in range(-2, 3): d.line([bx + k * 5 * S, by - 10 * S, bx + k * 4 * S, by + 10 * S], fill=(25, 22, 20), width=max(1, int(1.5 * S)))
    d.line([bx, by - 10 * S, bx, by - 26 * S], fill=(25, 22, 20), width=int(2 * S))
    a = arr(img)
    # spray-painted name over the door + small stencils
    sign = Image.new('L', (FW, FH), 0); sd = ImageDraw.Draw(sign)
    f = font('impact.ttf', int(64 * S)); txt = 'SHEDITHERS'; tw = sd.textlength(txt, font=f)
    sd.text(((FW - tw) / 2, int(FH * .08)), txt, font=f, fill=255)
    f2 = font('courbd.ttf', int(15 * S))
    for t_, px, py in (('NO PHOTOS', .05, .46), ('NO IDENTITY', .74, .46), ('FOLLOW THE BASS', .05, .52), ('08.11', .80, .52)):
        sd.text((int(FW * px), int(FH * py)), t_, font=f2, fill=200)
    s = arr(sign); s = s * np.clip(.55 + fract(FH, FW, (8, 4, 2)) * .8, 0, 1)
    sp = np.clip(blur(s, 4 * S) * .5, 0, 1)
    paint = np.array([.92, .9, .84], np.float32)
    a = a * (1 - np.maximum(s, sp * .5)[..., None]) + paint * np.maximum(s, sp * .5)[..., None]
    # a lime stripe of tape across the sign board
    a[int(FH * .27):int(FH * .285), int(FW * .18):int(FW * .82)] = np.array([.83, 1, .1], np.float32) * .85
    emis[int(FH * .27):int(FH * .285), int(FW * .18):int(FW * .82)] = np.array([.4, .5, .02], np.float32)
    return a, emis, (dx0, dx1, open_y, dy1, bx, by)

# ---------- perspective helpers ----------
def coeffs(dst_pts, src_pts):
    M = []
    for (x, y), (u, v) in zip(dst_pts, src_pts):
        M.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); M.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    return np.linalg.solve(np.array(M, np.float64), np.array(src_pts, np.float64).reshape(8))
def warp(tex, quad, W, H):
    th, tw = tex.shape[:2]
    im = Image.fromarray((np.dstack([tex, np.ones(tex.shape[:2], np.float32)]) * 255).astype(np.uint8), 'RGBA')
    c = coeffs(quad, [(0, 0), (tw, 0), (tw, th), (0, th)])
    return arr(im.transform((W, H), Image.PERSPECTIVE, tuple(c), Image.BICUBIC))

def ground_tex(GW, GD, seed):
    global rng; rng = np.random.default_rng(seed)
    g = fract(GD, GW, (64, 32, 16, 8, 4, 2))[..., None]
    t = np.array([.11, .105, .1], np.float32) * (0.6 + .9 * g)
    agg = (rng.random((GD, GW)) > .985).astype(np.float32)[..., None]; t = t + agg * .08
    # cracks + a cable running toward the door
    img = Image.fromarray((np.clip(t, 0, 1) * 255).astype(np.uint8)); d = ImageDraw.Draw(img)
    for k in range(14):
        x0, y0 = rng.uniform(0, GW), rng.uniform(0, GD); pts = [(x0, y0)]
        for j in range(8): x0 += rng.uniform(-30, 30); y0 += rng.uniform(-60, 60); pts.append((x0, y0))
        d.line(pts, fill=(14, 13, 12), width=3)
    cx = GW * .78; pts = [(cx + np.sin(j / 3) * 18, GD - j * GD / 40) for j in range(41)]
    d.line(pts, fill=(8, 8, 8), width=9); d.line([(p[0] - 2, p[1]) for p in pts], fill=(60, 58, 52), width=2)
    # dropped flyers on the ground
    t = arr(img)
    for name, fx, fy in (('no-identity.png', .2, .22), ('mad-women-and-poets.png', .62, .5), ('to-see-and-be-seen.png', .3, .72)):
        p = poster(name, int(GW * .14), rng.uniform(-40, 40)); paste(t, p, int(GW * fx), int(GD * fy), .8)
    puddle = np.clip((fract(GD, GW, (256, 128, 64, 32)) - .5) * 7, 0, 1)
    return t, puddle

def render(W, H, far, k, S, name):
    fx0, fy0, fx1, fy1 = [v * S for v in far]; W *= S; H *= S
    vp = ((fx0 + fx1) / 2, fy0 + (fy1 - fy0) * .64)
    N = lambda p: (vp[0] + k * (p[0] - vp[0]), vp[1] + k * (p[1] - vp[1]))
    img = np.zeros((H, W, 3), np.float32)
    # sky + the artist's dither sky
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    sky = np.dstack([.04 + .5 * np.clip(yy / fy0, 0, 1) ** 3, .03 + .16 * np.clip(yy / fy0, 0, 1) ** 3, .06 + .05 * np.clip(yy / fy0, 0, 1)])
    ds = arr(Image.open(os.path.join(UI, 'dither-sky.png')).convert('RGB').resize((W, int(fy0 + 40 * S)), Image.LANCZOS))
    img[:ds.shape[0]] = sky[:ds.shape[0]] * .55 + ds * sky[:ds.shape[0]] * 1.4
    img[ds.shape[0]:] = sky[ds.shape[0]:]
    # ground
    GW, GD = 1100, 3000; gt, pud = ground_tex(GW, GD, 3)
    gq = [N((fx0, fy1)), N((fx1, fy1)), (fx1, fy1), (fx0, fy1)]
    gq = [(fx0, fy1), (fx1, fy1), N((fx1, fy1)), N((fx0, fy1))]
    gw = warp(np.dstack([gt[..., 0], gt[..., 1], gt[..., 2]])[::-1][::-1], gq, W, H)
    # (texture row 0 = far edge)
    gw = warp(gt, gq, W, H); pw = warp(np.dstack([pud, pud, pud]), gq, W, H)
    m = gw[..., 3:4]; img = img * (1 - m) + gw[..., :3] * m; puddle = pw[..., 0] * m[..., 0]
    # walls
    TW, TH = 3600, 1100
    L = wall_texture(TW, TH, 21, [
        ('are-we-alive-yet.png', 120, 250, 250, 0, 3), ('all-signs-point-to-yes.png', 980, 330, 190, 0, 4),
        ('i-stand-alone-orange.png', 1900, 300, 210, 2, 2), ('when-you-rain.png', 2500, 260, 200, -1, 3), ('stop-asking-me-about-my-future.png', 3200, 330, 170, 0, 2)],
        [('bloom', 640, 40, .42, None), ('guy', 1720, 740, .5, (.92, .9, .84)), ('gold', 2900, 650, .2, None), ('bloom', 3350, 760, .14, (.83, 1, .1)), ('flower', 2280, 470, .62, None), ('gold', 150, 640, .26, (.83, 1, .1)), ('guy', 980, 820, .34, (.9, .2, .15))])
    R = wall_texture(TW, TH, 33, [
        ('mad-women-and-poets.png', 80, 280, 240, 0, 3), ('no-identity.png', 900, 300, 220, -1, 3),
        ('who-will-you-be.png', 1800, 280, 200, 1, 3), ('to-see-and-be-seen.png', 2550, 300, 190, 0, 3), ('im-sorry-again.png', 3200, 380, 260, -3, 1)],
        [('gold', 700, 60, .34, None), ('guy', 2100, 760, .42, (.83, 1, .1)), ('bloom', 3000, 720, .16, (.92, .9, .84)), ('flower', 300, 520, .45, None), ('bloom', 2650, 500, .3, (.92, .9, .84)), ('guy', 1300, 830, .3, (.9, .2, .15)), ('gold', 3300, 700, .2, None)])
    Lq = [N((fx0, fy0)), (fx0, fy0), (fx0, fy1), N((fx0, fy1))]
    Rq = [N((fx1, fy0)), (fx1, fy0), (fx1, fy1), N((fx1, fy1))]
    for tex, q in ((L, Lq), (R[:, ::-1].copy(), [Rq[1], Rq[0], Rq[3], Rq[2]])):
        w_ = warp(tex, q, W, H); m = w_[..., 3:4]; img = img * (1 - m) + w_[..., :3] * m
    # facade
    FW, FH = int(fx1 - fx0), int(fy1 - fy0)
    fa, fe, (dx0, dx1, oy, dy1, bx, by) = facade(FW, FH, S)
    img[int(fy0):int(fy0) + FH, int(fx0):int(fx0) + FW] = fa
    emis = np.zeros_like(img); emis[int(fy0):int(fy0) + FH, int(fx0):int(fx0) + FW] = fe
    door = (fx0 + (dx0 + dx1) / 2, fy0 + (oy + dy1) / 2)
    bulb = (fx0 + bx, fy0 + by)
    # ---- light ----
    def glow(c, sx, sy, col, p=1.0):
        return (np.exp(-(((xx - c[0]) / sx) ** 2 + ((yy - c[1]) / sy) ** 2)) ** p)[..., None] * np.array(col, np.float32)
    s = S * (W / S / 2400) ** .0
    lamp = N((fx0, fy0 + (fy1 - fy0) * .05)); lamp = ((lamp[0] + fx0) / 2 * 1.0, (lamp[1] * .35 + fy0 * .65))
    light = np.full((H, W, 3), [.05, .045, .06], np.float32)
    light += glow((door[0], fy1), (fx1 - fx0) * .75, (fy1 - fy0) * .9, [1.5, 1.7, .45])
    light += glow((door[0], fy1 + (H - fy1) * .3), (fx1 - fx0) * 1.5, (H - fy1) * .7, [.32, .3, .1])
    light += glow(bulb, (fx1 - fx0) * .5, (fy1 - fy0) * .5, [1.6, .2, .15])
    light += glow(lamp, W * .2, H * .28, [1.4, .5, .16])
    light += glow((W * .92, H * .35), W * .14, H * .3, [.9, .12, .1])
    out = img * light
    # wet ground: mirrored light from the door + bulb, streaked
    refl_src = np.clip(out + emis, 0, 4)
    ry = np.clip(2 * fy1 - yy, 0, H - 1).astype(int); refl = refl_src[ry, xx.astype(int)]
    refl = np.dstack([rs(rs(refl[..., i], W // 3, H // 24, Image.BILINEAR), W, H) for i in range(3)])
    wet = np.clip(puddle * .9 + .18, 0, 1)[..., None] * (yy > fy1)[..., None]
    out = out * (1 - wet * .5) + refl * wet * 1.1
    out += emis * 1.1
    # fog + god-rays out of the door
    fog = np.clip(fract(H, W, (256 * S, 128 * S, 64 * S)) - .2, 0, 1)[..., None]
    out += glow((door[0], door[1]), (fx1 - fx0) * 1.1, (fy1 - fy0) * .9, [.38, .46, .06]) * (.3 + fog)
    out += glow((door[0], fy1), W * .45, (H - fy0) * .35, [.4, .14, .06]) * fog * .4
    ang = np.arctan2(yy - door[1], xx - door[0]); rays = (np.sin(ang * 23) * .5 + .5) ** 6 * (np.sin(ang * 7 + 1) * .5 + .5)
    dist = np.hypot(xx - door[0], yy - door[1]); out += (rays * np.exp(-dist / (W * .25)) * (yy < door[1] + 40 * S))[..., None] * np.array([.35, .45, .05], np.float32) * .6
    # grade: crush, warm, vignette, grain, slight chroma split
    out = out / (1 + out * .55)
    out = np.clip((out - .02) * 1.25, 0, 1) ** 1.08
    out = out * np.array([1.06, .97, .88], np.float32)
    vig = 1 - .6 * (((xx - W / 2) / (W * .65)) ** 2 + ((yy - H * .52) / (H * .7)) ** 2)[..., None]
    out *= np.clip(vig, .25, 1)
    out += (rng.standard_normal((H, W, 1)).astype(np.float32)) * .025
    out = np.clip(out, 0, 1)
    sh = int(1.5 * S); out[..., 0] = np.roll(out[..., 0], sh, 1); out[..., 2] = np.roll(out[..., 2], -sh, 1)
    im = Image.fromarray((out * 255).astype(np.uint8)).resize((W // S, H // S), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=2))
    im.save(os.path.join(OUT, name), quality=84, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)) // 1024, 'KB')

which = sys.argv[3] if len(sys.argv) > 3 else 'both'
if which in ('wide', 'both'): render(2400, 1400, (880, 420, 1520, 960), 4.4, int(os.environ.get('SS','2')), 'walk-scene.jpg')
if which in ('tall', 'both'): render(1200, 2000, (300, 560, 900, 1066), 6.3, int(os.environ.get('SS','2')), 'walk-scene-tall.jpg')
