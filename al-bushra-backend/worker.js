const FARD_SERVICES = ['janazah','transport','new-muslim','quran','practical-care','skills','general'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token, X-FARD-Token, X-FARD-Verifier-Token',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      await ensureSchema(env.DB);

      // ---------- Existing AL-BUSHRA community routes ----------
      if (url.pathname === '/api/comments' && request.method === 'GET') {
        const storyId = clean(url.searchParams.get('story_id') || '', 100);
        if (!storyId) return json({ error: 'story_id required' }, 400, cors);
        const { results } = await env.DB.prepare(
          `SELECT id, story_id, name, text, created_at
           FROM comments
           WHERE story_id = ? AND status = 'approved'
           ORDER BY created_at DESC LIMIT 100`
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
          `INSERT INTO comments (id, story_id, name, text, status, created_at)
           VALUES (?, ?, ?, ?, 'pending', datetime('now'))`
        ).bind(id, storyId, name, text).run();
        return json({ ok: true, id, status: 'pending', message: 'Comment received for moderation.' }, 201, cors);
      }

      if (url.pathname === '/api/submissions' && request.method === 'POST') {
        const body = await request.json();
        const type = clean(body.type, 80);
        const title = clean(body.title, 140);
        const details = clean(body.details, 1800);
        if (!type || !title || !details) return json({ error: 'type, title and details required' }, 400, cors);
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO submissions (id, type, title, details, status, created_at)
           VALUES (?, ?, ?, ?, 'pending', datetime('now'))`
        ).bind(id, type, title, details).run();
        return json({ ok: true, id, status: 'pending' }, 201, cors);
      }

      // ---------- FARD public intake ----------
      if (url.pathname === '/api/fard/requests' && request.method === 'POST') {
        const body = await request.json();
        const serviceKey = normalizeService(body.service_key);
        const title = clean(body.title, 140);
        const area = clean(body.area, 120);
        const timing = clean(body.timing, 120);
        const priority = normalizeStatus(body.priority, ['normal','soon','urgent'], 'normal');
        const recurrence = normalizeStatus(body.recurrence, ['one-time','daily','weekly','monthly','as-needed'], 'one-time');
        const details = clean(body.details, 2200);
        const tasks = cleanArray(body.tasks, 16, 90);
        const preferredLanguage = clean(body.preferred_language, 80);
        const verifierName = clean(body.verifier_name, 140);
        const contactName = clean(body.contact_name || 'Requester', 100);
        const contactMethod = normalizeContactMethod(body.contact_method);
        const contactValue = clean(body.contact_value, 180);
        if (!serviceKey || !title || !area || !details || !contactMethod || !contactValue) {
          return json({ error: 'service_key, title, area, details, contact_method and contact_value are required' }, 400, cors);
        }
        const moderation = moderate(title + ' ' + details);
        if (!moderation.ok) return json({ error: 'Please rewrite the request respectfully.', reason: moderation.reason }, 400, cors);

        const id = crypto.randomUUID();
        const refCode = makeRef('REQ');
        const manageToken = randomToken(24);
        const manageHash = await sha256(manageToken);
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO fard_requests
             (id, ref_code, service_key, title, area, timing, priority, recurrence, details, tasks, preferred_language, verifier_name,
              verification_status, status, manage_token_hash, completed_occurrences, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, 0, datetime('now'), datetime('now'))`
          ).bind(id, refCode, serviceKey, title, area, timing, priority, recurrence, details, JSON.stringify(tasks), preferredLanguage, verifierName, manageHash),
          env.DB.prepare(
            `INSERT INTO fard_private_contacts
             (subject_type, subject_id, contact_name, contact_method, contact_value, created_at)
             VALUES ('request', ?, ?, ?, ?, datetime('now'))`
          ).bind(id, contactName, contactMethod, contactValue)
        ]);
        return json({
          ok: true, id, ref_code: refCode, status: 'pending', verification_status: 'pending',
          manage_token: manageToken,
          message: 'FARD request received for verification. Save the private management key; it is shown only now.'
        }, 201, cors);
      }

      if (url.pathname === '/api/fard/volunteers' && request.method === 'POST') {
        const body = await request.json();
        const serviceKey = normalizeService(body.service_key);
        const serviceType = clean(body.service_type, 140);
        const area = clean(body.area, 120);
        const availability = clean(body.availability, 180);
        const languages = cleanArray(body.languages, 10, 60);
        const capabilities = cleanArray(body.capabilities, 20, 90);
        const details = clean(body.details, 1800);
        const verifierName = clean(body.verifier_name, 140);
        const contactName = clean(body.contact_name || 'Volunteer', 100);
        const contactMethod = normalizeContactMethod(body.contact_method);
        const contactValue = clean(body.contact_value, 180);
        if (!serviceKey || !serviceType || !area || !availability || !contactMethod || !contactValue) {
          return json({ error: 'service_key, service_type, area, availability, contact_method and contact_value are required' }, 400, cors);
        }
        const moderation = moderate(serviceType + ' ' + details);
        if (!moderation.ok) return json({ error: 'Please rewrite the volunteer profile respectfully.', reason: moderation.reason }, 400, cors);

        const id = crypto.randomUUID();
        const refCode = makeRef('VOL');
        const manageToken = randomToken(24);
        const manageHash = await sha256(manageToken);
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO fard_volunteers
             (id, ref_code, service_key, service_type, area, availability, languages, capabilities, details, verifier_name,
              verification_status, status, manage_token_hash, completed_services, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, 0, datetime('now'), datetime('now'))`
          ).bind(id, refCode, serviceKey, serviceType, area, availability, JSON.stringify(languages), JSON.stringify(capabilities), details, verifierName, manageHash),
          env.DB.prepare(
            `INSERT INTO fard_private_contacts
             (subject_type, subject_id, contact_name, contact_method, contact_value, created_at)
             VALUES ('volunteer', ?, ?, ?, ?, datetime('now'))`
          ).bind(id, contactName, contactMethod, contactValue)
        ]);
        return json({
          ok: true, id, ref_code: refCode, status: 'pending', verification_status: 'pending',
          manage_token: manageToken,
          message: 'FARD volunteer profile received for verification. Save the private management key; it is shown only now.'
        }, 201, cors);
      }

      const statusMatch = url.pathname.match(/^\/api\/fard\/status\/(request|volunteer)\/([^/]+)$/);
      if (statusMatch && request.method === 'GET') {
        const subjectType = statusMatch[1];
        const id = clean(decodeURIComponent(statusMatch[2]), 100);
        const token = getFardToken(request, url);
        const owner = await getFardOwner(env.DB, subjectType, id);
        if (!owner) return json({ error: 'FARD entry not found' }, 404, cors);
        if (!token || !(await tokenMatches(token, owner.manage_token_hash))) return json({ error: 'Invalid private management key' }, 401, cors);
        const matches = await getOwnerMatches(env.DB, subjectType, owner.id);
        const enriched = [];
        for (const m of matches) enriched.push(await publicMatchForOwner(env.DB, subjectType, owner.id, m));
        return json({
          ok: true,
          entry: publicOwnerEntry(subjectType, owner),
          matches: enriched
        }, 200, cors);
      }

      const respondMatch = url.pathname.match(/^\/api\/fard\/matches\/([^/]+)\/respond$/);
      if (respondMatch && request.method === 'POST') {
        const matchId = clean(decodeURIComponent(respondMatch[1]), 100);
        const body = await request.json();
        const subjectType = body.subject_type === 'request' ? 'request' : body.subject_type === 'volunteer' ? 'volunteer' : '';
        const subjectId = clean(body.subject_id, 100);
        const token = clean(body.manage_token || getFardToken(request, url), 300);
        const decision = normalizeStatus(body.decision, ['accepted','declined']);
        if (!subjectType || !subjectId || !token || !decision) return json({ error: 'subject_type, subject_id, manage_token and decision are required' }, 400, cors);

        const owner = await getFardOwner(env.DB, subjectType, subjectId);
        if (!owner || !(await tokenMatches(token, owner.manage_token_hash))) return json({ error: 'Invalid private management key' }, 401, cors);
        const m = await env.DB.prepare(`SELECT * FROM fard_matches WHERE id = ?`).bind(matchId).first();
        if (!m) return json({ error: 'match not found' }, 404, cors);
        if ((subjectType === 'request' && m.request_id !== subjectId) || (subjectType === 'volunteer' && m.volunteer_id !== subjectId)) {
          return json({ error: 'This match does not belong to that FARD entry' }, 403, cors);
        }
        if (['declined','cancelled','completed'].includes(m.status)) return json({ error: 'This match is already closed' }, 409, cors);

        if (subjectType === 'request') {
          await env.DB.prepare(`UPDATE fard_matches SET requester_response = ?, updated_at = datetime('now') WHERE id = ?`).bind(decision, matchId).run();
        } else {
          await env.DB.prepare(`UPDATE fard_matches SET volunteer_response = ?, updated_at = datetime('now') WHERE id = ?`).bind(decision, matchId).run();
        }
        const fresh = await env.DB.prepare(`SELECT * FROM fard_matches WHERE id = ?`).bind(matchId).first();
        let status = 'offered';
        if (fresh.requester_response === 'declined' || fresh.volunteer_response === 'declined') status = 'declined';
        else if (fresh.requester_response === 'accepted' && fresh.volunteer_response === 'accepted') status = 'connected';
        else if (fresh.requester_response === 'accepted') status = 'accepted_requester';
        else if (fresh.volunteer_response === 'accepted') status = 'accepted_volunteer';
        await env.DB.prepare(`UPDATE fard_matches SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(status, matchId).run();
        if (status === 'declined') {
          await env.DB.batch([
            env.DB.prepare(`UPDATE fard_requests SET status='approved', updated_at=datetime('now') WHERE id=? AND status='matched'`).bind(fresh.request_id),
            env.DB.prepare(`UPDATE fard_volunteers SET status='approved', updated_at=datetime('now') WHERE id=? AND status='matched'`).bind(fresh.volunteer_id)
          ]);
        }
        const finalMatch = await env.DB.prepare(`SELECT * FROM fard_matches WHERE id = ?`).bind(matchId).first();
        return json({ ok: true, match: await publicMatchForOwner(env.DB, subjectType, subjectId, finalMatch) }, 200, cors);
      }


      // ---------- FARD Phase 3: organisations, safeguarding and completion ----------
      if (url.pathname === '/api/fard/organizations' && request.method === 'POST') {
        const body = await request.json();
        const name = clean(body.name, 160);
        const orgType = clean(body.org_type, 80);
        const area = clean(body.area, 140);
        const representative = clean(body.representative, 120);
        const contactMethod = normalizeContactMethod(body.contact_method);
        const contactValue = clean(body.contact_value, 180);
        const serviceScopes = cleanArray(body.service_scopes, 10, 40).map(normalizeService).filter(Boolean);
        const details = clean(body.details, 1800);
        if (!name || !orgType || !area || !representative || !contactMethod || !contactValue) {
          return json({ error: 'name, org_type, area, representative, contact_method and contact_value are required' }, 400, cors);
        }
        const id = crypto.randomUUID();
        const refCode = makeRef('ORG');
        const manageToken = randomToken(24);
        const tokenHash = await sha256(manageToken);
        await env.DB.prepare(
          `INSERT INTO fard_organizations
           (id, ref_code, name, org_type, area, representative, contact_method, contact_value, service_scopes, details,
            status, verifier_status, manage_token_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, datetime('now'), datetime('now'))`
        ).bind(id, refCode, name, orgType, area, representative, contactMethod, contactValue, JSON.stringify(serviceScopes), details, tokenHash).run();
        await addAudit(env.DB, 'organization', id, 'application_created', 'public', 'Organisation applied to become a FARD verifier.');
        return json({
          ok:true,id,ref_code:refCode,status:'pending',verifier_status:'pending',manage_token:manageToken,
          message:'Organisation application received. Save the private verifier key; it is shown only now.'
        },201,cors);
      }

      const orgStatusMatch = url.pathname.match(/^\/api\/fard\/organizations\/status\/([^/]+)$/);
      if (orgStatusMatch && request.method === 'GET') {
        const ref = clean(decodeURIComponent(orgStatusMatch[1]),100);
        const token = getVerifierToken(request,url);
        const org = await env.DB.prepare(`SELECT * FROM fard_organizations WHERE id=? OR ref_code=? LIMIT 1`).bind(ref,ref).first();
        if (!org) return json({error:'organisation not found'},404,cors);
        if (!token || !(await tokenMatches(token,org.manage_token_hash))) return json({error:'Invalid private verifier key'},401,cors);
        return json({ok:true,organization:publicOrganization(org)},200,cors);
      }

      if (url.pathname === '/api/fard/verifier/verify' && request.method === 'POST') {
        const body = await request.json();
        const orgRef = clean(body.organization_ref,100);
        const subjectType = body.subject_type === 'request' ? 'request' : body.subject_type === 'volunteer' ? 'volunteer' : '';
        const subjectRef = clean(body.subject_ref,100);
        const decision = normalizeStatus(body.decision,['verified','rejected']);
        const notes = clean(body.notes,900);
        const token = clean(body.verifier_token || getVerifierToken(request,url),300);
        if (!orgRef || !subjectType || !subjectRef || !decision || !token) return json({error:'organization_ref, subject_type, subject_ref, decision and verifier key are required'},400,cors);
        const org = await env.DB.prepare(`SELECT * FROM fard_organizations WHERE id=? OR ref_code=? LIMIT 1`).bind(orgRef,orgRef).first();
        if (!org || org.status!=='approved' || org.verifier_status!=='active') return json({error:'Organisation is not an active FARD verifier'},403,cors);
        if (!(await tokenMatches(token,org.manage_token_hash))) return json({error:'Invalid private verifier key'},401,cors);
        const subject = await getFardOwner(env.DB,subjectType,subjectRef);
        if (!subject) return json({error:'FARD entry not found'},404,cors);
        const scopes=parseJson(org.service_scopes,[]);
        if (scopes.length && !scopes.includes(subject.service_key)) return json({error:'This organisation is not approved to verify that FARD service area'},403,cors);
        const verificationStatus = decision==='verified' ? 'community_verified' : 'rejected';
        const table = subjectType==='request' ? 'fard_requests' : 'fard_volunteers';
        await env.DB.batch([
          env.DB.prepare(`UPDATE ${table} SET verification_status=?, updated_at=datetime('now') WHERE id=?`).bind(verificationStatus,subject.id),
          env.DB.prepare(
            `INSERT INTO fard_verifications
             (id, organization_id, subject_type, subject_id, decision, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          ).bind(crypto.randomUUID(),org.id,subjectType,subject.id,decision,notes)
        ]);
        await addAudit(env.DB,subjectType,subject.id,'community_verification_'+decision,'organization:'+org.id,notes||org.name);
        return json({ok:true,subject_type:subjectType,subject_ref:subject.ref_code,verification_status:verificationStatus},200,cors);
      }

      if (url.pathname === '/api/fard/incidents' && request.method === 'POST') {
        const body = await request.json();
        const subjectType = body.subject_type === 'request' ? 'request' : body.subject_type === 'volunteer' ? 'volunteer' : '';
        const subjectRef = clean(body.subject_ref,100);
        const matchId = clean(body.match_id,100);
        const token = clean(body.manage_token || getFardToken(request,url),300);
        const category = normalizeStatus(body.category,['safety','privacy','money','harassment','misrepresentation','boundary','service-quality','other']);
        const severity = normalizeStatus(body.severity,['low','medium','high','critical']);
        const details = clean(body.details,2200);
        if (!subjectType || !subjectRef || !token || !category || !severity || !details) return json({error:'subject_type, subject_ref, management key, category, severity and details are required'},400,cors);
        const owner = await getFardOwner(env.DB,subjectType,subjectRef);
        if (!owner || !(await tokenMatches(token,owner.manage_token_hash))) return json({error:'Invalid private management key'},401,cors);
        let match=null;
        if (matchId) {
          match=await env.DB.prepare(`SELECT * FROM fard_matches WHERE id=?`).bind(matchId).first();
          if (!match) return json({error:'match not found'},404,cors);
          const belongs = subjectType==='request' ? match.request_id===owner.id : match.volunteer_id===owner.id;
          if (!belongs) return json({error:'This match does not belong to your FARD entry'},403,cors);
        }
        const id=crypto.randomUUID(),refCode=makeRef('INC');
        await env.DB.prepare(
          `INSERT INTO fard_incidents
           (id, ref_code, reporter_type, reporter_id, match_id, category, severity, details, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))`
        ).bind(id,refCode,subjectType,owner.id,matchId||null,category,severity,details).run();
        if (match && ['high','critical'].includes(severity) && !['completed','cancelled','declined'].includes(match.status)) {
          await env.DB.prepare(`UPDATE fard_matches SET status='safety_hold', updated_at=datetime('now') WHERE id=?`).bind(match.id).run();
        }
        await addAudit(env.DB,'incident',id,'incident_reported',subjectType+':'+owner.id,category+' / '+severity);
        return json({ok:true,ref_code:refCode,status:'open',match_status:match&&['high','critical'].includes(severity)?'safety_hold':undefined},201,cors);
      }

      const completeMatch = url.pathname.match(/^\/api\/fard\/matches\/([^/]+)\/complete$/);
      if (completeMatch && request.method === 'POST') {
        const matchId=clean(decodeURIComponent(completeMatch[1]),100);
        const body=await request.json();
        const subjectType=body.subject_type==='request'?'request':body.subject_type==='volunteer'?'volunteer':'';
        const subjectRef=clean(body.subject_ref,100);
        const token=clean(body.manage_token||getFardToken(request,url),300);
        const note=clean(body.note,900);
        if(!subjectType||!subjectRef||!token) return json({error:'subject_type, subject_ref and management key are required'},400,cors);
        const owner=await getFardOwner(env.DB,subjectType,subjectRef);
        if(!owner||!(await tokenMatches(token,owner.manage_token_hash))) return json({error:'Invalid private management key'},401,cors);
        const m=await env.DB.prepare(`SELECT * FROM fard_matches WHERE id=?`).bind(matchId).first();
        if(!m) return json({error:'match not found'},404,cors);
        const belongs=subjectType==='request'?m.request_id===owner.id:m.volunteer_id===owner.id;
        if(!belongs) return json({error:'This match does not belong to your FARD entry'},403,cors);
        if(!['connected','completed'].includes(m.status)) return json({error:'Only a connected match can be completed'},409,cors);
        if(subjectType==='request'){
          await env.DB.prepare(`UPDATE fard_matches SET requester_completed_at=COALESCE(requester_completed_at,datetime('now')), updated_at=datetime('now') WHERE id=?`).bind(matchId).run();
        } else {
          await env.DB.prepare(`UPDATE fard_matches SET volunteer_completed_at=COALESCE(volunteer_completed_at,datetime('now')), updated_at=datetime('now') WHERE id=?`).bind(matchId).run();
        }
        await env.DB.prepare(
          `INSERT INTO fard_feedback (id,match_id,author_type,author_id,outcome,note,created_at)
           VALUES (?, ?, ?, ?, 'completed', ?, datetime('now'))`
        ).bind(crypto.randomUUID(),matchId,subjectType,owner.id,note).run();
        const fresh=await env.DB.prepare(`SELECT * FROM fard_matches WHERE id=?`).bind(matchId).first();
        let status=fresh.status;
        if(fresh.requester_completed_at&&fresh.volunteer_completed_at&&fresh.status!=='completed'){
          status='completed';
          const recurringRequest=await env.DB.prepare(`SELECT recurrence FROM fard_requests WHERE id=?`).bind(fresh.request_id).first();
          const requestNextStatus=recurringRequest&&recurringRequest.recurrence&&recurringRequest.recurrence!=='one-time'?'approved':'completed';
          await env.DB.batch([
            env.DB.prepare(`UPDATE fard_matches SET status='completed', updated_at=datetime('now') WHERE id=?`).bind(matchId),
            env.DB.prepare(`UPDATE fard_requests SET status=?, completed_occurrences=completed_occurrences+1, updated_at=datetime('now') WHERE id=?`).bind(requestNextStatus,fresh.request_id),
            env.DB.prepare(`UPDATE fard_volunteers SET status='approved', completed_services=completed_services+1, updated_at=datetime('now') WHERE id=?`).bind(fresh.volunteer_id)
          ]);
          await addAudit(env.DB,'match',matchId,'service_completed','system',requestNextStatus==='approved'?'Both sides confirmed this occurrence; recurring request returned to matching pool.':'Both sides confirmed completion.');
        }
        return json({ok:true,status,requester_confirmed:!!fresh.requester_completed_at,volunteer_confirmed:!!fresh.volunteer_completed_at},200,cors);
      }

      // ---------- Admin moderation and FARD operations ----------
      if (url.pathname.startsWith('/api/admin/')) {
        const auth = checkAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, cors);

        // Existing AL-BUSHRA admin routes
        if (url.pathname === '/api/admin/comments' && request.method === 'GET') {
          const status = normalizeStatus(url.searchParams.get('status'), ['approved','hidden','pending'], 'all');
          const storyId = clean(url.searchParams.get('story_id') || '', 100);
          let sql = `SELECT id, story_id, name, text, status, created_at FROM comments`;
          const values = [], where = [];
          if (status !== 'all') { where.push('status = ?'); values.push(status); }
          if (storyId) { where.push('story_id = ?'); values.push(storyId); }
          if (where.length) sql += ' WHERE ' + where.join(' AND ');
          sql += ` ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC LIMIT 300`;
          const { results } = await env.DB.prepare(sql).bind(...values).all();
          return json({ comments: results }, 200, cors);
        }

        if (url.pathname === '/api/admin/submissions' && request.method === 'GET') {
          const status = normalizeStatus(url.searchParams.get('status'), ['pending','approved','hidden','rejected'], 'all');
          let sql = `SELECT id, type, title, details, status, created_at FROM submissions`;
          const values = [];
          if (status !== 'all') { sql += ' WHERE status = ?'; values.push(status); }
          sql += ` ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'hidden' THEN 2 ELSE 3 END, created_at DESC LIMIT 300`;
          const { results } = await env.DB.prepare(sql).bind(...values).all();
          return json({ submissions: results }, 200, cors);
        }

        const commentMatch = url.pathname.match(/^\/api\/admin\/comments\/([^/]+)$/);
        if (commentMatch && request.method === 'PATCH') {
          const id = clean(decodeURIComponent(commentMatch[1]), 100);
          const body = await request.json();
          const status = normalizeStatus(body.status, ['approved','hidden','pending']);
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
          const status = normalizeStatus(body.status, ['pending','approved','hidden','rejected']);
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

        // FARD admin: list requests / volunteers / matches
        if (url.pathname === '/api/admin/fard/requests' && request.method === 'GET') {
          const status = normalizeStatus(url.searchParams.get('status'), ['pending','approved','matched','completed','cancelled','hidden','rejected'], 'all');
          const verification = normalizeStatus(url.searchParams.get('verification'), ['pending','community_verified','skill_verified','rejected'], 'all');
          let sql = `SELECT r.*, c.contact_name, c.contact_method, c.contact_value
                     FROM fard_requests r
                     LEFT JOIN fard_private_contacts c ON c.subject_type='request' AND c.subject_id=r.id`;
          const where = [], values = [];
          if (status !== 'all') { where.push('r.status = ?'); values.push(status); }
          if (verification !== 'all') { where.push('r.verification_status = ?'); values.push(verification); }
          if (where.length) sql += ' WHERE ' + where.join(' AND ');
          sql += ` ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'matched' THEN 2 ELSE 3 END, r.created_at DESC LIMIT 500`;
          const { results } = await env.DB.prepare(sql).bind(...values).all();
          return json({ requests: results.map(adminRequest) }, 200, cors);
        }

        if (url.pathname === '/api/admin/fard/volunteers' && request.method === 'GET') {
          const status = normalizeStatus(url.searchParams.get('status'), ['pending','approved','matched','completed','cancelled','hidden','rejected','suspended'], 'all');
          const verification = normalizeStatus(url.searchParams.get('verification'), ['pending','community_verified','skill_verified','rejected'], 'all');
          let sql = `SELECT v.*, c.contact_name, c.contact_method, c.contact_value
                     FROM fard_volunteers v
                     LEFT JOIN fard_private_contacts c ON c.subject_type='volunteer' AND c.subject_id=v.id`;
          const where = [], values = [];
          if (status !== 'all') { where.push('v.status = ?'); values.push(status); }
          if (verification !== 'all') { where.push('v.verification_status = ?'); values.push(verification); }
          if (where.length) sql += ' WHERE ' + where.join(' AND ');
          sql += ` ORDER BY CASE v.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'matched' THEN 2 ELSE 3 END, v.created_at DESC LIMIT 500`;
          const { results } = await env.DB.prepare(sql).bind(...values).all();
          return json({ volunteers: results.map(adminVolunteer) }, 200, cors);
        }

        if (url.pathname === '/api/admin/fard/matches' && request.method === 'GET') {
          const { results } = await env.DB.prepare(
            `SELECT m.*, r.ref_code AS request_ref, r.title AS request_title, r.area AS request_area,
                    v.ref_code AS volunteer_ref, v.service_type AS volunteer_service, v.area AS volunteer_area
             FROM fard_matches m
             JOIN fard_requests r ON r.id=m.request_id
             JOIN fard_volunteers v ON v.id=m.volunteer_id
             ORDER BY m.created_at DESC LIMIT 500`
          ).all();
          return json({ matches: results }, 200, cors);
        }

        if (url.pathname === '/api/admin/fard/suggestions' && request.method === 'GET') {
          const requestId = clean(url.searchParams.get('request_id') || '', 100);
          if (!requestId) return json({ error: 'request_id required' }, 400, cors);
          const r = await env.DB.prepare(`SELECT * FROM fard_requests WHERE id = ?`).bind(requestId).first();
          if (!r) return json({ error: 'request not found' }, 404, cors);
          if (r.status !== 'approved' || !['community_verified','skill_verified'].includes(r.verification_status)) {
            return json({ error: 'Request must be approved and verified before matching' }, 409, cors);
          }
          const { results } = await env.DB.prepare(
            `SELECT v.* FROM fard_volunteers v
             WHERE v.service_key = ? AND v.status = 'approved'
             AND v.verification_status IN ('community_verified','skill_verified')
             AND NOT EXISTS (
               SELECT 1 FROM fard_incidents i
               JOIN fard_matches fm ON fm.id=i.match_id
               WHERE fm.volunteer_id=v.id AND i.status IN ('open','reviewing') AND i.severity IN ('high','critical')
             )
             ORDER BY v.completed_services DESC, v.created_at DESC LIMIT 200`
          ).bind(r.service_key).all();
          const suggestions = results.map(v => scoreSuggestion(r, v)).filter(x => x.score > 0).sort((a,b)=>b.score-a.score).slice(0,25);
          return json({ request: adminRequest(r), suggestions }, 200, cors);
        }

        if (url.pathname === '/api/admin/fard/matches' && request.method === 'POST') {
          const body = await request.json();
          const requestId = clean(body.request_id, 100);
          const volunteerId = clean(body.volunteer_id, 100);
          if (!requestId || !volunteerId) return json({ error: 'request_id and volunteer_id required' }, 400, cors);
          const [r,v] = await Promise.all([
            env.DB.prepare(`SELECT * FROM fard_requests WHERE id = ?`).bind(requestId).first(),
            env.DB.prepare(`SELECT * FROM fard_volunteers WHERE id = ?`).bind(volunteerId).first()
          ]);
          if (!r || !v) return json({ error: 'request or volunteer not found' }, 404, cors);
          if (r.service_key !== v.service_key) return json({ error: 'service areas do not match' }, 409, cors);
          if (r.status !== 'approved' || v.status !== 'approved') return json({ error: 'Both entries must be approved first' }, 409, cors);
          if (!['community_verified','skill_verified'].includes(r.verification_status) || !['community_verified','skill_verified'].includes(v.verification_status)) {
            return json({ error: 'Both entries must be verified first' }, 409, cors);
          }
          const existing = await env.DB.prepare(
            `SELECT id, status FROM fard_matches
             WHERE request_id=? AND volunteer_id=? AND status NOT IN ('declined','cancelled','completed') LIMIT 1`
          ).bind(requestId, volunteerId).first();
          if (existing) return json({ error: 'An active match already exists', match_id: existing.id }, 409, cors);
          const scored = scoreSuggestion(r,v);
          const id = crypto.randomUUID();
          await env.DB.prepare(
            `INSERT INTO fard_matches
             (id, request_id, volunteer_id, score, status, requester_response, volunteer_response, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'offered', 'pending', 'pending', datetime('now'), datetime('now'))`
          ).bind(id, requestId, volunteerId, scored.score).run();
          await env.DB.batch([
            env.DB.prepare(`UPDATE fard_requests SET status='matched', updated_at=datetime('now') WHERE id=?`).bind(requestId),
            env.DB.prepare(`UPDATE fard_volunteers SET status='matched', updated_at=datetime('now') WHERE id=?`).bind(volunteerId)
          ]);
          return json({ ok: true, match_id: id, status: 'offered', score: scored.score, reasons: scored.reasons }, 201, cors);
        }

        const fardReqMatch = url.pathname.match(/^\/api\/admin\/fard\/requests\/([^/]+)$/);
        if (fardReqMatch && request.method === 'PATCH') {
          const id = clean(decodeURIComponent(fardReqMatch[1]), 100);
          const body = await request.json();
          const status = body.status ? normalizeStatus(body.status, ['pending','approved','matched','completed','cancelled','hidden','rejected']) : '';
          const verification = body.verification_status ? normalizeStatus(body.verification_status, ['pending','community_verified','skill_verified','rejected']) : '';
          if (!status && !verification) return json({ error: 'valid status or verification_status required' }, 400, cors);
          if (status) await env.DB.prepare(`UPDATE fard_requests SET status=?, updated_at=datetime('now') WHERE id=?`).bind(status,id).run();
          if (verification) await env.DB.prepare(`UPDATE fard_requests SET verification_status=?, updated_at=datetime('now') WHERE id=?`).bind(verification,id).run();
          return json({ ok:true,id,status:status||undefined,verification_status:verification||undefined },200,cors);
        }

        const fardVolMatch = url.pathname.match(/^\/api\/admin\/fard\/volunteers\/([^/]+)$/);
        if (fardVolMatch && request.method === 'PATCH') {
          const id = clean(decodeURIComponent(fardVolMatch[1]), 100);
          const body = await request.json();
          const status = body.status ? normalizeStatus(body.status, ['pending','approved','matched','completed','cancelled','hidden','rejected','suspended']) : '';
          const verification = body.verification_status ? normalizeStatus(body.verification_status, ['pending','community_verified','skill_verified','rejected']) : '';
          if (!status && !verification) return json({ error: 'valid status or verification_status required' }, 400, cors);
          if (status) await env.DB.prepare(`UPDATE fard_volunteers SET status=?, updated_at=datetime('now') WHERE id=?`).bind(status,id).run();
          if (verification) await env.DB.prepare(`UPDATE fard_volunteers SET verification_status=?, updated_at=datetime('now') WHERE id=?`).bind(verification,id).run();
          return json({ ok:true,id,status:status||undefined,verification_status:verification||undefined },200,cors);
        }

        const fardMatchPatch = url.pathname.match(/^\/api\/admin\/fard\/matches\/([^/]+)$/);
        if (fardMatchPatch && request.method === 'PATCH') {
          const id = clean(decodeURIComponent(fardMatchPatch[1]),100);
          const body = await request.json();
          const status = normalizeStatus(body.status,['offered','accepted_requester','accepted_volunteer','connected','completed','declined','cancelled','safety_hold']);
          if (!status) return json({error:'invalid match status'},400,cors);
          const m = await env.DB.prepare(`SELECT * FROM fard_matches WHERE id=?`).bind(id).first();
          if (!m) return json({error:'match not found'},404,cors);
          await env.DB.prepare(`UPDATE fard_matches SET status=?, updated_at=datetime('now') WHERE id=?`).bind(status,id).run();
          if (status === 'completed') {
            await env.DB.batch([
              env.DB.prepare(`UPDATE fard_requests SET status='completed', updated_at=datetime('now') WHERE id=?`).bind(m.request_id),
              env.DB.prepare(`UPDATE fard_volunteers SET status='approved', completed_services=completed_services+1, updated_at=datetime('now') WHERE id=?`).bind(m.volunteer_id)
            ]);
          } else if (['declined','cancelled'].includes(status)) {
            await env.DB.batch([
              env.DB.prepare(`UPDATE fard_requests SET status='approved', updated_at=datetime('now') WHERE id=? AND status='matched'`).bind(m.request_id),
              env.DB.prepare(`UPDATE fard_volunteers SET status='approved', updated_at=datetime('now') WHERE id=? AND status='matched'`).bind(m.volunteer_id)
            ]);
          }
          return json({ok:true,id,status},200,cors);
        }


        if (url.pathname === '/api/admin/fard/organizations' && request.method === 'GET') {
          const {results}=await env.DB.prepare(`SELECT * FROM fard_organizations ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC LIMIT 300`).all();
          return json({organizations:(results||[]).map(publicOrganizationAdmin)},200,cors);
        }

        const orgAdminMatch=url.pathname.match(/^\/api\/admin\/fard\/organizations\/([^/]+)$/);
        if(orgAdminMatch&&request.method==='PATCH'){
          const id=clean(decodeURIComponent(orgAdminMatch[1]),100);
          const body=await request.json();
          const status=body.status?normalizeStatus(body.status,['pending','approved','rejected','suspended']):'';
          const verifierStatus=body.verifier_status?normalizeStatus(body.verifier_status,['pending','active','suspended','revoked']):'';
          if(!status&&!verifierStatus) return json({error:'valid status or verifier_status required'},400,cors);
          if(status) await env.DB.prepare(`UPDATE fard_organizations SET status=?,updated_at=datetime('now') WHERE id=?`).bind(status,id).run();
          if(verifierStatus) await env.DB.prepare(`UPDATE fard_organizations SET verifier_status=?,updated_at=datetime('now') WHERE id=?`).bind(verifierStatus,id).run();
          await addAudit(env.DB,'organization',id,'admin_update','admin',JSON.stringify({status,verifierStatus}));
          return json({ok:true,id,status:status||undefined,verifier_status:verifierStatus||undefined},200,cors);
        }

        if (url.pathname === '/api/admin/fard/incidents' && request.method === 'GET') {
          const {results}=await env.DB.prepare(
            `SELECT i.*, m.request_id, m.volunteer_id
             FROM fard_incidents i
             LEFT JOIN fard_matches m ON m.id=i.match_id
             ORDER BY CASE i.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,
                      CASE i.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                      i.created_at DESC LIMIT 500`
          ).all();
          return json({incidents:results||[]},200,cors);
        }

        const incidentAdminMatch=url.pathname.match(/^\/api\/admin\/fard\/incidents\/([^/]+)$/);
        if(incidentAdminMatch&&request.method==='PATCH'){
          const id=clean(decodeURIComponent(incidentAdminMatch[1]),100);
          const body=await request.json();
          const status=normalizeStatus(body.status,['open','reviewing','resolved','dismissed']);
          const action=normalizeStatus(body.action||'none',['none','resume_match','cancel_match','suspend_volunteer']);
          const notes=clean(body.notes,1200);
          if(!status) return json({error:'valid incident status required'},400,cors);
          const inc=await env.DB.prepare(`SELECT * FROM fard_incidents WHERE id=?`).bind(id).first();
          if(!inc) return json({error:'incident not found'},404,cors);
          await env.DB.prepare(`UPDATE fard_incidents SET status=?,admin_notes=?,updated_at=datetime('now') WHERE id=?`).bind(status,notes,id).run();
          if(inc.match_id&&action==='resume_match') await env.DB.prepare(`UPDATE fard_matches SET status='connected',updated_at=datetime('now') WHERE id=? AND status='safety_hold'`).bind(inc.match_id).run();
          if(inc.match_id&&action==='cancel_match'){
            const m=await env.DB.prepare(`SELECT * FROM fard_matches WHERE id=?`).bind(inc.match_id).first();
            if(m){
              await env.DB.batch([
                env.DB.prepare(`UPDATE fard_matches SET status='cancelled',updated_at=datetime('now') WHERE id=?`).bind(m.id),
                env.DB.prepare(`UPDATE fard_requests SET status='approved',updated_at=datetime('now') WHERE id=? AND status='matched'`).bind(m.request_id),
                env.DB.prepare(`UPDATE fard_volunteers SET status='approved',updated_at=datetime('now') WHERE id=? AND status='matched'`).bind(m.volunteer_id)
              ]);
            }
          }
          if(inc.match_id&&action==='suspend_volunteer'){
            const m=await env.DB.prepare(`SELECT volunteer_id FROM fard_matches WHERE id=?`).bind(inc.match_id).first();
            if(m) await env.DB.prepare(`UPDATE fard_volunteers SET status='suspended',updated_at=datetime('now') WHERE id=?`).bind(m.volunteer_id).run();
          }
          await addAudit(env.DB,'incident',id,'admin_review','admin',JSON.stringify({status,action,notes}));
          return json({ok:true,id,status,action},200,cors);
        }

        if (url.pathname === '/api/admin/health' && request.method === 'GET') {
          return json({ ok:true, service:'AL-BUSHRA + FARD admin moderation', authenticated:true, fard_phase:'phase-3-trust-safeguarding-ready' }, 200, cors);
        }

        return json({ error: 'Admin endpoint not found' }, 404, cors);
      }

      if (url.pathname === '/api/health') {
        return json({
          ok: true,
          service: 'AL-BUSHRA community backend',
          moderation: 'admin-approval-required',
          fard: 'phase-3-trust-safeguarding-ready'
        }, 200, cors);
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
function cleanArray(value, maxItems, maxLen) {
  if (!Array.isArray(value)) {
    if (typeof value === 'string') value = value.split(',').map(x=>x.trim()).filter(Boolean);
    else return [];
  }
  return value.slice(0,maxItems).map(x=>clean(x,maxLen)).filter(Boolean);
}
function normalizeService(value) {
  const k = clean(value,40).toLowerCase();
  return FARD_SERVICES.includes(k) ? k : '';
}
function normalizeContactMethod(value) {
  const x=clean(value,30).toLowerCase();
  return ['phone','whatsapp','email','telegram','other'].includes(x)?x:'';
}
function moderate(text) {
  const lower = String(text || '').toLowerCase();
  const blocked = ['idiot','stupid','fool','shut up','kill yourself','porn','xxx','takfir','kafir because','you are kafir','sectarian abuse'];
  if (blocked.some(x=>lower.includes(x))) return {ok:false,reason:'inappropriate language'};
  if ((String(text||'').match(/https?:\/\//g)||[]).length>2) return {ok:false,reason:'too many links'};
  return {ok:true};
}
function checkAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return {ok:false,status:503,error:'Admin moderation is not configured yet.'};
  const auth=request.headers.get('Authorization')||'';
  const bearer=auth.startsWith('Bearer ')?auth.slice(7).trim():'';
  const headerToken=(request.headers.get('X-Admin-Token')||'').trim();
  const token=bearer||headerToken;
  if (!token || token!==env.ADMIN_TOKEN) return {ok:false,status:401,error:'Invalid admin token'};
  return {ok:true};
}
function normalizeStatus(value, allowed, fallback='') {
  const status=clean(value||'',40).toLowerCase();
  if (!status && fallback) return fallback;
  return allowed.includes(status)?status:'';
}
function changed(result){return Number(result?.meta?.changes||result?.changes||0)>0}
function json(data,status,headers){return new Response(JSON.stringify(data),{status,headers})}

function makeRef(prefix){
  const part=crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase();
  return `FARD-${prefix}-${part}`;
}
function randomToken(bytes=24){
  const a=new Uint8Array(bytes);crypto.getRandomValues(a);
  let s='';for(const b of a)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function sha256(text){
  const bytes=new TextEncoder().encode(String(text));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function tokenMatches(token,hash){return !!token && (await sha256(token))===hash}
function getFardToken(request,url){
  return clean(request.headers.get('X-FARD-Token')||url.searchParams.get('token')||'',300);
}
async function getFardOwner(db,type,id){
  if(type==='request') return db.prepare(`SELECT * FROM fard_requests WHERE id=? OR ref_code=? LIMIT 1`).bind(id,id).first();
  return db.prepare(`SELECT * FROM fard_volunteers WHERE id=? OR ref_code=? LIMIT 1`).bind(id,id).first();
}
function publicOwnerEntry(type,row){
  if(type==='request') return {
    type:'request',id:row.id,ref_code:row.ref_code,service_key:row.service_key,title:row.title,area:row.area,timing:row.timing,priority:row.priority||'normal',recurrence:row.recurrence||'one-time',completed_occurrences:Number(row.completed_occurrences||0),
    tasks:parseJson(row.tasks,[]),verification_status:row.verification_status,status:row.status,created_at:row.created_at,updated_at:row.updated_at
  };
  return {
    type:'volunteer',id:row.id,ref_code:row.ref_code,service_key:row.service_key,service_type:row.service_type,area:row.area,
    availability:row.availability,languages:parseJson(row.languages,[]),capabilities:parseJson(row.capabilities,[]),
    verification_status:row.verification_status,status:row.status,completed_services:Number(row.completed_services||0),created_at:row.created_at,updated_at:row.updated_at
  };
}
async function getOwnerMatches(db,type,id){
  const field=type==='request'?'request_id':'volunteer_id';
  const {results}=await db.prepare(`SELECT * FROM fard_matches WHERE ${field}=? ORDER BY created_at DESC LIMIT 50`).bind(id).all();
  return results||[];
}
async function publicMatchForOwner(db,type,id,m){
  const out={id:m.id,status:m.status,score:m.score,requester_response:m.requester_response,volunteer_response:m.volunteer_response,requester_completed:!!m.requester_completed_at,volunteer_completed:!!m.volunteer_completed_at,created_at:m.created_at,updated_at:m.updated_at};
  if(type==='request'){
    const v=await db.prepare(`SELECT id,ref_code,service_type,area,availability,languages,capabilities,completed_services FROM fard_volunteers WHERE id=?`).bind(m.volunteer_id).first();
    out.counterpart=v?{type:'volunteer',ref_code:v.ref_code,service_type:v.service_type,area:v.area,availability:v.availability,languages:parseJson(v.languages,[]),capabilities:parseJson(v.capabilities,[]),completed_services:Number(v.completed_services||0)}:null;
    if(m.status==='connected'||m.status==='completed'){
      const c=await db.prepare(`SELECT contact_name,contact_method,contact_value FROM fard_private_contacts WHERE subject_type='volunteer' AND subject_id=?`).bind(m.volunteer_id).first();
      out.counterpart_contact=c||null;
    }
  } else {
    const r=await db.prepare(`SELECT id,ref_code,title,area,timing,tasks FROM fard_requests WHERE id=?`).bind(m.request_id).first();
    out.counterpart=r?{type:'request',ref_code:r.ref_code,title:r.title,area:r.area,timing:r.timing,tasks:parseJson(r.tasks,[])}:null;
    if(m.status==='connected'||m.status==='completed'){
      const c=await db.prepare(`SELECT contact_name,contact_method,contact_value FROM fard_private_contacts WHERE subject_type='request' AND subject_id=?`).bind(m.request_id).first();
      out.counterpart_contact=c||null;
    }
  }
  return out;
}
function parseJson(s,fallback){try{return JSON.parse(s||'')}catch{return fallback}}
function adminRequest(r){return {...r,tasks:parseJson(r.tasks,[])}}
function adminVolunteer(v){return {...v,languages:parseJson(v.languages,[]),capabilities:parseJson(v.capabilities,[])}}

function wordSet(text){
  return new Set(String(text||'').toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u0600-\u06FF]+/g,' ').split(/\s+/).filter(x=>x.length>2));
}
function overlapScore(a,b,max){
  const A=wordSet(a),B=wordSet(b);if(!A.size||!B.size)return 0;
  let hit=0;for(const x of A)if(B.has(x))hit++;
  return Math.min(max,Math.round(max*hit/Math.max(1,Math.min(A.size,B.size))));
}
function scoreSuggestion(r,v){
  let score=30;const reasons=['Same FARD service area'];
  const area=overlapScore(r.area,v.area,40);score+=area;if(area>=20)reasons.push('Strong area similarity');else if(area>0)reasons.push('Some area similarity');
  const tasks=parseJson(r.tasks,[]).join(' '), caps=parseJson(v.capabilities,[]).join(' ');
  const skill=overlapScore(tasks,caps,20);score+=skill;if(skill>=10)reasons.push('Capabilities overlap requested tasks');
  if(r.preferred_language){
    const langs=parseJson(v.languages,[]).join(' ');
    const ls=overlapScore(r.preferred_language,langs,10);score+=ls;if(ls>0)reasons.push('Language preference overlap');
  }
  score+=Math.min(10,Number(v.completed_services||0)*2);
  if(Number(v.completed_services||0)>0)reasons.push('Has completed FARD service history');
  return {volunteer_id:v.id,ref_code:v.ref_code,service_type:v.service_type,area:v.area,availability:v.availability,languages:parseJson(v.languages,[]),capabilities:parseJson(v.capabilities,[]),verification_status:v.verification_status,completed_services:Number(v.completed_services||0),score:Math.min(100,score),reasons};
}


function getVerifierToken(request,url){
  return clean(request.headers.get('X-FARD-Verifier-Token')||url.searchParams.get('verifier_token')||'',300);
}
function publicOrganization(o){
  return {id:o.id,ref_code:o.ref_code,name:o.name,org_type:o.org_type,area:o.area,service_scopes:parseJson(o.service_scopes,[]),status:o.status,verifier_status:o.verifier_status,created_at:o.created_at,updated_at:o.updated_at};
}
function publicOrganizationAdmin(o){
  return {...publicOrganization(o),representative:o.representative,contact_method:o.contact_method,contact_value:o.contact_value,details:o.details};
}
async function addAudit(db,subjectType,subjectId,action,actor,detail=''){
  await db.prepare(
    `INSERT INTO fard_audit (id,subject_type,subject_id,action,actor,detail,created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(crypto.randomUUID(),clean(subjectType,50),clean(subjectId,120),clean(action,100),clean(actor,140),clean(detail,1600)).run();
}

async function ensureSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_story_status_created
    ON comments(story_id, status, created_at DESC);

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_status_created
    ON submissions(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_requests (
      id TEXT PRIMARY KEY,
      ref_code TEXT NOT NULL UNIQUE,
      service_key TEXT NOT NULL,
      title TEXT NOT NULL,
      area TEXT NOT NULL,
      timing TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      recurrence TEXT NOT NULL DEFAULT 'one-time',
      completed_occurrences INTEGER NOT NULL DEFAULT 0,
      details TEXT NOT NULL,
      tasks TEXT NOT NULL DEFAULT '[]',
      preferred_language TEXT,
      verifier_name TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'pending',
      manage_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_requests_service_status
    ON fard_requests(service_key, status, verification_status, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_volunteers (
      id TEXT PRIMARY KEY,
      ref_code TEXT NOT NULL UNIQUE,
      service_key TEXT NOT NULL,
      service_type TEXT NOT NULL,
      area TEXT NOT NULL,
      availability TEXT NOT NULL,
      languages TEXT NOT NULL DEFAULT '[]',
      capabilities TEXT NOT NULL DEFAULT '[]',
      details TEXT,
      verifier_name TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'pending',
      manage_token_hash TEXT NOT NULL,
      completed_services INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_volunteers_service_status
    ON fard_volunteers(service_key, status, verification_status, completed_services DESC, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_private_contacts (
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_method TEXT NOT NULL,
      contact_value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY(subject_type, subject_id)
    );

    CREATE TABLE IF NOT EXISTS fard_matches (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      volunteer_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'offered',
      requester_response TEXT NOT NULL DEFAULT 'pending',
      volunteer_response TEXT NOT NULL DEFAULT 'pending',
      requester_completed_at TEXT,
      volunteer_completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_matches_request
    ON fard_matches(request_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fard_matches_volunteer
    ON fard_matches(volunteer_id, status, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_organizations (
      id TEXT PRIMARY KEY,
      ref_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      org_type TEXT NOT NULL,
      area TEXT NOT NULL,
      representative TEXT NOT NULL,
      contact_method TEXT NOT NULL,
      contact_value TEXT NOT NULL,
      service_scopes TEXT NOT NULL DEFAULT '[]',
      details TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      verifier_status TEXT NOT NULL DEFAULT 'pending',
      manage_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_org_status
    ON fard_organizations(status, verifier_status, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_verifications (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_verifications_subject
    ON fard_verifications(subject_type, subject_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_incidents (
      id TEXT PRIMARY KEY,
      ref_code TEXT NOT NULL UNIQUE,
      reporter_type TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      match_id TEXT,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_incidents_status
    ON fard_incidents(status, severity, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_feedback (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      author_type TEXT NOT NULL,
      author_id TEXT NOT NULL,
      outcome TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_feedback_match
    ON fard_feedback(match_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS fard_audit (
      id TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fard_audit_subject
    ON fard_audit(subject_type, subject_id, created_at DESC);
  `);
}
