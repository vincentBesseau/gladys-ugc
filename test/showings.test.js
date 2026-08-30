import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fetchNowPlaying } from '../src/ugc/showings.js';

const realFetch = globalThis.fetch;

const sampleHtml = readFileSync(
  fileURLToPath(new URL('./fixtures/showings-sample.html', import.meta.url)),
  'utf-8',
);

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('parses films from the showings HTML fragment', async () => {
  globalThis.fetch = async () => ({ ok: true, text: async () => sampleHtml });

  const movies = await fetchNowPlaying('10');

  assert.equal(movies.length, 2, 'the film with no parseable release date is dropped');

  const [tad, spiderMan] = movies;

  assert.deepEqual(tad, {
    id: '17489',
    title: "TAD L'EXPLORATEUR ET LA LAMPE MAGIQUE",
    releaseDate: '2026-08-26',
    overview: 'Tad et Sara sont désormais les heureux parents d’Oli.',
    posterUrl: 'https://www.ugc.fr/dynamique/films/89/17489/fr/poster/large/poster.jpg',
    sourceUrl: 'https://www.ugc.fr/film.html?id=17489',
  });

  assert.equal(spiderMan.id, '276608');
  assert.equal(spiderMan.title, 'Spider-Man: Brand New Day');
  assert.equal(spiderMan.releaseDate, '2026-07-29');
  assert.equal(spiderMan.posterUrl, undefined);
  assert.equal(spiderMan.overview, undefined);
});

test("requests the given cinema ID and today's date by default", async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, text: async () => '' };
  };

  await fetchNowPlaying('42');

  assert.match(calledUrl.toString(), /cinemaId=42/);
  assert.match(calledUrl.toString(), new RegExp(`date=${new Date().toISOString().slice(0, 10)}`));
});

test('requests a future date when a day offset is given', async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, text: async () => '' };
  };

  await fetchNowPlaying('42', 7);

  const expected = new Date();
  expected.setDate(expected.getDate() + 7);
  assert.match(calledUrl.toString(), new RegExp(`date=${expected.toISOString().slice(0, 10)}`));
});

test('returns an empty array when the fragment has no film block', async () => {
  globalThis.fetch = async () => ({ ok: true, text: async () => '<div>no films today</div>' });

  assert.deepEqual(await fetchNowPlaying('10'), []);
});
