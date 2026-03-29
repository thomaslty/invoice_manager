# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Full dev stack (postgres + backend + frontend)
docker compose -f docker-compose.dev.yml up -d --build

# Backend (port 3000)
cd backend && npm run dev

# Frontend (port 5173, proxies /api to backend)
cd frontend && npm run dev

# Database migrations (NEVER write SQL by hand)
cd backend && npm run db:generate   # generate migration from schema changes
cd backend && npm run db:migrate    # apply migrations
cd backend && npm run db:seed       # seed default fonts

# Frontend
cd frontend && npm run build        # production build
cd frontend && npm run lint         # ESLint

# E2E tests (requires frontend + backend running)
cd e2e && npx playwright test --config playwright.config.js
```

## Git Rules

- Never add `Co-Authored-By` lines to commit messages
- Use `/commit-clean` for commits

## Package Rules

- **Frontend**: Use shadcn for all UI components. Do NOT install any third-party UI library. If a package is truly needed, ask the user for approval first — never install without explicit permission.
- **Backend**: Same rule — ask before adding new dependencies.
- shadcn config: style `radix-nova`, JSX (not TSX), lucide icons, `@/` path alias

## Architecture

**Monorepo** with independent `frontend/` and `backend/` packages (no npm workspaces, no root package.json).

### Backend: Express 5 + Drizzle ORM + PostgreSQL 18

Layered architecture: **Routes → Controllers → Services → DB**

- `backend/src/db/schema.js` — Drizzle schema (single source of truth for DB structure)
- `backend/src/templates/invoice-html.js` — shared HTML template for both preview and PDF generation
- `backend/src/services/pdfService.js` — Puppeteer (singleton browser instance, new page per PDF)
- File storage: signatures in `backend/uploads/`, local fonts in `backend/fonts/`

**Database migration rules**: Always modify `schema.js` and run `drizzle-kit generate` + `drizzle-kit migrate`. Never write raw SQL migration files. Drizzle Kit generates them from schema diffs.

**Extracted columns pattern**: When saving/updating invoices, `ref_no`, `client_name`, `date`, `total_amount` are extracted from `json_data` into indexed columns for search/sort/filter. The full invoice data lives in a `jsonb` column.

### Frontend: React 19 + Vite 7 + Tailwind CSS 4 + shadcn

- JavaScript only (no TypeScript)
- `frontend/src/lib/api.js` — API client for all backend endpoints
- `frontend/src/hooks/useInvoiceForm.js` — state management for the invoice editor
- Vite proxy: `/api`, `/uploads`, `/fonts` → `http://localhost:3000`

### E2E Tests: Playwright (in `e2e/`)

- ESM package (`"type": "module"`) — `node_modules` is a symlink to `frontend/node_modules`
- Tests run against `http://localhost:5173` — both frontend and backend must be running
- Test files: `invoice-editor.spec.js` (7 tests), `fonts.spec.js` (3 tests)

### Core Data Flow: Preview & PDF

Single source of truth: `backend/src/templates/invoice-html.js` renders a self-contained HTML string.

- **Live preview**: Frontend debounces edits (300ms), POSTs to `/api/preview`, gets HTML, sets iframe `srcdoc`
- **PDF download**: Backend loads invoice, renders same HTML, Puppeteer prints to PDF (A4, zero margins)

Both use the identical HTML template function — this guarantees preview matches PDF output.

### Data Model

Three core concepts sharing the same JSON schema (`json_data` column):
- **Template** — reusable skeleton (layout + defaults, no real data)
- **Invoice** — real invoice with actual data
- **Invoice Snapshot** — full copy of an invoice for cloning/renewal

The JSON shape has 7 toggleable sections: `header`, `metadata`, `items`, `paymentMethod`, `terms`, `signature`, `footer`. See `docs/plans/2026-03-09-invoice-manager-design.md` for the full schema.

FK ON DELETE policies: snapshots cascade on invoice delete, template_id and font_id set null on delete.

## Verification

- **Playwright MCP** is available — use it to verify frontend changes (navigate pages, evaluate DOM, check computed styles, take screenshots). Always save screenshots to `.playwright-mcp/` (e.g., `filename: ".playwright-mcp/my-screenshot.png"`)
- After CSS/layout changes, evaluate computed heights and overflow properties to confirm the fix works
- **E2E tests** — run after any frontend/backend change to catch regressions. Always add tests for new features.

## Gotchas

- **Flex height chains**: In nested flex-col containers, every level needs `min-h-0` to override the CSS default `min-height: auto` — otherwise children won't shrink below content size, breaking `overflow-hidden/auto`
- **shadcn SidebarInset** has no height constraint by default (`min-h-svh` on wrapper, no max) — pass `className="h-svh overflow-hidden"` to bound it
- **Preview base URLs**: Preview uses empty `baseUrl` (relative `/uploads/...` resolved by Vite proxy). PDF uses Docker-internal `baseUrl`. Never mix them — browser can't reach `http://backend:3000`.
- **Duplicate toasts in tests**: Actions like save-then-PDF produce multiple "Invoice saved" toasts. Use `.first()` in Playwright assertions.
- **DnD kit IDs**: Items need stable `crypto.randomUUID()` IDs, not index-based keys. Use `CSS.Translate` (not `CSS.Transform`) to avoid bounce-back from scale factors.

## Hidden UI (commented out, not removed)

- Templates sidebar nav item (`components/layout/Sidebar.jsx`)
- "Save as Snapshot" and "View Snapshots" in invoice dropdown (`components/dashboard/InvoiceTable.jsx`)
