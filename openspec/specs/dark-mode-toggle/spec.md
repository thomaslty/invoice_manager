### Requirement: Theme provider manages dark class on HTML element
The system SHALL provide a ThemeProvider React context that adds or removes the `dark` class on `document.documentElement` based on the current theme setting. The provider SHALL support three theme values: `light`, `dark`, and `system`.

#### Scenario: Light theme selected
- **WHEN** the user selects the "Light" theme
- **THEN** the `dark` class SHALL be removed from the `<html>` element
- **AND** the `light` class SHALL be added to the `<html>` element

#### Scenario: Dark theme selected
- **WHEN** the user selects the "Dark" theme
- **THEN** the `dark` class SHALL be added to the `<html>` element
- **AND** the `light` class SHALL be removed from the `<html>` element

#### Scenario: System theme follows OS preference
- **WHEN** the user selects the "System" theme
- **THEN** the system SHALL detect the OS color scheme preference via `matchMedia("(prefers-color-scheme: dark)")`
- **AND** apply the corresponding `light` or `dark` class to the `<html>` element

### Requirement: Theme preference persists across sessions
The system SHALL persist the user's theme preference to `localStorage` so it survives page reloads and new sessions.

#### Scenario: Preference saved on change
- **WHEN** the user selects a theme
- **THEN** the selected value SHALL be stored in `localStorage`

#### Scenario: Preference restored on load
- **WHEN** the app loads and a theme value exists in `localStorage`
- **THEN** the system SHALL apply the stored theme immediately

#### Scenario: Default when no preference stored
- **WHEN** the app loads and no theme value exists in `localStorage`
- **THEN** the system SHALL default to `system` (follow OS preference)

### Requirement: Mode toggle in sidebar footer
The system SHALL display a theme toggle control in the sidebar footer. The toggle SHALL be a button with Sun/Moon icon that opens a dropdown menu with three options: Light, Dark, and System.

#### Scenario: Toggle visible in expanded sidebar
- **WHEN** the sidebar is in expanded (non-collapsed) state
- **THEN** the toggle button SHALL be visible in the sidebar footer area with a label

#### Scenario: Toggle visible in collapsed sidebar
- **WHEN** the sidebar is collapsed to icon-only mode
- **THEN** the toggle button SHALL still be visible as an icon-only button in the sidebar footer

#### Scenario: Selecting a theme from dropdown
- **WHEN** the user clicks the toggle button and selects a theme option
- **THEN** the theme SHALL change immediately without page reload

### Requirement: Invoice preview unaffected by dark mode
The invoice preview iframe SHALL NOT be affected by the app's dark mode setting. It SHALL always render with its own self-contained styles.

#### Scenario: Preview stays light in dark mode
- **WHEN** the app is in dark mode
- **AND** the user views an invoice preview
- **THEN** the preview iframe SHALL display with its original light styling
