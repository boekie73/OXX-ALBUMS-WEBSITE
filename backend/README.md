# OXX application API — V4.8 preparation

Node 22+; standard library only. This backend is **not deployed** and has no real database, mail service, accounts, uploads or payments. GitHub Pages cannot run it.

## Run and test

- `npm test --prefix backend`: real local HTTP/HTTPS tests using fictitious `.invalid` addresses and an in-memory adapter defined only in the tests. OpenSSL creates a one-day certificate/key in an OS temporary directory for the HTTPS test and removes it afterward. No certificate or secret is committed.
- `npm start --prefix backend`: disabled demonstration at `127.0.0.1:8787`. A correctly originated request receives `503 receiving_disabled`; this command cannot enable receipt. It does not log requests or open a public listener.

## Endpoint contract

`POST /api/aanvragen`, JSON, at most 16,384 bytes. Required: `customerName` (1–120 characters after trim, bounded original length), `email` (up to 254 characters; standard dot-atom mailbox and fully qualified valid domain), `collection` (`classic` or `essential`), `bookFormat` (one exact approved string below), `photoCount` (positive JSON integer, max 180 or 300 respectively). `comments` is optional, max 3000 characters. Unknown fields, control characters, Premium and client-provided ids/statuses are rejected. Comments permit normal line breaks and remain untrusted text: future readers must escape them, and database adapters must use parameterized operations. Email validation is syntax only; quoted mailboxes/SMTPUTF8 local parts are not supported, and mailbox ownership/deliverability is not asserted.

Approved formats, in centimeters:

- Staand — 21 × 28 cm
- Staand — 15 × 21 cm
- Liggend — 28 × 19 cm
- Liggend — 21 × 15 cm
- Vierkant — 19 × 19 cm
- Vierkant — 15 × 15 cm

Responses: `201 {"id":"<random UUID v4>"}` only after storage confirms durable creation with that same id; `400` invalid JSON/UTF-8, `403` transport/origin/automation rejection, `404` other paths or query strings, `405` wrong method, `413` oversized body, `415` unsupported encoding/media type, `422` invalid fields, `429` rate limit, `503` disabled/unavailable dependencies, generic `500` for unexpected failures. Errors contain only fixed codes, known field names and an independent request id. No input values, exception text or stack traces are returned. Internal status is not returned. Responses are `no-store`.

## Safety gates

`createHandler()` defaults to disabled receipt, no allowed origins, disabled storage and no automation verifier. Receipt requires **all** of: explicit `enabled:true`, actual TLS, an exact configured HTTPS Origin, a ready private EU storage adapter and a server-side automation verifier. The browser client stays disabled separately.

HTTPS is checked using the actual socket, not caller-controlled `Forwarded`/`X-Forwarded-*` headers. If a future ingress proxy terminates TLS, it must re-encrypt the upstream connection to this handler. Do not bypass transport checks to accommodate a plaintext upstream. The explicit `allowInsecureLoopback` option is only for local disabled demonstration/tests; never use it for public receipt, including a loopback proxy upstream.

Origins must be explicit HTTPS origins, e.g. `https://boekie73.github.io` (an origin has no repository path). CORS permits the matching origin only, no credentials and no wildcard. Origin/CORS checks are **not authentication**: non-browser callers can forge Origin. The independent anti-automation verifier is mandatory. A future verifier must validate proof signature, expiry, expected site/action and replay/single-use rules as appropriate, respect the supplied AbortSignal, and return the boolean `true` only on verified success. Missing, false, throwing or timed-out verification fails closed. No real verifier/provider is configured or purchased. The public fixture proof in tests is deliberately not a secret or a production verifier.

The default limiter allows five attempts per socket peer per minute, including invalid automation attempts. It keeps only keyed hashes of addresses in bounded transient memory; keys are random per process and never logged. Expired entries are removed and capacity exhaustion fails closed. This is a **single-process baseline**, not a distributed production anti-abuse system. Future public deployment needs an ingress/shared limiter and provider proof verification. Do not trust arbitrary forwarded IP headers for rate keys.

The demo server sets request/header/connection timeouts and a header size cap. A future HTTPS server/ingress must likewise enforce body/header limits, request/connection timeouts, connection/concurrency limits and limits on oversized rejected bodies. A storage adapter must have bounded database operation timeouts. Server, proxy, observability and database logging must exclude bodies, email/name/comments, automation proofs and sensitive query strings. The optional audit hook receives only a fixed event code and random request id; the module never prints exceptions or input. Raw addresses are not included in audit output.

## Storage and internal identity

`DisabledStorage` is the only shipped application storage adapter. It cannot store anything. The test-only memory implementation is confined to the test file and is not used by the server.

A future injected private EU adapter must expose `ready:true`, `kind:'private'`, `region:'EU'` and `async create(record) -> {id}`. These metadata labels express the deployment contract; they are **not proof of geographical location or infrastructure security**. The operator must independently verify EU hosting, private network access, encryption at rest/backups, least-privilege access, retention/deletion, audit policy and processing agreements. Credentials belong in the secured deployment environment/secret manager, never the repository or static page. `create` must atomically create a unique UUID record and resolve only after durable commit. Storage errors or an invalid receipt never produce a success response. Handle retry/idempotency and ambiguous commit timeouts before enabling public receipt.

IDs use cryptographically random UUID v4 values. The initial stored internal status is `ontvangen`. `nextStatus` permits only adjacent transitions:

`ontvangen → in_beoordeling → voorstel → akkoord → betaling → productie → geleverd`

There is no public status/read/list/update route. These names do not implement or trigger payment/production services. Future internal status updates need authorized operations and atomic compare-and-set in the private storage layer; a customer must never supply status or id in an application.

## Before actual receipt

Provision an approved secured server environment separately, configure real TLS/origin and distributed abuse controls, implement and assess a private EU adapter and real automation verifier, define access/retention/retry handling, then test the full receipt path with controlled fixtures. Only after that should the frontend obtain a separately reviewed active transport and an honest durable-receipt acknowledgement. No hosting, database, email or external form service has been activated by this work.
