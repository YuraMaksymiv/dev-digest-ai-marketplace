# Changelog

All notable changes to this plugin. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [1.0.0] - 2026-10-21

### Added
- `architecture`: generic layering and dependency-direction rules (backend onion / ports-and-adapters, frontend layer map) that defer to repository-local architecture docs.
- Reference skills extracted from the course project's local harness: `typescript-expert`, `react-best-practices`, `react-testing-library`, `next-best-practices`, `fastify-best-practices`, `drizzle-orm-patterns`, `postgresql-table-design`, `zod`, `security`, `mermaid-diagram`.

### Changed
- `drizzle-orm-patterns` no longer grants `allowed-tools`: reference skills must not widen permissions.
