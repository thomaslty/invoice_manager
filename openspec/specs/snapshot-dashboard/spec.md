## ADDED Requirements

### Requirement: Snapshot dashboard page
The system SHALL provide a Snapshot dashboard page at `/snapshots` that lists all snapshots belonging to the authenticated user across all invoices.

#### Scenario: View all snapshots
- **WHEN** a user navigates to `/snapshots`
- **THEN** the system SHALL display a table with columns: Snapshot Name, Invoice Ref, Client, Created Date, and Actions

#### Scenario: Empty state
- **WHEN** a user has no snapshots
- **THEN** the system SHALL display an empty state message

### Requirement: Snapshot dashboard actions
Each snapshot row SHALL provide actions: View, Clone to Invoice, and Delete.

#### Scenario: View snapshot
- **WHEN** user clicks View on a snapshot
- **THEN** the system SHALL navigate to `/snapshots/:id` showing the read-only viewer

#### Scenario: Clone snapshot to invoice
- **WHEN** user clicks Clone to Invoice on a snapshot
- **THEN** the system SHALL create a new invoice from the snapshot data and navigate to the invoice editor

#### Scenario: Delete snapshot
- **WHEN** user clicks Delete on a snapshot
- **THEN** the system SHALL show a confirmation dialog and delete the snapshot upon confirmation

### Requirement: Snapshots sidebar navigation
The sidebar SHALL include a "Snapshots" navigation item linking to `/snapshots`.

#### Scenario: Sidebar displays Snapshots link
- **WHEN** the sidebar is rendered
- **THEN** it SHALL display navigation items for Invoices, Templates, Snapshots, and Fonts

### Requirement: Templates sidebar navigation
The sidebar SHALL include a "Templates" navigation item linking to `/templates`.

#### Scenario: Sidebar displays Templates link
- **WHEN** the sidebar is rendered
- **THEN** the Templates navigation item SHALL be visible and functional

### Requirement: Invoice table snapshot actions
The invoice table dropdown menu SHALL include "Save as Snapshot" and "View Snapshots" actions.

#### Scenario: Save as snapshot
- **WHEN** user clicks "Save as Snapshot" from the invoice actions dropdown
- **THEN** the system SHALL show a dialog to name and save a snapshot of that invoice

#### Scenario: View snapshots
- **WHEN** user clicks "View Snapshots" from the invoice actions dropdown
- **THEN** the system SHALL show the existing snapshot list modal for that invoice
