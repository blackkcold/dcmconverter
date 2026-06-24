# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
