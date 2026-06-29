# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Fixed

### Changed

<<<<<<< HEAD
### Docs

## [v0.5.5] - 2026-06-29

### Added

- Import boundary Transfer Syntax validation: files with unsupported TS now skip before entering the store, with clear user-facing skip reason.
- Pixel PHI permanent warning in export panel — always visible, not conditional on personal-info mode.

### Fixed

- Unparseable DICOM metadata no longer silently enters the store; files that fail parsing are reported as skipped.
- `useExportStore.resetJobs()` now clears `targetDirectoryName` alongside jobs and counters.
- ZIP download `URL.revokeObjectURL` now delayed by 5s to avoid race conditions in some browsers.

### Changed

- Split `includeJpegMetadata` into `includeJpegDescription` (default on, writes `ImageDescription` only) and `includeJpegExtendedMetadata` (default off, writes `UserComment` JSON).
- Renamed JPEG EXIF `BurnedIn=` field to `OverlayBurnedIn=` for semantic clarity.

### Docs

- Document JPEG EXIF field split in EXPORT_SPEC.
- Update SECURITY_PRIVACY to note permanent pixel-PHI warning in UI.
- Document new tests in TEST_PLAN.

## [v0.6.0] - 2026-06-24

### Added

- Add privacy-safe PWA app shell support with manual update prompts and offline access to build assets only.

### Fixed

### Changed
## [v0.5.1] - 2026-06-24

### Added

- Add E2E regression test for mobile panel state persistence after shell re-render

### Fixed

- Mobile panel tab switching no longer resets on React re-render: replaced imperative DOM classList manipulation with React state (`activeMobileTab`)
- Bottom tab bar no longer overlaps mobile panel content: added safe-area-aware bottom padding to viewer, left, and right panels
- Keyboard navigation guard (`data-panel-open`) now correctly covers all overlay states (tablet drawer + mobile tree/export panels)

### Changed

- Migrated mobile/tablet panel visibility management from `querySelector/classList` to React state + `useMediaQuery`

## [v0.5.0] - 2026-06-22

### Added

- Mobile viewport support: bottom tab bar for file tree / viewer / export panels
- Slide-over left panel drawer on tablet with keyboard-safe overlay
- iOS safe-area and touch-optimized form inputs
- Drag-and-drop import for files and directories using FileSystemEntry API

### Fixed

- DICOM viewport lifecycle: fix decoding hang on file switch caused by React DOM cleanup conflicting with Cornerstone viewport management
- Keep placeholder text in dicom-viewport on initial load

### Changed

- Migrate to Vite 8 and updated dependencies

### Docs

- Add license guide
- Refresh bilingual README with improved badges and layout
