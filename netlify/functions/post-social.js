/*
  Netlify Function: post-social
  Sends post text to a Make.com webhook which posts to Facebook + Instagram.

  ═══════════════════════════════════════════════════════════════
  WHEN YOU GET BACK — 3 steps to go live:

  1. Go to make.com → sign up free → Create a new scenario
     - Add module: Webhooks → Custom Webhook → Add → copy the URL
     - Add module: Facebook Pages → Create a Post
         · Connect your Facebook account
         · Select the @kellyhullhypnotherapy page
         · Set Message = {{1.text}} (from the webhook data)
     - Add module: Instagram for Business → Create a Post
         · Connect via Facebook
         · Select @kellyhullhypnotherapy Instagram
         · Set Caption = {{1.text}}
     - Turn the scenario ON
     - Copy the webhook URL (looks like https://hook.make.com/xxxxx)

  2. In Netlify → your site → Site configuration → Environment variables
     Add: MAKE_WEBHOOK_URL = paste the Make.com webhook URL here
     (You can delete BUFFER_ACCESS_TOKEN and BUFFER_PROFILE_IDS)

  3. That's it — the Approve & Post Now button in the admin will work.
  ═══════════════════════════════════════════════════════════════
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

  const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'MAKE_WEBHOOK_URL not configured. Add it in Netlify → Site configuration → Environment variables.',
        setup: true
      })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { text } = body;
  if (!text) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing text field' }) };
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        platform: 'facebook,instagram',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: 'Make.com webhook failed', detail })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Post sent to Make.com successfully' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
