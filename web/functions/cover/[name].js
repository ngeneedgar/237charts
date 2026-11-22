// Public chart covers from Cloudflare R2 (binding COVERS): GET /cover/<chart>.jpg
// Uploaded by the team in the admin (Covers). If a chart has no custom cover, a 1×1 transparent
// image is returned, so the page simply shows the drawn gradient cover underneath.
const EMPTY = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='), (c) => c.charCodeAt(0));

export async function onRequestGet({ params, env, request }) {
  const name = String(params.name || '');
  if (!/^[a-z0-9-]+\.jpg$/.test(name)) return new Response('Not found', { status: 404 });
  const obj = env.COVERS ? await env.COVERS.get(`covers/${name}`) : null;
  if (!obj) {
    return new Response(EMPTY, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=300' } });
  }
  const etag = obj.httpEtag;
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { etag } });
  return new Response(obj.body, {
    headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', etag, 'cache-control': 'public, max-age=300' },
  });
}
