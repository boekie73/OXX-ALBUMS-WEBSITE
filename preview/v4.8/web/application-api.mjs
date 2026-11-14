/** Future contract mapping only. No active request, transport, endpoint host or storage. */
export function createApplicationClient() {
  return Object.freeze({
    enabled: false,
    prepare(form) {
      const get = key => form.elements.namedItem(key)?.value ?? '';
      return {
        method: 'POST', path: '/api/aanvragen',
        payload: { customerName: get('customerName').trim(), email: get('email').trim(),
          collection: get('collection').toLowerCase(), bookFormat: get('bookFormat'),
          photoCount: Number(get('photoCount')), comments: get('comments') },
      };
    },
    async send() { throw new Error('Aanvraagverzending is nog niet beschikbaar.'); },
  });
}
