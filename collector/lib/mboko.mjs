// 237 Charts — Mboko chart algorithm (team design, 2026-11-23). Pure functions, no I/O.
//   1. Classification: is the song Mboko? confidence 0–1 from artist list, label/channel, keywords; team decisions win.
//   2. Score: log-scaled platform scores × velocity × time decay (older hits make room for new releases).
// Sources we do not collect yet (Audiomack, Boomplay, TikTok, likes/comments) are skipped and the
// weights of the sources that exist are rescaled — add the data later and they switch on by themselves.

export const MBOKO_V1 = {
  weights: { youtube: 0.35, audiomack: 0.25, boomplay: 0.20, tiktok: 0.20, shazam: 0.15, deezer: 0.10 },
  confidenceThreshold: 0.45,
  decayGravity: 1.2,          // score ÷ (weeks_old + 2)^1.2
  unknownAgeWeeks: 26,        // Shazam-only songs without a release date
  velocity: { smoothing: 500, min: 0.8, max: 2.0 },
  artistScore: 0.60, adjacentScore: 0.35, labelScore: 0.30, keywordScore: 0.15, keywordMax: 0.45,
  size: 20,
};

const fold = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").trim();
const compact = (s) => fold(s).replace(/[^a-z0-9]/g, '');

// Artists matched by exact credited name (never substring: "Lor" must not match "Flore").
export const CORE_ARTISTS = [
  'jovi', 'le monstre', 'mic monsta', 'pascal', 'reniss', 'askia', 'stanley enow', 'ko-c', 'kocee', 'tenor', 'minks', "mink's",
  'maahlox', 'maahlox le vibeur', 'koppo', 'krotal', 'pit baccardi', 'boudor', 'franko', 'valsero', 'lady b', 'negrissim', 'sadrak',
  'spido', 'bashi', 'bashi b', 'tata', 'ebako', 'dareal', 'deecy',
  'mboko mana', 'mboko son', 'okunol', 'taku joel', 'tahbax', 'cyril keenz', 'freeboi lamma', 'faashon dee', 'yung time',
  "d'slyk", "d'slyk gongolo", 'chefor', 'boy j 2axe', 'styyles', 'draaag', 'boykaf', 'vherse', 'lop', 'big ac', 'wiznova',
  'av hovy', 't kay', 'ym god', 'gg maestro', 'chillup', 'mamiso', 'yf nolito', 'rick silver', 'handy b', 'lill humble', 'wildman',
  'shweng king', 'dairo', 'kula', 'king ceasar', 'ak santana', 'afanyu', 'tbr', 'young holiday', 'loocid', 'stainz', 'mihney',
  'nazzy blaise', 'joad kennedy', 'speczy clinton', 'kicka', 'el kobi', 'phido', 'bobo', 'cruz waine jnr', 'will conquer',
  'bakaporo', 'besingi', 'crispy', 'pet-robino', 'b spark', 'maxtor', 'tilla', 'mr biggs', 'street king', 'boy tag',
  'skidi boy', 'kikoh', 'ngoma', 'sifoor', 'cleo grae', 'tim kayzer', 'krys kofi', 'killamel', 'torch city', 'big piz',
  'tony nobody', 'ulrich takam', 'eyidi', 'yvich', 'k-tino', 'fluri boyz', 'mister shyne', 'skiddy', 'djino', 'mc lo', 'zino',
  'killa mel', 'k-rism', 'sarkozy 237', "l'oiseau rare", 'young me',
];
// Mboko-pop / urban-fusion neighbours: an artist match alone is not enough — needs a label or keyword too.
export const ADJACENT_ARTISTS = [
  'magasco', 'tzy panchak', 'gasha', 'clara', 'ewube', 'blaise b', 'mr leo', 'salatiel', 'locko', 'kameni', 'gomez', 'blanche bailly',
  'daphne', 'mimie', 'aveiro djess', 'happi', 'vanister', 'lidop', 'philjohn', 'phillbill', 'rythmz', 'ridimz', 'x-maleya', 'xmaleya',
  'numerica', 'dynastie le tigre', 'moustik le karismatik', 'tonton ebogo', 'krys m', 'libianca', 'benash', 'lor', 'ngassam',
  'hais', 'daddy channel', 'ivo', 'gill arym', 'nami nami cyrus', 'ne grie', 'abztrumental', 'adah akenji', 'chuzih', 'mr adrenaline',
  'mr tcheck', 'dijay karl',
];
export const CORE_LABELS = [
  'new bell music', 'newbellmusic', 'newbellmusicchannel', 'kreef entertainment', 'otantik ent', 'otantik films', 'new wave cameroon',
  'raw gang', '7katta music', 'sa majeste music', 'tahbax prizywest', 'mboko gang', 'zone2rap', 'zone de revolution artistique positive',
  'mapane records', 'red zone', 'amusic', 'a-music', 'motherland empire', 'kwata music', 'buea records',
  "steven's music", 'stevens music', "steven's music entertainment", 'big dreams entertainment', 'big dreams ent',
  'alpha better records', 'alpha betta records', 'empire company', 'sonolive prod', 'lionn productions', 'bboy records', 'shaba muzik',
  'akumba music', 'blu nation', 'blu nation recordingz', 'muzikol', 'universal music africa', 'war machine music', 'hope music group',
  'hmg', 'keyzit cameroon', 'keyzit', 'bomaye musik', 'french kind', 'like wow tv', 'dairo official', 'power house entertainment',
  'powerhouse', 'cameroon hip hop', '237 hip hop', 'mboa music', 'ndolo music', 'kwat music', 'kamer music', '237showbiz', 'dj rabeatz',
  'seta beatz', 'konfor', 'uncle dro', 'goldblisz',
];
export const KEYWORDS = [
  'mboko', 'camfranglais', 'pidgin', 'yaounde', 'douala', 'bamenda', 'buea', '237', 'le monstre', 'ndolo', 'mola', 'tchop', 'waka',
  '237hiphop', 'cameroonhiphop', 'mboa', 'kmer', 'bantou', 'kwata', 'mboko gang', 'buea boy', 'bamenda boy',
];

const coreSet = new Set(CORE_ARTISTS.map(fold)), adjSet = new Set(ADJACENT_ARTISTS.map(fold));
const labelList = CORE_LABELS.map(fold).map((l) => ({ l, c: l.replace(/[^a-z0-9]/g, '') }));
const kwRes = KEYWORDS.map((k) => new RegExp(`(^|[^a-z0-9])${fold(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`));

const SPLIT = /\s*(?:,|&|×|\bx\b|\bfeat\.?|\bft\.?|\bavec\b)\s*/i;
export const creditedArtists = (artist, title = '') => [
  ...(artist ?? '').split(SPLIT),
  // artists featured in the video title: "ENJR feat JOVI - BAHEBECK", "(ft. X)"
  ...[...(title ?? '').matchAll(/\b(?:feat\.?|ft\.?|avec)\s+([^-–(\[|]+)/gi)].flatMap((m) => m[1].split(SPLIT)),
].map(fold).filter(Boolean);

/** @param {{artist, title, label?, teamGenre?}} song  teamGenre: genre set by the team for this artist/song (null if none) */
export function mbokoConfidence(song, m = MBOKO_V1) {
  if (song.teamGenre === 'mboko') return { confidence: 1, why: 'team' };
  const names = creditedArtists(song.artist, song.title);
  // The team's genre for the main artist does not veto a song that credits a core Mboko artist (e.g. "ENJR feat JOVI").
  if (song.teamGenre && !names.some((n) => coreSet.has(n))) return { confidence: 0, why: 'team-other-genre' };
  let score = 0; const why = [];
  if (names.some((n) => coreSet.has(n))) { score += m.artistScore; why.push('artist'); }
  else if (names.some((n) => adjSet.has(n))) { score += m.adjacentScore; why.push('adjacent-artist'); }
  const lab = fold(song.label), labC = lab.replace(/[^a-z0-9]/g, '');
  if (lab && labelList.some(({ l, c }) => (c.length <= 4 ? new RegExp(`(^|[^a-z0-9])${c}([^a-z0-9]|$)`).test(lab) : labC.includes(c)))) { score += m.labelScore; why.push('label'); }
  const text = fold(`${song.title} ${song.artist}`);
  const hits = kwRes.filter((re) => re.test(text)).length;
  if (hits) { score += Math.min(m.keywordMax, hits * m.keywordScore); why.push(`keywords×${hits}`); }
  return { confidence: Math.min(1, score), why: why.join('+') };
}

/** Rewards week-over-week growth (smoothed); prev null = unknown → neutral 1.0. */
export function velocityBoost(current, prev, v = MBOKO_V1.velocity) {
  if (prev == null) return 1;
  return Math.max(v.min, Math.min(v.max, (current + v.smoothing) / (prev + v.smoothing)));
}
export const timeDecay = (ageWeeks, g = MBOKO_V1.decayGravity) => 1 / ((Math.max(0, ageWeeks) + 2) ** g);

/**
 * @param songs [{songId, artist, title, label, teamGenre, ageWeeks|null, counts:{youtube,shazam,deezer,…}, prevTotal|null}]
 * @returns [{songId, score, confidence, why, velocity, decay}] — only songs at/over the confidence threshold, unsorted
 */
export function mbokoScores(songs, m = MBOKO_V1) {
  const cands = songs.map((s) => ({ s, ...mbokoConfidence(s, m) })).filter((c) => c.confidence >= m.confidenceThreshold);
  const lg = (x) => Math.log10(Math.max(0, x) + 1);
  const maxLog = {};
  for (const { s } of cands) for (const [p, c] of Object.entries(s.counts ?? {})) maxLog[p] = Math.max(maxLog[p] ?? 0, lg(c));
  const present = Object.keys(m.weights).filter((p) => maxLog[p] > 0);
  const wSum = present.reduce((a, p) => a + m.weights[p], 0) || 1;
  return cands.map(({ s, confidence, why }) => {
    // each platform's log score is scaled to the biggest Mboko song on it (0–1), so weights mean what they say
    const composite = present.reduce((a, p) => a + (m.weights[p] / wSum) * (lg(s.counts?.[p] ?? 0) / maxLog[p]), 0);
    const total = Object.values(s.counts ?? {}).reduce((a, c) => a + (c ?? 0), 0);
    const velocity = velocityBoost(total, s.prevTotal);
    const decay = timeDecay(s.ageWeeks ?? m.unknownAgeWeeks, m.decayGravity);
    return { songId: s.songId, score: Math.round(composite * velocity * decay * 1e4) / 100, confidence: Math.round(confidence * 100) / 100, why, velocity: Math.round(velocity * 100) / 100, decay: Math.round(decay * 1e3) / 1e3 };
  });
}

/**
 * Glue for build-week.mjs: score-ready Mboko rows (same shape as scoreWeek rows, genre 'mboko', score = Mboko score).
 * @param rows scoreWeek rows · songs merged songs · artistGenres artist-genres.json · channelTitles {channelId: title} · videos snapshot videos
 */
export function mbokoRows({ rows, songs, artistGenres, channelTitles, videos, weekEnd, weeksBetween }) {
  const byId = Object.fromEntries(songs.map((x) => [x.songId, x]));
  const input = rows.filter((r) => r.eligible).map((r) => {
    const x = byId[r.songId], qid = x.songId.split('::')[0], ag = artistGenres[qid];
    const age = x.releaseDate ? weeksBetween(x.releaseDate, weekEnd) : null;
    const teamGenre = x.genre === 'mboko' ? 'mboko' : ag?.source === '237 Charts team' ? ag.genre : null;
    // the cleaned title drops "feat. X", so classify on the original video titles too
    const rawTitles = (x.meta.sources ?? []).map((v) => videos[v.videoId]?.title).filter(Boolean);
    return { songId: r.songId, artist: x.meta.artist, title: [x.meta.title, ...rawTitles].join(' | '), teamGenre, ageWeeks: age, counts: r.counts,
      label: channelTitles[videos[x.meta.sources?.[0]?.videoId]?.channelId] ?? '',
      prevTotal: age != null && age < 1 ? 0 : null }; // released this week → last week was zero
  });
  const scored = Object.fromEntries(mbokoScores(input).map((r) => [r.songId, r]));
  return rows.filter((r) => scored[r.songId]).map((r) => ({ ...r, genre: 'mboko', score: scored[r.songId].score, mboko: scored[r.songId] }));
}
