# ADR 0005: Privacy-Safe PWA App Shell

## Status

Accepted.

## Context

The app is a local-first DICOM viewer/exporter. Users explicitly authorize local files through browser file or directory pickers, and DICOM data must not be uploaded or silently persisted. The app already has a web manifest and install-related metadata, but it previously had no service worker.

Cornerstone decoding depends on build-time worker and WASM assets. Offline app-shell support therefore needs those build outputs available while still excluding user DICOM data from all persistent browser storage.

## Decision

Use `vite-plugin-pwa` with `injectManifest` and a custom service worker in `src/pwa`.

- Precache only build assets injected through `self.__WB_MANIFEST`.
- Set `maximumFileSizeToCacheInBytes` above the Cornerstone worker/WASM asset sizes.
- Use prompt/manual update registration in production only.
- Do not call `clientsClaim()`.
- Call `skipWaiting()` only after an explicit `SKIP_WAITING` message triggered by user confirmation.
- Use network-only handling for runtime HTTP(S) requests and no broad runtime caching strategy.
- Keep `public/manifest.json` as the single manifest source linked from `index.html`.

## Consequences

- The installed PWA can open the app shell offline after a successful online visit.
- Cornerstone build assets required for decoding are part of the precache.
- User DICOM files, File/blob/file: URLs, export blobs, and File System Access handles are not cached by the service worker.
- Users may remain on an older version until they accept the update prompt or close/reopen the app.
