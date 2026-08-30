# gladys-ugc

UGC cinema integration for [Gladys Assistant](https://gladysassistant.com):
movies currently playing at your UGC cinema, shown in the "Upcoming Releases"
widget (Gladys core contract B.19, `movies` external-integration type).

## Why UGC only

This started as a search for one cinema integration covering the major French
chains (AlloCiné, Pathé, UGC, CGR). Each lead was checked against the same
bar — no paid API, no credential extracted from a decompiled app, no bypass
of anti-bot protection — and only UGC cleared it:

- **AlloCiné**'s mobile GraphQL API requires reusing a hardcoded token
  extracted from decompiling their app. Ruled out.
- **Pathé**'s site actively fingerprints and blocks non-browser HTTP clients
  (Akamai Bot Manager, verified live: a plain `fetch()` gets a 403 that a
  real browser does not). Getting past that means impersonating a browser,
  which is bot-detection bypass. Ruled out.
- **CGR**'s own site has no live per-cinema showtimes endpoint of its own; it
  sources its "now playing" data at build time from a third-party syndicated
  database. Not a clean target either.
- **UGC**'s cinema pages call a plain, unauthenticated, first-party AJAX
  endpoint (`ugc.fr/showingsCinemaAjaxAction!getShowingsForCinemaPage.action`)
  — verified live with a fresh HTTP client, no cookie, no session, no
  bot-block. This is the same endpoint `ugc.fr` calls for every visitor.

If Pathé or CGR later expose an equally clean source, they belong in their
own separate integration (`gladys-pathe`, `gladys-cgr`, ...), not bolted onto
this one — one integration per chain, matching how `gladys-ugc` is scoped.

## What it does

- Configure one UGC cinema (its numeric ID).
- `movies.getUpcoming` returns the films currently playing there today,
  parsed from `ugc.fr`'s own public HTML.
- A **Find my cinema** action searches a hand-maintained static list of UGC
  cinemas (there is no dynamic "select" field type in Gladys for anything
  other than devices — see `docs/fr.md` / `docs/en.md`).

Showtimes (which session, at what time) are out of scope for v1.

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
