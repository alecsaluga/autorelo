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
  if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) return '';
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.color ? ' - ' + vehicle.color : ''}`.trim();
}

// Generate a random token for Step 2
function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
  const ackTable = base(process.env.AIRTABLE_TABLE_ID); // Step 2 table

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
    const existingFields = record.fields;

    // Idempotency: If already completed, return success
    if (existingFields['Status'] === 'Completed') {
      return res.status(200).json({
        success: true,
        message: 'This intake form has already been submitted.',
        completedAt: existingFields['Completed At']
      });
    }

    // Get client info
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Extract vehicles array
    const vehicles = formData.vehicles || [];
    const vehicle1 = vehicles[0] || {};
    const vehicle2 = vehicles[1] || {};
    const vehicle3 = vehicles[2] || {};

    // Build vehicle descriptions
    const v1Desc = formatVehicleDescription(vehicle1);
    const v2Desc = formatVehicleDescription(vehicle2);
    const v3Desc = formatVehicleDescription(vehicle3);

    // Prepare update fields for Step 1 (Intake) - only include fields that have values
    const updateFields = {
      'Status': 'Completed',
      'Completed At': new Date().toISOString(),
    };

    // Add fields only if they have values
    if (formData.pickupAddress) updateFields['Pickup Address'] = formData.pickupAddress;
    if (formData.deliveryAddress) updateFields['Delivery Address'] = formData.deliveryAddress;
    if (formData.availabilityDate) updateFields['Availability Date'] = formData.availabilityDate;

    // Vehicle 1
    if (v1Desc) updateFields['Vehicle 1 Description'] = v1Desc;
    if (vehicle1.plateNumber) updateFields['Vehicle 1 Plate'] = vehicle1.plateNumber;
    if (vehicle1.vinNumber) updateFields['Vehicle 1 VIN'] = vehicle1.vinNumber;

    // Vehicle 2
    if (v2Desc) updateFields['Vehicle 2 Description'] = v2Desc;
    if (vehicle2.plateNumber) updateFields['Vehicle 2 Plate'] = vehicle2.plateNumber;
    if (vehicle2.vinNumber) updateFields['Vehicle 2 VIN'] = vehicle2.vinNumber;

    // Vehicle 3
    if (v3Desc) updateFields['Vehicle 3 Description'] = v3Desc;
    if (vehicle3.plateNumber) updateFields['Vehicle 3 Plate'] = vehicle3.plateNumber;
    if (vehicle3.vinNumber) updateFields['Vehicle 3 VIN'] = vehicle3.vinNumber;

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

    // Update Step 1 record - try fields one by one for resilience
    const successfulFields = [];
    const failedFields = [];

    for (const [fieldName, fieldValue] of Object.entries(updateFields)) {
      try {
        await intakeTable.update(record.id, { [fieldName]: fieldValue });
        successfulFields.push(fieldName);
      } catch (fieldErr) {
        failedFields.push(fieldName);
        console.warn(`Could not update field "${fieldName}":`, fieldErr.message);
      }
    }

    // ============================================
    // CREATE STEP 2 RECORD
    // ============================================
    const step2Token = generateToken();

    // Get values from Step 1 record (handle different field name cases)
    const transfereeName = existingFields['Transferee Name'] || existingFields['Name'] || existingFields['transferee name'] || '';
    const email = existingFields['Email'] || existingFields['email'] || '';
    const phone = formData.pickupContactPhone || '';

    // Build Step 2 fields - matching your Acknowledgement table
    const step2Fields = {
      'Token': step2Token,
      'Transferee Name': transfereeName,
      'Email': email,
      'Phone': phone,
      'Vehicle Count': vehicles.length,
      'Earliest Available Delivery Date': formData.availabilityDate || ''
    };

    // Add vehicle descriptions
    if (v1Desc) step2Fields['Vehicle 1 Description'] = v1Desc;
    if (v2Desc) step2Fields['Vehicle 2 Description'] = v2Desc;
    if (v3Desc) step2Fields['Vehicle 3 Description'] = v3Desc;

    console.log('Creating Step 2 record with fields:', JSON.stringify(step2Fields, null, 2));

    let step2RecordId = null;
    let step2Error = null;

    try {
      const step2Record = await ackTable.create(step2Fields);
      step2RecordId = step2Record.id;

      // Try to link Step 2 record ID back to Step 1
      try {
        await intakeTable.update(record.id, { 'Step 2 Record ID': step2RecordId });
      } catch (e) {
        // Field might not exist, ignore
      }
    } catch (err) {
      console.error('Error creating Step 2 record:', err);
      step2Error = err.message;
    }

    res.status(200).json({
      success: true,
      message: `Intake form submitted. Updated ${successfulFields.length} fields.`,
      completedAt: new Date().toISOString(),
      updatedFields: successfulFields,
      skippedFields: failedFields,
      step2: {
        created: !!step2RecordId,
        recordId: step2RecordId,
        token: step2Token,
        error: step2Error
      }
    });
  } catch (error) {
    console.error('Error submitting intake:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
