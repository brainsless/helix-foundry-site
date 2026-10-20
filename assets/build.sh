#!/bin/bash
# Regenerates both figures and inlines them into index.html at their markers.
# Inlined rather than linked so they inherit the sheet's fonts and tokens.
set -euo pipefail
for name in hero boundary; do node assets/diagram.mjs "$name" > "/tmp/dia-$name.svg"; done
python3 - <<'PY'
import re
html = open('index.html').read()
for name in ('hero', 'boundary'):
    svg = "\n".join("    " + l for l in open(f'/tmp/dia-{name}.svg').read().strip().split("\n"))
    marker = f'<!--DIA:{name}-->'
    pattern = re.escape(marker) + r'(?:\n    <svg class="dia"[\s\S]*?</svg>)?'
    html, n = re.subn(pattern, lambda _: marker + "\n" + svg, html, count=1)
    assert n == 1, f'marker {marker} not found'
open('index.html', 'w').write(html)
PY
echo "inlined hero and boundary"
