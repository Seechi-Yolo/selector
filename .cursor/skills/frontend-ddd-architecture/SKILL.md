---
name: frontend-ddd-architecture
description: Applies restrained frontend Domain-Driven Design architecture for this Chrome extension. Use when writing new frontend code, adding Chrome extension behavior, modeling local persistence, or refactoring existing code.
---

# Frontend DDD Architecture

Use this skill when adding new code or refactoring. The project is a pure frontend Chrome extension: data stays local to the browser/extension storage, with no cloud upload unless the user explicitly changes that product direction.

## Core Rule

Model the code around user capabilities and domain language, not technical folders. Keep business rules independent from React, browser APIs, storage APIs, and UI details.

## Suggested Shape

Prefer a small Feature-Sliced / Clean Architecture blend:

- `app`: application bootstrap, providers, extension entry wiring.
- `pages` or `screens`: route/page-level composition when needed.
- `features`: user actions and workflows, such as selecting, saving, filtering, importing, exporting.
- `entities`: domain concepts and business rules, such as selector, rule, collection, snapshot.
- `shared`: reusable UI primitives, utilities, adapters, and infrastructure without domain ownership.

Only create layers that the change actually needs. For small features, keep the shape compact.

## Dependency Direction

- Higher-level composition may depend on lower-level domain code.
- Domain code must not import UI frameworks, Chrome APIs, storage implementations, routes, or feature orchestration.
- Feature code may coordinate entities, UI, and adapters, but should not hide domain rules inside components.
- Cross-slice imports should go through public entry points, usually `index.ts`.

### Concrete rules for this repo

| From \\ To | `entities` | `shared` | `features` | `app` / `pages` |
|------------|:------------:|:--------:|:------------:|:---------------:|
| **`entities`** | internal only | **avoid** — prefer keeping domain free of infra imports; if a type is only a string alias, keep it in `entities` | **no** | **no** |
| **`shared`** | **no** — do not import domain types or domain functions; use plain `string` at boundaries if needed | internal only | **no** | **no** |
| **`features`** | yes | yes | internal only | **no** |
| **`app` / `pages`** | yes | yes | yes | internal |

- **`shared/editor-chrome`**: global theme injection, panel shell DOM, and CSS class contract — presentation/infrastructure, **not** domain. Lives under `shared` so it can use `document` and raw CSS without polluting `entities`.
- **DOM read model → prompt row**: assembling `PromptElementContext` from `document` belongs in a **feature** (e.g. `features/copy-prompt/build-element-context.ts`), not in `shared/dom`, so `shared` does not depend on `entities/prompt-composition`.
- **Interactive panel** (`EditorPanel`): lives in `features/editor-panel` when it wires shell DOM to selection/`ElementId` callbacks — not in `shared/ui`.

## Local Data Boundary

Treat Chrome/local browser storage as infrastructure, not the domain model.

- Define domain types and use cases first.
- Put storage serialization, versioning, migrations, and Chrome API calls behind adapters/repositories.
- Keep persisted data schemas explicit and stable; do not let component state become the storage contract.
- Never introduce network upload, analytics sync, remote auth, or cloud assumptions without explicit user approval.

## Component Guidance

- Components render state and capture user intent.
- Hooks may orchestrate UI state, but durable business rules belong in entities or use cases.
- Keep browser-extension concerns at the edge: popup/content/background scripts should delegate to feature or application services quickly.

## Refactoring Guidance

When refactoring, move toward boundaries in this order:

1. Name the capability or entity in domain terms.
2. Extract pure rules from UI and browser APIs.
3. Introduce an adapter only where infrastructure leaks into domain or feature code.
4. Keep public APIs small; avoid broad barrel exports.
5. Stop once the current change is clear and maintainable.

## Avoid

- Splitting every file by pattern before there is real complexity.
- Generic `services`, `utils`, or `components` folders that accumulate unrelated domain behavior.
- Framework-specific domain objects.
- Defensive compatibility layers for unshipped branch code.
- Architecture rewrites unrelated to the requested change.
