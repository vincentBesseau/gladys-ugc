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

const logger = createLogger({ name: 'ugc-showings' });

function isoDateWithOffset(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
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

function parseFilmBlock(block) {
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
    // Gladys requires a release date; fabricating one (e.g. "today") would be
    // dishonest data, so this film is dropped rather than misrepresented.
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
    sourceUrl: `https://www.ugc.fr/film.html?id=${id}`,
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
 * Fetch and parse the films playing at a UGC cinema on a given day.
 * @param {string} cinemaId
 * @param {number} [dayOffset] - 0 = today (default), 1 = tomorrow, etc.
 * @returns {Promise<Array<{id: string, title: string, releaseDate: string, overview?: string, posterUrl?: string, sourceUrl: string}>>}
 */
export async function fetchNowPlaying(cinemaId, dayOffset = 0) {
  const html = await ugcGet('showingsCinemaAjaxAction!getShowingsForCinemaPage.action', {
    cinemaId,
    date: isoDateWithOffset(dayOffset),
  });

  const root = parse(html);
  const blocks = root.querySelectorAll('[id^="bloc-showing-film-"]');

  const movies = blocks.map(parseFilmBlock).filter(Boolean);

  logger.info(`UGC cinema ${cinemaId}: ${movies.length} film(s) playing (day offset ${dayOffset})`);

  return movies;
}
