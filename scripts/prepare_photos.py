#!/usr/bin/env python3
"""Turns the Bad Boy photo folder into web-ready images and a seed manifest.

    python3 -I scripts/prepare_photos.py "<unzipped Bad Boy Pictures folder>"
    python3 -I scripts/prepare_photos.py --add "<folder with more photos>"

--add keeps every photo already prepared and only (re)writes the models found in the new folder.

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
    # Implements, from badboycountry.com/tractors/implements (downloaded 2026-11-21).
    (r'^flex_wing_cutter_', 'model', 'implement-flex-wing-cutter', "12' flex-wing rotary cutter"),
    (r'^cutter_', 'model', 'implement-rotary-cutters', 'rotary cutter'),
    (r'^box_blade_', 'model', 'implement-box-blades', 'box blade'),
    (r'^land_grader_', 'model', 'implement-land-graders', 'land grader'),
    (r'^rotary_tiller_', 'model', 'implement-rotary-tillers', 'rotary tiller'),
    (r'^disc_harrow_', 'model', 'implement-disc-harrow', 'disc harrow'),
    (r'^(qa_front_hay_spear|3_point_hay_fork|hay_fork_trailer_hitch|trailer_mover|hd_pallet_forks|pallet_forks)_',
     'model', 'implement-forks-and-hitches', 'forks and hitches'),
    (r'^grappler_', 'model', 'implement-front-grapples', 'front grapple'),
    (r'^grader_blade_', 'model', 'implement-grader-blades', 'rear grader blade'),
    (r'^landscape_rake_', 'model', 'implement-landscape-rakes', 'landscape rake'),
    (r'^mid_mower_deck_', 'model', 'implement-mid-mount-mower-deck', 'mid-mount mower deck'),
    (r'^spreader_', 'model', 'implement-spreaders', 'spreader'),
    (r'^snow_pusher_', 'model', 'implement-snow-pusher', 'snow pusher'),
    (r'^finish_mower_', 'model', 'implement-finish-mower', 'finish mower'),
    # More photos from badboycountry.com (downloaded 2026-11-21), renamed site_<name>_N before running.
    (r'^site_push_mower_', 'model', 'push-mower', 'self-propelled push mower'),
    (r'^site_revolt_fury_', 'model', 'revolt-fury-blower', 'Revolt Fury stand-on blower'),
    (r'^site_hedge_trimmer_', 'model', 'e-series-hedge-trimmer', 'E-Series 80V hedge trimmer'),
    (r'^site_snow_thrower_', 'model', 'e-series-snow-thrower', 'E-Series 80V snow thrower'),
    (r'^site_attach_', 'model', 'e-series-string-trimmer-attachments', 'E-Series string trimmer attachment'),
    (r'^site_corded_pw_', 'model', 'e-series-corded-pressure-washer', 'corded electric pressure washer'),
    (r'^site_gas_pw_', 'model', 'gas-pressure-washers', 'gas pressure washer'),
    (r'^site_bandit550_', 'model', 'bandit-550', 'Bandit 550 UTV'),
    (r'^site_bandit750_', 'model', 'bandit-750', 'Bandit 750 UTV'),
    (r'^site_banditcrew_', 'model', 'bandit-750-crew-cab', 'Bandit 750 Crew Cab UTV'),
    (r'^site_recon_', 'model', 'recon', 'Recon mini skid steer'),
    (r'^site_terrain_', 'model', 'terrain', 'Terrain small articulating loader'),
    (r'^site_part_worklight', 'part', '80V Work Light', 'E-Series 80V work light'),
    (r'^site_part_inverter', 'part', '80V Power Inverter', 'E-Series 80V power inverter'),
    (r'^site_part_linecutter', 'part', 'String Trimmer Line With Cutter', 'string trimmer line with cutter'),
    (r'^site_part_line', 'part', 'String Trimmer Line', 'string trimmer line'),
]

# Implement photos: file-name start -> what the photo shows (checked before VIEW_WORDS).
IMPLEMENT_VIEWS = [
    ('cutter_sd_4_5_6', "standard-duty 4'-6' cutter"), ('cutter_10', "10' pull-type cutter"),
    ('cutter_6', "6' heavy-duty cutter"), ('cutter_7', "7' heavy-duty cutter"), ('cutter_photo', 'cutting pasture'),
    ('flex_wing_cutter_photo', 'in the field'), ('box_blade_photo', 'on a tractor'), ('land_grader_photo', 'grading gravel'),
    ('rotary_tiller_photo', 'tilling'), ('disc_harrow_5', "5' disc harrow"), ('disc_harrow_6', "6' disc harrow"),
    ('disc_harrow_photo', 'in the field'), ('qa_front_hay_spear_photo', 'quick-attach hay spear carrying a bale'),
    ('qa_front_hay_spear', 'quick-attach front hay spear'), ('3_point_hay_fork_photo', '3-point hay fork carrying a bale'),
    ('3_point_hay_fork', '3-prong 3-point hay fork'), ('hay_fork_trailer_hitch_photo', '2-prong hay fork moving a bale'),
    ('hay_fork_trailer_hitch', '2-prong hay fork and trailer mover combo'), ('trailer_mover', '3-point trailer mover'),
    ('hd_pallet_forks', 'heavy-duty pallet forks'), ('pallet_forks', 'standard pallet forks'),
    ('grappler_large', 'rake grapple'), ('grappler_small', 'brush grapple'), ('grappler_photo', 'clearing brush'),
    ('mid_mower_deck', 'on a 1025 tractor'), ('spreader_pull_behind', 'pull-behind spreader'),
    ('spreader_3_point', '3-point hitch spreader'), ('finish_mower_duo', 'two sizes'),
    ('finish_mower_deck_lift', 'single-pin height adjustment'), ('finish_mower_front_forks', 'front forks'),
    ('site_attach_1', 'blower attachment'), ('site_attach_2', 'edger attachment'),
    ('site_attach_3', 'hedge clipper attachment'), ('site_attach_4', 'pruner attachment'),
    ('site_gas_pw_1', 'BBPW3525'), ('site_gas_pw_2', 'BBPW3625'), ('site_bandit750_2', 'orange and camo'),
    ('site_hedge_trimmer_2', 'in use'), ('site_snow_thrower_2', 'studio view'),
]

# Photo sets whose file names say nothing (e.g. BadBoy_Tools_Gas0416_resized.png) are matched by the
# FOLDER they're in, named after Bad Boy's model number: folder -> (kind, target, display name).
FOLDER_RULES = {
    'CS300-14': ('model', 'gas-chainsaw', 'CS300-14 gas chainsaw'),
    'BB880': ('model', 'gas-backpack-blowers', 'BB880 gas backpack blower'),
    'BB1060': ('model', 'gas-backpack-blowers', 'BB1060 gas backpack blower'),
    'HB450': ('model', 'gas-handheld-blower', 'HB450 gas handheld blower'),
    'ED254': ('model', 'gas-edger', 'ED254 gas edger'),
    'HT225-24': ('model', 'gas-hedge-trimmer', 'HT225-24 gas hedge trimmer'),
    'ST225': ('model', 'gas-string-trimmers', 'ST225 gas string trimmer'),
    'ST254': ('model', 'gas-string-trimmers', 'ST254 gas string trimmer'),
    'ST300T': ('model', 'gas-string-trimmers', 'ST300T gas string trimmer'),
}

# The main (first) photo for each target. Everything else follows in file order.
MAIN = {
    'e-magnum': 'Front_Left', 'tractor-5045': '5045S', 'tractor-5055': '5055S',
    'e-series-backpack-blower': 'Front_Right', 'e-series-handheld-blower': 'Front_Right',
    'e-series-chainsaw': 'Front_Right', 'e-series-pole-saw': 'RearLeft',
    'e-series-self-propelled-mower': 'Bagger_Left', 'e-series-string-trimmer': 'FrontRight',
    '4A Single Port Battery Charger': 'Charger_4',
    'implement-rotary-cutters': 'cutter_6_studio', 'implement-flex-wing-cutter': 'flex_wing_cutter_studio',
    'implement-box-blades': 'box_blade_studio', 'implement-land-graders': 'land_grader_studio',
    'implement-rotary-tillers': 'rotary_tiller_studio', 'implement-disc-harrow': 'disc_harrow_6_studio',
    'implement-forks-and-hitches': 'hd_pallet_forks', 'implement-front-grapples': 'grappler_large',
    'implement-finish-mower': 'finish_mower_duo', 'implement-spreaders': 'spreader_3_point',
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
    implement = next((w for k, w in IMPLEMENT_VIEWS if stem.startswith(k)), None)
    if implement:
        return implement
    for key, words in CAB.items():
        if stem.startswith(key):
            extra = next((w for k, w in VIEW_WORDS if k in stem and k != 'Studio'), None)
            return f'{words}, {extra}' if extra else words
    return next((w for k, w in VIEW_WORDS if k in stem), 'product view')


def main(src_root: str, add: bool = False) -> None:
    files = []
    for d, _, names in os.walk(src_root):
        for n in names:
            if n.lower().endswith(('.png', '.jpg', '.jpeg')):
                files.append(os.path.join(d, n))

    groups: dict[tuple, list[str]] = {}
    unmatched, logos = [], []
    labels: dict[str, str] = {}  # photo -> its own name, for folder-matched sets
    for path in sorted(files, key=lambda p: os.path.basename(p)):
        name = os.path.basename(path)
        if name.startswith('bbm_logo_'):
            logos.append(path)
            continue
        rule = next((r for r in RULES if re.search(r[0], name)), None)
        folder_rule = FOLDER_RULES.get(os.path.basename(os.path.dirname(path)))
        if rule:
            groups.setdefault(rule[1:], []).append(path)
        elif folder_rule:
            # One gallery per model; each photo keeps its own model number in the alt text.
            kind, target, display = folder_rule
            key = next((k for k in groups if k[0] == kind and k[1] == target), (kind, target, display))
            groups.setdefault(key, []).append(path)
            labels[path] = display
        else:
            unmatched.append(os.path.relpath(path, src_root))

    manifest = []
    if add:
        with open(MANIFEST) as f:
            new_targets = {t for _, t, _ in groups}
            manifest = [m for m in json.load(f)['targets'] if m['target'] not in new_targets]
    else:
        shutil.rmtree(OUT_DIR, ignore_errors=True)
    os.makedirs(OUT_DIR, exist_ok=True)
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
        shutil.rmtree(os.path.join(OUT_DIR, folder), ignore_errors=True)
        os.makedirs(os.path.join(OUT_DIR, folder), exist_ok=True)
        images = []
        for pos, i in enumerate(order, 1):
            label = labels.get(paths[i])
            view_slug = re.sub(r'[^a-z0-9]+', '-', (label.split(' ')[0] if label else views[i]).lower()).strip('-')
            filename = f'bb-{folder}-{pos:02d}-{view_slug}.webp'
            w, h = save_webp(paths[i], os.path.join(OUT_DIR, folder, filename))
            alt = f'Bad Boy {label}' if label else f'Bad Boy {display}, {views[i]}'
            images.append({'file': f'{folder}/{filename}', 'alt': alt,
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
    args = sys.argv[1:]
    main(args[-1], add='--add' in args)
