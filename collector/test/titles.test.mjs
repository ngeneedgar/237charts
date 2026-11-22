import test from 'node:test';
import assert from 'node:assert/strict';
import { fixCaps, bestTitle } from '../lib/songs.mjs';

test('ALL-CAPS titles are title-cased; mixed case is kept', () => {
  assert.equal(fixCaps('KIDNAPPE'), 'Kidnappe');
  assert.equal(fixCaps('CONTRADICTION'), 'Contradiction');
  assert.equal(fixCaps('LA VIE DE LA RUE'), 'La Vie de la Rue');
  assert.equal(fixCaps("J'AI COUPÉ LE SON"), "J'ai Coupé le Son");
  assert.equal(fixCaps('Big Papa'), 'Big Papa');
  assert.equal(fixCaps('DJ'), 'DJ');
  assert.equal(fixCaps('PDG'), 'PDG');
  assert.equal(fixCaps('LES AUTRES PLANÈTES'), 'Les Autres Planètes');
  assert.equal(fixCaps('APPELS MANQUÉS'), 'Appels Manqués');
});

test("Deezer's spelling wins when it is the same title", () => {
  assert.equal(bestTitle('KIDNAPPE', 'Kidnappé'), 'Kidnappé');
  assert.equal(bestTitle('KIDNAPPE', 'KIDNAPPÉ'), 'Kidnappé');
  assert.equal(bestTitle('KIDNAPPE', 'Another Song'), 'Kidnappe');
  assert.equal(bestTitle('Stranger', undefined), 'Stranger');
  assert.equal(bestTitle('PDG', 'Pdg'), 'PDG');
  assert.equal(bestTitle('Ta Femme', 'Ta Fémme'), 'Ta Femme');
});
