## ADDED Requirements

### Requirement: Line-item description supports multi-line, resizable input
The invoice editor SHALL present the line-item description as a multi-line text area that the user can vertically resize, replacing the single-line input.

#### Scenario: Enter multi-line description
- **WHEN** the user types text with line breaks into a line-item description
- **THEN** the field displays the text across multiple lines
- **THEN** the field can be resized vertically by the user

#### Scenario: Existing single-line descriptions still work
- **WHEN** an existing invoice with single-line descriptions is opened
- **THEN** the descriptions display and edit normally

### Requirement: Multi-line descriptions render line breaks in preview and PDF
Line breaks entered in a description SHALL be preserved and rendered as line breaks in both the live preview and the downloaded PDF.

#### Scenario: Line breaks appear in output
- **WHEN** a description contains multiple lines
- **THEN** the live preview renders the description on multiple lines
- **THEN** the downloaded PDF renders the description on multiple lines
