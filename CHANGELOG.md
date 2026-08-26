# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Added

- Initial project setup.

### Changed

- `render()` now throws `Unsupported format` for unknown output formats instead of
  silently returning `undefined`.
- Publish validated tag artifacts to npm with trusted publishing before creating
  the corresponding GitHub release.
- Package smoke verification now checks the CLI bin target, release metadata,
  and npm files allowlist before running the dry-run pack.

### Fixed

- Distinguish local actions, remote action refs, and Docker image digests when
  checking pinned dependencies.
- Preserve workflow source lines so JSON, Markdown, and SARIF findings point to
  the relevant job or step property instead of an array index.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/ciquilt/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/ciquilt/releases/latest`

Replace placeholder links once the first release tag exists.
