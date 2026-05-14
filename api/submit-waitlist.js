export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Missing HubSpot token' });
  }

  const { firstname, email, phone, company, business_type } = req.body;
  if (!firstname || !email || !phone || !company || !business_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        properties: { firstname, email, phone, company, business_type },
      }),
    });

    const data = await hsRes.json();

    if (!hsRes.ok && data.error === 'CONTACT_EXISTS') {
      return res.json({ success: true });
    }

    if (!hsRes.ok) {
      console.error('HubSpot error:', JSON.stringify(data));
      return res.status(500).json({ error: 'HubSpot rejected the request' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Fetch error:', err.message);
    return res.status(500).json({ error: 'Network error calling HubSpot' });
  }
}
