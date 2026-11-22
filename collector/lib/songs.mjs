// Merge versions of one song (official clip, visualizer, lyric video, audio, Topic track)
// into a single chart entry. Key = artist (Wikidata id) + normalised song title.
import { norm } from './names.mjs';

const VERSION_WORDS =
  /\b(official|officiel(le)?|music|video|vid[eé]o|clip|audio|lyrics?|lyric video|paroles|visuali[sz]er|hd|4k|explicit|version|prod\.?.*|dir\.?.*|directed by.*)\b/gi;

/** Clean song title: drop artist prefix, (Official Video)-style tags, and featured credits. */
export function songTitle(rawTitle, artistNames = []) {
  let t = rawTitle;
  // "Artist - Title" / "Artist x Other - Title" → keep the part after the dash if it starts with an artist name
  const dash = t.split(/\s+[-–—|]\s+/);
  if (dash.length > 1) {
    const head = norm(dash[0]);
    if (artistNames.some((n) => head.includes(norm(n))) || dash.length > 2) t = dash.slice(1).join(' - ');
  }
  return t
    .replace(/[([{][^)\]}]*[)\]}]/g, ' ')                          // (Official Video), [Clip Officiel], {…}
    .replace(/\b(?:feat\.?|ft\.?|featuring)\b.*$/i, ' ')           // featured credits
    .replace(VERSION_WORDS, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/[-–—|:]+\s*$/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SMALL = new Set(['a', 'à', 'au', 'aux', 'de', 'des', 'du', 'en', 'et', 'la', 'le', 'les', 'ou', 'pour', 'sur', 'un', 'une', 'the', 'of', 'and', 'in', 'on', 'to', 'for', 'my', 'your', 'me']);
/** "KIDNAPPE" → "Kidnappe": title-case a title written in ALL CAPS (mixed-case titles are left alone). */
export function fixCaps(title) {
  if (!title) return title;
  title = title.normalize('NFC'); // "PLANÈTES" may arrive as E + combining accent
  if (/\p{Ll}/u.test(title) || /^[\p{Lu}\p{N}]{1,4}$/u.test(title.trim())) return title; // mixed case, or an acronym like "PDG"
  return title.toLocaleLowerCase('fr').replace(/[\p{L}\p{N}'’]+/gu, (w, i) =>
    (i > 0 && SMALL.has(w) ? w : w[0].toLocaleUpperCase('fr') + w.slice(1)));
}

/** Display title: Deezer's spelling when it is the same title (it restores accents: Kidnappé), else fixCaps. */
export function bestTitle(title, deezerTitle) {
  const fold = (s) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  if (fixCaps(title) === title?.normalize('NFC')) return title; // not ALL CAPS (or an acronym): keep the artist's spelling
  if (deezerTitle && fold(deezerTitle) === fold(title)) return fixCaps(deezerTitle);
  return fixCaps(title);
}

export function songKey(artistId, rawTitle, artistNames = []) {
  const t = norm(songTitle(rawTitle, artistNames));
  return t ? `${artistId}::${t}` : null;
}

/** Version priority for picking the display title / link: official clip > visualizer > lyric > audio. */
export function versionRank(rawTitle, isTopic = false) {
  if (/clip|music video|official video|vid[eé]o officiel/i.test(rawTitle)) return 0;
  if (/visuali[sz]er/i.test(rawTitle)) return 1;
  if (/lyric|paroles/i.test(rawTitle)) return 2;
  if (isTopic || /audio/i.test(rawTitle)) return 3;
  return 1.5;
}

/** Public-facing artist name: the stage name if the video title uses it (Lady Ponce, not Adèle Ruffine Ngono). */
export function displayName(legalName, aliases = [], title = '') {
  const t = norm(title);
  if (t.includes(norm(legalName))) return legalName;
  return aliases.find((a) => norm(a).length > 2 && t.includes(norm(a))) ?? legalName;
}

/**
 * Group videos into songs.
 * @param {Array<{videoId, artistId, artist, title, publishedAt, weekly, aliases?}>} videos
 * @returns {Array<{songId, artistId, artist, title, releaseDate, weekly, sources:[…]}>}
 */
export function mergeVersions(videos) {
  const songs = new Map();
  for (const v of videos) {
    const names = [v.artist, ...(v.aliases ?? [])];
    const key = songKey(v.artistId, v.title, names) ?? `${v.artistId}::${v.videoId}`;
    const s = songs.get(key) ?? { songId: key, artistId: v.artistId, artist: displayName(v.artist, v.aliases, v.title), names, weekly: 0, sources: [] };
    s.weekly += v.weekly;
    s.sources.push({ videoId: v.videoId, title: v.title, weekly: v.weekly, rank: versionRank(v.title, v.isTopic) });
    if (!s.releaseDate || v.publishedAt < s.releaseDate) s.releaseDate = v.publishedAt; // earliest version = release
    songs.set(key, s);
  }
  for (const s of songs.values()) {
    s.sources.sort((a, b) => a.rank - b.rank || b.weekly - a.weekly);
    s.title = fixCaps(songTitle(s.sources[0].title, s.names) || s.sources[0].title);
    s.releaseDate = s.releaseDate.slice(0, 10);
    delete s.names;
  }
  return [...songs.values()];
}
