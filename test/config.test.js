import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, validateConfig } from '../src/config.js';

test('normalizeConfig trims and defaults cinema_id', () => {
  assert.deepEqual(normalizeConfig(), { cinema_id: '' });
  assert.deepEqual(normalizeConfig({ cinema_id: ' 10 ' }), { cinema_id: '10' });
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
