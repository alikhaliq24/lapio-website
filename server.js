const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/submit-waitlist', async (req, res) => {
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

    res.json({ success: true });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Network error calling HubSpot' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
