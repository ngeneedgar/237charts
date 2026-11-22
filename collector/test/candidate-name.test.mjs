import test from 'node:test';
import assert from 'node:assert/strict';
import { junkReason } from '../lib/candidate-name.mjs';

const known = ['Magasco', 'Fally Ipupa', 'Tenor', 'Mimie', 'Martin\'s'];

test('video-title junk is rejected', () => {
  for (const n of ['BLACK M merci audio officiel', 'Hen\'s Ebol\'am HD Directed by MouphassA', 'Tenor Loading…60%', 'Martin’s Out Now !!',
    'Disponible en Grrr !', 'teetyofficiel9367', 'teetyofficiel9367 !!! Le', '330Shelby Fianso Soprano', 'avec MIMIE', 'Magasco TROMPER', 'MAGASCO ONE BY ONE',
    'fallyipupa SACRIFICES', 'TENOR – YAMO', 'SXL OV × KEMI2VINCI × NZO CACHMIR', 'MIMIE -prêt à tout', 'CYSOULOfficiel'])
    assert.ok(junkReason(n, known), `should reject: ${n}`);
});

test('real artist names pass', () => {
  for (const n of ['Lady Fi', 'Otaku Black', 'Eddy NEM', 'Yemi Alade', 'A. Mpacko', 'Gifto La Russe', 'IMILO LeChanceux', 'PHIL.B',
    'Kinshasa Orchestra', 'Voice2gether', 'Stanley Enow', 'Cleo Grae', 'NI GOD', 'AL-K', 'LUCKY +2', 'Magasco', 'Tour 2 Garde', 'Espoir 2000', '1da Banton', 'Yanicko la star du Flow'])
    assert.equal(junkReason(n, known), null, `should keep: ${n}`);
});
