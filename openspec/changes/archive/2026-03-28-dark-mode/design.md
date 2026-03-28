## Context

The frontend already has complete light and dark CSS variable sets in `index.css` (`:root` and `.dark` selectors) and the Tailwind `@custom-variant dark (&:is(.dark *))` directive. All shadcn components use semantic CSS variables, so they'll respond automatically to a `.dark` class on `<html>`. What's missing is the runtime mechanism to toggle that class and persist the user's preference.

The official shadcn dark mode guide for Vite provides a well-established pattern: a React context provider that manages the class on `document.documentElement` and persists to `localStorage`.

## Goals / Non-Goals

**Goals:**
- Let users switch between Light, Dark, and System themes
- Persist theme preference across sessions via `localStorage`
- Place the toggle in the sidebar footer so it's accessible but unobtrusive
- Follow the official shadcn/Vite dark mode pattern exactly

**Non-Goals:**
- Per-page or per-component theme overrides
- Theming the invoice preview iframe (it must stay light for print fidelity)
- Custom color themes beyond light/dark
- Server-side theme detection or persistence

## Decisions

### 1. Follow the official shadcn ThemeProvider pattern
**Choice**: Use a React context provider that adds/removes `.dark` on `<html>`, with `localStorage` persistence and system preference detection via `matchMedia`.

**Why**: This is the documented approach from shadcn for Vite projects. It's minimal, well-understood, and works with the existing CSS variable setup. No reason to deviate.

### 2. Place toggle in SidebarFooter
**Choice**: Use the shadcn `SidebarFooter` component at the bottom of the sidebar to house the mode toggle.

**Alternatives considered**:
- Top bar / header — the app has no top bar; adding one just for a theme toggle is excessive
- Settings page — too hidden for a frequently-toggled preference
- Sidebar header — already has the title and collapse button, would be cramped

**Why**: The sidebar footer is a standard location for secondary controls. It's always visible, doesn't compete with navigation, and degrades gracefully when the sidebar is collapsed (shows just the icon button).

### 3. Dropdown toggle (Light / Dark / System)
**Choice**: Use a `DropdownMenu` triggered by a Sun/Moon icon `Button`, with three options.

**Why**: The shadcn guide uses this pattern. It gives users the "System" option which respects OS-level preference — important for users who switch between light/dark based on time of day.

### 4. Default theme: "system"
**Choice**: Default to `"system"` (follow OS preference) rather than forcing light or dark.

**Why**: Respects user's existing OS setting. First-time visitors get the theme their OS is set to. Can be overridden with one click.

### 5. ThemeProvider wraps at App level, inside BrowserRouter
**Choice**: Wrap in `App.jsx` around the route structure, not in `main.jsx`.

**Why**: The ThemeProvider doesn't need router context and the router doesn't need theme context. Placing it in `App.jsx` keeps `main.jsx` focused on React/router bootstrap and puts the provider close to the components that use it.

## Risks / Trade-offs

- **FOUC (Flash of Unstyled Content)**: On first load, there may be a brief flash of the default theme before JS hydrates and applies the stored preference. → Acceptable for this app (internal tool, not public-facing). Could be mitigated later with an inline `<script>` in `index.html` if needed.
- **Invoice preview isolation**: The iframe uses self-contained HTML with inline styles, so dark mode won't affect it. → This is desired behavior (print fidelity), but users might initially wonder why the preview doesn't go dark. No action needed.
