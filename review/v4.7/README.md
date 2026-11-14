# V4.7 — local application validation and review

Based on the published V4.6. Only the existing application dialog, its scoped functional CSS and local form script change. The homepage, image data, six formats, readonly collection, other information dialogs, navigation, prices and collection conditions are unchanged.

## Behavior

The application introduction is the exact requested sentence. A short existing privacy/reset notice remains. Required name (including whitespace-only rejection), native email validity, format, positive whole-number photo count and per-collection maxima are checked. Classic accepts up to 180 and Essential up to 300, inclusively.

When Classic has 181–300 photos, the inline error refers to Essential and explicitly leaves the choice unchanged. Above 300, neither available collection fits; the message says this rather than recommending the non-orderable Premium. Essential above 300 likewise says no other currently orderable collection fits. No automatic switching occurs.

Valid data opens a review of all six fields. Values are inserted with textContent, preserving comments safely as text. The requested “not sent/no data stored” notice is shown. On small screens the dialog scrolls directly to the review so the first submitted details are visible immediately. “Gegevens corrigeren” returns to the form without resetting input; checking again refreshes the review. Empty optional comments show “Niet ingevuld”.

Close, Escape and Return clear the fields, custom errors and every personal value in the review. No transmission, database, email, payment or upload functionality is connected. No browser storage is used. Data exists only temporarily in the active document until closed or navigated away.

## Checks

Serve the repository on port 8007. Run `python3 review/v4.7/verify.py` and `node review/v4.7/test.cjs` (Node, Playwright and `/usr/bin/chromium`).

Touch-enabled Chromium: 320×640, 393×851 and 412×915. Desktop: 1440×900. Both Classic and Essential are covered for missing fields, whitespace-only name, missing/malformed email, missing size, empty/zero/negative/fractional photo count, exceeding the collection limit, exact inclusive boundaries, valid review, safe comments, editing every editable field, rechecking, closing/reopening, Escape and Return. Tests verify that invalid data never opens review, that collection never switches automatically, and that the first review value is visible without extra scrolling. They assert zero form network requests, empty local/session storage, and cleared review text after close. Existing collection information dialogs, cross-links and Home routes are also checked.

Home/Classic/Essential desktop pixels outside the revised dialog match V4.6. Static comparison proves all image data and content outside the application are unchanged, including Mijn OXX and Premium. Test outcomes are in `results.json`; four review screenshots are included. These checks emulate Android viewport/touch behavior and are not physical Android acceptance.

## Publication

Only `preview/v4.7/index.html` is to be added to main as an exact copy of the standalone V4.7 file. The root homepage, original image asset and every previous preview must retain their existing blob IDs. No PR merge, service integration or V4.5 publication is part of this task.
