-- Convert invoices.date from the displayed format ("30 September, 2022") to an
-- ISO sort key ("2022-09-30").
--
-- invoices.date is a derived column: extractFields recomputes it from json_data
-- on every save. Storing the display string there made SQLite order the Date
-- column as text, which sorts by day-of-month first and then by month name
-- alphabetically, and made the dashboard From/To filter compare ISO input
-- against display text. This restores real chronological order.
--
-- json_data is not read or written here. The display string stays exactly as it
-- is, so the preview and the PDF are unchanged, and any row can be re-derived
-- from json_data later if this conversion ever needs correcting.
--
-- Safety: rows that cannot be read without guessing keep their existing value.
-- Purely numeric dates such as "01/02/2026" are skipped on purpose — there is no
-- way to tell 1 February from 2 January. Nothing is ever set to NULL, and rows
-- already in ISO form are excluded, so re-running this changes nothing.
--
-- This mirrors backend/src/lib/invoiceDate.js, which does the same conversion at
-- save time. test/date-backfill.test.js asserts the two agree.

WITH src AS (
	SELECT id, trim(date) AS raw
	FROM invoices
	WHERE date IS NOT NULL
		AND trim(date) <> ''
		AND instr(trim(date), ' ') > 0
		-- Already migrated.
		AND trim(date) NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
),
parts AS (
	SELECT
		id,
		substr(raw, 1, instr(raw, ' ') - 1) AS day_part,
		lower(substr(ltrim(substr(raw, instr(raw, ' ') + 1)), 1, 3)) AS mon_abbr,
		substr(raw, -4) AS year_part
	FROM src
),
parsed AS (
	SELECT
		id,
		day_part,
		year_part,
		CASE mon_abbr
			WHEN 'jan' THEN '01'
			WHEN 'feb' THEN '02'
			WHEN 'mar' THEN '03'
			WHEN 'apr' THEN '04'
			WHEN 'may' THEN '05'
			WHEN 'jun' THEN '06'
			WHEN 'jul' THEN '07'
			WHEN 'aug' THEN '08'
			WHEN 'sep' THEN '09'
			WHEN 'oct' THEN '10'
			WHEN 'nov' THEN '11'
			WHEN 'dec' THEN '12'
		END AS month_num
	FROM parts
),
candidate AS (
	SELECT
		id,
		year_part || '-' || month_num || '-' || printf('%02d', CAST(day_part AS INTEGER)) AS iso
	FROM parsed
	WHERE month_num IS NOT NULL
		AND year_part GLOB '[0-9][0-9][0-9][0-9]'
		AND (day_part GLOB '[0-9]' OR day_part GLOB '[0-9][0-9]')
)
UPDATE invoices
SET date = candidate.iso
FROM candidate
WHERE invoices.id = candidate.id
	-- date() normalises impossible dates ("2022-02-31" becomes "2022-03-03"),
	-- so a value that survives unchanged is a real calendar date.
	AND date(candidate.iso) = candidate.iso;
