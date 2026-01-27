import Airtable from 'airtable';

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

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

  // Check for required env vars
  if (!process.env.AIRTABLE_INTAKE_TABLE_ID) {
    console.error('Missing AIRTABLE_INTAKE_TABLE_ID environment variable');
    return res.status(500).json({ error: 'Server configuration error: Missing intake table ID' });
  }

  const intakeTable = base(process.env.AIRTABLE_INTAKE_TABLE_ID);

  try {
    const { token, formData } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!formData) {
      return res.status(400).json({ error: 'Form data is required' });
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

    // Idempotency: If already completed, return success
    if (fields['Status'] === 'Completed') {
      return res.status(200).json({
        success: true,
        message: 'This intake form has already been submitted.',
        completedAt: fields['Completed At']
      });
    }

    // Get client info
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Prepare update fields
    const updateFields = {
      'Pickup Address': formData.pickupAddress || '',
      'Delivery Address': formData.deliveryAddress || '',
      'Availability Date': formData.availabilityDate || '',
      'Vehicle Year': formData.vehicleYear || '',
      'Vehicle Make': formData.vehicleMake || '',
      'Vehicle Model': formData.vehicleModel || '',
      'Vehicle Color': formData.vehicleColor || '',
      'Plate Number': formData.plateNumber || '',
      'VIN Number': formData.vinNumber || '',
      'Pickup Contact Name': formData.pickupContactName || '',
      'Pickup Contact Phone': formData.pickupContactPhone || '',
      'Delivery Contact Name': formData.deliveryContactName || '',
      'Delivery Contact Phone': formData.deliveryContactPhone || '',
      'Status': 'Completed',
      'Completed At': new Date().toISOString(),
      'IP Address': ipAddress,
      'User Agent': userAgent
    };

    // Update the record
    await intakeTable.update(record.id, updateFields);

    res.status(200).json({
      success: true,
      message: 'Intake form submitted successfully',
      completedAt: updateFields['Completed At']
    });
  } catch (error) {
    console.error('Error submitting intake:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
