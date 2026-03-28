## ADDED Requirements

### Requirement: E2E test for complete invoice form fill
The test suite SHALL include a test that fills all invoice form fields and verifies they appear in the preview.

#### Scenario: Fill metadata and verify preview
- **WHEN** the test fills in date, ref no., client, contact person, and job title
- **THEN** the preview iframe HTML contains all entered metadata values

#### Scenario: Add items with categories and verify totals
- **WHEN** the test adds two categories ("Website" with items Frontend=$100 and Backend=$100, "Infra" with item Hosting=$100)
- **THEN** the preview shows subtotals of $200 and $100, and grand total of $300

#### Scenario: Fill payment method and terms
- **WHEN** the test fills in payment method and terms fields
- **THEN** the preview iframe HTML contains the entered payment and terms text

### Requirement: E2E test for signature upload
The test suite SHALL verify that a signature image can be uploaded and appears in the preview.

#### Scenario: Upload signature image
- **WHEN** the test uploads an image file via the signature upload area
- **THEN** the signature image appears in the form and in the preview iframe

### Requirement: E2E test for save and reload
The test suite SHALL verify that saving an invoice persists all data.

#### Scenario: Save new invoice
- **WHEN** the test fills out an invoice and clicks Save
- **THEN** the URL changes to `/invoices/:id/edit` and a success toast appears

#### Scenario: Reload saved invoice
- **WHEN** the test navigates away and returns to the saved invoice
- **THEN** all previously entered data is present in the form

### Requirement: E2E test for PDF download
The test suite SHALL verify that a saved invoice can be downloaded as a PDF with correct content.

#### Scenario: Download PDF and verify content
- **WHEN** the test clicks the PDF download button for a saved invoice
- **THEN** a valid PDF file is downloaded containing the invoice metadata, item totals, and grand total

### Requirement: E2E test for save validation
The test suite SHALL verify that validation errors prevent saving invalid invoices.

#### Scenario: Attempt save with empty required fields
- **WHEN** the test clicks Save on a new invoice without filling required fields
- **THEN** toast error messages appear and the invoice is NOT saved (URL remains `/invoices/new`)

### Requirement: E2E test for drag reorder
The test suite SHALL verify that items can be reordered via drag-and-drop and the new order persists.

#### Scenario: Drag item to new position and verify numbering
- **WHEN** the test drags item 2 above item 1 in a category
- **THEN** the item descriptions swap positions and row numbers update to reflect the new order
