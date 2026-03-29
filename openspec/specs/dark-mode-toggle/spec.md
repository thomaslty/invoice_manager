## MODIFIED Requirements

### Requirement: Theme toggle location
The theme toggle SHALL be accessible from the NavUser dropdown menu in the sidebar footer instead of as a standalone component. The toggle options (Light, Dark, System) and their behavior SHALL remain unchanged. The standalone `ModeToggle` component in the sidebar footer SHALL be removed.

#### Scenario: Theme toggle accessible via NavUser
- **WHEN** the user clicks the NavUser trigger in the sidebar footer
- **THEN** the dropdown SHALL include Light, Dark, and System theme options

#### Scenario: Standalone ModeToggle removed
- **WHEN** the app renders the sidebar
- **THEN** the sidebar footer SHALL NOT contain the standalone `ModeToggle` dropdown button
