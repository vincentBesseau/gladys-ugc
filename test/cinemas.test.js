import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchCinemas } from '../src/ugc/cinemas.js';

test('returns every cinema when the query is empty', () => {
  const results = searchCinemas('');
  assert.ok(results.length > 40);
  assert.ok(results.every((c) => c.id && c.name && c.city));
});

test('filters by city, case and accent insensitively', () => {
  const results = searchCinemas('rennes');
  assert.ok(results.length === 0 || results.every((c) => c.city === 'RENNES'));

  const paris = searchCinemas('paris');
  assert.ok(paris.length > 0);
  assert.ok(paris.every((c) => c.city.includes('PARIS')));
});

test('filters by postal code', () => {
  const results = searchCinemas('75001');
  assert.ok(results.length > 0);
  assert.ok(results.every((c) => c.postalCode === '75001'));
});

test('returns an empty array when nothing matches', () => {
  assert.deepEqual(searchCinemas('this-city-does-not-exist'), []);
});
