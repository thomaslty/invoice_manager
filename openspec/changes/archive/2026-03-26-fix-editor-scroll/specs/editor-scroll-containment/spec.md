## ADDED Requirements

### Requirement: Editor page scroll is contained to the left panel only
The invoice editor page SHALL constrain scrolling to the left editor panel. The page-level scrollbar SHALL NOT appear when the editor content exceeds the viewport height. The right PDF preview panel SHALL remain fixed in position.

#### Scenario: Scrolling with many line items
- **WHEN** the user adds enough invoice items to exceed the viewport height
- **THEN** only the left editor panel shows a scrollbar and scrolls
- **THEN** the right PDF preview panel does not move

#### Scenario: Preview stays visible while scrolling editor
- **WHEN** the user scrolls to the bottom of the editor form
- **THEN** the PDF preview iframe remains visible at the top of the right panel
- **THEN** no empty white space appears below the preview iframe

### Requirement: Other pages remain unaffected
The layout changes SHALL NOT break scroll behavior on other pages (Dashboard, Templates, Fonts). Pages with content taller than the viewport SHALL still be scrollable.

#### Scenario: Dashboard page with many invoices
- **WHEN** the dashboard has enough rows to exceed the viewport height
- **THEN** the page content scrolls normally within the main area
