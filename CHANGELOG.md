# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

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
