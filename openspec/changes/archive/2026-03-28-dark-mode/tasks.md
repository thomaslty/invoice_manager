## 1. Theme Provider

- [x] 1.1 Create `frontend/src/components/theme-provider.jsx` with ThemeProvider context, useTheme hook, localStorage persistence, and system preference detection via matchMedia
- [x] 1.2 Wrap app tree with `<ThemeProvider defaultTheme="system">` in `frontend/src/App.jsx`

## 2. Mode Toggle

- [x] 2.1 Create `frontend/src/components/mode-toggle.jsx` with Sun/Moon icon button and dropdown menu (Light / Dark / System options)
- [x] 2.2 Add `SidebarFooter` to `frontend/src/components/layout/Sidebar.jsx` with the mode toggle, ensuring it works in both expanded and collapsed sidebar states

## 3. Verification

- [x] 3.1 Verify dark mode toggles correctly (light, dark, system) and persists across page reload
- [x] 3.2 Verify invoice preview iframe remains unaffected by dark mode
- [x] 3.3 Verify sidebar toggle works in both expanded and collapsed states
