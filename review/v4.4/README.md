# V4.4 — customer-facing popup text

Based on the published V4.3 source. Only the navigation, Classic and Essential Mijn OXX dialog contents and the shared Premium notice are changed. The account dialogs show the exact requested sentence and retain their close buttons. Premium reads: “Premium is nog in ontwikkeling en niet bestelbaar.” No account, registration or ordering features are added.

`verify.py` checks equality outside these four dialog contents and equality of all original image data. Thus CSS, navigation scripts, prices, conditions, images and other dialogs are unchanged.

`test.cjs` uses touch-enabled mobile Chromium at 320×640, 393×851 and 412×915. It checks all navigation buttons, both collection pages' four information dialogs and close controls, the exact Mijn OXX text at each entry point, Premium's non-orderable notice, reading/overview, collection cross-links, Home routes and the OXX Design link from the homepage card, navigation and both collections. It verifies browser history returns after external navigation. Outbound OXX Design requests are intercepted to test actual link targets independently of the live service; this does not verify external server availability. Physical Android hardware is not available here.

One desktop comparison of Home, Classic and Essential against V4.3 checks that closed-popup rendering remains pixel identical. V4.3 already passed pixel comparisons against V4.1. No further layout or image changes are made.

Run a repository HTTP server on port 8004, then `python3 review/v4.4/verify.py` and `node review/v4.4/test.cjs`. Requires Node, Playwright and `/usr/bin/chromium`. Measurements are in `results.json`.

Publish only the standalone source copy at `preview/v4.4/index.html`. Preserve the root homepage and all previous previews.
