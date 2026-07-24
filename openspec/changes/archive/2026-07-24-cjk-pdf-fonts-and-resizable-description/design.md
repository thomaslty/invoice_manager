## Context

The invoice HTML template (`backend/src/templates/invoice-html.js`) is the single source of truth for both the live preview (iframe `srcdoc`, rendered by the user's browser) and the PDF (rendered by Puppeteer/Chromium inside the container). This split is why the CJK bug is preview-invisible but PDF-visible: the browser has CJK fonts, the container does not.

## Decision 1 — Fix CJK at the container + fallback level, not per-invoice

**Root cause:** `Dockerfile` installs only `fonts-liberation`. Chromium has no CJK glyphs → tofu.

**Chosen fix (two layers):**
1. `apt-get install fonts-noto-cjk` — gives Chromium the glyphs. This alone fixes rendering because browsers do per-glyph font fallback down the CSS chain and then to the system (fontconfig) default, which now includes Noto CJK.
2. Append `'Noto Sans CJK TC', 'Noto Sans CJK SC'` to the template's `font-family` chain — makes the fallback deterministic instead of relying on the last-resort `sans-serif` → fontconfig mapping.

**Why TC before SC:** the user is Hong Kong based (HKD, PingFang). For Han-unified codepoints, listing Traditional first yields the expected regional glyph variants; SC follows to cover Simplified-only characters. `fonts-noto-cjk` bundles SC/TC/HK/JP/KR, so both families resolve.

**Why not change the default font / seed a CJK font:** the container fallback fixes *every* invoice (existing and new) under *any* selected font, with zero data migration. `seed.js` is idempotent (skips when fonts exist), so a seeded entry would only reach fresh installs — inconsistent, and unnecessary for the fix. Rejected as out of scope.

**Alternatives considered:** hardcoding a single CJK family (breaks SC/TC variant selection); embedding a web font via `@font-face` (huge file, slow, unnecessary when the OS font is available to Chromium).

## Decision 2 — Textarea with vertical resize + `pre-line` rendering

**Frontend:** the shadcn `<Textarea>` already ships `field-sizing-content` (auto-grow) and `min-h-16`. Swap `<Input>` → `<Textarea>`, add `resize-y` for manual drag. Horizontal resize is excluded: the description column has no fixed width and `resize: both` would let the field overflow the cell and distort the table.

**Rendering newlines:** `esc()` preserves `\n` (it only escapes `& < > "`), but HTML collapses whitespace by default, so newlines render as single spaces in preview and PDF. Setting `white-space: pre-line` on `.col-desc` makes saved newlines render as line breaks. `.item-row td` already has `vertical-align: top`, so multi-line rows align cleanly.

**No data-shape change:** `item.description` stays a string; multi-line is just embedded `\n`. Existing single-line invoices are unaffected.

## Risks

- **SC/TC variant mismatch:** an invoice with Simplified-only content while TC is listed first — acceptable; Noto still renders the glyph, only the unified-Han style preference differs. Verified visually.
- **Image size:** `fonts-noto-cjk` adds ~few hundred MB to the image. Acceptable for correct rendering; it is the standard package for this need.
