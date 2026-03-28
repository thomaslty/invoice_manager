## ADDED Requirements

### Requirement: Auto-populate font name and family from Google Fonts URL
When pasting a Google Fonts CSS URL in the remote font dialog, the system SHALL parse the font name from the URL and auto-fill the Name and Family fields.

#### Scenario: Paste Google Fonts CSS2 URL
- **WHEN** user pastes `https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap` into the URL field
- **THEN** the Name field is auto-filled with "Playfair Display"
- **AND** the Family field is auto-filled with "Playfair Display"

#### Scenario: Paste simple Google Fonts URL without weight specifiers
- **WHEN** user pastes `https://fonts.googleapis.com/css2?family=Roboto&display=swap`
- **THEN** the Name and Family fields are auto-filled with "Roboto"

#### Scenario: Do not overwrite user-edited fields
- **WHEN** the user has already typed a custom name in the Name field
- **AND** then pastes a Google Fonts URL
- **THEN** the Name field is NOT overwritten (retains user's custom value)
- **AND** only empty fields are auto-filled

#### Scenario: Non-Google-Fonts URL
- **WHEN** user pastes a URL that is not from fonts.googleapis.com (e.g., a direct .woff2 file URL)
- **THEN** no auto-population occurs — Name and Family fields remain unchanged

#### Scenario: Multi-font Google Fonts URL rejected
- **WHEN** user pastes a Google Fonts URL containing multiple `family=` parameters (e.g., `family=Playfair+Display&family=Roboto`)
- **THEN** an inline error message is shown in the dialog: "Multiple font families detected. Please use a URL with a single font family."
- **AND** the Add Font button is disabled (submission blocked)
- **AND** the Name and Family fields are NOT auto-populated

#### Scenario: Multi-font error clears when URL is corrected
- **WHEN** the user has a multi-font URL error showing
- **AND** replaces the URL with a single-font Google Fonts URL
- **THEN** the error message disappears
- **AND** the Name and Family fields are auto-populated normally
