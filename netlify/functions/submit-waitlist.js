exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    console.error('HUBSPOT_ACCESS_TOKEN is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration: missing token' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { firstname, email, phone, company, business_type } = body;
  if (!firstname || !email || !phone || !company || !business_type) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        properties: { firstname, email, phone, company, business_type },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('HubSpot error:', JSON.stringify(data));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'HubSpot rejected the request', detail: data }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Fetch error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Network error calling HubSpot' }) };
  }
};
