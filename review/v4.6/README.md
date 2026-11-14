# V4.6 — local application preparation

Based on the approved, published V4.4. Only the Start dialogs of Classic and Essential, CSS scoped to those forms, and their local validation handlers change. Existing images, slogan, prices, terms, navigation, Mijn OXX and Premium are retained. The application does not connect to Mijn OXX.

## Current behavior

The existing Start button opens a form with name, email, readonly selected collection, the six existing book sizes, a positive whole-number photo estimate and optional comments. Required fields, whitespace-only names, email syntax, the format selection and the photo estimate are validated. Native email syntax validation is not proof of mailbox ownership.

“Controleer aanvraag” only checks the fields. Its result explicitly says the application has not been sent or stored and sending is unavailable. There is no submit endpoint, network transmission, application storage, upload, payment or account creation. The form's submit event is prevented, the check button is not a submit button, and pressing Enter does not transmit anything. Status output uses textContent and does not echo personal information. Closing or returning to the collection resets the fields; reopening starts empty. Native browser autofill is disabled for the form, though browser behavior is outside the website's control.

The original no-payment-obligation paragraph is retained verbatim, with an additional explicit statement that the application is nonbinding and not an order. The estimate is not presented as a change to the collection's existing book/photo limits.

## Validation

Serve the repository on port 8006, then run `python3 review/v4.6/verify.py` and `node review/v4.6/test.cjs` (Node/Playwright and `/usr/bin/chromium` required).

Tests cover touch-enabled Chromium at 320×640, 393×851 and 412×915 and desktop at 1440×900, for both collections. They check required fields, whitespace-only names, invalid email, missing format, empty/zero/negative/fractional photo counts, every size option, readonly collection, optional comments, safe text handling, Enter, prevented submission, zero application network requests and empty local/session storage. Close, Escape and Return reset the form; existing information dialogs, Classic/Essential cross-links and Home routes work. Premium and Mijn OXX remain information-only on mobile. Desktop Home/Classic/Essential rendering with the dialog closed is pixel identical to V4.4. `results.json` and four form screenshots record the checks. These tests emulate Android viewport/touch behavior; they are not physical Android acceptance.

## Safe receiving and storage options for a later phase

No services have been configured or contacted for form data. The following require a separate implementation decision and permission:

1. An HTTPS endpoint on an owned server, with a private encrypted database hosted in an agreed region (for example within the EU). Only the backend holds database credentials. Validate the collection and six sizes again on the server, enforce field limits and rate limits, and apply CSRF protection if cookie-based authorization is introduced. Set access roles, retention/deletion rules and protected backups before receiving customer information.
2. A serverless HTTPS endpoint plus a managed private database, under the same access, encryption and retention controls. Any third-party provider and data-processing arrangement must be approved before connection; nothing is added automatically.
3. A server-side email notification through approved SMTP or a transactional email provider, after the request has been safely recorded. Keep mail credentials on the server and send minimal notification data. Treat email as a notification channel rather than the sole project archive. Confirm “received” to the customer only after successful durable receipt; provide an honest retry state on failure.

No secrets belong in this static GitHub Pages HTML. Do not store applications in the public Git repository, browser URLs, analytics or unapproved external form services. The current client-side checks must be repeated server-side before any storage or processing.

## Publication

Publish only an exact copy of `OXXAlbums_Android_V4_6.html` as `preview/v4.6/index.html` on main. The root homepage, original asset and every earlier preview must keep their Git blob IDs. No V4.5 is published.
