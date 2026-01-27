import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Airtable from 'airtable';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
const table = base(process.env.AIRTABLE_TABLE_ID);
const intakeTable = base(process.env.AIRTABLE_INTAKE_TABLE_ID);

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'Unknown';
}

// GET /api/ack?token=TOKEN
// Fetches acknowledgement data by token and sets Viewed At if not already set
app.get('/api/ack', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
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

    // Check if already completed
    if (fields['Status'] === 'Completed') {
      return res.status(200).json({
        status: 'completed',
        message: 'This acknowledgement has already been submitted.',
        completedAt: fields['Completed At']
      });
    }

    // Set Viewed At if not already set
    if (!fields['Viewed At']) {
      await table.update(record.id, {
        'Viewed At': new Date().toISOString()
      });
    }

    // Return safe fields only (no record ID, no sensitive data)
    const responseData = {
      transfereeName: fields['Transferee Name'] || '',
      arpNumber: fields['ARP Number'] || '',
      vehicle1: fields['Vehicle 1 Description'] || '',
      vehicle2: fields['Vehicle 2 Description'] || '',
      vehicle3: fields['Vehicle 3 Description'] || '',
      vehicleCount: fields['Vehicle Count'] || 0,
      containsEV: fields['Contains Electric Vehicle'] || false,
      pickupDate: fields['Pickup Date'] || '',
      arrivalWindowStart: fields['Arrival Window Start'] || '',
      arrivalWindowEnd: fields['Arrival Window End'] || '',
      earliestAvailableDeliveryDate: fields['Earliest Available Delivery Date'] || '',
      transitTimeDescription: fields['Transit Time Description'] || '',
      checklistSnapshot: fields['Checklist Snapshot'] || '',
      checklistVersion: fields['Checklist Version'] || '',
      email: fields['Email'] || '',
      phone: fields['Phone'] || '',
      status: fields['Status'] || ''
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching acknowledgement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ack/submit
// Submits the completed acknowledgement
app.post('/api/ack/submit', async (req, res) => {
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

    res.json({
      success: true,
      message: 'Acknowledgement submitted successfully',
      completedAt: updateFields['Completed At']
    });
  } catch (error) {
    console.error('Error submitting acknowledgement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// INTAKE ENDPOINTS (Step 1)
// ============================================

// GET /api/intake?token=TOKEN
// Fetches intake data by token
app.get('/api/intake', async (req, res) => {
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

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching intake:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/intake/submit
// Submits the intake form
app.post('/api/intake/submit', async (req, res) => {
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

    res.json({
      success: true,
      message: 'Intake form submitted successfully',
      completedAt: updateFields['Completed At']
    });
  } catch (error) {
    console.error('Error submitting intake:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Airtable Base: ${process.env.AIRTABLE_BASE_ID}`);
  console.log(`📊 Acknowledgement Table: ${process.env.AIRTABLE_TABLE_ID}`);
  console.log(`📝 Intake Table: ${process.env.AIRTABLE_INTAKE_TABLE_ID}`);
});
