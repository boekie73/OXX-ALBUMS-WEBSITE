import { validateApplication, newApplicationId } from './contract.mjs';
import { DisabledStorage, storageReady } from './storage.mjs';
import { createRateLimiter } from './rate-limit.mjs';

export const MAX_BODY_BYTES = 16_384;
function loopback(address) {
  return address === '::1' || address === '127.0.0.1' || address === '::ffff:127.0.0.1';
}
function originsSet(values) {
  return new Set(values.map(value => {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password) throw new Error('invalid_allowed_origin');
    return value;
  }));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let bytes = 0; const chunks = [];
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) { reject(Object.assign(new Error('body_too_large'), { status: 413 })); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (bytes > MAX_BODY_BYTES) return;
      try { resolve(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))); }
      catch { reject(Object.assign(new Error('invalid_json'), { status: 400 })); }
    });
    req.on('error', () => reject(Object.assign(new Error('invalid_request'), { status: 400 })));
    req.on('aborted', () => reject(Object.assign(new Error('invalid_request'), { status: 400 })));
  });
}
async function verifyWithDeadline(verify, token) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => verify(token, { signal: controller.signal })),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('verification_timeout')); }, 2000); }),
    ]);
  } finally { clearTimeout(timer); }
}

/** No proxy header is trusted. Public deployments must supply actual TLS at this handler. */
export function createHandler({ enabled = false, allowedOrigins = [], store = new DisabledStorage(),
  verifyAutomationToken = null, limiter = createRateLimiter(), audit = () => {},
  allowInsecureLoopback = false } = {}) {
  const allowed = originsSet(allowedOrigins);
  return async (req, res) => {
    const requestId = newApplicationId();
    const send = (status, value) => {
      if (!req.readableEnded) req.resume();
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(value === undefined ? undefined : JSON.stringify(value));
    };
    const fail = (status, code) => send(status, { error: code, requestId });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Origin');
    res.setHeader('X-Request-ID', requestId);
    if (req.socket.encrypted) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      if (req.url !== '/api/aanvragen') return fail(404, 'not_found');
      if (!(req.socket.encrypted || (allowInsecureLoopback && loopback(req.socket.remoteAddress)))) return fail(403, 'https_required');
      const origin = req.headers.origin;
      if (typeof origin !== 'string' || !allowed.has(origin)) return fail(403, 'origin_not_allowed');
      res.setHeader('Access-Control-Allow-Origin', origin);
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-OXX-Automation-Token');
        return send(204);
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return fail(405, 'method_not_allowed'); }
      if (enabled !== true || !storageReady(store) || typeof verifyAutomationToken !== 'function' || !allowed.size) {
        return fail(503, 'receiving_disabled');
      }
      if (!limiter.consume(req.socket.remoteAddress)) { res.setHeader('Retry-After', '60'); return fail(429, 'rate_limited'); }
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '') ||
          (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity')) return fail(415, 'unsupported_media_type');
      if (Number(req.headers['content-length']) > MAX_BODY_BYTES) return fail(413, 'body_too_large');
      const token = req.headers['x-oxx-automation-token'];
      if (typeof token !== 'string' || !token || token.length > 2048) return fail(403, 'automation_proof_required');
      let verified;
      try { verified = await verifyWithDeadline(verifyAutomationToken, token); }
      catch { return fail(503, 'automation_check_unavailable'); }
      if (verified !== true) return fail(403, 'automation_rejected');
      const input = await readJson(req);
      const result = validateApplication(input);
      if (!result.ok) return send(422, { error: 'validation_failed', fields: result.errors, requestId });
      const id = newApplicationId();
      const record = { ...result.value, id, status: 'ontvangen', createdAt: new Date().toISOString() };
      try {
        const receipt = await store.create(record);
        if (receipt?.id !== id) throw new Error('invalid_storage_receipt');
      } catch {
        try { audit({ event: 'storage_failure', requestId }); } catch { /* no unsafe fallback logging */ }
        return fail(503, 'storage_unavailable');
      }
      return send(201, { id }); // Internal status and customer data are never returned.
    } catch (error) {
      if (error?.status === 413) return fail(413, 'body_too_large');
      if (error?.status === 400) return fail(400, 'invalid_request');
      try { audit({ event: 'request_failure', requestId }); } catch { /* no exception or input logging */ }
      return fail(500, 'internal_error');
    }
  };
}
