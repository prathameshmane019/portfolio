import nodemailer, { type Transporter } from "nodemailer";

type MailIdentity = {
  name: string;
  email: string;
};

let transporter: Transporter | undefined;

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user, pass: password },
    });
  }
  return transporter;
}

function fromAddress() {
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;
  if (!from) throw new Error("Set CONTACT_FROM_EMAIL or SMTP_USER.");
  return from;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function emailTemplate(title: string, greeting: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f2e9;color:#171715;font-family:Arial,sans-serif">
    <div style="max-width:620px;margin:32px auto;padding:0 18px">
      <div style="padding:18px 22px;background:#171715;color:#f5f2e9;font-family:monospace;font-size:12px;letter-spacing:2px">ENGINEER'S LOGBOOK</div>
      <div style="padding:34px 28px;background:#fffdf7;border:1px solid #ded9cc">
        <p style="margin:0 0 12px;color:#e74316;font-family:monospace;font-size:11px;letter-spacing:1px">PORTFOLIO / ${escapeHtml(title.toUpperCase())}</p>
        <h1 style="margin:0 0 20px;font-size:27px;line-height:1.2">${escapeHtml(greeting)}</h1>
        <div style="font-size:15px;line-height:1.75;white-space:pre-wrap">${escapeHtml(body).replace(/\n/g, "<br>")}</div>
        <p style="margin:28px 0 0;color:#6f6d66;font-size:12px">Sent from the portfolio contact desk.</p>
      </div>
      <p style="padding:0 4px;color:#77766f;font-family:monospace;font-size:10px">A NOTE FROM THE ENGINEER'S LOGBOOK</p>
    </div>
  </body></html>`;
}

export async function sendOwnerNotification(identity: MailIdentity, message: string, profileEmail: string) {
  await getMailer().sendMail({
    from: fromAddress(),
    to: process.env.CONTACT_TO_EMAIL || profileEmail,
    replyTo: identity.email,
    subject: `Portfolio message from ${identity.name}`,
    text: `New portfolio message\n\nFrom: ${identity.name}\nEmail: ${identity.email}\n\n${message}`,
    html: emailTemplate("New message", `New note from ${identity.name}`, `${message}\n\nReply to: ${identity.email}`),
  });
}

export async function sendSenderAcknowledgement(identity: MailIdentity, profileName: string) {
  const body = `Thanks for reaching out, ${identity.name}. Your message has reached ${profileName}, and a copy has been saved for follow-up. We'll get back to you as soon as possible.`;
  await getMailer().sendMail({
    from: fromAddress(),
    to: identity.email,
    replyTo: process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER,
    subject: `Thanks for your message, ${identity.name}`,
    text: `${body}\n\n— ${profileName}`,
    html: emailTemplate("Message received", `Thanks for getting in touch, ${identity.name}.`, `${body}\n\n— ${profileName}`),
  });
}

export async function sendAdminReply(identity: MailIdentity, profileName: string, body: string) {
  await getMailer().sendMail({
    from: fromAddress(),
    to: identity.email,
    replyTo: process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER,
    subject: `Re: Your message to ${profileName}`,
    text: `${body}\n\n— ${profileName}`,
    html: emailTemplate("A reply to your message", `Hello ${identity.name},`, `${body}\n\n— ${profileName}`),
  });
}
