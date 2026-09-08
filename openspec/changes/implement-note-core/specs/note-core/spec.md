## Purpose

定义 Inspira S1 的最小私人 Note 闭环：登录用户可以创建 Note，在 Everything 中只看到自己的 Note，并从卡片打开详情浮层。

## ADDED Requirements

### Requirement: Authenticated access to Note core

The system SHALL require a valid logged-in user before any Note creation, Everything Note listing, or Note detail data access is performed.

#### Scenario: Unauthenticated visitor cannot use Note data flow

- **WHEN** a visitor has no valid session
- **THEN** the system presents a login entry instead of showing Note data or creation controls

#### Scenario: Expired session is not trusted

- **WHEN** a previously logged-in user's session is no longer valid
- **THEN** Note creation and owner-scoped Note queries fail as unauthenticated and do not expose private data

### Requirement: Create Note for current owner

The system SHALL allow a logged-in user to create a Note with required body content, optional title, optional notes, optional string tags, and no required workspace.

#### Scenario: Successful Note creation

- **WHEN** a logged-in user submits valid Note content with optional title, notes, and tags
- **THEN** the system stores a new Note owned by that user and reports success with the created Note identifier

#### Scenario: Empty Note content is rejected

- **WHEN** a logged-in user submits a Note without non-blank body content
- **THEN** the system rejects the request with a validation error and does not create a Note

#### Scenario: Client owner fields are ignored

- **WHEN** a create request includes any client-supplied owner or user identifier
- **THEN** the system does not trust that value and derives ownership only from the verified server-side session

### Requirement: Everything lists current user's Notes

The system SHALL show logged-in users an Everything list containing their own Notes ordered with the newest Note first.

#### Scenario: Created Note appears in Everything

- **WHEN** a logged-in user successfully creates a Note
- **THEN** the Note appears in that user's Everything list without requiring a page reload

#### Scenario: Empty Everything state

- **WHEN** a logged-in user has no Notes
- **THEN** the Everything list shows an empty state that does not imply search, workspaces, media, or other excluded modules are available

#### Scenario: Load failure is visible

- **WHEN** the user's Note list cannot be loaded
- **THEN** the UI shows an error state without displaying another user's data

### Requirement: Note detail opens from a card

The system SHALL let a logged-in user open a Note detail floating layer from a Note card in the current Everything list.

#### Scenario: Open Note detail

- **WHEN** a logged-in user selects a Note card from their Everything list
- **THEN** a detail floating layer opens over the current list and displays that Note's body on the left, with title, tags, notes, created time, and updated time available in the right-side detail controls

#### Scenario: Close Note detail

- **WHEN** a logged-in user closes the detail floating layer
- **THEN** the user returns to the Everything list with the Note card flow still visible

### Requirement: Owner isolation for Notes

The system SHALL isolate Note creation, listing, and detail access by the current authenticated owner.

#### Scenario: User B cannot see User A Note in Everything

- **WHEN** user A creates a Note and user B opens Everything
- **THEN** user B's list does not include user A's Note

#### Scenario: User B cannot access User A Note detail

- **WHEN** user B attempts to load a detail record for a Note owned by user A
- **THEN** the system denies access or returns no record without leaking the Note content
