# gladys-ugc

[![Latest version](https://img.shields.io/github/v/tag/vincentBesseau/gladys-ugc?label=version)](https://github.com/vincentBesseau/gladys-ugc/tags)
[![CI](https://github.com/vincentBesseau/gladys-ugc/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentBesseau/gladys-ugc/actions/workflows/ci.yml)
[![Docker pulls](https://ghcr-badge.elias.eu.org/shield/vincentBesseau/gladys-ugc/gladys-ugc)](https://github.com/vincentBesseau/gladys-ugc/pkgs/container/gladys-ugc)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://www.apache.org/licenses/LICENSE-2.0)
[![Gladys](https://img.shields.io/badge/gladys-%3E%3D4.90.0-6f42c1)](https://gladysassistant.com)

UGC cinema integration for [Gladys Assistant](https://gladysassistant.com):
movies currently playing at your UGC cinema, shown in the "Upcoming Releases"
widget (Gladys core contract B.19, `movies` external-integration type).

## Why UGC first

This started as a search for one cinema integration covering the major French
chains (AlloCiné, Pathé, UGC, CGR). Each lead was checked against the same
bar — no paid API, no credential extracted from a decompiled app, no bypass
of anti-bot protection:

- **UGC**'s cinema pages call a plain, unauthenticated, first-party AJAX
  endpoint (`ugc.fr/showingsCinemaAjaxAction!getShowingsForCinemaPage.action`)
  — verified live with a fresh HTTP client, no cookie, no session, no
  bot-block. This is the same endpoint `ugc.fr` calls for every visitor, and
  the cleanest of the four to start with — hence this integration first.
- **AlloCiné**'s mobile GraphQL API requires reusing a hardcoded token
  extracted from decompiling their app. Ruled out.
- **CGR** first looked like it had no live per-cinema showtimes endpoint of
  its own. A deeper look later found otherwise: `cgrcinemas.fr` actually
  exposes a clean, first-party JSON API, no auth needed — see
  [`gladys-cgr`](https://github.com/vincentBesseau/gladys-cgr).
- **Pathé**'s rendered pages are behind Akamai Bot Manager (verified live: a
  plain `fetch()` gets a 403 a real browser does not get), but the JSON API
  those same pages call underneath is not — see
  [`gladys-pathe`](https://github.com/vincentBesseau/gladys-pathe) for the
  full reasoning, including a User-Agent judgment call that integration
  documents in detail.

One integration per chain, matching how this one is scoped — see
[Related integrations](#related-integrations) below.

## What it does

- Configure one UGC cinema (its numeric ID).
- `movies.getUpcoming` returns the films currently playing there today,
  parsed from `ugc.fr`'s own public HTML, each with its trailer (when
  `ugc.fr` has one, fetched from its `filmTrailerAjaxAction` endpoint) and
  today's showtimes at that cinema (`movie.showtimes`, Gladys core contract
  B.19) — both come from the same page, no extra scraping technique needed.
- A **Find my cinema** action searches a hand-maintained static list of UGC
  cinemas (there is no dynamic "select" field type in Gladys for anything
  other than devices — see `docs/fr.md` / `docs/en.md`).

A day picker (tomorrow, in a week, ...) was tried and reverted: v1 only
covers today's films and showtimes.

## Development

```bash
npm install
npm test
npm run lint
npm run format:check
```

Conventions: ESM, native `fetch` (no HTTP client dependency), `node --test`
(no test framework dependency). The one extra dependency is
`node-html-parser`, needed because this integration necessarily parses HTML
(UGC's endpoint returns a rendered fragment, not JSON).

### SDK dependency (temporary)

`onMoviesGetUpcoming` and `getHouses()` were added to the official SDK in
[GladysAssistant/integration-sdk-js#32](https://github.com/GladysAssistant/integration-sdk-js/pull/32),
not yet merged/published at the time this integration was written.
`package.json` points `@gladysassistant/integration-sdk` at that branch
directly:

```json
"@gladysassistant/integration-sdk": "github:vincentBesseau/integration-sdk-js#feature/movies-type"
```

Switch this back to a published `^x.y.z` version once that PR is merged and
released.

### Refreshing the cinema list

`src/ugc/cinemas.json` is a hand-maintained snapshot of UGC's cinema list
(id, name, address). To refresh it: open `https://www.ugc.fr/cinemas.html` in
a browser, wait for the list to load, then run this in the page's console:

```js
JSON.stringify(
  Array.from(document.querySelectorAll('.text-wrapper'))
    .map((b) => {
      const idEl = b.querySelector('[data-fav-cinema-id]');
      const addrEl = b.querySelector('.address');
      if (!idEl) return null;
      return {
        id: idEl.getAttribute('data-fav-cinema-id'),
        name: idEl.getAttribute('data-fav-cinema-name').trim(),
        address: addrEl ? addrEl.textContent.trim().replace(/\s+/g, ' ') : null,
      };
    })
    .filter(Boolean),
);
```

Then re-derive `postalCode`/`city` from each `address` (last `NNNNN CITY`
token) and re-sort by postal code, e.g. with a short one-off script.

## Related integrations

Same chain-by-chain approach, one repo per cinema chain:

- [`gladys-cgr`](https://github.com/vincentBesseau/gladys-cgr) — CGR
- [`gladys-pathe`](https://github.com/vincentBesseau/gladys-pathe) — Pathé

## Publishing checklist

- [ ] `gladys_version` in `gladys-assistant-integration.json` is a placeholder
      (`>=4.90.0`) — set it to the actual Gladys release that ships the
      `movies` integration type (Gladys core PR
      [GladysAssistant/Gladys#3061](https://github.com/GladysAssistant/Gladys/pull/3061))
      once it is released.
- [ ] Swap the SDK dependency to a published version (see above).
- [ ] Add a `cover.png` (referenced by `cover_image` in the manifest).
- [ ] Run **Release** (GitHub Actions) once ready to cut `v0.1.0` and publish
      the image to `ghcr.io/vincentbesseau/gladys-ugc`.

## License

Apache-2.0
