import nodemailer from 'nodemailer';

/**
 * Creates a configured Nodemailer transporter.
 * Uses Gmail SMTP with app password authentication.
 * @returns {Object} Nodemailer transporter instance
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Sends an email using the configured transporter.
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body content
 * @param {string} [options.text] - Plain text alternative
 * @param {Array} [options.attachments] - Array of attachment objects
 * @returns {Promise<Object>} Nodemailer send result
 */
export const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Balaji Perfect Caters" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Sends an invoice/statement PDF via email.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.customerName - Customer name for greeting
 * @param {Buffer} options.pdfBuffer - PDF file as Buffer
 * @param {string} options.fileName - PDF filename
 * @param {string} options.subject - Email subject
 * @param {string} options.period - Billing period (e.g., "April 2026")
 * @param {number} options.amount - Total amount
 */
export const sendInvoiceEmail = async ({ to, customerName, pdfBuffer, fileName, subject, period, amount }) => {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFDF8; border-radius: 12px; overflow: hidden; border: 1px solid #E8E0D0;">
      <div style="background: linear-gradient(135deg, #7B1C1C 0%, #5A1212 100%); padding: 30px 30px 25px; text-align: center;">
        <h1 style="color: #D4A017; margin: 0; font-size: 26px; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 1px;">Balaji Perfect Caters</h1>
        <p style="color: #FDF2F2; margin: 5px 0 0; font-size: 13px; letter-spacing: 0.5px;">High Class Veg & Non Veg Caterers</p>
      </div>

      <div style="padding: 30px;">
        <p style="color: #1A1A1A; font-size: 16px; margin-bottom: 5px;">Dear <strong>${customerName}</strong>,</p>
        <p style="color: #4A4A4A; line-height: 1.7; font-size: 14px;">
          Please find attached your ${period ? `statement for <strong>${period}</strong>` : 'invoice'} from Balaji Perfect Caters.
        </p>

        <div style="background: #FDF2F2; border-left: 4px solid #7B1C1C; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px; color: #1A1A1A;">
            ${period ? `<tr><td style="padding: 4px 0; color: #4A4A4A;">Period:</td><td style="text-align: right; font-weight: 600;">${period}</td></tr>` : ''}
            <tr><td style="padding: 4px 0; color: #4A4A4A;">Total Amount:</td><td style="text-align: right; font-weight: 700; font-size: 18px; color: #7B1C1C;">₹${amount?.toLocaleString('en-IN') || '0'}</td></tr>
          </table>
        </div>

        <p style="color: #4A4A4A; line-height: 1.7; font-size: 14px;">
          The detailed ${period ? 'statement' : 'invoice'} is attached as a PDF for your records.
        </p>

        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #92600A; font-size: 14px;">💳 Payment Details</p>
          <table style="width: 100%; font-size: 13px; color: #4A4A4A;">
            <tr><td style="padding: 2px 0;">Bank:</td><td>South Indian Bank</td></tr>
            <tr><td style="padding: 2px 0;">Branch:</td><td>Trichy Main Branch</td></tr>
            <tr><td style="padding: 2px 0;">IFSC:</td><td>SIBL0000082</td></tr>
            <tr><td style="padding: 2px 0;">A/C No:</td><td style="font-weight: 600;">0082073000002485</td></tr>
            <tr><td style="padding: 2px 0;">Name:</td><td>Balaji Perfect Caters</td></tr>
          </table>
        </div>

        <p style="color: #9A9A9A; font-size: 12px; margin-top: 24px; line-height: 1.6;">
          If you have any questions regarding this ${period ? 'statement' : 'invoice'}, please contact us at 99438 73993 or 90805 97330.
        </p>
      </div>

      <div style="background: linear-gradient(135deg, #5A1212 0%, #3D0A0A 100%); padding: 20px; text-align: center;">
        <p style="color: #D4A017; margin: 0 0 4px; font-size: 12px;">GSTIN: 33CADPB6649D1Z3 | FSSAI: 12424028000583</p>
        <p style="color: #9A7A7A; margin: 0; font-size: 11px;">
          C2/1, Raaj Iswariyam, No.48, Warner's Road, Cantonment, Trichy-620 001
        </p>
        <p style="color: #9A7A7A; margin: 4px 0 0; font-size: 11px;">
          © ${new Date().getFullYear()} Balaji Perfect Caters. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: subject || `BPC Invoice — ${period || 'Statement'}`,
    html,
    attachments: [
      {
        filename: fileName || 'BPC_Invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

/**
 * Strips HTML tags from a string for plain text alternative.
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
const stripHtml = (html) => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};
