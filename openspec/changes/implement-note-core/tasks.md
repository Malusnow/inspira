## 1. Backend Foundation

- [ ] 1.1 Create the root `convex/` setup for the installed Convex version, including schema/auth/function module structure, and verify expected generated/imported Convex files resolve during the first available Convex codegen or Web build.
- [ ] 1.2 Configure Clerk-to-Convex authentication using environment variables and safe placeholders only; verify unauthenticated Convex calls to Note functions fail without returning private data.
- [ ] 1.3 Add the `inspirations` table for S1 Note rows with owner, type, title, content, tags, optional workspace, createdAt, updatedAt, and an owner/time query path; verify the schema accepts valid Note rows and rejects non-Note shape where applicable.
- [ ] 1.4 Implement shared backend auth helper behavior that derives `ownerId` from the verified session and never from client input; verify a mutation/query cannot be made to read or write another owner by passing spoofed owner/user fields.

## 2. Contracts And Validation

- [ ] 2.1 Update `packages/contracts` with Note create/list/detail types and selected title/content/tag limits; verify Web and Convex code import the shared types without circular or cross-package component sharing.
- [ ] 2.2 Implement Convex runtime validation for Note creation, including non-blank content, trimmed optional title, string tags, bounded tag count/length, and no required workspace; verify invalid inputs return validation errors and create no rows.
- [ ] 2.3 Sync `docs/CONTRACTS.md` with the exact S1 Note fields, limits, error behavior, and owner derivation rule; verify the docs no longer describe Note limits as undecided after implementation.

## 3. Note Functions

- [ ] 3.1 Implement the create Note mutation returning the created Note identifier; verify a logged-in user can create a valid Note and the stored row has type `note`, current owner, timestamps, and sanitized fields.
- [ ] 3.2 Implement the Everything Notes query returning only the current owner’s Notes newest first; verify a newly created Note appears in the same user’s list without requiring a browser reload.
- [ ] 3.3 Implement a Note detail query or owner-safe detail lookup path for selected cards; verify cross-owner IDs return no content or an authorization failure without leaking title/body/tags.

## 4. Web Auth And App Shell

- [ ] 4.1 Wrap `apps/web/src/main.tsx` with Clerk and Convex React providers using Vite environment variables; verify missing configuration fails clearly during local startup/build rather than silently rendering broken private data.
- [ ] 4.2 Replace the Vite starter UI with an authenticated Library/Everything shell using TDesign controls and the confirmed narrow-sidebar direction; verify signed-out users see login UI and no Note list or create controls.
- [ ] 4.3 Add loading, empty, error, and success states for the owner-scoped Everything query; verify each state can be reached without implying excluded features such as search, media, workspaces, Insights, or Serendipity.

## 5. Create, List, And Detail UI

- [ ] 5.1 Build the plain-text Note creation form with title, content, and tags input; verify successful submit clears the form, reports success, and invalid blank content preserves editable input with an error.
- [ ] 5.2 Render Note cards from the owner-scoped Everything query with stable responsive layout and timestamps; verify cards contain only Note data returned for the signed-in owner.
- [ ] 5.3 Open a TDesign detail floating layer from a card and display title, body, tags, createdAt, and updatedAt; verify close returns to the same Everything list and keyboard focus remains usable.
- [ ] 5.4 Keep S1 UI free of excluded controls and claims, including plugin capture, upload, workspace management, search, Insights, Serendipity, favorites, restore, AI summary, or rich text editing; verify visible UI copy and controls match this scope.

## 6. Verification And Delivery

- [ ] 6.1 Run `pnpm --filter web lint` and verify it exits successfully, or record the exact failure and whether it is caused by this change.
- [ ] 6.2 Run `pnpm --filter web build` and verify it exits successfully, or record the exact failure and whether it is caused by this change.
- [ ] 6.3 Run any Convex generation/check command required by the added backend setup and verify generated API/types are current; if no such command is available in repo scripts, record the gap explicitly.
- [ ] 6.4 Manually verify with two Clerk users: user A creates a Note, user A sees it in Everything, user A opens detail, user B cannot see it in Everything, and user B cannot access its detail content; record the accounts as anonymized A/B evidence only.
- [ ] 6.5 Review all changed files against `openspec/changes/implement-note-core/specs/note-core/spec.md`, then run `openspec validate implement-note-core --strict` and verify the change spec is valid before marking tasks complete.
