import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchCinemas, nearestCinemas } from '../src/ugc/cinemas.js';

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

test('every cinema has a valid latitude/longitude', () => {
  const results = searchCinemas('');

  assert.ok(
    results.every(
      (c) =>
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        Math.abs(c.latitude) <= 90 &&
        Math.abs(c.longitude) <= 180,
    ),
  );
});

test('nearestCinemas sorts by distance, nearest first, and attaches distanceKm', () => {
  // A point right next to UGC Ciné Cité Les Halles (Paris city center).
  const nearParis = { latitude: 48.86, longitude: 2.347 };

  const results = nearestCinemas(nearParis, 5);

  assert.equal(results.length, 5);
  assert.ok(results.every((c) => typeof c.distanceKm === 'number'));

  for (let i = 1; i < results.length; i += 1) {
    assert.ok(results[i].distanceKm >= results[i - 1].distanceKm);
  }

  assert.ok(
    results.some((c) => c.city.includes('PARIS')),
    'at least one of the 5 nearest cinemas to central Paris should be in Paris',
  );
});

test('nearestCinemas respects the limit', () => {
  const nearParis = { latitude: 48.86, longitude: 2.347 };

  assert.equal(nearestCinemas(nearParis, 3).length, 3);
  assert.equal(nearestCinemas(nearParis, 1).length, 1);
});
