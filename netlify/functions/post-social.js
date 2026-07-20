/*
  Netlify Function: post-social
  Proxies post requests to Buffer API — keeps credentials server-side.

  ENVIRONMENT VARIABLES (set in Netlify → Site configuration → Environment variables):
  ─────────────────────────────────────────────────────────────────────────────────────
  BUFFER_ACCESS_TOKEN   Your Buffer personal access token
                        Get it: buffer.com/developers/api → Get Access Token

  BUFFER_PROFILE_IDS    Comma-separated Buffer profile IDs for FB + IG
                        Get them: after setting vars, visit
                        https://kellyhullhypnotherapy.com/.netlify/functions/get-profiles
                        to see your profile IDs, then paste them here.
  ─────────────────────────────────────────────────────────────────────────────────────
*/

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const TOKEN    = process.env.BUFFER_ACCESS_TOKEN;
  const PROFILES = process.env.BUFFER_PROFILE_IDS;

  if (!TOKEN || !PROFILES) {
    return { statusCode: 500, headers, body: JSON.stringify({
      error: 'Buffer credentials not configured. Add BUFFER_ACCESS_TOKEN and BUFFER_PROFILE_IDS in Netlify environment variables.'
    })};
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

  const { text, now = true } = body;
  if (!text) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing text field' }) };

  const profileIds = PROFILES.split(',').map(p => p.trim()).filter(Boolean);
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('now', now ? 'true' : 'false');
  profileIds.forEach(id => params.append('profile_ids[]', id));

  try {
    const res = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Buffer error:', data);
      return { statusCode: res.status, headers, body: JSON.stringify({ error: data.message || 'Buffer API error', detail: data }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, buffer: data }) };
  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
