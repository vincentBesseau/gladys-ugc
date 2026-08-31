// -----------------------------------------------------------------------------
// "Now playing" for one UGC cinema.
//
// ugc.fr's own cinema pages call this exact endpoint (verified live: no
// authentication, no session cookie) to render every film currently
// programmed at a cinema. We parse the same HTML fragment its own front-end
// JavaScript consumes.
// -----------------------------------------------------------------------------

import { parse } from 'node-html-parser';
import { createLogger } from '@gladysassistant/integration-sdk';
import { ugcGet } from './client.js';
import { decodeHtmlEntities } from './decodeHtmlEntities.js';
import { parseFrenchDate } from './parseFrenchDate.js';
import { fetchTrailerUrl } from './trailers.js';

const logger = createLogger({ name: 'ugc-showings' });

// Movies are enriched with a trailer one HTTP call each: bounded so a
// cinema with 50+ films still resolves comfortably within the 15s ack
// budget Gladys allows for movies.getUpcoming.
const TRAILER_FETCH_CONCURRENCY = 10;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function textOf(el) {
  return el ? decodeHtmlEntities(el.text).trim() : null;
}

/**
 * Find the <p class="p--medium color--grey ..."> whose own text (excluding
 * its <span> child) starts with `label`, and return the child span's text.
 */
function fieldAfterLabel(root, label) {
  const paragraph = root
    .querySelectorAll('p')
    .find((p) => decodeHtmlEntities(p.text).trim().startsWith(label));

  return textOf(paragraph?.querySelector('span'));
}

/**
 * `movie.showtimes[].time` is a bare "HH:MM" with no date (Gladys core's B.19
 * contract: the core cannot tell a past session from an upcoming one, so
 * providers that only ever report "today" — this one — must drop a session
 * once it has passed themselves). An unparseable value is kept rather than
 * dropped: better to show an odd time than to silently hide a real session.
 * @param {string} hhmm
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isUpcoming(hhmm, now = new Date()) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);

  if (!match) {
    return true;
  }

  const [, hours, minutes] = match;
  const showtime = new Date(now);
  showtime.setHours(Number(hours), Number(minutes), 0, 0);

  return showtime.getTime() >= now.getTime();
}

/**
 * Every screening button on the page (`data-filmid`, `data-seancehour`,
 * `data-version`) carries its own film id, regardless of where it sits in
 * the DOM relative to that film's synopsis block — grouping by attribute is
 * simpler and more robust than relying on a specific nesting.
 * @param {object} root
 * @param {Date} [now]
 * @returns {Map<string, Array<{time: string, version?: string}>>}
 */
function groupShowtimesByFilmId(root, now = new Date()) {
  const showtimesByFilmId = new Map();

  root.querySelectorAll('[data-filmid][data-seancehour]').forEach((button) => {
    const filmId = button.getAttribute('data-filmid');
    const time = button.getAttribute('data-seancehour');

    if (!filmId || !time || !isUpcoming(time, now)) {
      return;
    }

    const version = button.getAttribute('data-version') || undefined;

    if (!showtimesByFilmId.has(filmId)) {
      showtimesByFilmId.set(filmId, []);
    }

    showtimesByFilmId.get(filmId).push(version ? { time, version } : { time });
  });

  return showtimesByFilmId;
}

function parseFilmBlock(block, cinemaId) {
  const rawId = block.id?.replace('bloc-showing-film-', '');
  const id = rawId && /^\d+$/.test(rawId) ? rawId : null;

  const titleLink = block.querySelector('.block--title a');
  const title = textOf(titleLink);

  if (!id || !title) {
    return null;
  }

  const poster = block.querySelector('img[data-src]')?.getAttribute('data-src') || null;

  const releaseDateRaw = fieldAfterLabel(block, 'Sortie le');
  const releaseDate = releaseDateRaw ? parseFrenchDate(releaseDateRaw) : null;

  if (!releaseDate) {
    // Gladys requires a release date; fabricating one (e.g. "today") would
    // be dishonest data, so this film is dropped rather than misrepresented.
    logger.debug(`UGC film ${id} (${title}) has no parseable release date, skipping it`);

    return null;
  }

  const synopsisText = extractSynopsis(block);
  const overview = synopsisText
    ? decodeHtmlEntities(synopsisText)
        .replace(/voir plus\s*$/i, '')
        .trim()
    : null;

  return {
    id,
    title,
    releaseDate,
    overview: overview || undefined,
    posterUrl: poster || undefined,
    // cinemaId pins the booking flow to the configured cinema (verified
    // live: ugc.fr's own film page reads it), so the user lands ready to
    // book at their cinema instead of a generic film page with none picked
    sourceUrl: `https://www.ugc.fr/film.html?id=${id}&cinemaId=${cinemaId}`,
  };
}

function extractSynopsis(block) {
  const paragraph = block
    .querySelectorAll('p')
    .find((p) => decodeHtmlEntities(p.text).trim().startsWith('Synopsis'));

  const span = paragraph?.querySelector('span');

  if (!span) {
    return null;
  }

  // The "voir plus" link is nested inside the span: drop it before reading
  // the text so it doesn't get appended to the synopsis.
  span.querySelectorAll('a').forEach((a) => a.remove());

  return span.text;
}

/**
 * Run `mapper` over `items` with at most `concurrency` calls in flight.
 * @param {Array} items
 * @param {number} concurrency
 * @param {(item: any) => Promise<void>} mapper
 */
async function forEachWithConcurrency(items, concurrency, mapper) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = items[nextIndex];
      nextIndex += 1;
      await mapper(current);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
}

/**
 * Fetch and attach a trailerUrl to every movie that has one. A missing or
 * failed trailer lookup just leaves the field unset — never fails the batch.
 * @param {Array<object>} movies
 */
async function attachTrailers(movies) {
  await forEachWithConcurrency(movies, TRAILER_FETCH_CONCURRENCY, async (movie) => {
    const trailerUrl = await fetchTrailerUrl(movie.id);

    if (trailerUrl) {
      movie.trailerUrl = trailerUrl;
    }
  });
}

/**
 * Fetch and parse the films currently playing at a UGC cinema, including
 * their showtimes and (best-effort) trailer.
 * @param {string} cinemaId
 * @param {object} [options]
 * @param {Date} [options.now] - Overridable for tests; defaults to the real current time.
 * @returns {Promise<Array<{id: string, title: string, releaseDate: string, overview?: string, posterUrl?: string, trailerUrl?: string, sourceUrl: string, showtimes?: Array<{time: string, version?: string}>}>>}
 */
export async function fetchNowPlaying(cinemaId, { now = new Date() } = {}) {
  const html = await ugcGet('showingsCinemaAjaxAction!getShowingsForCinemaPage.action', {
    cinemaId,
    date: todayIsoDate(),
  });

  const root = parse(html);
  const blocks = root.querySelectorAll('[id^="bloc-showing-film-"]');

  const showtimesByFilmId = groupShowtimesByFilmId(root, now);

  // ugc.fr's showings fragment can include a film block with no screening
  // button at all (or none left once today's past sessions are dropped) —
  // e.g. a title still listed on the page without an actual session today.
  // Gladys's "now playing" widget should only show films you can actually
  // go see today, so those are dropped here rather than shown as a poster
  // with nothing to click on.
  const movies = blocks
    .map((block) => parseFilmBlock(block, cinemaId))
    .filter(Boolean)
    .filter((movie) => {
      const showtimes = showtimesByFilmId.get(movie.id);

      if (!showtimes || showtimes.length === 0) {
        return false;
      }

      movie.showtimes = showtimes;

      return true;
    });

  await attachTrailers(movies);

  logger.info(`UGC cinema ${cinemaId}: ${movies.length} film(s) currently playing`);

  return movies;
}
