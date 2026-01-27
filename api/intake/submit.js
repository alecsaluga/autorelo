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

// Helper to format vehicle description
function formatVehicleDescription(vehicle) {
  if (!vehicle) return '';
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.color}`.trim();
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

    // Extract vehicles array (handle both old format and new format)
    const vehicles = formData.vehicles || [];
    const vehicle1 = vehicles[0] || {};
    const vehicle2 = vehicles[1] || {};
    const vehicle3 = vehicles[2] || {};

    // Prepare update fields - only include fields that have values
    const updateFields = {
      'Status': 'Completed',
      'Completed At': new Date().toISOString(),
    };

    // Add fields only if they have values (prevents Airtable errors for missing fields)
    if (formData.pickupAddress) updateFields['Pickup Address'] = formData.pickupAddress;
    if (formData.deliveryAddress) updateFields['Delivery Address'] = formData.deliveryAddress;
    if (formData.availabilityDate) updateFields['Availability Date'] = formData.availabilityDate;

    // Vehicle 1
    if (vehicle1.year) updateFields['Vehicle 1 Year'] = vehicle1.year;
    if (vehicle1.make) updateFields['Vehicle 1 Make'] = vehicle1.make;
    if (vehicle1.model) updateFields['Vehicle 1 Model'] = vehicle1.model;
    if (vehicle1.color) updateFields['Vehicle 1 Color'] = vehicle1.color;
    if (vehicle1.plateNumber) updateFields['Vehicle 1 Plate'] = vehicle1.plateNumber;
    if (vehicle1.vinNumber) updateFields['Vehicle 1 VIN'] = vehicle1.vinNumber;
    const v1Desc = formatVehicleDescription(vehicle1);
    if (v1Desc) updateFields['Vehicle 1 Description'] = v1Desc;

    // Vehicle 2
    if (vehicle2.year) updateFields['Vehicle 2 Year'] = vehicle2.year;
    if (vehicle2.make) updateFields['Vehicle 2 Make'] = vehicle2.make;
    if (vehicle2.model) updateFields['Vehicle 2 Model'] = vehicle2.model;
    if (vehicle2.color) updateFields['Vehicle 2 Color'] = vehicle2.color;
    if (vehicle2.plateNumber) updateFields['Vehicle 2 Plate'] = vehicle2.plateNumber;
    if (vehicle2.vinNumber) updateFields['Vehicle 2 VIN'] = vehicle2.vinNumber;
    const v2Desc = formatVehicleDescription(vehicle2);
    if (v2Desc) updateFields['Vehicle 2 Description'] = v2Desc;

    // Vehicle 3
    if (vehicle3.year) updateFields['Vehicle 3 Year'] = vehicle3.year;
    if (vehicle3.make) updateFields['Vehicle 3 Make'] = vehicle3.make;
    if (vehicle3.model) updateFields['Vehicle 3 Model'] = vehicle3.model;
    if (vehicle3.color) updateFields['Vehicle 3 Color'] = vehicle3.color;
    if (vehicle3.plateNumber) updateFields['Vehicle 3 Plate'] = vehicle3.plateNumber;
    if (vehicle3.vinNumber) updateFields['Vehicle 3 VIN'] = vehicle3.vinNumber;
    const v3Desc = formatVehicleDescription(vehicle3);
    if (v3Desc) updateFields['Vehicle 3 Description'] = v3Desc;

    // Vehicle count
    updateFields['Vehicle Count'] = vehicles.length;

    // Contacts
    if (formData.pickupContactName) updateFields['Pickup Contact Name'] = formData.pickupContactName;
    if (formData.pickupContactPhone) updateFields['Pickup Contact Phone'] = formData.pickupContactPhone;
    if (formData.deliveryContactName) updateFields['Delivery Contact Name'] = formData.deliveryContactName;
    if (formData.deliveryContactPhone) updateFields['Delivery Contact Phone'] = formData.deliveryContactPhone;

    // Metadata
    if (ipAddress) updateFields['IP Address'] = ipAddress;
    if (userAgent) updateFields['User Agent'] = userAgent;

    // First, update just the status (this should always work)
    try {
      await intakeTable.update(record.id, {
        'Status': 'Completed',
        'Completed At': new Date().toISOString()
      });
    } catch (statusErr) {
      console.error('Failed to update status:', statusErr.message);
      return res.status(500).json({ error: 'Failed to update status', details: statusErr.message });
    }

    // Now try to update the other fields (non-blocking - continue even if some fail)
    const otherFields = { ...updateFields };
    delete otherFields['Status'];
    delete otherFields['Completed At'];

    if (Object.keys(otherFields).length > 0) {
      try {
        await intakeTable.update(record.id, otherFields);
      } catch (fieldsErr) {
        // Log which fields failed but don't fail the request
        console.warn('Some fields could not be updated:', fieldsErr.message);
        console.warn('Attempted fields:', Object.keys(otherFields));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Intake form submitted successfully',
      completedAt: updateFields['Completed At']
    });
  } catch (error) {
    console.error('Error submitting intake:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
