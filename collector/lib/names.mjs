// Name normalisation + similarity, shared by discovery scripts.

export function norm(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
    .toLowerCase()
    .replace(/\s*-\s*topic$/, '')
    .replace(/\b(official|officiel|music|musique|tv|vevo|channel|chaine)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Token-set similarity 0..1 (order-insensitive), plus exact-compact bonus
export function similarity(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na.replace(/ /g, '') === nb.replace(/ /g, '')) return 1;
  const A = new Set(na.split(' ')), B = new Set(nb.split(' '));
  const inter = [...A].filter((t) => B.has(t)).length;
  return inter / Math.max(A.size, B.size);
}

// Extract featured artist names from a video title.
// Handles: "feat.", "ft.", "featuring", "Ft", "x" / "&" inside parentheses.
export function featuredNames(title) {
  const out = [];
  const m = title.match(/\b(?:feat\.?|ft\.?|featuring)\s+([^()\[\]|]+?)(?=\s*(?:[)\]|]|-\s|\(|$))/i);
  if (m) out.push(...m[1].split(/\s*(?:,|&|\bx\b|\bet\b|\band\b)\s*/i));
  return out
    .map((s) => s
      .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/gu, '')       // emojis, flags
      .replace(/["“”]|official.*$|clip.*$|video.*$|\b\d+\s*ans\b.*$|\blive\b.*$/gi, '')
      .replace(/#\S+|@/g, '')                                                  // hashtags, @handles
      .replace(/\s{2,}/g, ' ')
      .trim())
    .filter((s) => s.length >= 2 && s.length <= 40);
}
