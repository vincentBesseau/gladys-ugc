import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchTrailerUrl } from '../src/ugc/trailers.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('returns the decoded trailer URL when a video exists', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    text: async () =>
      JSON.stringify({
        videos: [
          { src: 'https://fr.vid.web.acsta.net/nmedia/foo.mp4?source=ugc&amp;platform=proxy' },
        ],
      }),
  });

  const url = await fetchTrailerUrl('17489');

  assert.equal(url, 'https://fr.vid.web.acsta.net/nmedia/foo.mp4?source=ugc&platform=proxy');
});

test('returns undefined when the film has no trailer', async () => {
  globalThis.fetch = async () => ({ ok: true, text: async () => JSON.stringify({ videos: [] }) });

  assert.equal(await fetchTrailerUrl('17489'), undefined);
});

test('returns undefined instead of throwing on a request failure', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500 });

  assert.equal(await fetchTrailerUrl('17489'), undefined);
});

test('returns undefined on an unparseable response body', async () => {
  globalThis.fetch = async () => ({ ok: true, text: async () => 'not json' });

  assert.equal(await fetchTrailerUrl('17489'), undefined);
});

test('requests the given film ID', async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, text: async () => JSON.stringify({ videos: [] }) };
  };

  await fetchTrailerUrl('42');

  assert.match(calledUrl.toString(), /filmId=42/);
});
