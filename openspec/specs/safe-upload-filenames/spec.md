# safe-upload-filenames Specification

## Purpose
TBD - created by archiving change harden-nonascii-filenames. Update Purpose after archive.
## Requirements
### Requirement: Uploaded files use safe generated filenames
Uploaded files (signatures, fonts) SHALL be stored under a server-generated, ASCII-only filename and SHALL NOT derive the on-disk name from the client-supplied original name.

#### Scenario: Upload with a non-ASCII filename
- **WHEN** a user uploads a file whose original name contains non-ASCII characters
- **THEN** the stored filename contains only ASCII characters
- **THEN** the file is served correctly via its returned URL

#### Scenario: Upload with a path-traversal filename
- **WHEN** the original name contains path segments such as `../`
- **THEN** the stored filename contains no `/` or `..`
- **THEN** the file is written only inside the intended upload directory

#### Scenario: Display name is preserved
- **WHEN** a font is uploaded with a non-ASCII display name in the form fields
- **THEN** the font's stored `name`/`family` retain the original characters

