import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, validateConfig } from '../src/config.js';

test('normalizeConfig trims and defaults cinema_id', () => {
  assert.deepEqual(normalizeConfig(), { cinema_id: '', day_offset: 0 });
  assert.deepEqual(normalizeConfig({ cinema_id: ' 10 ' }), { cinema_id: '10', day_offset: 0 });
});

test('normalizeConfig accepts an allowed day_offset', () => {
  assert.equal(normalizeConfig({ day_offset: '1' }).day_offset, 1);
  assert.equal(normalizeConfig({ day_offset: '7' }).day_offset, 7);
});

test('normalizeConfig falls back to 0 for an unsupported day_offset', () => {
  assert.equal(normalizeConfig({ day_offset: '3' }).day_offset, 0);
  assert.equal(normalizeConfig({ day_offset: 'not-a-number' }).day_offset, 0);
});

test('validateConfig throws when cinema_id is empty', () => {
  assert.throws(() => validateConfig({ cinema_id: '' }), /Find my cinema/);
});

test('validateConfig throws when cinema_id is not numeric', () => {
  assert.throws(() => validateConfig({ cinema_id: 'abc' }), /must be numeric/);
});

test('validateConfig accepts a numeric cinema_id', () => {
  assert.doesNotThrow(() => validateConfig({ cinema_id: '10' }));
});
