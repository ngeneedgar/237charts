// 237 Charts genre list (approved 2026-11-21). Each artist has a main genre; a song can override it.
// `keywords` match song titles (e.g. "Yah (Mbolé Bikutsi)"); `wikidata` match artist genre labels on Wikidata.
// Order = display order. The four priority genres (team decision 2026-11-22) come first.
export const GENRES = [
  { slug: 'mbole', en: 'Mbolé', fr: 'Mbolé', priority: true,
    keywords: ['mbole', 'mbolé'], wikidata: ['mbolé', 'mbole'] },
  { slug: 'mboko', en: 'Mboko', fr: 'Mboko', priority: true,
    keywords: ['mboko'], wikidata: ['mboko'] },
  { slug: 'njang', en: 'Njang', fr: 'Njang', priority: true,
    keywords: ['njang'], wikidata: ['njang'] },
  { slug: 'afro', en: 'Afro', fr: 'Afro', priority: true,
    keywords: ['afrobeat', 'afropop', 'afro pop'], wikidata: ['afrobeats', 'afrobeat', 'afropop', 'afro pop', 'afro-pop', 'pop music', 'contemporary r&b', 'rhythm and blues', 'zouk', 'coupé-décalé'] },
  { slug: 'makossa', en: 'Makossa', fr: 'Makossa',
    keywords: ['makossa'], wikidata: ['makossa'] },
  { slug: 'bikutsi', en: 'Bikutsi', fr: 'Bikutsi',
    keywords: ['bikutsi'], wikidata: ['bikutsi'] },
  { slug: 'rap', en: 'Rap', fr: 'Rap',
    keywords: ['drill', 'freestyle rap'], wikidata: ['hip hop music', 'hip hop', 'rap', 'french hip hop', 'trap music', 'drill music', 'gangsta rap'] },
  { slug: 'dancehall', en: 'Dancehall', fr: 'Dancehall',
    keywords: ['dancehall'], wikidata: ['dancehall', 'reggae', 'ragga'] },
  { slug: 'gospel', en: 'Gospel', fr: 'Gospel',
    keywords: ['gospel'], wikidata: ['gospel music', 'gospel', 'christian music', 'contemporary christian music', 'worship music'] },
];

export const genreBySlug = Object.fromEntries(GENRES.map((g) => [g.slug, g]));

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Genre named in a song title, e.g. "(Mbolé Bikutsi)" → the more specific one (first listed wins: mbole before bikutsi). */
export function genreFromTitle(title) {
  const t = fold(title);
  const order = ['gospel', 'mboko', 'mbole', 'njang', 'makossa', 'bikutsi', 'dancehall', 'rap', 'afro'];
  for (const slug of order) if (genreBySlug[slug].keywords.some((k) => new RegExp(`\\b${fold(k)}\\b`).test(t))) return slug;
  return null;
}

/** Map Wikidata genre labels to our genres; most specific first. */
export function genreFromWikidata(labels) {
  const ls = labels.map(fold);
  const order = ['gospel', 'mboko', 'mbole', 'njang', 'makossa', 'bikutsi', 'dancehall', 'rap', 'afro'];
  for (const slug of order) if (genreBySlug[slug].wikidata.some((w) => ls.includes(fold(w)))) return slug;
  return null;
}
