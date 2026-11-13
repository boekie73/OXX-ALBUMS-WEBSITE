# OXX Albums V4.2.1 — Android correction

Development branch: `codex/mobile-v4.2.1`.
Preview destination: `preview/v4.2.1/index.html`, containing an exact copy of `OXXAlbums_Android_V4_2_1.html`.

## Reproduced defect

V4.2 initialized `overview=false`, enabled the Leesstand button and already rendered a 780px design. Clicking Leesstand calls `setOverview(false)` again, so it has no visible effect. At 393 × 851, the measured homepage width was 780px both before and after the first touch. The old tests checked state and event response, not an actual before/after change in design width. This was a state/initialization issue reproducible in mobile Chromium, not evidence of an Android-only JavaScript failure.

## Correction

V4.2.1 consistently starts in Overzicht. Touching Leesstand enlarges the original design, and touching Overzicht restores viewport width. The state also applies to newly loaded Classic/Essential pages. The one-line navigation scrolls horizontally, stays 61px tall, and retains 44px touch targets. On the homepage, Leesstand scales the intact original image to at least the available viewport height, rather than limiting it to a 780px canvas that leaves a large blank area below. The design scrolls horizontally. Overzicht fits the complete image to screen width; since the original design is wide, unused viewport background below it is unavoidable without cropping, stretching, adding content or changing the approved design. There is no added fixed-height spacer.

Collection dialogs are limited to the visible screen and frame height, with their close controls reachable at the top. This fixes a further issue found with actual touch tests at 320px. Original image data, embedded collection HTML, text, prices and hotspot coordinates are preserved byte for byte. Desktop styles remain unchanged.

## Validation

Run an HTTP server on port 8001 in the repository, then run `node review/v4.2.1/test.cjs`. Requires Playwright and `/usr/bin/chromium`.

The suite uses touch-enabled mobile Chromium at 320×640, 360×800, 393×851, 412×915, 650×900 and 700×900. It measures actual Home/Classic/Essential widths and heights in both modes, performs a native browser touch swipe, tests all collection dialogs and close controls, tests Classic/Essential/Home hotspots and mobile navigation, rotates the viewport and checks JavaScript errors. Desktop screenshots at 701, 844 and 1440px are compared byte for byte against V4.1. Original embedded images and collection HTML are compared as well. `results.json` records the measurements.

`probe.cjs` reproduces the original no-op and saves before/after homepage screenshots. Other screenshots show the two collection modes and the result of a touch swipe. Physical Android acceptance is still required.
