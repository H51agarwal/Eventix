import nodemailer from "nodemailer";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Eventix" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

async function sendSMS(to, message) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER.replace("whatsapp:", ""),
      to: to,
    });
    console.log(`✅ SMS sent to ${to}`);
  } catch (err) {
    console.error("❌ SMS error:", err.message);
  }
}

async function sendWhatsApp(to, message) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
    });
    console.log(`✅ WhatsApp sent to ${to}`);
  } catch (err) {
    console.error("❌ WhatsApp error:", err.message);
  }
}

async function notify(user, subject, text, html) {
  const pref = user.notificationPreference || user.notifyPreference || "email";
  if (pref === "email") {
    await sendEmail(user.email, subject, html);
  } else if (pref === "sms" && user.phone) {
    await sendSMS(user.phone, text);
  } else if (pref === "whatsapp" && user.phone) {
    await sendWhatsApp(user.phone, text);
  }
}

export async function sendEventCancellationNotification({ user, event }) {
  const text = `Hi ${user.name}, the event "${event.title}" scheduled for ${new Date(event.date).toLocaleDateString("en-IN")} has been cancelled. A full refund will be processed within 5-7 business days. — Team Eventix`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #ff6b35;">⚠️ Event Cancelled</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Unfortunately the event you booked has been cancelled.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px;">${event.title}</h3>
        <p style="margin: 4px 0;">📅 ${new Date(event.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <p style="margin: 4px 0;">📍 ${event.venue ?? "TBD"}</p>
      </div>
      <p>Your refund will be processed within <strong>5-7 business days</strong>.</p>
      <p style="color: #888; font-size: 13px;">— Team Eventix</p>
    </div>
  `;

  await notify(user, `Event Cancelled — ${event.title}`, text, html);
}

export async function sendRefundNotification({ user, event, refundAmount, refundPercentage, policyLabel }) {
  const text = refundAmount > 0
    ? `Hi ${user.name}, your ticket for "${event.title}" has been cancelled. Refund of ₹${refundAmount} (${refundPercentage}%) will be credited within 5-7 business days. Policy: ${policyLabel}. — Team Eventix`
    : `Hi ${user.name}, your ticket for "${event.title}" has been cancelled. No refund applicable — ${policyLabel}. — Team Eventix`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #ff6b35;">🎟 Ticket Cancelled</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your ticket has been cancelled successfully.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px;">${event.title}</h3>
        <p style="margin: 4px 0;">📅 ${new Date(event.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      ${refundAmount > 0 ? `
        <div style="background: #e8f5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin: 0 0 8px;">✅ Refund Details</h3>
          <p style="margin: 4px 0;">Refund amount: <strong>₹${refundAmount}</strong> (${refundPercentage}%)</p>
          <p style="margin: 4px 0;">Policy: ${policyLabel}</p>
          <p style="margin: 4px 0; color: #666;">Credit within 5-7 business days</p>
        </div>
      ` : `
        <div style="background: #fff3e0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #e65100; margin: 0;">⚠️ No refund applicable — ${policyLabel}</p>
        </div>
      `}
      <p style="color: #888; font-size: 13px;">— Team Eventix</p>
    </div>
  `;

  await notify(user, `Ticket Cancelled — ${event.title}`, text, html);
}

export const sendCancellationNotification = sendEventCancellationNotification;

export { sendEmail, sendSMS, sendWhatsApp };