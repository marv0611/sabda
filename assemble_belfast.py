#!/usr/bin/env python3
"""Reassemble sabda_belfast_v11_1.html from slim HTML + .b64 assets."""
import os

slim = 'sabda_belfast_v11_1_slim.html'
assets_dir = 'assets_belfast'
output = 'sabda_belfast_v11_1_full.html'

with open(slim, 'r') as f:
    html = f.read()

for aid in ['skydata', 'birdsdata', 'planetdata', 'saturndata']:
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
