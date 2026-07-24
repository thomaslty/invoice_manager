# pdf-cjk-fonts Specification

## Purpose
TBD - created by archiving change cjk-pdf-fonts-and-resizable-description. Update Purpose after archive.
## Requirements
### Requirement: CJK text renders in generated PDFs
Generated invoice PDFs SHALL render Chinese (and other CJK) characters as glyphs, not as missing-glyph boxes (tofu). This SHALL hold for any selected invoice font, because CJK fallback is provided at the container and template level rather than by per-invoice font selection.

#### Scenario: Chinese in an invoice with a Latin-oriented font
- **WHEN** an invoice contains Chinese characters and uses a Latin font (e.g. Arial)
- **THEN** the downloaded PDF shows the Chinese characters correctly
- **THEN** no empty boxes (□) appear in place of Chinese characters

#### Scenario: PDF matches preview for CJK content
- **WHEN** the live preview shows Chinese text correctly
- **THEN** the downloaded PDF shows the same Chinese text correctly

### Requirement: Template declares a CJK font fallback
The shared HTML template SHALL include a CJK font fallback in the body `font-family` chain so CJK codepoints resolve deterministically regardless of the primary selected font.

#### Scenario: Font-family chain includes CJK fallback
- **WHEN** the template renders an invoice
- **THEN** the body `font-family` chain includes a Noto CJK fallback family

