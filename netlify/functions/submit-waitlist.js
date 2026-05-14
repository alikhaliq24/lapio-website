exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { firstname, email, phone, company, business_type } = body;

  if (!firstname || !email || !phone || !company || !business_type) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      properties: { firstname, email, phone, company, business_type },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('HubSpot error:', err);
    return { statusCode: 500, body: 'Failed to submit to HubSpot' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
