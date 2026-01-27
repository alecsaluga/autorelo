import Airtable from 'airtable';

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
const intakeTable = base(process.env.AIRTABLE_INTAKE_TABLE_ID);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find record by token
    const records = await intakeTable.select({
      filterByFormula: `{Token} = '${token}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    const record = records[0];
    const fields = record.fields;

    // Check if already completed
    if (fields['Status'] === 'Completed') {
      return res.status(200).json({
        status: 'completed',
        message: 'This intake form has already been submitted.',
        completedAt: fields['Completed At']
      });
    }

    // Set Viewed At if not already set
    if (!fields['Viewed At']) {
      await intakeTable.update(record.id, {
        'Viewed At': new Date().toISOString()
      });
    }

    // Return safe fields only (name and email for display)
    const responseData = {
      transfereeName: fields['Transferee Name'] || '',
      email: fields['Email'] || '',
      status: fields['Status'] || ''
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching intake:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
