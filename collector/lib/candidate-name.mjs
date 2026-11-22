// Is a "feat." candidate a real artist name, or a piece of a video title?
// The collab snowball reads names out of titles like "Pit Baccardi ft. Magasco TROMPER (Audio Officiel)",
// so candidates can carry song titles, video words, handles or fragments. Those go straight to "reject"
// (with the reason shown in the admin) instead of the team's review queue.
import { norm } from './names.mjs';

const VIDEO_WORDS = /\b(officiel+e?|official|audio|vid[eé]o|clip|lyrics?|paroles|visuali[sz]er|directed|realis[eé]|prod\b|hd|4k|out now|disponible|available|loading|teaser|trailer|live|freestyle|remix)\b/i;

/** Returns a reason string if the name is not a plausible artist name, else null. */
export function junkReason(name, knownNames = []) {
  const n = (name ?? '').trim();
  if (!n) return 'empty name';
  if (VIDEO_WORDS.test(n) || /officiel|official/i.test(n)) return 'contains video-title words (official, audio, directed…)';
  if (/[%!?|…]|\.{3}|[a-z]\d{3,}|\d{3,}[a-z]/i.test(n)) return 'contains symbols or long numbers — part of a video title or a handle';
  if (/^(avec|with|and|et|feat|ft)\b/i.test(n)) return 'starts with a joining word (avec, with…) — fragment of a title';
  if (/\s[–—-]\s|\s[×x]\s.*\s[×x]\s/i.test(n)) return 'several names or a title joined together';
  if (n.split(/\s+/).length > 5) return 'too many words for an artist name';
  // "Magasco TROMPER", "fallyipupa SACRIFICES": a known artist followed by a song title
  const nn = norm(n);
  for (const k of knownNames) {
    const kn = norm(k);
    if (kn.length >= 3 && nn !== kn && (nn.startsWith(kn + ' ') || nn.replace(/ /g, '').startsWith(kn.replace(/ /g, '')) && nn.length > kn.length + 3))
      return `known artist “${k}” followed by other words (probably a song title)`;
  }
  return null;
}
