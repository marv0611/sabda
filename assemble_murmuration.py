#!/usr/bin/env python3
"""Reassemble sabda_murmuration.html from murmuration slim HTML + .b64 assets."""
import os

slim = 'sabda_murmuration_slim.html'
assets_dir = 'assets_evening'
output = 'sabda_murmuration_full.html'

with open(slim, 'r', encoding='utf-8') as f:
    html = f.read()

for aid in ['skydata', 'skydata_b', 'birdsdata', 'planetdata', 'saturndata', 'balloonhousedata', 'balloonglbdata', 'sabdasymboldata', 'lanterndata']:
    if aid == 'saturndata':
        b64_path = os.path.join('assets_shared', f'{aid}.b64')
    elif aid == 'skydata_b':
        b64_path = os.path.join('assets_belfast', 'skydata.b64')
    elif aid == 'balloonhousedata':
        b64_path = os.path.join('assets', 'house_balloon.b64')
    elif aid == 'balloonglbdata':
        b64_path = os.path.join('assets', 'group_of_balloons.b64')
    elif aid == 'sabdasymboldata':
        b64_path = os.path.join('assets', 'sabda_symbol.b64')
    elif aid == 'lanterndata':
        b64_path = os.path.join('assets', 'sky_lantern.b64')
    else:
        b64_path = os.path.join(assets_dir, f'{aid}.b64')
    with open(b64_path, 'r') as f:
        b64 = f.read().strip()
    placeholder = f'<script id="{aid}" type="text/plain">ASSET_PLACEHOLDER</script>'
    replacement = f'<script id="{aid}" type="text/plain">{b64}</script>'
    html = html.replace(placeholder, replacement)
    print(f"  Injected {aid}: {len(b64)/1024/1024:.1f}MB")

with open(output, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nAssembled: {os.path.getsize(output)/1024/1024:.1f}MB -> {output}")
