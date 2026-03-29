## ADDED Requirements

### Requirement: NavUser component in sidebar footer
The sidebar footer SHALL display a `NavUser` component showing the authenticated user's avatar (letter fallback), name, and email. It SHALL replace the existing standalone `ModeToggle` component.

#### Scenario: User info displayed
- **WHEN** the app loads with a valid session
- **THEN** the sidebar footer SHALL show the user's name and email in the NavUser trigger button

#### Scenario: Avatar fallback
- **WHEN** the user has no profile image (always, since profile images are not supported)
- **THEN** the avatar SHALL display the first letter of the user's name as a fallback

#### Scenario: Sidebar collapsed mode
- **WHEN** the sidebar is in collapsed (icon) mode
- **THEN** the NavUser SHALL show only the avatar icon

### Requirement: NavUser dropdown menu
Clicking the NavUser trigger SHALL open a dropdown menu containing theme options and a logout action.

#### Scenario: Dropdown contents
- **WHEN** the user clicks the NavUser trigger
- **THEN** a dropdown SHALL appear with: user label (avatar + name + email), separator, theme options (Light, Dark, System), separator, Log out button

#### Scenario: Dropdown positioning
- **WHEN** the sidebar is in desktop mode
- **THEN** the dropdown SHALL open to the right side of the trigger

#### Scenario: Dropdown positioning mobile
- **WHEN** the sidebar is in mobile mode
- **THEN** the dropdown SHALL open above (bottom side) the trigger

### Requirement: Theme toggle in NavUser dropdown
The NavUser dropdown SHALL include Light, Dark, and System theme options that function identically to the previous standalone ModeToggle.

#### Scenario: Switch to dark theme
- **WHEN** the user clicks "Dark" in the NavUser dropdown
- **THEN** the document root element SHALL have the `dark` class and the preference SHALL persist to localStorage

#### Scenario: Switch to light theme
- **WHEN** the user clicks "Light" in the NavUser dropdown
- **THEN** the document root element SHALL NOT have the `dark` class and the preference SHALL persist to localStorage

#### Scenario: Switch to system theme
- **WHEN** the user clicks "System" in the NavUser dropdown
- **THEN** the theme SHALL follow the OS preference and persist the "system" choice to localStorage

### Requirement: Logout action
The NavUser dropdown SHALL include a "Log out" option that ends the user's session.

#### Scenario: Logout flow
- **WHEN** the user clicks "Log out" in the dropdown
- **THEN** the frontend SHALL send `POST /api/auth/logout` and follow the redirect (to IdP logout or `/`)

### Requirement: AuthProvider context
The app SHALL wrap all routes in an `AuthProvider` that calls `GET /api/auth/me` on mount to determine the authenticated user.

#### Scenario: Authenticated load
- **WHEN** the app loads and `/api/auth/me` returns HTTP 200 with user data
- **THEN** the AuthProvider SHALL store the user in context and render the app

#### Scenario: Unauthenticated load
- **WHEN** the app loads and `/api/auth/me` returns HTTP 401
- **THEN** the AuthProvider SHALL redirect to `/api/auth/login` via `window.location.href`

#### Scenario: Loading state
- **WHEN** the `/api/auth/me` request is in flight
- **THEN** the AuthProvider SHALL render a loading indicator (not the app)

### Requirement: Global 401 handler in API client
The frontend API client SHALL handle HTTP 401 responses globally by redirecting to `/api/auth/login`.

#### Scenario: API call returns 401
- **WHEN** any API call (not `/api/auth/me`) returns HTTP 401
- **THEN** the API client SHALL redirect to `/api/auth/login` via `window.location.href`

<!-- ModeToggle removal is specified in dark-mode-toggle/spec.md (MODIFIED capability) -->
