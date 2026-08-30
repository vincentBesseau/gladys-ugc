// ugc.fr's fragments are HTML-entity-encoded (e.g. "d&eacute;sormais"). This
// covers the named entities that actually show up in French movie text plus
// numeric entities, without pulling in a full entity-decoding dependency.
const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  euml: 'ë',
  agrave: 'à',
  acirc: 'â',
  auml: 'ä',
  ccedil: 'ç',
  ocirc: 'ô',
  ouml: 'ö',
  ucirc: 'û',
  ugrave: 'ù',
  uuml: 'ü',
  icirc: 'î',
  iuml: 'ï',
  oelig: 'œ',
  aelig: 'æ',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  laquo: '«',
  raquo: '»',
  ndash: '–',
  mdash: '—',
};

export function decodeHtmlEntities(value = '') {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name] ?? match);
}
