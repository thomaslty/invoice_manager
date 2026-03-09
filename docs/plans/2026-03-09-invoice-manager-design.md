# Invoice Manager — Feature Design

## Overview

Invoice management app: create invoices from templates, edit, save snapshots for cloning, download as PDF, and manage fonts. Single-user, no auth for MVP.

## Core Concepts

- **Template**: Reusable skeleton — layout, toggleable sections, placeholder text, default values. No real data.
- **Invoice**: A real invoice with actual client/item data.
- **Invoice Snapshot**: A full copy of a completed invoice that can be cloned to quickly create renewals without re-filling.

## Data Model

### JSON Data Shape (shared by templates, invoices, snapshots)

```js
{
  sections: {
    header: { visible: true, title: "INVOICE" },
    metadata: {
      visible: true,
      fields: {
        date: "",
        refNo: "",
        client: "",
        contactPerson: "",
        jobTitle: ""
      }
    },
    items: {
      visible: true,
      currency: "HK$",
      categories: [
        {
          name: "",
          items: [
            { no: 1, description: "", qty: 1, total: 0 }
          ]
        }
      ]
    },
    paymentMethod: { visible: true, content: "" },
    terms: { visible: true, content: "" },
    signature: {
      visible: true,
      label: "For and on behalf of",
      imageUrl: "",
      name: "",
      title: ""
    },
    footer: { visible: true, content: "" }
  }
}
```

### DB Tables

**`fonts`**

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | varchar(255) | display name, e.g. "Geist" |
| family | varchar(255) | CSS font-family value |
| source | varchar(20) | `system` / `remote` / `local` |
| file_path | text nullable | local path, e.g. `/fonts/MyFont.woff2` |
| url | text nullable | remote URL, e.g. Google Fonts CSS URL |
| created_at | timestamp | default now() |

**`templates`**

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | varchar(255) | template display name |
| font_id | integer FK | references fonts |
| json_data | jsonb | full template JSON |
| created_at | timestamp | default now() |
| updated_at | timestamp | default now() |

**`invoices`**

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| template_id | integer FK nullable | template used to create this |
| font_id | integer FK | inherited from template, overridable |
| ref_no | varchar(100) indexed | for search/filter |
| client_name | varchar(255) indexed | extracted from JSON for search |
| date | date indexed | invoice date, for sort/filter |
| total_amount | numeric(12,2) | grand total, for sort |
| json_data | jsonb | full invoice JSON |
| created_at | timestamp | default now() |
| updated_at | timestamp | default now() |

**`invoice_snapshots`**

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| invoice_id | integer FK | source invoice |
| name | varchar(255) | user-given name |
| font_id | integer FK | font at time of snapshot |
| json_data | jsonb | full copy of invoice JSON |
| created_at | timestamp | default now() |

## API Design

### Fonts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/fonts` | List all available fonts |
| GET | `/api/fonts/:id` | Get single font |
| POST | `/api/fonts` | Register a font (remote URL or system) |
| POST | `/api/fonts/upload` | Upload a local font file (.woff2, .ttf, .otf) |
| DELETE | `/api/fonts/:id` | Remove a font (and local file if applicable) |

### Templates

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:id` | Get single template |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

### Invoices

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/invoices` | List invoices (`?search=`, `?sort=`, `?filter=`) |
| GET | `/api/invoices/:id` | Get single invoice |
| POST | `/api/invoices` | Create invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/invoices/:id/pdf` | Download invoice as PDF |

### Invoice Snapshots

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/invoices/:id/snapshots` | List snapshots for an invoice |
| POST | `/api/invoices/:id/snapshots` | Save current invoice as snapshot |
| GET | `/api/snapshots/:id` | Get a snapshot |
| DELETE | `/api/snapshots/:id` | Delete a snapshot |
| POST | `/api/snapshots/:id/clone` | Clone snapshot into a new invoice |

### Preview & Uploads

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/preview` | Accepts invoice JSON, returns rendered HTML |
| POST | `/api/uploads/signature` | Upload signature image, returns URL |

## Frontend Architecture

### Screens

1. **Dashboard (Invoice List)** — default landing page
   - Searchable, sortable, filterable table
   - Columns: Ref No, Client, Job Title, Date, Total Amount, Actions
   - Search: free-text across ref_no, client_name
   - Sort: clickable column headers
   - Filter: date range
   - Actions: Edit, Download PDF, Delete, Save as Snapshot
   - "New Invoice" button — pick template or blank
   - Snapshot browser for cloning

2. **Template List**
   - Card grid or table
   - Actions: Edit, Delete, Duplicate
   - "New Template" button

3. **Create/Edit Invoice (Split Screen)**
   - Left half: form editor with collapsible sections
     - Header: title input
     - Metadata: date picker, ref no, client, contact person, job title
     - Items: category groups with add/remove rows, auto subtotals + grand total
     - Payment Method: textarea
     - Terms: textarea
     - Signature: image upload + name + title
     - Footer: text input
     - Font selector dropdown
     - Section visibility toggles
   - Right half: live preview
     - iframe rendering same HTML used for PDF
     - Debounced updates (300ms)
     - Scaled A4 paper look

4. **Create/Edit Template (Split Screen)**
   - Same layout as invoice editor
   - Fields contain placeholder/example text
   - Section visibility toggles as primary config

5. **Font Management**
   - Grid of font cards
   - Editable preview text (like Google Fonts)
   - Each card: font name, source badge, sample text in that font
   - Add font: upload file or paste remote URL
   - Delete with confirmation

### Component Structure

```
src/
  pages/
    DashboardPage.jsx
    TemplateListPage.jsx
    InvoiceEditorPage.jsx
    TemplateEditorPage.jsx
    FontManagementPage.jsx
  components/
    layout/
      AppLayout.jsx
      Sidebar.jsx
    invoice/
      InvoiceForm.jsx
      InvoicePreview.jsx
      SectionToggle.jsx
      MetadataFields.jsx
      ItemsTable.jsx
      SignatureUpload.jsx
    dashboard/
      InvoiceTable.jsx
      SnapshotList.jsx
    templates/
      TemplateCard.jsx
    fonts/
      FontCard.jsx
      FontUploadDialog.jsx
    ui/
      (shadcn components)
```

## Backend Architecture

```
src/
  index.js
  routes/
    index.js
    invoices.js
    templates.js
    snapshots.js
    fonts.js
    preview.js
    uploads.js
  controllers/
    invoicesController.js
    templatesController.js
    snapshotsController.js
    fontsController.js
    previewController.js
    uploadsController.js
  services/
    invoiceService.js
    templateService.js
    snapshotService.js
    fontService.js
    pdfService.js
    previewService.js
  db/
    index.js
    schema.js
  templates/
    invoice-html.js
  uploads/
  fonts/
```

### Key Decisions

- Routes → Controllers → Services → DB layer separation
- Puppeteer: launch once on server start, reuse browser instance, new page per PDF
- File storage: signatures in `./uploads/`, local fonts in `./fonts/`, served via Express static
- Extracted columns: on save/update, extract ref_no, client_name, date, total_amount from JSON to indexed columns
- No validation library for MVP — manual validation in controllers

## PDF Generation & Preview

### Single Source of Truth

`backend/src/templates/invoice-html.js` — a function taking `{ jsonData, fontInfo }` returning a complete HTML string with inline CSS.

### Preview Flow

1. User edits form field
2. Frontend debounces (300ms), calls `POST /api/preview` with current JSON
3. Backend renders HTML using shared template function
4. Frontend updates iframe `srcdoc`

### PDF Download Flow

1. User clicks "Download PDF"
2. `GET /api/invoices/:id/pdf`
3. Backend loads invoice, renders HTML via shared template
4. Puppeteer prints to PDF (A4)
5. Returns PDF as `Content-Disposition: attachment`

### Font Loading

- Local fonts: embedded as base64 data URIs in `@font-face`
- Remote fonts: loaded via URL in `@font-face`
- System fonts: just referenced by CSS family name

## Tech Constraints

- No additional packages beyond shadcn components on frontend
- JavaScript only (no TypeScript)
- Drizzle ORM for all DB operations
- PostgreSQL 18
- No auth for MVP
- Default currency: HK$
- Sections are toggleable (show/hide) per template, not reorderable
