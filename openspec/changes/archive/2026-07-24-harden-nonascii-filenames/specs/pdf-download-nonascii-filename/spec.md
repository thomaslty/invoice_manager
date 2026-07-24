## ADDED Requirements

### Requirement: PDF download supports non-ASCII reference numbers
Downloading an invoice PDF SHALL succeed when the invoice reference number contains non-ASCII characters, and SHALL NOT fail with an invalid-header error.

#### Scenario: Download PDF for an invoice with a Chinese reference number
- **WHEN** the user downloads the PDF of an invoice whose reference number contains Chinese characters
- **THEN** the response is a valid PDF (HTTP 200), not a 500 error
- **THEN** the `Content-Disposition` header value contains only ASCII characters

#### Scenario: Original filename preserved for capable clients
- **WHEN** the reference number contains non-ASCII characters
- **THEN** the `Content-Disposition` header includes an ASCII `filename="..."` fallback
- **THEN** it also includes a `filename*=UTF-8''` parameter encoding the original name
