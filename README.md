# Helix Foundry, site

A static marketing site for Helix Foundry. One page, no build step: open `index.html`
or serve the directory.

    python3 -m http.server 8000

## What is in here

| Path                  | What it is                                                        |
| --------------------- | ----------------------------------------------------------------- |
| `index.html`          | The page. Every string lives here.                                |
| `assets/base.css`     | Ground, lettering, controls. Dark, zero radius, Geist.            |
| `assets/sections.css` | The bordered section boxes and everything inside them.            |
| `assets/field.js`     | The hero film: a point cloud morphing through three formations.   |
| `assets/diagrams.js`  | The two small animated figures.                                   |
| `assets/site.js`      | Smooth scroll, entrances, copy buttons.                           |
| `assets/diagram.mjs`  | Generator for the static technical drawings, inlined by build.sh. |
| `assets/bg-*.jpg`     | Rendered section backgrounds.                                     |
| `assets/shot-*.jpg`   | Product screens.                                                  |

Nothing here is minified or bundled, so a change is a change to the file you are
reading.

## Regenerating the drawings

    ./assets/build.sh

Reads `assets/diagram.mjs`, renders both figures and inlines them into `index.html`
at their `<!--DIA:*-->` markers.
