import { randomUUID } from 'node:crypto';
import { domainToASCII } from 'node:url';

export const FORMATS = Object.freeze([
  'Staand — 21 × 28 cm', 'Staand — 15 × 21 cm',
  'Liggend — 28 × 19 cm', 'Liggend — 21 × 15 cm',
  'Vierkant — 19 × 19 cm', 'Vierkant — 15 × 15 cm',
]);
export const LIMITS = Object.freeze({ classic: 180, essential: 300 });
export const STATUSES = Object.freeze([
  'ontvangen', 'in_beoordeling', 'voorstel', 'akkoord', 'betaling', 'productie', 'geleverd',
]);
export function nextStatus(current, next) {
  if (!STATUSES.includes(current) || STATUSES.indexOf(next) !== STATUSES.indexOf(current) + 1) {
    throw new Error('invalid_status_transition');
  }
  return next;
}
export function newApplicationId() { return randomUUID(); }

const fields = ['customerName', 'email', 'collection', 'bookFormat', 'photoCount', 'comments'];
const control = /[\u0000-\u001f\u007f]/;
function validEmail(value) {
  const parts = value.split('@');
  if (parts.length !== 2 || parts[0].length > 64 || !/^[\p{L}\p{N}\p{M}.-]+$/u.test(parts[1])) return false;
  const atom = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*$/i;
  if (!atom.test(parts[0])) return false;
  const domain = domainToASCII(parts[1]);
  const labels = domain.split('.');
  return domain.length <= 253 && labels.length >= 2 && labels.every(label =>
    label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
}
export function validateApplication(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: [{ field: 'request', code: 'invalid_object' }] };
  }
  if (Object.keys(input).some(key => !fields.includes(key))) {
    errors.push({ field: 'request', code: 'unknown_fields' });
  }
  const text = (key, limit, optional = false) => {
    const raw = input[key];
    if (optional && raw === undefined) return '';
    if (typeof raw !== 'string') { errors.push({ field: key, code: 'invalid_text' }); return ''; }
    const value = raw.trim();
    const forbidden = key === 'comments' ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : control;
    if ((!optional && !value) || raw.length > limit || forbidden.test(raw)) {
      errors.push({ field: key, code: 'invalid_text' });
    }
    return value;
  };
  const customerName = text('customerName', 120);
  const email = text('email', 254);
  const comments = text('comments', 3000, true);
  if (email && !validEmail(email)) {
    errors.push({ field: 'email', code: 'invalid_email' });
  }
  const collection = input.collection;
  if (typeof collection !== 'string' || !Object.hasOwn(LIMITS, collection)) {
    errors.push({ field: 'collection', code: 'unsupported_collection' });
  }
  if (!FORMATS.includes(input.bookFormat)) errors.push({ field: 'bookFormat', code: 'unsupported_format' });
  if (!Number.isSafeInteger(input.photoCount) || input.photoCount < 1) {
    errors.push({ field: 'photoCount', code: 'positive_integer_required' });
  } else if (typeof collection === 'string' && Object.hasOwn(LIMITS, collection) && input.photoCount > LIMITS[collection]) {
    errors.push({ field: 'photoCount', code: 'collection_limit' });
  }
  return errors.length ? { ok: false, errors } : {
    ok: true, value: { customerName, email, collection, bookFormat: input.bookFormat,
      photoCount: input.photoCount, comments },
  };
}
