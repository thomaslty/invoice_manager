## ADDED Requirements

### Requirement: Signature image visible in live preview
The live preview iframe SHALL display uploaded signature images correctly.

#### Scenario: Uploaded signature appears in preview
- **WHEN** user uploads a signature image via the editor form
- **THEN** the signature image is visible in the preview iframe (not a broken image icon)

#### Scenario: Signature uses browser-resolvable URL in preview
- **WHEN** the backend generates preview HTML
- **THEN** signature image URLs are relative paths (e.g., `/uploads/sig-xxx.png`) that the browser can resolve via the Vite proxy or reverse proxy

#### Scenario: Signature uses absolute URL in PDF
- **WHEN** the backend generates HTML for Puppeteer PDF rendering
- **THEN** signature image URLs are absolute paths with the Docker-internal hostname (e.g., `http://backend:3000/uploads/sig-xxx.png`) so Puppeteer can fetch them
