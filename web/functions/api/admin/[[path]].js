// 237 Charts admin API — Cloudflare Pages Function at /api/admin/*.
// The GitHub repo is the database: reads come from the repo, every save is a commit
// (which triggers the weekly-chart workflow, exactly like editing admin/ on github.com).
//
// Environment (Cloudflare Pages → Settings → Variables; secrets marked *):
//   GITHUB_TOKEN*   fine-grained token, this repo only: Contents read/write + Actions read/write
//   GITHUB_REPO     "ngeneedgar/237charts"
//   ADMIN_TEAM*     JSON: [{"email":"a@b.com","name":"Edgar","role":"owner"}, …]  (kept out of the public repo)
//   ACCESS_TEAM     Cloudflare Access team name (https://<ACCESS_TEAM>.cloudflareaccess.com)
//   ACCESS_AUD      Access application audience tag
//   DEV_USER_EMAIL  local development only: skips Access and signs in as this team member
//   DRY_WRITES      "1" = don't commit, return what would have been committed (local testing)

const READABLE = [
  /^admin\/[\w.-]+\.(csv|json|md)$/,
  /^collector\/out\/(candidate-review|nationality|chart-preview|channel-matches|artist-genres|song-meta|wikidata-artists|roster-extra)\.json$/,
  /^collector\/out\/(review-queue\.csv|last-run\.log)$/,
  /^web\/data\/chart\.json$/,
];
const WRITABLE = {
  'admin/eligibility.csv': 'editor', 'admin/genres.csv': 'editor', 'admin/artists-add.csv': 'editor',
  'admin/artists-remove.csv': 'editor', 'admin/channels.csv': 'editor', 'admin/labels.csv': 'editor',
  'admin/contact.json': 'owner',
};
const RANK = { viewer: 0, editor: 1, owner: 2 };
const WORKFLOW = 'weekly-chart.yml';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const fail = (status, error) => json({ error }, status);

// ---------- auth ----------
const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
let jwks = null;
async function verifyAccessJwt(token, env) {
  const [h, p, sig] = token.split('.');
  if (!sig) return null;
  const header = JSON.parse(new TextDecoder().decode(b64url(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
  if (!jwks) jwks = (await (await fetch(`https://${env.ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`)).json()).keys;
  const jwk = jwks.find((k) => k.kid === header.kid);
  if (!jwk) { jwks = null; return null; }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!ok || payload.exp * 1000 < Date.now()) return null;
  // Signed by OUR Access team; if an audience tag is configured, it must match too
  if (payload.iss !== `https://${env.ACCESS_TEAM}.cloudflareaccess.com`) return null;
  if (env.ACCESS_AUD && !aud.includes(env.ACCESS_AUD)) return null;
  return payload.email;
}
async function currentUser(request, env) {
  let email = null;
  if (env.DEV_USER_EMAIL) email = env.DEV_USER_EMAIL;
  else {
    const token = request.headers.get('cf-access-jwt-assertion');
    if (token && env.ACCESS_TEAM) email =await verifyAccessJwt(token, env).catch(() => null);
  }
  if (!email) return null;
  const team = JSON.parse(env.ADMIN_TEAM || '[]');
  const m = team.find((t) => t.email.toLowerCase() === email.toLowerCase());
  return m ? { name: m.name, role: m.role in RANK ? m.role : 'viewer' } : null; // email never leaves the server
}

// ---------- GitHub ----------
const gh = (env, path, init = {}) => fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
  ...init,
  headers: {
    accept: 'application/vnd.github+json', 'user-agent': '237charts-admin', 'x-github-api-version': '2022-11-28',
    ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}), ...init.headers,
  },
});
const fromB64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
const toB64 = (s) => { let bin = ''; for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b); return btoa(bin); };

async function readFile(env, path) {
  if (env.GITHUB_TOKEN) { // API: always fresh, gives the sha needed to save
    const r = await gh(env, `/contents/${encodeURI(path)}?ref=main`);
    if (r.status === 404) return { content: '', sha: null };
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    const j = await r.json();
    if (j.content) return { content: fromB64(j.content), sha: j.sha };
    // files over 1 MB come without content
    const raw = await gh(env, `/contents/${encodeURI(path)}?ref=main`, { headers: { accept: 'application/vnd.github.raw' } });
    return { content: await raw.text(), sha: j.sha };
  }
  // No token (local preview): public raw file, read-only
  const r = await fetch(`https://raw.githubusercontent.com/${env.GITHUB_REPO}/main/${path}`);
  if (r.status === 404) return { content: '', sha: null };
  if (!r.ok) throw new Error(`GitHub raw ${r.status}`);
  return { content: await r.text(), sha: null };
}

// ---------- routes ----------
export async function onRequest({ request, env, params }) {
  env.GITHUB_REPO ||= 'ngeneedgar/237charts';
  env.ACCESS_TEAM ||= 'cold-sky-c44b'; // Cloudflare Zero Trust team (public name, not a secret)
  const route = (params.path || []).join('/');
  const user = await currentUser(request, env);
  if (!user) return fail(401, 'Not signed in, or not on the team list.');
  const can = (role) => RANK[user.role] >= RANK[role];
  const url = new URL(request.url);

  try {
    if (route === 'me' && request.method === 'GET') {
      return json({ ...user, canWrite: !!env.GITHUB_TOKEN || env.DRY_WRITES === '1', dry: env.DRY_WRITES === '1' });
    }

    if (route === 'file' && request.method === 'GET') {
      const path = url.searchParams.get('path') || '';
      if (!READABLE.some((re) => re.test(path))) return fail(403, `Not readable: ${path}`);
      return json(await readFile(env, path));
    }

    if (route === 'file' && request.method === 'PUT') {
      const { path, content, sha, reason } = await request.json();
      const need = WRITABLE[path];
      if (!need) return fail(403, `Not writable: ${path}`);
      if (!can(need)) return fail(403, `Your role (${user.role}) can't change ${path}.`);
      if (!reason || reason.trim().length < 3) return fail(400, 'A reason is required.');
      if (typeof content !== 'string' || content.length > 500_000) return fail(400, 'Bad content.');
      const message = `Admin: ${user.name} — ${reason.trim().replace(/\s+/g, ' ').slice(0, 200)}\n\nFile: ${path}`;
      if (env.DRY_WRITES === '1') return json({ dry: true, path, message, content });
      if (!env.GITHUB_TOKEN) return fail(503, 'Saving is not set up (GITHUB_TOKEN missing).');
      const r = await gh(env, `/contents/${encodeURI(path)}`, {
        method: 'PUT',
        body: JSON.stringify({
          message, content: toB64(content), branch: 'main', ...(sha ? { sha } : {}),
          committer: { name: '237 Charts Admin', email: 'admin@users.noreply.237charts' },
          author: { name: `${user.name} (237 Charts Admin)`, email: 'admin@users.noreply.237charts' },
        }),
      });
      if (r.status === 409 || r.status === 422) return fail(409, 'Someone else changed this file. Reload and try again.');
      if (!r.ok) return fail(502, `GitHub refused the save (${r.status}).`);
      const j = await r.json();
      return json({ ok: true, sha: j.content?.sha, commit: j.commit?.html_url });
    }

    if (route === 'history' && request.method === 'GET') {
      const r = await gh(env, '/commits?path=admin&per_page=30');
      if (!r.ok) return fail(502, `GitHub ${r.status}`);
      const items = (await r.json()).map((c) => ({
        sha: c.sha.slice(0, 7), url: c.html_url, date: c.commit.author.date,
        message: c.commit.message.split('\n')[0], author: c.commit.author.name.replace(/ \(237 Charts Admin\)$/, ''),
      }));
      return json({ items });
    }

    if (route === 'runs' && request.method === 'GET') {
      const r = await gh(env, `/actions/workflows/${WORKFLOW}/runs?per_page=10`);
      if (!r.ok) return fail(502, `GitHub ${r.status}`);
      const runs = (await r.json()).workflow_runs.map((w) => ({
        id: w.id, url: w.html_url, event: w.event, status: w.status, conclusion: w.conclusion,
        started: w.run_started_at, updated: w.updated_at, title: w.display_title,
      }));
      return json({ runs });
    }

    if (route === 'run' && request.method === 'POST') {
      if (!can('editor')) return fail(403, 'Viewers cannot start a run.');
      if (env.DRY_WRITES === '1') return json({ dry: true });
      const r = await gh(env, `/actions/workflows/${WORKFLOW}/dispatches`, { method: 'POST', body: JSON.stringify({ ref: 'main' }) });
      if (!r.ok) return fail(502, `GitHub refused the run (${r.status}).`);
      return json({ ok: true });
    }

    return fail(404, 'Unknown admin route.');
  } catch (e) {
    return fail(502, `Couldn't reach GitHub: ${e.message}`);
  }
}
