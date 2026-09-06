## Context

See `proposal.md` for motivation. Current repo facts shaping the approach:

- `apps/web` is still the Vite starter UI, but already depends on `@clerk/react`, `convex`, `tdesign-react`, `tdesign-icons-react`, and React 19.
- `convex/` does not exist yet; `docs/ARCHITECTURE.md` defines Convex as the target backend and requires all reads/writes to derive owner from a verified Clerk session.
- `packages/contracts/src/index.ts` contains basic content types and `CreateInspirationInput`, but no runtime validation. `docs/CONTRACTS.md` says TypeScript types are not a security boundary.
- `docs/design/README.md` confirms Library/Everything uses a fixed narrow sidebar and opens card detail as a floating layer in the current flow.
- `docs/DEVELOPMENT.md` currently treats Web lint/build as the available automated checks; root typecheck/test/build and Convex backend validation are not yet fully connected.

## Goals / Non-Goals

**Goals:**

- Establish the first authenticated Web-to-Convex business path without adding unrelated modules.
- Make owner isolation testable at the backend boundary, not just hidden by UI state.
- Keep Note shape compatible with the broader `Inspiration` model so S2 can add other content types without replacing the table.
- Replace the starter screen with a usable Everything surface for Note creation, list cards, and detail overlay.

**Non-Goals:**

- No workspace CRUD; `workspaceId` remains absent/null in S1 user flow.
- No search, pagination, editing, deletion, media, plugin capture, or additional content-type creation.
- No complex rich text editor; Note body is plain text for this slice.
- No production deployment or secret provisioning in the planning artifact.

## Decisions

### Use Convex as the backend source of truth

Create a root `convex/` directory with the minimum generated setup expected by the installed Convex package: schema, query/mutation modules, and auth configuration needed for Clerk JWT validation.

Rationale: the architecture already names Convex as the target backend and Web already depends on it. Using local-only state or browser storage would fail the cross-user isolation acceptance test and would create throwaway behavior.

Alternative considered: add a temporary API route or mock persistence. Rejected because the repo has no server app besides the planned Convex backend, and mocks would not verify owner isolation.

### Model S1 Notes as `inspirations` rows

Add an `inspirations` table with fields needed now: `ownerId`, `type: "note"`, optional `title`, required `content`, `tags: string[]`, optional `workspaceId`, `createdAt`, and `updatedAt`. Add an index that supports querying by owner and creation time; if Convex index ordering cannot directly satisfy newest-first, query by owner and sort/limit in the query for this small S1 set.

Rationale: `docs/PRODUCT.md` and `docs/CONTRACTS.md` describe a shared Inspiration domain across five content types. Starting with a Note-only subset avoids a later table migration from `notes` to `inspirations`.

Alternative considered: a dedicated `notes` table. Rejected because Everything is the cross-type Library surface and S2 needs to add Page/Image/Quote/Video into the same content domain.

### Derive owner only on the server

Backend functions read the authenticated identity from Convex auth context and store/query using that subject as `ownerId`. Create inputs must omit owner fields; if any caller attempts to supply one, validation ignores or rejects it rather than trusting it.

Rationale: this is the core privacy boundary in `docs/ARCHITECTURE.md` and `docs/CONTRACTS.md`. It is also the only reliable way to verify A/B user isolation.

Alternative considered: pass Clerk user ID from React. Rejected because client-provided identity can be tampered with.

### Keep contracts small but runtime-backed

Update `packages/contracts` to expose the Note creation/list/detail types and limits used by Web and Convex. Add matching runtime validation in Convex functions rather than relying on the shared TypeScript definitions alone.

Suggested S1 validation limits: non-blank `content`, trimmed optional `title`, trimmed string tags, tag array bounded to a small fixed count, and string length caps documented in `docs/CONTRACTS.md` during apply. Exact caps can be selected during implementation if they do not weaken the spec behavior.

Rationale: the existing contracts package is the intended shared boundary, while server runtime validation is mandatory for security.

Alternative considered: define types only inside Convex. Rejected because Web and future extension code would drift from backend expectations.

### Build a compact authenticated Library shell

Wrap the Web app with Clerk and Convex providers in `main.tsx`, using environment variables for the Clerk publishable key and Convex URL. Inside the signed-in app, render a narrow-sidebar Library layout with an Everything heading, creation form, Note cards, and a TDesign Dialog/Drawer-style floating layer for details.

Rationale: this matches the confirmed design direction while keeping S1 to one real user flow. TDesign already exists and should handle form controls, buttons, loading, empty/error states, and overlay accessibility.

Alternative considered: introduce a full routing structure immediately. Deferred because S1 only needs Everything and the detail overlay; route organization can arrive with additional modules when there is real navigation state to preserve.

## Risks / Trade-offs

- Clerk/Convex auth setup can fail locally without correct dashboard/JWT template configuration -> document required environment variables and report any manual setup needed; do not commit secrets.
- Convex generated files may affect lint/build assumptions -> run the available Web checks and any Convex generation/check command that is available after setup, while clearly reporting gaps from `docs/DEVELOPMENT.md`.
- Owner isolation needs two real accounts or test identities -> include a manual A/B acceptance script and do not claim it passed unless actually executed.
- A single `inspirations` table starts with unused future fields absent -> keep the schema minimal and add only fields required by Note; future content types can extend the table in S2.
- No pagination in S1 can become slow with many Notes -> acceptable for the minimum slice; document as a future Library concern rather than implementing search/pagination now.

## Migration Plan

1. Add backend files and provider wiring behind required environment variables.
2. Update contracts and docs so the Note payload and runtime validation are described consistently.
3. Replace the starter Web UI with the authenticated Everything flow.
4. Run current available checks from `docs/DEVELOPMENT.md`: `pnpm --filter web lint` and `pnpm --filter web build`; run any newly available Convex validation/generation command if the setup adds one.
5. Manually verify with two Clerk users that user A's Note appears for A, does not appear for B, and detail access does not leak content.

Rollback is straightforward before production data exists: remove the Convex S1 functions/schema additions and restore the Web starter or prior app shell. After real data exists, rollback must preserve or export `inspirations` rows instead of deleting the table.

## Open Questions

- Exact Note field limits for title/content/tags can be chosen during implementation and recorded in `docs/CONTRACTS.md`, provided blank content remains invalid and owner isolation is unchanged.
