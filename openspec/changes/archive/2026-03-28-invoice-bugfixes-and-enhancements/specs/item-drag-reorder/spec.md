## ADDED Requirements

### Requirement: Drag-to-reorder items within a category
The system SHALL allow users to reorder line items within a category by dragging, using drag handles on each item row.

#### Scenario: User drags item to new position
- **WHEN** user drags item at position 2 to position 1 within a category
- **THEN** the items array is reordered so the dragged item is now first, and all row numbers update accordingly

#### Scenario: Drag is constrained to within a category
- **WHEN** user drags an item from category "Website"
- **THEN** the item can only be dropped within the "Website" category, not into "Infra" or other categories

### Requirement: Auto-computed row numbers
The system SHALL auto-compute the "No." column from the item's position in the array (index + 1), replacing the manual number input.

#### Scenario: Row numbers reflect array order
- **WHEN** a category has 3 items
- **THEN** the No. column displays 1, 2, 3 based on array position (not a stored field)

#### Scenario: Row numbers update after reorder
- **WHEN** user drags item 3 to position 1
- **THEN** the No. column updates to show the new order: the moved item is now 1, previous item 1 becomes 2, previous item 2 becomes 3

#### Scenario: Row numbers update after item deletion
- **WHEN** user deletes item 2 from a 3-item list
- **THEN** the remaining items show No. 1 and No. 2 (no gaps)

### Requirement: Drag handle UI
Each item row SHALL display a grip/drag handle icon as the leftmost element, replacing the editable No. input field.

#### Scenario: Drag handle is visible
- **WHEN** user views the items table
- **THEN** each row has a grip icon on the left that indicates the row is draggable

#### Scenario: No. column is read-only
- **WHEN** user views the items table
- **THEN** the No. column displays the auto-computed number as plain text (not an editable input)

### Requirement: Smooth drag animation without bounce-back
The drag-and-drop animation SHALL be smooth, with no visual bounce-back to the original position after dropping.

#### Scenario: Item drops smoothly into new position
- **WHEN** user drags item 2 above item 1 and releases
- **THEN** the item settles into its new position without visually bouncing back to position 2 first

#### Scenario: Drag is constrained to vertical axis
- **WHEN** user drags an item
- **THEN** the item only moves vertically (no horizontal drift), creating a tight table-row feel

### Requirement: Stable unique item identifiers
Each item SHALL have a stable unique ID that persists across reorders, ensuring React can efficiently move DOM nodes instead of remounting them.

#### Scenario: New items get unique IDs
- **WHEN** user clicks "Add Item"
- **THEN** the new item is assigned a unique ID (UUID) that does not change when items are reordered

#### Scenario: Existing items without IDs get assigned IDs on load
- **WHEN** an invoice with legacy items (no ID field) is loaded into the editor
- **THEN** each item is assigned a unique ID for the editing session

### Requirement: HTML template uses array index for numbering
The backend HTML template SHALL render item numbers based on array position (index + 1), ignoring any stored `no` field.

#### Scenario: PDF renders correct item numbers after reorder
- **WHEN** an invoice is saved after reordering items and exported to PDF
- **THEN** the PDF shows items numbered sequentially (1, 2, 3...) matching their saved order
