export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      // Public comments: readers see only approved comments.
      if (url.pathname === '/api/comments' && request.method === 'GET') {
        const storyId = (url.searchParams.get('story_id') || '').trim();
        if (!storyId) return json({ error: 'story_id required' }, 400, cors);
        const { results } = await env.DB.prepare(
          `SELECT id, story_id, name, text, created_at FROM comments WHERE story_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 100`
        ).bind(storyId).all();
        return json({ comments: results }, 200, cors);
      }

      // Public comment submission: basic automatic adab/spam gate, then publish.
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
        return json({ ok: true, id, status: 'approved' }, 201, cors);
      }

      // Public story / achiever / improvement submissions always wait for admin review.
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

      // Everything below this point is private admin moderation.
      if (url.pathname.startsWith('/api/admin/')) {
        const auth = checkAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, cors);

        if (url.pathname === '/api/admin/comments' && request.method === 'GET') {
          const status = normalizeStatus(url.searchParams.get('status'), ['approved', 'hidden', 'pending'], 'all');
          const storyId = clean(url.searchParams.get('story_id') || '', 100);
          let sql = `SELECT id, story_id, name, text, status, created_at FROM comments`;
          const values = [];
          const where = [];
          if (status !== 'all') { where.push('status = ?'); values.push(status); }
          if (storyId) { where.push('story_id = ?'); values.push(storyId); }
          if (where.length) sql += ' WHERE ' + where.join(' AND ');
          sql += ' ORDER BY created_at DESC LIMIT 300';
          const { results } = await env.DB.prepare(sql).bind(...values).all();
          return json({ comments: results }, 200, cors);
        }

        if (url.pathname === '/api/admin/submissions' && request.method === 'GET') {
          const status = normalizeStatus(url.searchParams.get('status'), ['pending', 'approved', 'hidden', 'rejected'], 'all');
          let sql = `SELECT id, type, title, details, status, created_at FROM submissions`;
          const values = [];
          if (status !== 'all') { sql += ' WHERE status = ?'; values.push(status); }
          sql += ' ORDER BY created_at DESC LIMIT 300';
          const { results } = await env.DB.prepare(sql).bind(...values).all();
          return json({ submissions: results }, 200, cors);
        }

        const commentMatch = url.pathname.match(/^\/api\/admin\/comments\/([^/]+)$/);
        if (commentMatch && request.method === 'PATCH') {
          const id = clean(decodeURIComponent(commentMatch[1]), 100);
          const body = await request.json();
          const status = normalizeStatus(body.status, ['approved', 'hidden', 'pending']);
          if (!status) return json({ error: 'status must be approved, hidden or pending' }, 400, cors);
          const result = await env.DB.prepare(`UPDATE comments SET status = ? WHERE id = ?`).bind(status, id).run();
          if (!changed(result)) return json({ error: 'comment not found' }, 404, cors);
          return json({ ok: true, id, status }, 200, cors);
        }
        if (commentMatch && request.method === 'DELETE') {
          const id = clean(decodeURIComponent(commentMatch[1]), 100);
          const result = await env.DB.prepare(`DELETE FROM comments WHERE id = ?`).bind(id).run();
          if (!changed(result)) return json({ error: 'comment not found' }, 404, cors);
          return json({ ok: true, id, deleted: true }, 200, cors);
        }

        const submissionMatch = url.pathname.match(/^\/api\/admin\/submissions\/([^/]+)$/);
        if (submissionMatch && request.method === 'PATCH') {
          const id = clean(decodeURIComponent(submissionMatch[1]), 100);
          const body = await request.json();
          const status = normalizeStatus(body.status, ['pending', 'approved', 'hidden', 'rejected']);
          if (!status) return json({ error: 'status must be pending, approved, hidden or rejected' }, 400, cors);
          const result = await env.DB.prepare(`UPDATE submissions SET status = ? WHERE id = ?`).bind(status, id).run();
          if (!changed(result)) return json({ error: 'submission not found' }, 404, cors);
          return json({ ok: true, id, status }, 200, cors);
        }
        if (submissionMatch && request.method === 'DELETE') {
          const id = clean(decodeURIComponent(submissionMatch[1]), 100);
          const result = await env.DB.prepare(`DELETE FROM submissions WHERE id = ?`).bind(id).run();
          if (!changed(result)) return json({ error: 'submission not found' }, 404, cors);
          return json({ ok: true, id, deleted: true }, 200, cors);
        }

        if (url.pathname === '/api/admin/health' && request.method === 'GET') {
          return json({ ok: true, service: 'AL-BUSHRA admin moderation', authenticated: true }, 200, cors);
        }

        return json({ error: 'Admin endpoint not found' }, 404, cors);
      }

      if (url.pathname === '/api/health') {
        return json({ ok: true, service: 'AL-BUSHRA community backend', moderation: 'enabled' }, 200, cors);
      }

      return json({ error: 'Not found' }, 404, cors);
    } catch (err) {
      console.error(err);
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

function checkAdmin(request, env) {
  if (!env.ADMIN_TOKEN) {
    return { ok: false, status: 503, error: 'Admin moderation is not configured yet.' };
  }
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerToken = (request.headers.get('X-Admin-Token') || '').trim();
  const token = bearer || headerToken;
  if (!token || token !== env.ADMIN_TOKEN) return { ok: false, status: 401, error: 'Invalid admin token' };
  return { ok: true };
}

function normalizeStatus(value, allowed, fallback = '') {
  const status = clean(value || '', 30).toLowerCase();
  if (!status && fallback) return fallback;
  return allowed.includes(status) ? status : '';
}

function changed(result) {
  return Number(result?.meta?.changes || result?.changes || 0) > 0;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}
