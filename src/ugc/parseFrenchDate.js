const MONTHS = {
  janvier: '01',
  février: '02',
  mars: '03',
  avril: '04',
  mai: '05',
  juin: '06',
  juillet: '07',
  août: '08',
  septembre: '09',
  octobre: '10',
  novembre: '11',
  décembre: '12',
};

/**
 * Parse a French "26 août 2026" date into an ISO "2026-08-26" string.
 * @param {string} value
 * @returns {string|null} null when the input doesn't match the expected shape.
 */
export function parseFrenchDate(value = '') {
  const match = String(value)
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const monthNumber = MONTHS[month];

  if (!monthNumber) {
    return null;
  }

  return `${year}-${monthNumber}-${day.padStart(2, '0')}`;
}
