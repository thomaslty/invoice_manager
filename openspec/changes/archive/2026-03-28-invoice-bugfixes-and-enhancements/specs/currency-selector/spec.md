## ADDED Requirements

### Requirement: Currency selection via dropdown
The system SHALL provide a dropdown selector for currency instead of a free-text input. The dropdown SHALL include the options: HKD (HK$), USD (US$), RMB (¥).

#### Scenario: User selects currency from dropdown
- **WHEN** user opens the currency selector in the items section
- **THEN** the system displays a dropdown with options: "HKD - Hong Kong Dollar", "USD - US Dollar", "RMB - Renminbi"

#### Scenario: Selected currency is stored as code
- **WHEN** user selects "HKD - Hong Kong Dollar" from the dropdown
- **THEN** the value `"HKD"` is stored in `json_data.sections.items.currency`

#### Scenario: Currency symbol renders correctly in preview
- **WHEN** an invoice has currency code `"HKD"` and an item with total `100`
- **THEN** the preview renders the amount as `HK$100.00`

#### Scenario: Currency symbol renders correctly in PDF
- **WHEN** an invoice has currency code `"USD"` and an item with total `250`
- **THEN** the PDF renders the amount as `US$250.00`

### Requirement: Currency formatting produces correct amounts
The `formatCurrency` function SHALL look up the display symbol from the currency code and format as `{symbol}{number}` with 2 decimal places and locale-appropriate thousand separators.

#### Scenario: Single item total formatting
- **WHEN** an item has total `100` and currency is `"HKD"`
- **THEN** the rendered amount is `HK$100.00` (not `HKD$300100.00` or any other malformed value)

#### Scenario: Subtotal formatting with multiple items
- **WHEN** a category has items with totals `100` and `100`, currency is `"HKD"`
- **THEN** the subtotal renders as `HK$200.00`

#### Scenario: Grand total formatting
- **WHEN** all items across categories sum to `300`, currency is `"HKD"`
- **THEN** the grand total renders as `HK$300.00`

#### Scenario: Large amount formatting with thousand separators
- **WHEN** an item has total `50000` and currency is `"USD"`
- **THEN** the rendered amount is `US$50,000.00`

### Requirement: Backward compatibility with legacy currency values
The system SHALL handle invoices that store the old format (e.g., `"HK$"`) by treating unrecognized values as literal display symbols.

#### Scenario: Legacy invoice with symbol-based currency
- **WHEN** an existing invoice has currency `"HK$"` (old format)
- **THEN** the system renders amounts using `HK$` as the symbol without error

### Requirement: Subtotal display for named categories
The system SHALL display a subtotal row for every category that has a non-empty name, regardless of the total number of categories.

#### Scenario: Single named category shows subtotal
- **WHEN** an invoice has one category named "Website" with items totaling `200`
- **THEN** a subtotal row reading `HK$200.00` appears below the category items

#### Scenario: Single unnamed category hides subtotal
- **WHEN** an invoice has one category with no name and items totaling `200`
- **THEN** no subtotal row is displayed (grand total suffices)

#### Scenario: Multiple named categories each show subtotals
- **WHEN** an invoice has categories "Website" (total `200`) and "Infra" (total `100`)
- **THEN** each category has its own subtotal row, and the grand total shows `300`
