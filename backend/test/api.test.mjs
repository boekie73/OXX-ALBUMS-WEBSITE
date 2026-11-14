import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { createServer as createTlsServer, request as httpsRequest } from 'node:https';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHandler, MAX_BODY_BYTES } from '../src/handler.mjs';
import { FORMATS, STATUSES, nextStatus, newApplicationId, validateApplication } from '../src/contract.mjs';
import { createRateLimiter } from '../src/rate-limit.mjs';
import { DisabledStorage } from '../src/storage.mjs';
import { createApplicationClient } from '../../web/application-api.mjs';

const origin = 'https://albums.example.invalid';
// Fictitious, public test fixture; this is not a credential or usable anti-bot proof.
const fixture = (changes = {}) => ({ customerName: 'Fictieve Aanvrager', email: 'fixture@example.invalid',
  collection: 'classic', bookFormat: FORMATS[0], photoCount: 180, comments: 'Uitsluitend fictieve testgegevens.', ...changes });
function fakeStore() {
  return { ready: true, kind: 'private', region: 'EU', records: [],
    async create(record) { this.records.push(record); return { id: record.id }; } };
}
async function setup(t, overrides = {}) {
  const store = fakeStore(), audits = [];
  const handler = createHandler({ enabled: true, allowedOrigins: [origin], store,
    verifyAutomationToken: async token => token === 'public-fixture-proof',
    allowInsecureLoopback: true, limiter: createRateLimiter({ limit: 1000 }),
    audit: event => audits.push(event), ...overrides });
  const server = createServer({ maxHeaderSize: 8192 }, handler);
  server.requestTimeout = 5000; server.timeout = 5000;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}/api/aanvragen`;
  async function send(value = fixture(), { method = 'POST', headers = {}, raw, path } = {}) {
    const response = await fetch(path ? new URL(path, url) : url, { method,
      headers: { Origin: origin, 'Content-Type': 'application/json',
        'X-OXX-Automation-Token': 'public-fixture-proof', ...headers },
      body: ['GET', 'OPTIONS'].includes(method) ? undefined : (raw ?? JSON.stringify(value)) });
    return { status: response.status, headers: response.headers,
      body: response.status === 204 ? null : await response.json() };
  }
  return { send, store, audits, url };
}

test('valid Classic and Essential: unique id only, internal received status after storage receipt', async t => {
  const { send, store } = await setup(t);
  const ids = [];
  for (const collection of ['classic', 'essential']) {
    for (const bookFormat of FORMATS) {
      const response = await send(fixture({ collection, bookFormat, photoCount: collection === 'classic' ? 180 : 300 }));
      assert.equal(response.status, 201); assert.deepEqual(Object.keys(response.body), ['id']);
      assert.match(response.body.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      ids.push(response.body.id);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    }
  }
  assert.equal(new Set(ids).size, 12); assert.equal(store.records.length, 12);
  assert(store.records.every(record => record.status === 'ontvangen'));
});

test('required, malformed and excessive fields never reach storage', async t => {
  const { send, store } = await setup(t);
  const invalid = [null, [], 'not an object', {},
    fixture({ customerName: '' }), fixture({ customerName: '   ' }), fixture({ customerName: 3 }),
    fixture({ customerName: 'n'.repeat(121) }), fixture({ customerName: 'name\r\nInjected' }),
    fixture({ email: '' }), fixture({ email: 'invalid' }), fixture({ email: 'a@b' }), fixture({ email: 'a..b@example.invalid' }), fixture({ email: '.a@example.invalid' }), fixture({ email: 'a@-bad.invalid' }), fixture({ email: 'a@bad_domain.invalid' }), fixture({ email: 'a@example.invalid/path' }), fixture({ email: 'a@example.invalid?x' }), fixture({ email: 'a@example.invalid#x' }), fixture({ email: 'a@example.invalid\\evil' }), fixture({ email: 'a'.repeat(65) + '@example.invalid' }), fixture({ email: 'e'.repeat(255) }),
    fixture({ collection: 'premium' }), fixture({ collection: 'Classic' }), fixture({ collection: '__proto__' }),
    fixture({ collection: { toString: null } }), fixture({ bookFormat: '20 × 20 cm' }), fixture({ bookFormat: null }),
    ...[0, -1, 1.5, '20', null, Number.MAX_SAFE_INTEGER + 1].map(photoCount => fixture({ photoCount })),
    fixture({ photoCount: 181 }), fixture({ collection: 'essential', photoCount: 301 }),
    fixture({ comments: 'x'.repeat(3001) }), fixture({ comments: '\u0000' }), fixture({ comments: {} }),
    fixture({ status: 'geleverd' }), fixture({ id: 'customer-selected' }),
    JSON.parse('{"__proto__":true}')];
  for (const value of invalid) {
    const response = await send(value); assert.equal(response.status, 422, JSON.stringify(value));
    assert(!JSON.stringify(response.body).includes('fixture@example.invalid'));
  }
  for (const key of ['customerName', 'email', 'collection', 'bookFormat', 'photoCount']) {
    const value = fixture(); delete value[key]; assert.equal((await send(value)).status, 422);
  }
  assert.equal(store.records.length, 0);
});

test('optional comments and minimum photo count; untrusted text remains data', async t => {
  const { send, store } = await setup(t);
  const input = fixture({ photoCount: 1 }); delete input.comments;
  assert.equal((await send(input)).status, 201); assert.equal(store.records[0].comments, '');
  assert.equal((await send(fixture({ comments: '<script>not executed</script>\nFictief.' }))).status, 201);
  assert.equal(store.records[1].comments, '<script>not executed</script>\nFictief.');
});

test('default and incomplete configurations cannot receive or store', async t => {
  for (const overrides of [{ enabled: false }, { store: new DisabledStorage() }, { verifyAutomationToken: null },
    { store: { ...fakeStore(), region: 'unknown' } }, { store: { ...fakeStore(), kind: 'public' } }]) {
    const { send, store } = await setup(t, overrides);
    assert.equal((await send()).status, 503); assert.equal(store.records.length, 0);
  }
  const server = createServer(createHandler());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/aanvragen`, { method: 'POST' });
  assert.equal(response.status, 403); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
});

test('HTTPS required; forwarded headers cannot bypass actual transport', async t => {
  const { send, store } = await setup(t, { allowInsecureLoopback: false });
  const response = await send(fixture(), { headers: { 'X-Forwarded-Proto': 'https', 'Forwarded': 'proto=https' } });
  assert.equal(response.status, 403); assert.equal(response.body.error, 'https_required'); assert.equal(store.records.length, 0);
});

test('origin allowlist, missing/null origins and lookalike origins', async t => {
  const { send, store } = await setup(t);
  for (const Origin of ['', 'null', 'http://albums.example.invalid', 'https://albums.example.invalid.evil.invalid', 'https://evil.invalid']) {
    const response = await send(fixture(), { headers: { Origin } });
    assert.equal(response.status, 403); assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  const options = await send(undefined, { method: 'OPTIONS' });
  assert.equal(options.status, 204); assert.equal(options.headers.get('access-control-allow-credentials'), null);
  assert.equal((await send(undefined, { method: 'GET' })).status, 405);
  assert.equal((await send(undefined, { path: '/api/aanvragen?email=fixture@example.invalid' })).status, 404);
  assert.equal(store.records.length, 0);
});

test('invalid origin configuration rejected before serving', () => {
  for (const value of ['*', 'null', 'http://albums.example.invalid', 'https://albums.example.invalid/path', 'https://fixture-user@albums.example.invalid']) {
    assert.throws(() => createHandler({ allowedOrigins: [value] }));
  }
});

test('automation proof is required, verified and bounded', async t => {
  const { send, store } = await setup(t);
  for (const token of ['', 'invalid-public-fixture', 'x'.repeat(2049)]) {
    assert.equal((await send(fixture(), { headers: { 'X-OXX-Automation-Token': token } })).status, 403);
  }
  assert.equal(store.records.length, 0);
  const unavailable = await setup(t, { verifyAutomationToken: async () => { throw new Error('private details'); } });
  assert.equal((await unavailable.send()).status, 503);
  const timeout = await setup(t, { verifyAutomationToken: () => new Promise(() => {}) });
  assert.equal((await timeout.send()).status, 503);
});

test('rate limiting counts invalid submissions too and fails closed at capacity', async t => {
  const { send } = await setup(t, { limiter: createRateLimiter({ limit: 2 }) });
  assert.equal((await send(fixture(), { headers: { 'X-OXX-Automation-Token': '' } })).status, 403);
  assert.equal((await send()).status, 201);
  const limited = await send(); assert.equal(limited.status, 429); assert.equal(limited.headers.get('retry-after'), '60');
  let clock = 0; const limiter = createRateLimiter({ limit: 1, capacity: 1, windowMs: 100, now: () => clock });
  assert(limiter.consume('one')); assert(!limiter.consume('two')); assert(!limiter.consume('one'));
  clock = 101; assert(limiter.consume('two'));
});

test('JSON, content type, content encoding and declared body size', async t => {
  const { send, store } = await setup(t);
  assert.equal((await send(undefined, { raw: '{"email":"fixture@example.invalid"' })).status, 400);
  assert.equal((await send(undefined, { raw: Buffer.from([0xff, 0xfe]) })).status, 400);
  assert.equal((await send(undefined, { raw: 'x'.repeat(MAX_BODY_BYTES + 1) })).status, 413);
  assert.equal((await send(fixture(), { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await send(fixture(), { headers: { 'Content-Encoding': 'gzip' } })).status, 415);
  assert.equal(store.records.length, 0);
});

test('streamed bodies are bounded even without Content-Length', async t => {
  const { url, store } = await setup(t);
  const status = await new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json',
      'X-OXX-Automation-Token': 'public-fixture-proof' } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.write('x'.repeat(9000)); req.end('x'.repeat(9000));
  });
  assert.equal(status, 413); assert.equal(store.records.length, 0);
});

test('storage failures, invalid receipts and internal errors leak no customer data', async t => {
  for (const create of [async () => { throw new Error('fixture@example.invalid Fictieve Aanvrager 127.0.0.1'); }, async () => ({ id: 'wrong' })]) {
    const { send, audits } = await setup(t, { store: { ...fakeStore(), create } });
    const response = await send(); assert.equal(response.status, 503);
    assert(!/fixture@|Fictieve|127\.0\.0\.1/.test(JSON.stringify({ response, audits })));
    assert.deepEqual(Object.keys(audits[0]).sort(), ['event', 'requestId']);
  }
  const { send, audits } = await setup(t, { limiter: { consume() { throw new Error('fixture@example.invalid'); } } });
  const response = await send(); assert.equal(response.status, 500); assert(!JSON.stringify({ response, audits }).includes('fixture@'));
});

test('internal status transitions are sequential, ids are random UUID v4', () => {
  for (let i = 0; i < STATUSES.length - 1; i++) assert.equal(nextStatus(STATUSES[i], STATUSES[i + 1]), STATUSES[i + 1]);
  assert.throws(() => nextStatus('ontvangen', 'geleverd')); assert.throws(() => nextStatus('unknown', 'ontvangen'));
  assert.throws(() => nextStatus('geleverd', 'ontvangen'));
  assert.equal(new Set(Array.from({ length: 1000 }, newApplicationId)).size, 1000);
});

test('website client is immutable and cannot send even when callers pass enable flags', async () => {
  const client = createApplicationClient({ enabled: true });
  assert.equal(client.enabled, false); assert(Object.isFrozen(client));
  await assert.rejects(client.send(fixture()), /nog niet beschikbaar/);
  const values = { customerName: ' Fictieve Aanvrager ', email: 'fixture@example.invalid', collection: 'Essential',
    bookFormat: FORMATS[0], photoCount: '300', comments: '' };
  const request = client.prepare({ elements: { namedItem: key => ({ value: values[key] }) } });
  assert.equal(request.method, 'POST'); assert.equal(request.path, '/api/aanvragen');
  assert(validateApplication(request.payload).ok);
});


test('actual HTTPS accepts verified fixture and returns HSTS; ephemeral key never enters repository', async t => {
  const temp = mkdtempSync(join(tmpdir(), 'oxx-api-tls-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const keyPath = join(temp, 'key.pem'), certPath = join(temp, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', '/CN=localhost', '-addext', 'subjectAltName=IP:127.0.0.1',
    '-keyout', keyPath, '-out', certPath], { stdio: 'ignore' });
  const cert = readFileSync(certPath), store = fakeStore();
  const handler = createHandler({ enabled: true, allowedOrigins: [origin], store,
    verifyAutomationToken: async token => token === 'public-fixture-proof' });
  const server = createTlsServer({ key: readFileSync(keyPath), cert }, handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const response = await new Promise((resolve, reject) => {
    const req = httpsRequest({ hostname: '127.0.0.1', port: server.address().port, path: '/api/aanvragen',
      method: 'POST', ca: cert, headers: { Origin: origin, 'Content-Type': 'application/json',
        'X-OXX-Automation-Token': 'public-fixture-proof' } }, res => {
      let body = ''; res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, hsts: res.headers['strict-transport-security'], body: JSON.parse(body) }));
    });
    req.on('error', reject); req.end(JSON.stringify(fixture()));
  });
  assert.equal(response.status, 201); assert.equal(response.hsts, 'max-age=31536000');
  assert.equal(store.records.length, 1); assert.deepEqual(Object.keys(response.body), ['id']);
});
