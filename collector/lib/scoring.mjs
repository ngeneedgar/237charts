// 237 Charts — scoring engine (methodology v1.0). Pure functions, no I/O, fully testable.
//
//   Score = 10,000 × Σ_p ( w_p × share_p )
//   share_p = song's weekly count on platform p / total weekly count of all eligible songs on p
//
// Weights: YouTube 50 · Shazam Cameroon 25 · Deezer 25.
// Once Audiomack data exists: YouTube 40 · Audiomack 25 · Shazam 20 · Deezer 15.
// If a source has no data one week, the remaining weights are rescaled to 100%.
//
// Count sources (youtube, audiomack): weekly views/plays.
// Ranked sources: shazam = Cameroon Top 200 points (201 − position); deezer = Deezer popularity rank.

export const METHODOLOGY_V1 = {
  version: 'v1.0',
  weights: { youtube: 0.5, shazam: 0.25, deezer: 0.25 },
  weightsWithAudiomack: { youtube: 0.4, audiomack: 0.25, shazam: 0.2, deezer: 0.15 },
  eligibilityWeeks: 104,       // older songs can't chart
  recurrentAfterWeeks: 52,     // older songs become "recurrent"…
  recurrentMinRank: 25,        // …and only stay on the Overall chart while ranked in the top 25
  anomaly: { factor: 5, minCount: 5000, capFactor: 3 }, // spike > 5× 4-week median → capped at 3×
  chartSizes: { overall: 50, genre: 20 },
};

const WEEK_MS = 7 * 864e5;
export const weeksBetween = (from, to) => Math.floor((new Date(to) - new Date(from)) / WEEK_MS);

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ---------- Viral chart ----------
// Spotify's stated viral signals: fast play growth, sharing, new listeners discovering a song.
// Our free equivalents: YouTube view GROWTH (this week − last week) and Shazam Cameroon (people
// looking up a song they just heard = discovery). Sharing isn't measurable from public data.
// Newness counts heavily: only songs released in the last 8 weeks, with a newness multiplier.
export const VIRAL_V1 = {
  maxAgeWeeks: 8,
  weights: { growth: 0.5, shazam: 0.5 },
  newness: (age) => (age <= 2 ? 1 : Math.max(0.4, 1 - 0.1 * (age - 2))), // weeks 0–2: 1.0 → week 8: 0.4
  size: 20,
};

/**
 * @param songs [{songId, releaseDate, youtubeThisWeek, youtubeLastWeek, shazamPoints}]
 * @returns ranked [{songId, viralScore, growth, ageWeeks, newness}]
 */
export function viralChart(songs, weekEnd, v = VIRAL_V1) {
  const rows = songs
    .map((s) => {
      const ageWeeks = s.releaseDate ? weeksBetween(s.releaseDate, weekEnd) : null;
      // A new upload's first week counts fully as growth
      const growth = Math.max(0, (s.youtubeThisWeek ?? 0) - (s.youtubeLastWeek ?? 0));
      return { songId: s.songId, ageWeeks, growth, shazam: s.shazamPoints ?? 0 };
    })
    .filter((r) => r.ageWeeks != null && r.ageWeeks >= 0 && r.ageWeeks <= v.maxAgeWeeks); // unknown date = not provably new
  const totG = rows.reduce((a, r) => a + r.growth, 0), totS = rows.reduce((a, r) => a + r.shazam, 0);
  const wSum = (totG ? v.weights.growth : 0) + (totS ? v.weights.shazam : 0) || 1;
  for (const r of rows) {
    r.newness = v.newness(r.ageWeeks);
    const base = ((totG ? v.weights.growth * r.growth / totG : 0) + (totS ? v.weights.shazam * r.shazam / totS : 0)) / wSum;
    r.viralScore = Math.round(10000 * base * r.newness * 100) / 100;
  }
  return rows.filter((r) => r.viralScore > 0)
    .sort((a, b) => b.viralScore - a.viralScore || a.songId.localeCompare(b.songId))
    .slice(0, v.size)
    .map((r, i) => ({ rank: i + 1, ...r }));
}

/** Shazam Cameroon Top 200 position → points (#1 = 200 … #200 = 1). */
export const shazamPoints = (position) => (position >= 1 && position <= 200 ? 201 - position : 0);

/** Anti-manipulation: cap a sudden spike vs. the song's own recent history on that platform. */
export function adjustForAnomaly(count, history, cfg = METHODOLOGY_V1.anomaly) {
  const med = median(history.slice(-4));
  if (med == null || med <= 0) return { count, adjusted: false };       // no baseline (new song)
  if (count >= cfg.minCount && count > cfg.factor * med) {
    return { count: Math.round(cfg.capFactor * med), adjusted: true, original: count };
  }
  return { count, adjusted: false };
}

/**
 * Score one chart week.
 * @param {Array<{songId, genre, releaseDate, counts:{youtube?,audiomack?,spotify?}, history?:{youtube?:number[],…}}>} songs
 * @param {string} weekEnd ISO date of the chart week's last day
 * @returns songs with { score, shares, counts, adjusted, eligible, recurrent, reason? }
 */
export function scoreWeek(songs, weekEnd, m = METHODOLOGY_V1) {
  // 1. Eligibility + anomaly adjustment
  const rows = songs.map((s) => {
    const age = s.releaseDate ? weeksBetween(s.releaseDate, weekEnd) : 0;
    const eligible = age < m.eligibilityWeeks;
    const counts = {}, adjustedPlatforms = [];
    for (const [p, c] of Object.entries(s.counts ?? {})) {
      const a = adjustForAnomaly(Math.max(0, c ?? 0), s.history?.[p] ?? [], m.anomaly);
      counts[p] = a.count;
      if (a.adjusted) adjustedPlatforms.push(p);
    }
    return {
      songId: s.songId, genre: s.genre, counts, eligible,
      recurrent: age >= m.recurrentAfterWeeks,
      adjusted: adjustedPlatforms.length > 0, adjustedPlatforms,
      ...(eligible ? {} : { reason: `released ${age} weeks ago (limit ${m.eligibilityWeeks})` }),
    };
  });

  // 2. Platform totals over eligible songs; use Spotify weights only if we have Spotify data
  const eligibleRows = rows.filter((r) => r.eligible);
  const totals = {};
  for (const r of eligibleRows) for (const [p, c] of Object.entries(r.counts)) totals[p] = (totals[p] ?? 0) + c;
  const base = totals.audiomack > 0 ? m.weightsWithAudiomack : m.weights;
  const present = Object.entries(base).filter(([p]) => totals[p] > 0);
  const sumW = present.reduce((s, [, w]) => s + w, 0) || 1;
  const weights = Object.fromEntries(present.map(([p, w]) => [p, Math.round((w / sumW) * 1e6) / 1e6]));

  // 3. Score
  for (const r of rows) {
    r.shares = {};
    let sum = 0;
    for (const [p, w] of Object.entries(weights)) {
      const share = r.eligible && totals[p] ? (r.counts[p] ?? 0) / totals[p] : 0;
      r.shares[p] = share;
      sum += w * share;
    }
    r.score = Math.round(10000 * sum * 100) / 100;
  }
  return { rows, weights, totals };
}

/**
 * Turn scores into ranked chart entries with LW / Peak / Wks / movement.
 * @param rows output of scoreWeek
 * @param {object} prev  map songId -> { lastRank (null if not on last week's chart), peak, weeks, everCharted }
 * @param {'overall'|string} chart  'overall' or a genre slug
 */
export function rankChart(rows, prev = {}, chart = 'overall', m = METHODOLOGY_V1, pins = {}) {
  const size = chart === 'overall' ? m.chartSizes.overall : m.chartSizes.genre;
  const pool = rows
    .filter((r) => r.eligible && r.score > 0 && (chart === 'overall' || r.genre === chart))
    .sort((a, b) => b.score - a.score || a.songId.localeCompare(b.songId)); // deterministic ties

  // 1. Normal selection by score
  let picked = [];
  for (const r of pool) {
    if (picked.length >= size) break;
    // Recurrent songs leave the Overall chart once they fall below the cutoff
    if (chart === 'overall' && r.recurrent && picked.length + 1 > m.recurrentMinRank) continue;
    picked.push(r);
  }
  // 2. Manual positions set by the team (admin/chart-overrides.csv), applied in rank order.
  //    A pinned song must still be eligible this week; the others keep their order around it.
  const pinList = Object.entries(pins).map(([id, rank]) => [pool.find((r) => r.songId === id), Math.max(1, Math.round(rank))])
    .filter(([r]) => r).sort((a, b) => a[1] - b[1]);
  if (pinList.length) {
    const pinned = new Set(pinList.map(([r]) => r.songId));
    const rest = picked.filter((r) => !pinned.has(r.songId));
    picked = [];
    for (const [r, rank] of pinList) { while (picked.length < rank - 1 && rest.length) picked.push(rest.shift()); picked.push(r); }
    picked.push(...rest);
    picked = picked.slice(0, size);
  }

  const entries = [];
  for (const r of picked) {
    const rank = entries.length + 1;
    const p = prev[r.songId] ?? {};
    const lw = p.lastRank ?? null;
    entries.push({
      rank, songId: r.songId, score: r.score, adjusted: r.adjusted,
      ...(r.songId in pins ? { manual: true } : {}),
      lastWeek: lw,
      peak: Math.min(rank, p.peak ?? Infinity),
      weeksOnChart: (p.weeks ?? 0) + 1,
      movement: lw == null ? (p.everCharted ? 're' : 'new') : rank < lw ? 'up' : rank > lw ? 'down' : 'same',
      delta: lw == null ? null : lw - rank,
    });
  }
  return entries;
}
