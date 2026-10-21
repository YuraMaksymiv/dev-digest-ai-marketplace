# Changelog

All notable changes to this plugin. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [1.0.0] - 2026-10-21

### Added
- `architecture-reviewer` agent: discovers the repository's architecture docs and checker, falls back to `engineering-paved-path:architecture`, never runs baseline/accept commands, separates new from baseline violations.
- Dependency on `engineering-paved-path@^1.0.0`.
