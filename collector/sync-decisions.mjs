// 237 Charts — turn answers from the "Artist Check" page into collector/review-decisions.csv.
// Step 1 (Claude): ArtifactData list of collection "decisions" with out_dir=collector/out/decisions-dump
// Step 2: node collector/sync-decisions.mjs   → then re-run classify-candidates.mjs
// "Not sure" answers are left out, so those artists stay in the queue.
import { readdir, readFile, writeFile } from 'node:fs/promises';

const dir = 'collector/out/decisions-dump/decisions';
const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json'));
const rows = [];
for (const f of files) {
  const d = JSON.parse(await readFile(`${dir}/${f}`, 'utf8'));
  const doc = d.data ?? d;
  if (doc.answer === 'yes' || doc.answer === 'no') rows.push([doc.name.replace(/,/g, ' '), doc.answer]);
}
await writeFile('admin/eligibility.csv', ['name,cameroonian', ...rows.map((r) => r.join(','))].join('\n') + '\n');
console.log(`Synced ${rows.length} answers (${rows.filter((r) => r[1] === 'yes').length} yes, ${rows.filter((r) => r[1] === 'no').length} no) from ${files.length} saved`);
