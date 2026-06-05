import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildBillOfSupplyHTML, buildMonthlyStatementHTML } from '../templates/invoiceTemplate.js';
import { numberToWords as numberToWordsUtil } from '../utils/numberToWords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Converts the BPC logo to base64 for embedding in PDF HTML.
 */
const getBase64Logo = async () => {
  try {
    const logoPath = join(__dirname, '..', 'assets', 'logo.jpeg');
    const logoBuffer = await readFile(logoPath);
    return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('Logo file not found, using text fallback:', error.message);
    return '';
  }
};

/**
 * Main PDF generation function.
 * Uses the full `puppeteer` package which bundles its own Chromium binary.
 * Works identically on local dev and Vercel serverless — no environment branching needed.
 */
export const generateBillPDF = async (data, settings, type = 'monthly') => {
  const logoBase64 = await getBase64Logo();

  const html = type === 'monthly'
    ? generateMonthlyStatementHTML(data, settings, logoBase64)
    : generateInvoiceHTML(data, settings, logoBase64);

  let browser;
  try {
    console.log(`[PDF] Launching browser — env: ${process.env.NODE_ENV}`);

    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    console.log(`[PDF] Generated successfully — size: ${pdf.length} bytes`);
    return Buffer.from(pdf);
  } catch (err) {
    console.error('[PDF] Generation failed:', err);
    throw err;
  } finally {
    if (browser) {
      await browser.close().catch((e) => console.warn('[PDF] Browser close error:', e.message));
    }
  }
};

/**
 * Generates the Monthly Statement HTML matching the BPC pixel-perfect template design.
 */
const generateMonthlyStatementHTML = (data, settings, logoBase64) => {
  const customer = data.customer || {};
  const transactions = data.transactions || [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[(data.month || 1) - 1];
  const year = data.year || new Date().getFullYear();

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${day}/${month}/${y}`;
  };

  const statementNo = data.statementNumber || data.billNumber || '';
  const statementDate = `For ${monthName} ${year}`;
  const totalBilled = data.closingBalance || data.totalAmount || 0;

  const words = numberToWordsUtil(totalBilled);
  const amountInWords = `${words} Rupees`;

  const formattedTransactions = [];

  if (data.openingBalance && data.openingBalance > 0) {
    formattedTransactions.push({
      date: '',
      particulars: 'Opening Balance (Previous Month)',
      amount: data.openingBalance,
    });
  }

  for (const t of transactions) {
    formattedTransactions.push({
      date: formatDate(t.date),
      particulars: t.particulars,
      amount: t.amount,
    });
  }

  if (transactions.length === 0 && data.items) {
    for (const item of data.items) {
      formattedTransactions.push({
        date: formatDate(data.serviceDate || data.billDate),
        particulars: `${item.name} × ${item.quantity}`,
        amount: item.totalPrice,
      });
    }
  }

  const bankDetails = {
    vendorName: settings.bankDetails?.vendorName || 'Balaji S',
    ifscCode: settings.bankDetails?.ifscCode || 'SIBL0000082',
    accountNumber: settings.bankDetails?.accountNumber || '0082073000002485',
    bankName: settings.bankDetails?.bankName || 'South Indian Bank',
    branch: settings.bankDetails?.branch || 'TIRUCHIRAPALLI',
  };

  return buildMonthlyStatementHTML({
    statementNo,
    statementDate,
    billTo: customer.name || '',
    placeOfSupply: 'Tamil Nadu',
    transactions: formattedTransactions,
    totalBilled,
    amountInWords,
    receivedAmount: data.totalPaid || data.paidAmount || 0,
    logoBase64,
    bankDetails,
  });
};

/**
 * Generates the Invoice / Bill of Supply HTML using the pixel-perfect template.
 */
const generateInvoiceHTML = (data, settings, logoBase64) => {
  const customer = data.customer || {};
  const items = data.items || [];

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const templateItems = items.map((item) => ({
    name: item.name,
    qty: item.quantity,
    rate: item.unitPrice,
    total: item.totalPrice,
  }));

  const subtotalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.totalPrice, 0);

  const words = numberToWordsUtil(subtotalAmount);
  const amountInWords = `${words} Rupees`;

  const receivedAmount = data.paidAmount || 0;

  const bankDetails = {
    vendorName: settings.bankDetails?.vendorName || 'Balaji S',
    ifscCode: settings.bankDetails?.ifscCode || 'SIBL0000082',
    accountNumber: settings.bankDetails?.accountNumber || '0082073000002485',
    bankName: settings.bankDetails?.bankName || 'South Indian Bank',
    branch: settings.bankDetails?.branch || 'TIRUCHIRAPALLI',
  };

  return buildBillOfSupplyHTML({
    invoiceNo: data.billNumber || '',
    invoiceDate: formatDate(data.billDate),
    billTo: customer.name || '',
    shipTo: customer.name || '',
    placeOfSupply: 'Tamil Nadu',
    items: templateItems,
    subtotalQty,
    subtotalAmount,
    amountInWords,
    receivedAmount,
    logoBase64,
    bankDetails,
  });
};
