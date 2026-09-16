export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/api/comments' && request.method === 'GET') {
        const storyId = (url.searchParams.get('story_id') || '').trim();
        if (!storyId) return json({ error: 'story_id required' }, 400, cors);
        const { results } = await env.DB.prepare(
          `SELECT id, story_id, name, text, created_at FROM comments WHERE story_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 100`
        ).bind(storyId).all();
        return json({ comments: results }, 200, cors);
      }

      if (url.pathname === '/api/comments' && request.method === 'POST') {
        const body = await request.json();
        const storyId = clean(body.story_id, 100);
        const name = clean(body.name || 'Reader', 60);
        const text = clean(body.text, 700);
        if (!storyId || !text) return json({ error: 'story_id and text required' }, 400, cors);

        const moderation = moderate(text);
        if (!moderation.ok) return json({ error: 'Please rewrite the comment with Islamic adab.', reason: moderation.reason }, 400, cors);

        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO comments (id, story_id, name, text, status, created_at) VALUES (?, ?, ?, ?, 'approved', datetime('now'))`
        ).bind(id, storyId, name, text).run();
        return json({ ok: true, id }, 201, cors);
      }

      if (url.pathname === '/api/submissions' && request.method === 'POST') {
        const body = await request.json();
        const type = clean(body.type, 80);
        const title = clean(body.title, 140);
        const details = clean(body.details, 1800);
        if (!type || !title || !details) return json({ error: 'type, title and details required' }, 400, cors);

        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO submissions (id, type, title, details, status, created_at) VALUES (?, ?, ?, ?, 'pending', datetime('now'))`
        ).bind(id, type, title, details).run();
        return json({ ok: true, id, status: 'pending' }, 201, cors);
      }

      if (url.pathname === '/api/health') return json({ ok: true, service: 'AL-BUSHRA community backend' }, 200, cors);
      return json({ error: 'Not found' }, 404, cors);
    } catch (err) {
      return json({ error: 'Server error' }, 500, cors);
    }
  }
};

function clean(value, max) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function moderate(text) {
  const lower = text.toLowerCase();
  const blocked = [
    'idiot','stupid','fool','shut up','kill yourself','porn','xxx',
    'takfir','kafir because','you are kafir','sectarian abuse'
  ];
  if (blocked.some(x => lower.includes(x))) return { ok: false, reason: 'inappropriate language' };
  if ((text.match(/https?:\/\//g) || []).length > 2) return { ok: false, reason: 'too many links' };
  return { ok: true };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}
