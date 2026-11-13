# OXX Albums V4.3

Development branch: `codex/mobile-v4.3`, based on the tested V4.2.1.
Standalone preview: `/preview/v4.3/`.

## Mobile-only changes (up to 700 CSS pixels)

The homepage uses five lossless PNG crops from the decoded original approved 1536×865 homepage image: its OXX Albums header and slogan, followed by Classic, Essential, Premium and OXX Design cards. The original source image and both embedded collection documents are retained unchanged. No generated images, replacement logos, edited source pixels or new designs are used. `crops.json` records the exact source rectangles and pixel hashes. `verify_crops.py` compares every embedded crop pixel with its original source pixel.

The cards stack vertically, with no horizontal homepage scrolling or fixed-height spacer. Only the one-line navigation scrolls horizontally when necessary. Its six primary destinations are Home, Classic, Essential, Premium, Mijn OXX and OXX Design. Collection pages retain their reading/overview controls and existing prices, terms, dialogs and hotspot coordinates. Premium gives information only, from its card, navigation and either collection's hotspot. Mijn OXX is an information dialog copied from the existing Classic account window, with no login or registration. OXX Design opens `https://oxxdesign.nl` from its card, navigation or existing collection link.

Desktop above 700px uses the original homepage and collection rendering; the mobile crops and added navigation are hidden.

## Validation

Serve the repository with `python3 -m http.server 8003 --bind 127.0.0.1`, then run:

- `node review/v4.3/test.cjs` (requires Playwright and `/usr/bin/chromium`)
- `python3 review/v4.3/verify_crops.py` (requires Pillow)

Touch-enabled Chromium tests cover 320×640, 360×800, 393×851, 412×915, 650×900 and 700×900. They check vertical card order and bounds, no horizontal page overflow, only 12px padding below the last card, all six navigation destinations, native navigation swiping, each homepage card, all four collection dialogs and close buttons, Premium hotspots, Home/Classic/Essential hotspots, actual reading/overview widths, rotation and JavaScript errors. The OXX Design link is activated from both the card and navigation, with its outgoing browser request intercepted to verify the exact URL independently of the external service.

Live access to `oxxdesign.nl` is blocked by the cloud proxy (403); the test does not claim to verify the external service itself. The same environment has previously blocked live GitHub Pages checks. Physical Android acceptance is still required.

Desktop Home, Classic and Essential screenshots are compared byte for byte to V4.1 at 701, 844 and 1440px. The 1440px before/after files, mobile full-page screenshots and comparison dialogs are included alongside `results.json`.

## Publishing boundary

Only an exact copy of `OXXAlbums_Android_V4_3.html` is to be added to `main` as `preview/v4.3/index.html`. The root `index.html`, V4.1 and the existing V4.2/V4.2.1 previews must retain their existing Git blob IDs. No PR merge or main-site replacement is part of this release.
