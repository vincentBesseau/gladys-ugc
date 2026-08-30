import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ugcGet } from '../src/ugc/client.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('builds the request URL from the action and params', async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, text: async () => 'ok' };
  };

  await ugcGet('someAjaxAction', { cinemaId: '10', date: '2026-08-30' });

  assert.equal(
    calledUrl.toString(),
    'https://www.ugc.fr/someAjaxAction?cinemaId=10&date=2026-08-30',
  );
});

test('sends an honest, self-identifying user-agent', async () => {
  let calledOptions;
  globalThis.fetch = async (url, options) => {
    calledOptions = options;
    return { ok: true, text: async () => 'ok' };
  };

  await ugcGet('someAjaxAction');

  assert.match(calledOptions.headers['user-agent'], /gladys-ugc/);
});

test('throws on a non-2xx response', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 503 });

  await assert.rejects(() => ugcGet('someAjaxAction'), /ugc\.fr HTTP 503/);
});
