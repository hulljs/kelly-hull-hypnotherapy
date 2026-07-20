/*
  Helper function — visit /.netlify/functions/get-profiles once to see your
  Buffer profile IDs, then add them to BUFFER_PROFILE_IDS env var and delete this file.
*/
exports.handler = async () => {
  const TOKEN = process.env.BUFFER_ACCESS_TOKEN;
  if (!TOKEN) return { statusCode: 500, body: 'Set BUFFER_ACCESS_TOKEN env var first.' };
  const res = await fetch('https://api.bufferapp.com/1/profiles.json', {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  const summary = Array.isArray(data) ? data.map(p => ({
    id: p.id, service: p.service, name: p.formatted_username
  })) : data;
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary, null, 2)
  };
};
