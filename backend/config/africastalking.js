// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
let sms = null;
let whatsapp = null;

try {
  const AfricasTalking = require('africastalking');
  if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
    const at = AfricasTalking({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME,
    });
    sms = at.SMS;
    // WhatsApp is part of the same Africa's Talking account/SDK (see Phase 9
    // market research, Part 3.3) — gated separately since it requires its
    // own WhatsApp product activation in the AT dashboard and a registered
    // sender number, which most accounts won't have configured by default.
    whatsapp = at.WHATSAPP || at.whatsapp || null;
  }
} catch (err) {
  console.warn('Africa\'s Talking not initialised:', err.message);
}

const sendSMS = async (to, message) => {
  if (!sms) {
    console.log(`[SMS stub] To: ${to} | ${message}`);
    return;
  }
  try {
    const recipients = Array.isArray(to) ? to : [to];
    await sms.send({
      to: recipients,
      message,
      from: process.env.AT_SENDER_ID || 'PCL',
    });
  } catch (err) {
    console.error('SMS error:', err.message);
  }
};

/**
 * Send a WhatsApp message via Africa's Talking, if the WhatsApp product is
 * enabled on this account (WHATSAPP_SENDER_PHONE_NUMBER_ID configured). Never
 * throws — callers should treat this as best-effort and pair it with SMS for
 * customers without WhatsApp or when the product isn't activated yet.
 */
const sendWhatsApp = async (to, message) => {
  if (!whatsapp || !process.env.AT_WHATSAPP_SENDER_ID) {
    console.log(`[WhatsApp stub — product not configured] To: ${to} | ${message}`);
    return false;
  }
  try {
    await whatsapp.send({
      senderPhoneNumberId: process.env.AT_WHATSAPP_SENDER_ID,
      phoneNumber: to,
      message: { text: { body: message } },
    });
    return true;
  } catch (err) {
    console.error('WhatsApp error:', err.message);
    return false;
  }
};

/**
 * Notify a customer through one or both channels.
 * @param {string} to        - phone number in +254... format
 * @param {string} message   - message body
 * @param {'sms'|'whatsapp'|'both'} channel - default 'sms' (always works without extra setup)
 */
const notifyCustomer = async (to, message, channel = 'sms') => {
  if (channel === 'whatsapp') {
    const sent = await sendWhatsApp(to, message);
    if (!sent) await sendSMS(to, message); // fall back so the customer isn't left with nothing
    return;
  }
  if (channel === 'both') {
    await Promise.all([sendSMS(to, message), sendWhatsApp(to, message)]);
    return;
  }
  await sendSMS(to, message);
};

module.exports = { sendSMS, sendWhatsApp, notifyCustomer };
