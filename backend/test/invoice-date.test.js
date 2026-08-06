import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toIsoDate } from '../src/lib/invoiceDate.js';

describe('toIsoDate', () => {
  test('parses the canonical date-picker format', () => {
    assert.equal(toIsoDate('30 September, 2022'), '2022-09-30');
    assert.equal(toIsoDate('1 December, 2025'), '2025-12-01');
  });

  test('parses abbreviated month names', () => {
    assert.equal(toIsoDate('02 Jan, 2026'), '2026-01-02');
    assert.equal(toIsoDate('5 Mar, 2020'), '2020-03-05');
  });

  test('parses without the comma', () => {
    assert.equal(toIsoDate('30 September 2022'), '2022-09-30');
  });

  test('parses month-first ordering', () => {
    assert.equal(toIsoDate('September 30, 2022'), '2022-09-30');
    assert.equal(toIsoDate('Mar 5, 2020'), '2020-03-05');
  });

  test('is case insensitive and tolerates extra whitespace', () => {
    assert.equal(toIsoDate('  30  september ,  2022 '), '2022-09-30');
    assert.equal(toIsoDate('30 SEPTEMBER, 2022'), '2022-09-30');
  });

  test('passes an ISO date straight through, so running it twice is stable', () => {
    assert.equal(toIsoDate('2022-09-30'), '2022-09-30');
    assert.equal(toIsoDate(toIsoDate('30 September, 2022')), '2022-09-30');
  });

  test('returns null for empty input', () => {
    assert.equal(toIsoDate(''), null);
    assert.equal(toIsoDate('   '), null);
    assert.equal(toIsoDate(null), null);
    assert.equal(toIsoDate(undefined), null);
  });

  test('returns null rather than guessing at ambiguous numeric dates', () => {
    // Could be 1 February or 2 January depending on locale. Never guess.
    assert.equal(toIsoDate('01/02/2026'), null);
    assert.equal(toIsoDate('1-2-2026'), null);
  });

  test('returns null for text that is not a date', () => {
    assert.equal(toIsoDate('not a date'), null);
    assert.equal(toIsoDate('Q3 invoice'), null);
  });

  test('rejects impossible days', () => {
    assert.equal(toIsoDate('31 February, 2022'), null);
    assert.equal(toIsoDate('0 January, 2022'), null);
    assert.equal(toIsoDate('32 January, 2022'), null);
  });

  test('accepts a valid leap day', () => {
    assert.equal(toIsoDate('29 February, 2024'), '2024-02-29');
  });

  test('rejects a leap day in a non-leap year', () => {
    assert.equal(toIsoDate('29 February, 2023'), null);
  });
});
