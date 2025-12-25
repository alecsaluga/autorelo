import Airtable from 'airtable';

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
const table = base(process.env.AIRTABLE_TABLE_ID);

// Helper function to get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'Unknown';
}

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, formData } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!formData) {
      return res.status(400).json({ error: 'Form data is required' });
    }

    // Find record by token
    const records = await table.select({
      filterByFormula: `{Token} = '${token}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    const record = records[0];
    const fields = record.fields;

    // Idempotency: If already completed, return success
    if (fields['Status'] === 'Completed') {
      return res.status(200).json({
        success: true,
        message: 'This acknowledgement has already been submitted.',
        completedAt: fields['Completed At']
      });
    }

    // Get client info
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Prepare update fields
    const updateFields = {
      'Section 1 Initialed – Transit Time': formData.initials?.section_1 ? true : false,
      'Section 2 Initialed – Delivery & Updates': formData.initials?.section_2 ? true : false,
      'Section 3 Initialed – Releasing & Delivery': formData.initials?.section_3 ? true : false,
      'Section 4 Initialed – General Guidelines': formData.initials?.section_4 ? true : false,
      'Section 5 Initialed – Personal Items': formData.initials?.section_5 ? true : false,
      'Section 6 Initialed – Vehicle Preparation': formData.initials?.section_6 ? true : false,
      'Section 7 Initialed – Inspection & Claims': formData.initials?.section_7 ? true : false,
      'Section 8 Initialed – Coverage Details': formData.initials?.section_8 ? true : false,
      'Section 9 Initialed – Delays & Rental Policy': formData.initials?.section_9 ? true : false,
      'Typed Signature Name': formData.fullName || '',
      'Consent to Electronic Records': true,
      'Status': 'Completed',
      'Completed At': new Date().toISOString(),
      'IP Address': ipAddress,
      'User Agent': userAgent,
      'Immutable Record Lock': true
    };

    // Update any input fields if they were modified
    if (formData.inputs?.availability_date) {
      updateFields['Earliest Available Delivery Date'] = formData.inputs.availability_date;
    }

    // Update the record
    await table.update(record.id, updateFields);

    res.status(200).json({
      success: true,
      message: 'Acknowledgement submitted successfully',
      completedAt: updateFields['Completed At']
    });
  } catch (error) {
    console.error('Error submitting acknowledgement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
