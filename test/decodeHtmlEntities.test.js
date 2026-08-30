import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeHtmlEntities } from '../src/ugc/decodeHtmlEntities.js';

test('decodes named entities used in French movie text', () => {
  assert.equal(decodeHtmlEntities('d&eacute;sormais'), 'désormais');
  assert.equal(decodeHtmlEntities('Com&eacute;die'), 'Comédie');
  assert.equal(decodeHtmlEntities('d&rsquo;Oli'), 'd’Oli');
});

test('decodes numeric entities (decimal and hex)', () => {
  assert.equal(decodeHtmlEntities('&#233;'), 'é');
  assert.equal(decodeHtmlEntities('&#xe9;'), 'é');
});

test('leaves unknown entities untouched', () => {
  assert.equal(decodeHtmlEntities('&unknownentity;'), '&unknownentity;');
});

test('passes plain text through unchanged', () => {
  assert.equal(decodeHtmlEntities('Spider-Man'), 'Spider-Man');
});
