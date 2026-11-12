import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, validateConfig, resolveWidgetCinema } from '../src/config.js';

test('normalizeConfig reads the default cinema (slot 1 keeps the historical keys)', () => {
  assert.deepEqual(normalizeConfig(), { cinema_id: '', cinemas: [] });
  assert.deepEqual(normalizeConfig({ cinema_id: ' 10 ', cinema_name: ' Les Halles ' }), {
    cinema_id: '10',
    cinemas: [{ id: '10', name: 'Les Halles' }],
  });
});

test('normalizeConfig collects up to five cinemas in slot order, skipping empty slots', () => {
  const config = normalizeConfig({
    cinema_id: '10',
    cinema_name: 'One',
    cinema_id_2: '',
    cinema_id_3: '42',
    cinema_name_3: 'Three',
  });

  assert.equal(config.cinema_id, '10');
  assert.deepEqual(config.cinemas, [
    { id: '10', name: 'One' },
    { id: '42', name: 'Three' },
  ]);
});

test('validateConfig throws when no cinema is set', () => {
  assert.throws(() => validateConfig({ cinema_id: '', cinemas: [] }), /Find my cinema/);
});

test('validateConfig rejects any non-numeric cinema id', () => {
  assert.throws(() => validateConfig({ cinema_id: 'abc' }), /must be numeric/);
  assert.throws(
    () =>
      validateConfig({
        cinema_id: '10',
        cinemas: [
          { id: '10', name: '' },
          { id: 'abc', name: '' },
        ],
      }),
    /must be numeric/,
  );
});

test('validateConfig accepts numeric cinema ids', () => {
  assert.doesNotThrow(() => validateConfig({ cinema_id: '10' }));
  assert.doesNotThrow(() =>
    validateConfig({
      cinema_id: '10',
      cinemas: [
        { id: '10', name: '' },
        { id: '42', name: '' },
      ],
    }),
  );
});

test('resolveWidgetCinema picks the cinema at the selected slot', () => {
  const config = normalizeConfig({
    cinema_id: '10',
    cinema_name: 'One',
    cinema_id_2: '42',
    cinema_name_2: 'Two',
  });

  assert.deepEqual(resolveWidgetCinema(config, { cinema: '2' }), { id: '42', name: 'Two' });
});

test('resolveWidgetCinema falls back to the first cinema when the slot is missing or out of range', () => {
  const config = normalizeConfig({ cinema_id: '10', cinema_name: 'One', cinema_id_2: '42' });

  assert.deepEqual(resolveWidgetCinema(config, {}), { id: '10', name: 'One' });
  assert.deepEqual(resolveWidgetCinema(config, { cinema: '5' }), { id: '10', name: 'One' });
  assert.deepEqual(resolveWidgetCinema(config), { id: '10', name: 'One' });
});
