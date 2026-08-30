import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrenchDate } from '../src/ugc/parseFrenchDate.js';

test('parses a well-formed French date', () => {
  assert.equal(parseFrenchDate('26 août 2026'), '2026-08-26');
  assert.equal(parseFrenchDate('5 janvier 2027'), '2027-01-05');
});

test('is case-insensitive and trims whitespace', () => {
  assert.equal(parseFrenchDate('  26 AOÛT 2026  '), '2026-08-26');
});

test('returns null for an unrecognized shape', () => {
  assert.equal(parseFrenchDate(''), null);
  assert.equal(parseFrenchDate('bientôt'), null);
  assert.equal(parseFrenchDate('26 blork 2026'), null);
});
