# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A 2001: A Space Odyssey–themed internet radio player. The web app is a static PWA (no build step, no framework, no dependencies) served at `https://discovery.ravijankar.com`. A second deployment at `https://wjc3.ravijankar.com` wraps just the local WJC3 stream. Two macOS native wrappers (`DiscoveryRadio.app`, `WJC3 Radio.app`) load these URLs in a WKWebView.

## Deploying

The web app is static files — deploy by pushing to the server or Pi. There is no build step for the web layer.

**Raspberry Pi install / update:**
```bash
bash install-pi.sh          # first-time install (auto-detects nginx/apache2/caddy/lighttpd)
sudo git -C /var/www/discovery-radio pull && sudo systemctl reload nginx   # update
```

**macOS apps** (requires macOS with Xcode command-line tools):
```bash
bash macos/build.sh         # outputs WJC3 Radio.app and Discovery Radio.app to ~/Applications
```
First launch: right-click → Open to bypass Gatekeeper.

## Architecture

Everything runs in the browser. There is no backend.

| File | Role |
|------|------|
| `index.html` | App shell and layout — HAL 9000 aesthetic with masthead, clocks, station list, control panel |
| `stations.js` | `STATIONS` global object — all station metadata and stream URLs |
| `app.js` | All runtime logic: playback engine, VU/signal meters, volume knob, station editor, clocks |
| `style.css` | Full dark-terminal visual theme |
| `sw.js` | Service worker — caches app shell (`discovery-v4`), passes through audio streams |
| `manifest.json` | PWA manifest for installability |
| `macos/DiscoveryRadio.swift` | macOS wrapper loading `https://discovery.ravijankar.com` |
| `macos/WJC3Radio.swift` | macOS wrapper loading `https://wjc3.ravijankar.com` (700×920, narrower) |
| `macos/build.sh` | Compiles both Swift wrappers and generates `AppIcon.icns` from `favicon.svg` |

## Key implementation details

**Playback engine** (`app.js:284–394`): Multi-source fallback — `tryStream()` iterates `st.streams[]` in order, with a 12-second connect timeout per source. Does NOT set `crossOrigin` on the Audio element — doing so triggers CORS preflight and breaks streams that don't send `Access-Control-Allow-Origin: *`.

**HLS handling**: `.m3u8` streams are skipped on browsers without native HLS support (Chrome, Firefox) and the next source in the array is tried automatically.

**Station persistence**: User edits via the station editor modal are saved to `localStorage` under the key `hal_stations` and loaded on startup before `rebuildMainList()` is called. The built-in `stations.js` data is only used as the default when no saved data exists.

**Cache busting**: JS and CSS files are included with `?v=N` query strings in `index.html` (currently `?v=5`). The service worker cache name (`discovery-v4` in `sw.js`) must also be bumped when deploying breaking changes, otherwise the old shell stays cached.

**WKWebView config**: Both macOS wrappers use `WKWebsiteDataStore.nonPersistent()` (no disk cache) and `reloadIgnoringLocalAndRemoteCacheData` to ensure the app always loads fresh JS from the server.

**Now Playing**: Stations can optionally include a `nowPlayingUrl` pointing to an AzuraCast `/api/nowplaying/` endpoint. The app polls it every 15 seconds while a station is playing and updates the description display.

## Station data format

Each station object in `STATIONS.us` or `STATIONS.intl`:
```js
{
  call: 'WXYZ',           // display identifier
  name: 'Full Name',
  loc: 'CITY, STATE',
  freq: '91.5 FM',        // or 'ONLINE'
  desc: 'Short tagline',
  tags: ['jazz', 'blues'], // used for filter buttons: jazz, classical, world, eclectic
  streams: ['url1', 'url2'],  // tried in order; first working one wins
  featured: true,         // optional — shows ★ LOCAL badge
  nowPlayingUrl: '...'    // optional — AzuraCast API endpoint
}
```
