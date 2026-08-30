const ALLOWED_DAY_OFFSETS = [0, 1, 7];
const DEFAULT_DAY_OFFSET = 0;

const DEFAULTS = Object.freeze({
  cinema_id: '',
  day_offset: DEFAULT_DAY_OFFSET,
});

export function normalizeConfig(input = {}) {
  const dayOffset = Number(input.day_offset);

  return {
    cinema_id: String(input.cinema_id ?? DEFAULTS.cinema_id).trim(),
    day_offset: ALLOWED_DAY_OFFSETS.includes(dayOffset) ? dayOffset : DEFAULT_DAY_OFFSET,
  };
}

export function validateConfig(config) {
  if (!config.cinema_id) {
    throw new Error('Run the "Find my cinema" action and set a cinema ID.');
  }

  if (!/^\d+$/.test(config.cinema_id)) {
    throw new Error('Cinema ID must be numeric (see the "Find my cinema" action).');
  }
}
