#!/usr/bin/env python3
"""Turns the Bad Boy photo folder into web-ready images and a seed manifest.

    python3 -I scripts/prepare_photos.py "<unzipped Bad Boy Pictures folder>"

Writes src/seed/media/<target>/*.webp (max 1600 px, trimmed to the machine) and
src/seed/data/photos.json, then prints anything it couldn't place. Re-run it whenever the photo
set changes; `pnpm seed` loads the result into the site.

Files are matched by FILE NAME, not folder, because some folders hold another model's photos
(e.g. Revolt SD frames sit in the Revolt folder, MZ Rambler inside MZ Magnum).
"""
import json
import os
import re
import shutil
import sys

from PIL import Image, ImageChops

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO, 'src', 'seed', 'media')
MANIFEST = os.path.join(REPO, 'src', 'seed', 'data', 'photos.json')
BRAND_DIR = os.path.join(REPO, 'public', 'brand')
MAX_EDGE = 1600

# (file-name pattern, kind, target slug, display name). First match wins.
RULES = [
    (r'^2025_MZ Rambler_', 'model', 'mz-rambler', 'MZ Rambler zero-turn mower'),
    (r'^2025_MZ Magnum_', 'model', 'mz-magnum', 'MZ Magnum zero-turn mower'),
    (r'^ZT Elite_', 'model', 'zt-elite', 'ZT Elite zero-turn mower'),
    (r'^2025_ZT Avenger_', 'model', 'zt-avenger', 'ZT Avenger zero-turn mower'),
    (r'^360_2026_Maverick HD_', 'model', 'maverick-hd', 'Maverick HD zero-turn mower'),
    (r'^360_2026_Maverick_', 'model', 'maverick', 'Maverick zero-turn mower'),
    (r'^2025_Raider_', 'model', 'raider', 'Raider walk-behind mower'),
    (r'^2026_RebelSD_', 'model', 'rebel-sd', 'Rebel SD zero-turn mower'),
    (r'^Rebel X_', 'model', 'rebel-x', 'Rebel X zero-turn mower'),
    (r'^Rebel360_', 'model', 'rebel', 'Rebel zero-turn mower'),
    (r'^2025_Renegade Diesel_', 'model', 'renegade-diesel', 'Renegade Diesel zero-turn mower'),
    (r'^Renegade_Gas_', 'model', 'renegade-gas', 'Renegade Gas zero-turn mower'),
    (r'^RevoltSD_Profile', 'model', 'revolt-sd', 'Revolt SD stand-on mower'),
    (r'^Revolt X_Profile', 'model', 'revolt-x', 'Revolt X stand-on mower'),
    (r'^Revolt_360_', 'model', 'revolt', 'Revolt stand-on mower'),
    (r'^RogueMain', 'model', 'rogue', 'Rogue zero-turn mower'),
    (r'^BBM-EMagnum_', 'model', 'e-magnum', 'E-Magnum electric zero-turn mower'),
    (r'^5045', 'model', 'tractor-5045', '5045 compact utility tractor'),
    (r'^5055', 'model', 'tractor-5055', '5055 compact utility tractor'),
    (r'^BBT-40356', 'model', 'tractor-4035', '4035 compact tractor'),
    (r'^BBT-4025_', 'model', 'tractor-4025', '4025 compact tractor'),
    (r'^BBT-3026H_', 'model', 'tractor-3026', '3026 compact tractor'),
    (r'^BBT-1025H_', 'model', 'tractor-1025', '1025 sub-compact tractor'),
    (r'^BBT-1022H_', 'model', 'tractor-1022', '1022 sub-compact tractor'),
    (r'^BBM-e-Product_BPBlower_', 'model', 'e-series-backpack-blower', 'E-Series backpack blower'),
    (r'^BBM-e-Product_Blower_', 'model', 'e-series-handheld-blower', 'E-Series handheld blower'),
    (r'^BBM-e-Product_Chainsaw_', 'model', 'e-series-chainsaw', 'E-Series chainsaw'),
    (r'^BBM-e-Product_PoleSaw_', 'model', 'e-series-pole-saw', 'E-Series pole saw'),
    (r'^BBM-e-Product_Mower_', 'model', 'e-series-self-propelled-mower', 'E-Series self-propelled mower'),
    (r'^BBM-e-Product_Trimmer_', 'model', 'e-series-string-trimmer', 'E-Series string trimmer'),
    (r'^BBM-e-Product_Charger_4_', 'part', '4A Single Port Battery Charger', 'E-Series 4A single-port battery charger'),
]

# The main (first) photo for each target. Everything else follows in file order.
MAIN = {
    'e-magnum': 'Front_Left', 'tractor-5045': '5045S', 'tractor-5055': '5055S',
    'e-series-backpack-blower': 'Front_Right', 'e-series-handheld-blower': 'Front_Right',
    'e-series-chainsaw': 'Front_Right', 'e-series-pole-saw': 'RearLeft',
    'e-series-self-propelled-mower': 'Bagger_Left', 'e-series-string-trimmer': 'FrontRight',
    '4A Single Port Battery Charger': 'Charger_4',
}

# Studio 360 sets come as 8 frames turning the machine; position -> view.
SPIN_VIEWS = ['side view', 'front three-quarter view', 'front view', 'front three-quarter view, right',
              'opposite side view', 'rear three-quarter view', 'rear view', 'rear three-quarter view, left']

VIEW_WORDS = [
    ('Front_Backhoe', 'front view with loader and backhoe'), ('FrontSteep', 'front view'),
    ('FrontExtreme', 'head close-up'), ('SawEnd', 'saw head close-up'), ('Sections', 'shown in sections'),
    ('Bagger', 'with bagger'), ('Mulch', 'mulching setup'), ('Front', 'front view'), ('Rear', 'rear view'),
    ('Side', 'side view'), ('LeftFront', 'front view'), ('Studio', 'studio view'),
]

CAB = {'5045CS': 'with cab', '5045S': 'with ROPS', '5055CS': 'with cab', '5055S': 'with ROPS',
       'BBT-40356SCH': 'with cab'}


def trim(im: Image.Image) -> Image.Image:
    """Crops empty margins (transparent, or near-white for JPEGs) and keeps a small border."""
    if im.mode == 'RGBA':
        box = im.split()[-1].point(lambda a: 255 if a > 8 else 0).getbbox()
    else:
        rgb = im.convert('RGB')
        diff = ImageChops.difference(rgb, Image.new('RGB', rgb.size, (255, 255, 255))).convert('L')
        box = diff.point(lambda v: 255 if v > 18 else 0).getbbox()
    if not box:
        return im
    pad = int(max(box[2] - box[0], box[3] - box[1]) * 0.04)
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
    return im.crop(box)


def save_webp(src: str, dest: str) -> tuple[int, int]:
    im = Image.open(src)
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    im = trim(im)
    im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    im.save(dest, 'WEBP', quality=80, method=6)
    return im.size


def view_for(name: str, index: int, count: int, spin: bool) -> str:
    if spin and count == 8:
        return SPIN_VIEWS[index]
    stem = os.path.splitext(name)[0]
    for key, words in CAB.items():
        if stem.startswith(key):
            extra = next((w for k, w in VIEW_WORDS if k in stem and k != 'Studio'), None)
            return f'{words}, {extra}' if extra else words
    return next((w for k, w in VIEW_WORDS if k in stem), 'product view')


def main(src_root: str) -> None:
    files = []
    for d, _, names in os.walk(src_root):
        for n in names:
            if n.lower().endswith(('.png', '.jpg', '.jpeg')):
                files.append(os.path.join(d, n))

    groups: dict[tuple, list[str]] = {}
    unmatched, logos = [], []
    for path in sorted(files, key=lambda p: os.path.basename(p)):
        name = os.path.basename(path)
        if name.startswith('bbm_logo_'):
            logos.append(path)
            continue
        rule = next((r for r in RULES if re.search(r[0], name)), None)
        if not rule:
            unmatched.append(os.path.relpath(path, src_root))
            continue
        groups.setdefault(rule[1:], []).append(path)

    shutil.rmtree(OUT_DIR, ignore_errors=True)
    os.makedirs(OUT_DIR)
    manifest = []
    for (kind, target, display), paths in groups.items():
        spin = len(paths) == 8 and all(p.lower().endswith('.png') for p in paths) and kind == 'model' \
            and not target.startswith('tractor')
        views = [view_for(os.path.basename(p), i, len(paths), spin) for i, p in enumerate(paths)]
        order = list(range(len(paths)))
        main_key = MAIN.get(target)
        first = next((i for i, p in enumerate(paths) if main_key and main_key in os.path.basename(p)), 1 if spin else 0)
        order.remove(first)
        order.insert(0, first)
        folder = re.sub(r'[^a-z0-9]+', '-', target.lower()).strip('-')
        os.makedirs(os.path.join(OUT_DIR, folder), exist_ok=True)
        images = []
        for pos, i in enumerate(order, 1):
            view_slug = re.sub(r'[^a-z0-9]+', '-', views[i].lower()).strip('-')
            filename = f'bb-{folder}-{pos:02d}-{view_slug}.webp'
            w, h = save_webp(paths[i], os.path.join(OUT_DIR, folder, filename))
            images.append({'file': f'{folder}/{filename}', 'alt': f'Bad Boy {display}, {views[i]}',
                           'width': w, 'height': h, 'source': os.path.relpath(paths[i], src_root)})
        manifest.append({'kind': kind, 'target': target, 'images': images})

    manifest.sort(key=lambda m: (m['kind'], m['target']))
    with open(MANIFEST, 'w') as f:
        json.dump({'note': 'Generated by scripts/prepare_photos.py. Do not edit by hand.', 'targets': manifest}, f, indent=2)
        f.write('\n')

    # Bad Boy logos for the "Authorized dealer" mark, served as static files.
    os.makedirs(BRAND_DIR, exist_ok=True)
    for path in logos:
        im = Image.open(path).convert('RGBA')
        im = trim(im)
        im.thumbnail((800, 800), Image.LANCZOS)
        im.save(os.path.join(BRAND_DIR, os.path.basename(path).replace('.png', '.webp')), 'WEBP', quality=90, method=6)

    total = sum(len(m['images']) for m in manifest)
    print(f'{total} photos for {len(manifest)} targets, {len(logos)} logos')
    for u in unmatched:
        print(f'UNMATCHED: {u}')


if __name__ == '__main__':
    main(sys.argv[1])
