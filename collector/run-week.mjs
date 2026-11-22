// 237 Charts — the whole weekly run, in order. Used by the GitHub Actions schedule and by hand.
// Usage: node collector/run-week.mjs [--dry] [--skip-deploy]
//   --dry          build a preview chart (no real chart file)  — for testing
//   --skip-deploy  don't upload the website
import { execSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { pruneYoutubeSnapshots, stripOldChannelData } from './lib/retention.mjs';
import { readFile, writeFile } from 'node:fs/promises';

const DRY = process.argv.includes('--dry');
const SKIP_DEPLOY = process.argv.includes('--skip-deploy');
const t0 = Date.now();
const log = (m) => console.log(`\n[${new Date().toISOString().slice(11, 19)}] ${m}`);
const run = (cmd, opts = {}) => { console.log(`$ ${cmd}`); execSync(cmd, { stdio: 'inherit', ...opts }); };
// A source failing must not stop the week: the chart rescales weights for missing sources.
const tryRun = (label, cmd) => { try { run(cmd); return true; } catch { console.log(`⚠ ${label} failed — continuing without it`); return false; } };

log('1/7 Collect sources');
tryRun('Shazam Cameroon', 'node collector/collect-shazam.mjs');
tryRun('Deezer', 'node collector/collect-deezer.mjs');
run('node collector/collect-youtube.mjs'); // YouTube is required (50% of the score)
tryRun('Audiomack', 'node collector/collect-audiomack.mjs');

log('2/7 Discovery: new artists and channels (cheap lookups + up to 25 searches)');
tryRun('Collaborations', 'node collector/discover-collabs.mjs');
tryRun('Classifier', 'node collector/classify-candidates.mjs');
tryRun('Channel matching', 'node collector/match-channels.mjs 25');
tryRun('Genres', 'node collector/tag-genres.mjs');
tryRun('Nationality', 'node collector/check-nationality.mjs'); // hard rule: Cameroonian nationals only

log('3/7 Build chart, then complete song data until stable');
const build = `node collector/build-week.mjs${DRY ? ' --dry' : ''}`;
for (let pass = 1; pass <= 4; pass++) {
  run(build);
  const out = execSync('node collector/enrich-songs.mjs').toString();
  console.log(out.trim());
  if (/Looked up 0 new songs/.test(out)) break;
}
// Before the first real chart (needs snapshots a full week apart), refresh the preview every run so the
// team sees its decisions (exclusions, genres, song fixes, manual positions) instead of a frozen test chart.
if (!DRY && !(await readdir('collector/out')).some((f) => /^chart-\d{4}-\d{2}-\d{2}\.json$/.test(f))) {
  log('No real chart yet — refreshing the preview with the latest data and team decisions');
  tryRun('Preview', 'node collector/build-week.mjs --dry');
  tryRun('Preview song data', 'node collector/enrich-songs.mjs');
}

// YouTube API policy: delete stored YouTube API data older than 30 days (weekly views need only the last ~7 days)
{ const gone = await pruneYoutubeSnapshots(); if (gone.length) console.log(`Deleted YouTube snapshots older than 30 days: ${gone.join(', ')}`); }
{ const f = 'collector/out/channel-matches.json'; const m = JSON.parse(await readFile(f, 'utf8').catch(() => '{}')); const n = stripOldChannelData(m); await writeFile(f, JSON.stringify(m, null, 2)); if (n) console.log(`Removed YouTube titles/counts older than 30 days from ${n} channel matches`); }

log('4/7 Tests');
// List test files explicitly: Node 22 (GitHub) treats a folder argument as a file
const tests = (await readdir('collector/test')).filter((f) => f.endsWith('.test.mjs')).map((f) => `collector/test/${f}`);
run(`node --test ${tests.join(' ')}`);

log('5/7 Export for the website');
run('node collector/export-web.mjs');

const realCharts = (await readdir('collector/out')).filter((f) => /^chart-\d{4}-\d{2}-\d{2}\.json$/.test(f));
console.log(`Real charts so far: ${realCharts.length ? realCharts.join(', ') : 'none (site stays in preview)'}`);

log('6/7 Build website');
run('npx next build', { cwd: 'web', env: { ...process.env, SITE_URL: process.env.SITE_URL ?? 'https://237charts.pages.dev' } });

if (SKIP_DEPLOY) log('7/7 Deploy skipped');
else {
  log('7/7 Deploy to Cloudflare Pages');
  run('npx --yes wrangler@3 pages deploy out --project-name 237charts --branch main --commit-dirty=true', { cwd: 'web' });
}
log(`Done in ${Math.round((Date.now() - t0) / 1000)} s`);
