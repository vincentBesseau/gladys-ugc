// -----------------------------------------------------------------------------
// Thin HTTP client for ugc.fr's own public site.
//
// This calls the exact same first-party AJAX endpoint ugc.fr's own pages call
// to render the "now playing" list for every visitor: no API key, no session
// cookie, no authentication of any kind (verified live: a fresh HTTP client
// with no prior request gets the same 200 response as a browser). It is
// unofficial (UGC does not publish or support it) and can change or disappear
// without notice — see the manifest's disclaimer.
//
// Node 20+ provides `fetch` natively: no HTTP client dependency needed.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';

const logger = createLogger({ name: 'ugc-client' });

const BASE_URL = 'https://www.ugc.fr';
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * GET one of ugc.fr's own AJAX actions and return the raw HTML/text body.
 * @param {string} action - e.g. "showingsCinemaAjaxAction!getShowingsForCinemaPage.action"
 * @param {Record<string, string>} params
 * @param {object} [options]
 * @param {number} [options.timeoutMs] - Overrides the default request timeout.
 * @returns {Promise<string>}
 */
export async function ugcGet(action, params = {}, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const url = new URL(`${BASE_URL}/${action}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  logger.debug('ugc.fr request ->', url.toString());

  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      // A plain, honest identification: not spoofing a browser, not hiding
      // what this is. ugc.fr answers it exactly like any other client.
      'user-agent': 'gladys-ugc integration (github.com/vincentBesseau/gladys-ugc)',
    },
  });

  if (!response.ok) {
    throw new Error(`ugc.fr HTTP ${response.status} on ${action}`);
  }

  return response.text();
}
