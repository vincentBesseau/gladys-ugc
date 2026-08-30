import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fetchNowPlaying, isUpcoming } from '../src/ugc/showings.js';

// Both showtimes in the fixture (13:30, 20:15) are in the future relative to
// this, so the main test below stays deterministic regardless of when it
// actually runs.
const BEFORE_ALL_FIXTURE_SHOWTIMES = new Date('2026-08-30T10:00:00');

const realFetch = globalThis.fetch;

const sampleHtml = readFileSync(
  fileURLToPath(new URL('./fixtures/showings-sample.html', import.meta.url)),
  'utf-8',
);

afterEach(() => {
  globalThis.fetch = realFetch;
});

/**
 * Routes the fetch mock by action name, like the real ugc.fr endpoints do:
 * the showings page for the cinema, and one trailer lookup per film.
 */
function fetchRouter({ showingsHtml = '', trailersByFilmId = {} } = {}) {
  return async (url) => {
    const href = url.toString();

    if (href.includes('showingsCinemaAjaxAction')) {
      return { ok: true, text: async () => showingsHtml };
    }

    if (href.includes('filmTrailerAjaxAction')) {
      const filmId = new URL(href).searchParams.get('filmId');
      const videos = trailersByFilmId[filmId] ? [{ src: trailersByFilmId[filmId] }] : [];

      return { ok: true, text: async () => JSON.stringify({ videos }) };
    }

    throw new Error(`Unexpected fetch: ${href}`);
  };
}

test('parses films, their showtimes and trailer from the showings HTML fragment', async () => {
  globalThis.fetch = fetchRouter({
    showingsHtml: sampleHtml,
    trailersByFilmId: { 17489: 'https://fr.vid.web.acsta.net/nmedia/tad.mp4' },
  });

  const movies = await fetchNowPlaying('10', { now: BEFORE_ALL_FIXTURE_SHOWTIMES });

  assert.equal(movies.length, 2, 'the film with no parseable release date is dropped');

  const [tad, spiderMan] = movies;

  assert.deepEqual(tad, {
    id: '17489',
    title: "TAD L'EXPLORATEUR ET LA LAMPE MAGIQUE",
    releaseDate: '2026-08-26',
    overview: 'Tad et Sara sont désormais les heureux parents d’Oli.',
    posterUrl: 'https://www.ugc.fr/dynamique/films/89/17489/fr/poster/large/poster.jpg',
    sourceUrl: 'https://www.ugc.fr/film.html?id=17489',
    trailerUrl: 'https://fr.vid.web.acsta.net/nmedia/tad.mp4',
    showtimes: [
      { time: '13:30', version: 'VF' },
      { time: '20:15', version: 'VOST' },
    ],
  });

  assert.equal(spiderMan.id, '276608');
  assert.equal(spiderMan.title, 'Spider-Man: Brand New Day');
  assert.equal(spiderMan.releaseDate, '2026-07-29');
  assert.equal(spiderMan.posterUrl, undefined);
  assert.equal(spiderMan.overview, undefined);
  assert.equal(spiderMan.trailerUrl, undefined, 'no trailer configured for this film in the mock');
  assert.equal(spiderMan.showtimes, undefined, 'no screening buttons for this film in the fixture');
});

test("requests the given cinema ID and today's date", async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, text: async () => '' };
  };

  await fetchNowPlaying('42');

  assert.match(calledUrl.toString(), /cinemaId=42/);
  assert.match(calledUrl.toString(), /date=\d{4}-\d{2}-\d{2}/);
});

test('returns an empty array when the fragment has no film block', async () => {
  globalThis.fetch = async () => ({ ok: true, text: async () => '<div>no films today</div>' });

  assert.deepEqual(await fetchNowPlaying('10'), []);
});

test('a trailer lookup failure does not drop the movie or fail the batch', async () => {
  globalThis.fetch = async (url) => {
    if (url.toString().includes('showingsCinemaAjaxAction')) {
      return { ok: true, text: async () => sampleHtml };
    }

    // every trailer lookup fails
    return { ok: false, status: 500 };
  };

  const movies = await fetchNowPlaying('10', { now: BEFORE_ALL_FIXTURE_SHOWTIMES });

  assert.equal(movies.length, 2);
  assert.equal(movies[0].trailerUrl, undefined);
});

test('isUpcoming', async (t) => {
  await t.test('keeps a time strictly after now', () => {
    assert.equal(isUpcoming('20:15', new Date('2026-08-30T10:00:00')), true);
  });

  await t.test('keeps a time exactly equal to now', () => {
    assert.equal(isUpcoming('10:00', new Date('2026-08-30T10:00:00')), true);
  });

  await t.test('drops a time before now', () => {
    assert.equal(isUpcoming('09:59', new Date('2026-08-30T10:00:00')), false);
  });

  await t.test('keeps an unparseable value rather than dropping a real session', () => {
    assert.equal(isUpcoming('not a time', new Date('2026-08-30T10:00:00')), true);
  });
});

test('drops a showtime that has already passed today, without dropping the movie itself', async () => {
  globalThis.fetch = fetchRouter({ showingsHtml: sampleHtml });

  // Between the fixture's two showtimes (13:30, 20:15): the first has
  // passed, the second hasn't.
  const movies = await fetchNowPlaying('10', { now: new Date('2026-08-30T15:00:00') });

  const tad = movies.find((movie) => movie.id === '17489');

  assert.deepEqual(tad.showtimes, [{ time: '20:15', version: 'VOST' }]);
});

test('omits showtimes entirely once every session for the day has passed', async () => {
  globalThis.fetch = fetchRouter({ showingsHtml: sampleHtml });

  const movies = await fetchNowPlaying('10', { now: new Date('2026-08-30T23:00:00') });

  const tad = movies.find((movie) => movie.id === '17489');

  assert.equal(tad.showtimes, undefined);
});
