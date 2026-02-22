#!/usr/bin/env python3
"""Reassemble sabda_evening_render.html from slim HTML + .b64 assets."""
import os

slim = 'sabda_evening_render_slim.html'
assets_dir = 'assets_evening'
output = 'sabda_evening_render_full.html'

with open(slim, 'r') as f:
    html = f.read()

for aid in ['skydata', 'skydata_b', 'birdsdata', 'planetdata', 'saturndata']:
    if aid == 'saturndata':
        b64_path = os.path.join('assets_shared', f'{aid}.b64')
    elif aid == 'skydata_b':
        b64_path = os.path.join('assets_belfast', 'skydata.b64')
    else:
        b64_path = os.path.join(assets_dir, f'{aid}.b64')
    with open(b64_path, 'r') as f:
        b64 = f.read().strip()
    placeholder = f'<script id="{aid}" type="text/plain">ASSET_PLACEHOLDER</script>'
    replacement = f'<script id="{aid}" type="text/plain">{b64}</script>'
    html = html.replace(placeholder, replacement)
    print(f"  Injected {aid}: {len(b64)/1024/1024:.1f}MB")

with open(output, 'w') as f:
    f.write(html)

print(f"\nAssembled: {os.path.getsize(output)/1024/1024:.1f}MB -> {output}")
