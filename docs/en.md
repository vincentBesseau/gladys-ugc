# UGC

Movies currently playing at your UGC cinema, shown in Gladys's "Upcoming
Releases" widget.

## Important: unofficial integration

This integration reads the "now playing" page that **ugc.fr already serves
publicly to any visitor** of its site — the same content you would see by
opening your cinema's page in a browser, nothing more. It is not developed,
endorsed, or affiliated with UGC. UGC can change its site at any time and
break this integration without notice.

No paid API, no credential extracted from an app, no bypass of anti-bot
protection is used: only the public endpoint the site already uses for
itself.

## Configuration

1. Open the integration's **Configuration** tab.
2. Run the **Find my cinema** action: leave the field empty to list every UGC
   cinema, or type a city / postal code to filter. The result is shown under
   the button as `Cinema name — City (ID: 10)`.
3. Copy the numeric ID of your cinema into the **Cinema ID** field, then save.

The films currently playing at that cinema then appear in the dashboard's
"Upcoming Releases" widget.

## Known limitations (v1)

- One cinema at a time per installation of the integration.
- Only today's now-playing list: no showtimes yet (planned for a future
  version).
- The cinema list is a hand-maintained static list (see the repository's
  README): a brand-new UGC cinema may not appear in it yet.

## Troubleshooting

The integration logs everything it does: check the integration logs from the
Gladys interface (or `docker logs` on the host) with `LOG_LEVEL=debug` for
full detail.
