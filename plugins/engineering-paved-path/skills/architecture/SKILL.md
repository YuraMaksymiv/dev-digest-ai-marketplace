---
name: architecture
description: Layering and dependency-direction rules for application code — backend onion / ports-and-adapters (transport → application → domain → ports ← adapters, composition root) and frontend layer map (route entry → route-local UI → shared feature UI → services → vendored leaves). Decides which layer a piece of code belongs to and which way its imports may point, and gives a review checklist. Always defers to the target repository's own architecture docs when they exist. Use when adding, moving or reviewing code across module/layer boundaries, when asked "where should this go", or when reviewing a diff for layering violations.
---

# Architecture — layering and dependency direction

A reference skill. It states the rules; the target repository decides how
they map onto its folders.

## 0. Repository docs win

Before applying anything below, look for the repository's own architecture
description and treat it as authoritative where it is more specific:

1. `ARCHITECTURE.md`, `docs/architecture*`, `docs/adr/*` / `docs/decisions/*`
2. `CLAUDE.md` / `AGENTS.md` at the root and in the touched module
3. A mechanical checker config: `.dependency-cruiser.*`, `eslint` boundary
   rules (`eslint-plugin-boundaries`, `import/no-restricted-paths`),
   `ArchUnit`/`import-linter`, Nx `enforce-module-boundaries`
4. The scripts that run it (`package.json` `arch`/`lint:arch`, `Makefile`)

If none exists, use the defaults below and say so: "no repository
architecture docs found — applied generic layering defaults".

## 1. The one rule

**Dependencies point inward (backend) or downward (frontend). Nothing inner
names a concrete outer thing.**

```
backend                                   frontend
transport   routes / controllers          route entry   page / screen (thin)
   ↓                                         ↓
application services, use cases           route-local   components used by one route
   ↓          owns the transaction            ↓
domain      pure logic, no I/O            shared UI     feature components, 2+ routes
   ↓ uses        ↑ implements                 ↓
ports       interfaces the core owns      services      api client · data hooks · contexts
   ↑                                          ↓
adapters    DB, HTTP clients, queues      leaves        design system · wire contracts
composition the ONLY place a concrete
            implementation is constructed
```

An outer layer may call any inner layer, not only the next one. The reverse
is forbidden, and so is constructing a concrete adapter anywhere except the
composition root.

## 2. Decision procedure — backend

Stop at the first match:

1. Reads the request/response, sets a status code, defines a wire schema →
   transport.
2. Runs a query → the persistence boundary (repository/DAO). It returns the
   module's contract types, not ORM rows.
3. Calls an external system (LLM, VCS host, filesystem, queue) → behind a
   port; implementation in an adapter; construction in the composition root.
4. Pure — same input, same output, no I/O → domain helpers.
5. Coordinates several of the above, opens a transaction → application
   service.
6. Cross-cutting infrastructure (config, jobs, logging, errors) → platform.
7. Wiring → composition root.

## 3. Decision procedure — frontend

Stop at the first match:

1. User-visible copy → the i18n/messages catalogue, never a literal.
2. Generic UI primitive → the design system; reuse before adding.
3. Talks to the API → the api client + a data hook. Never `fetch` in a
   component.
4. Pure function over data → a helper beside its only consumer; promote to a
   shared lib only when a second feature needs it.
5. Used by one component → colocate in that component's folder.
6. Used across one route subtree → nearest common ancestor in that route.
7. Used by more than one route → shared feature UI / shared lib.

State placement: server data in the data-fetching cache; shareable or
reload-surviving UI state in the URL; ephemeral state local; app-wide
concerns in a context; derived values computed during render, never stored.

## 4. When NOT to add layers

- A module with no orchestration does not need a service layer.
- No interface with one implementation and no test seam.
- No speculative shared folder: an abstraction with one consumer costs more
  than the duplication it removes.
- Don't refactor a conforming module to chase purity; fix drift when you are
  already touching it.

## 5. Mechanical check

If the repository has an architecture checker, run its documented script.
If it has a "baseline" / "accept known violations" command, **never run it**
— re-recording the baseline launders a new violation into accepted drift;
that decision belongs to a human. Distinguish violations the diff
introduced from pre-existing baseline ones.

## 6. Review checklist

- [ ] Does any import point outward/upward, or sideways into another route's
      private components?
- [ ] Is a concrete adapter constructed outside the composition root?
- [ ] Does anything outside the persistence boundary import the ORM/schema?
- [ ] Does a repository leak ORM row types to a service?
- [ ] Is transport code transport-only (parse, delegate, map status)?
- [ ] Are domain helpers still pure?
- [ ] Does a multi-statement write run without a transaction?
- [ ] Is a new external call behind a port that tests can fake?
- [ ] Frontend: any `fetch`/cache-key/invalidation inside a component?
- [ ] Frontend: any user-visible string or colour hard-coded?
- [ ] Any derived value or query result copied into local state?
- [ ] Does the repository's architecture check pass (if it has one)?
