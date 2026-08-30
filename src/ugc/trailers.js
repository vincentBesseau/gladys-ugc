// -----------------------------------------------------------------------------
// Trailer lookup for one UGC film.
//
// ugc.fr's own film page calls this exact endpoint (verified live: no
// authentication needed) to resolve the trailer video shown when a visitor
// clicks "Voir la bande annonce". Not every film has one.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { ugcGet } from './client.js';
import { decodeHtmlEntities } from './decodeHtmlEntities.js';

const logger = createLogger({ name: 'ugc-trailers' });

// Movies are enriched with a trailer one HTTP call at a time (see
// attachTrailers in showings.js): a single slow/hanging request must not eat
// the whole onMoviesGetUpcoming ack budget, so this is much shorter than the
// client's default timeout.
const TRAILER_TIMEOUT_MS = 5_000;

/**
 * @param {string} filmId
 * @returns {Promise<string|undefined>} The trailer's direct video URL, or undefined when none exists.
 */
export async function fetchTrailerUrl(filmId) {
  try {
    const body = await ugcGet(
      'filmTrailerAjaxAction',
      { filmId },
      { timeoutMs: TRAILER_TIMEOUT_MS },
    );
    const payload = JSON.parse(body);
    const video = Array.isArray(payload.videos) ? payload.videos[0] : null;

    return video && typeof video.src === 'string' ? decodeHtmlEntities(video.src) : undefined;
  } catch (error) {
    // No trailer is a normal outcome, not a failure worth surfacing: the
    // film itself still has valid data, it just won't have a trailer button.
    logger.debug(`UGC film ${filmId}: unable to fetch a trailer`, error);

    return undefined;
  }
}
