import path from 'path';

/**
 * Build a safe on-disk filename for an uploaded file.
 *
 * Never trusts the uploaded base name: that avoids mojibake from non-ASCII
 * `originalname` (busboy decodes it as latin1) and path traversal via `../`.
 * Only a sanitized, lowercased extension is preserved.
 *
 * @param {string} prefix       - e.g. 'sig-' or ''
 * @param {string} originalname - the uploaded file's original name (untrusted)
 * @param {string} fallbackExt  - extension to use when none is valid, e.g. '.png'
 * @param {number} [now]        - timestamp (injectable for tests)
 * @returns {string} an ASCII-only filename with no slashes or '..'
 */
export function safeUploadFilename(prefix, originalname, fallbackExt, now = Date.now()) {
  const ext = path.extname(originalname || '').toLowerCase();
  const safeExt = /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : fallbackExt;
  return `${prefix}${now}${safeExt}`;
}
