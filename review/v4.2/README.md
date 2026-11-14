# OXX Albums V4.2 — review

Development branch: `codex/mobile-v4.2`. The public `main` branch is untouched.
Open `index.html` through an HTTP server (for example `python3 -m http.server`).

## Changes

At viewport widths up to 700 CSS pixels, the original raster designs are shown on a 780px canvas. Swipe horizontally to read the whole design. The `Overzicht` button fits it to the screen; `Leesstand` restores the larger canvas. Mobile Home, Classic and Essential buttons have a minimum 44px touch height. Collection iframe heights follow the design rather than forcing an empty full viewport. Dialog close controls are enlarged and long information remains scrollable. Above 700px, the original desktop layout is retained.

All three original image data URLs, embedded collection documents, prices, conditions and existing dialogs are retained. V4.1 is kept as an untouched baseline. Premium remains unavailable, and Mijn OXX remains an information window for the service in development. No checkout or account service has been added.

## Evidence

`before-*.png` and `after-*.png` compare Home, Classic and Essential at 360, 412 and 1440px. `capture.cjs` regenerates these from the local HTTP server on port 8000. `test.cjs` checks navigation, all four collection dialogs, mobile modes, frame height and JavaScript errors at nine viewport widths, plus byte equality of embedded collection pages and exact desktop screenshot equality. Requires Node, Playwright and `/usr/bin/chromium`.

These are Chromium tests with mobile viewport/touch emulation, not tests on a physical Android device. Physical Android acceptance remains with the owner. Readability improves by displaying the unchanged image at a larger size; the image text itself cannot reflow. Horizontal swiping in Leesstand is intentional.
