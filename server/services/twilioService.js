const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid_here';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token_here';
const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

const client = twilio(accountSid, authToken);

async function sendSMS(to, message) {
  try {
    await client.messages.create({
      body: message,
      from: twilioNumber,
      to
    });
    console.log(`SMS sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send SMS to ${to}:`, err.message);
  }
}

async function makeCall(to, messageUrl = 'http://demo.twilio.com/docs/voice.xml') {
  // messageUrl should point to a TwiML Bin or endpoint that speaks the message
  try {
    await client.calls.create({
      url: messageUrl,
      from: twilioNumber,
      to
    });
    console.log(`Call initiated to ${to}`);
  } catch (err) {
    console.error(`Failed to call ${to}:`, err.message);
  }
}

module.exports = { sendSMS, makeCall }; 