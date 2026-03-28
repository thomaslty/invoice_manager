## Why

The app currently only supports a light theme. Users working in low-light environments or who prefer dark interfaces have no option. Adding dark mode is a standard UX expectation for modern web apps and the project already has dark CSS variables defined in `index.css` — they're just not wired up.

## What Changes

- Add a `ThemeProvider` context that manages the `dark` class on `<html>` and persists user preference to `localStorage`
- Add a `useTheme` hook for accessing/setting the current theme
- Add a mode toggle (Sun/Moon icon with dropdown: Light / Dark / System) in the sidebar footer
- Wrap the app tree with the `ThemeProvider`

## Capabilities

### New Capabilities
- `dark-mode-toggle`: Theme switching UI and persistence — provider, hook, and toggle component following the official shadcn/Vite dark mode pattern

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **Frontend only** — no backend changes
- **New files**: `components/theme-provider.jsx`, `components/mode-toggle.jsx`
- **Modified files**: `App.jsx` (wrap with ThemeProvider), `components/layout/Sidebar.jsx` (add SidebarFooter with toggle)
- **Dependencies**: None new — uses existing `dropdown-menu` shadcn component plus `lucide-react` icons (Sun, Moon) already in the project
- **Invoice preview**: Unaffected — the iframe renders self-contained HTML with its own styles, so invoices always display in light mode (correct for print fidelity)
