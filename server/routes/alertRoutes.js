const express = require('express');
const router = express.Router();
const { sendSMS, makeCall } = require('../services/twilioService');

// Placeholder: Replace with real user/contact lookup
async function getUserById(userId) {
  return {
    name: 'Test User',
    emergencyContacts: [
      { name: 'Contact 1', phone: '+917617668770' }
    ],
    location: 'IN'
  };
}

async function getCountryHelplines(countryCode) {
  // Placeholder: Replace with real helpline lookup
  if (countryCode === 'IN') {
    return [
      { name: 'Kiran Mental Health Helpline', phone: '1800-599-0019' }
    ];
  }
  return [
    { name: 'Befrienders Worldwide', phone: '' }
  ];
}

router.post('/emergency', async (req, res) => {
  const { userId, crisisDetails } = req.body;
  if (!userId || !crisisDetails) {
    return res.status(400).json({ error: 'userId and crisisDetails are required' });
  }
  try {
    const user = await getUserById(userId);
    const helplines = await getCountryHelplines(user.location);
    const message = `URGENT: ${user.name} may be in crisis. Please check on them immediately. Details: ${crisisDetails.summary || 'Crisis detected by CuraCompanion app.'}`;

    // Alert emergency contacts
    for (const contact of user.emergencyContacts) {
      await sendSMS(contact.phone, message);
      await makeCall(contact.phone);
    }
    // Alert helplines
    for (const helpline of helplines) {
      if (helpline.phone) {
        await makeCall(helpline.phone);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Emergency alert failed:', err.message);
    res.status(500).json({ error: 'Failed to send emergency alerts' });
  }
});

module.exports = router; 