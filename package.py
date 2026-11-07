"""Builds dist/shedithers-web.zip — everything needed to host or sell SHEDITHERS as a static web app."""
import os, zipfile, json, time
ROOT = os.path.dirname(os.path.abspath(__file__))
INCLUDE = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets']
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'shedithers-web.zip')
n = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for item in INCLUDE:
        p = os.path.join(ROOT, item)
        if os.path.isfile(p):
            z.write(p, item); n += 1
        else:
            for dp, _, fs in os.walk(p):
                for f in fs:
                    full = os.path.join(dp, f); z.write(full, os.path.relpath(full, ROOT).replace(os.sep, '/')); n += 1
    z.writestr('README.txt', 'SHEDITHERS - Dither Lab\nUpload this whole zip to itch.io (HTML project), Netlify Drop, or any static host.\nindex.html is the entry point. Made with love.\n')
print(f'Built {out} ({n} files, {os.path.getsize(out)/1048576:.1f} MB)')

# Also write an unzipped copy for drag-and-drop hosts (Netlify Drop, etc.)
import shutil
folder = os.path.join(ROOT, 'dist', 'shedithers-web')
if os.path.isdir(folder):
    shutil.rmtree(folder)
with zipfile.ZipFile(out) as z:
    z.extractall(folder)
print(f'Unzipped copy ready to drag-and-drop: {folder}')
