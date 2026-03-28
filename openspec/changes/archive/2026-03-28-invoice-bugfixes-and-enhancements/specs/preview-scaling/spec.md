## ADDED Requirements

### Requirement: Full A4 page visible in preview panel
The preview panel SHALL display the entire A4 invoice page scaled to fit the available width, so all sections including footer are visible without scrolling the preview.

#### Scenario: Preview shows full page at reduced scale
- **WHEN** user views the invoice editor
- **THEN** the preview panel shows the full 595x842px A4 page scaled down to fit the panel width, with all content visible (header through footer)

#### Scenario: Preview scales responsively
- **WHEN** user resizes the browser window
- **THEN** the preview scale adjusts dynamically to fit the new available width while maintaining the A4 aspect ratio

#### Scenario: Footer is visible in preview
- **WHEN** user fills in footer text in the editor form
- **THEN** the footer text is visible at the bottom of the scaled preview page
