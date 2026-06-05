import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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
    console.warn('Logo file not found, using text fallback');
    return '';
  }
};

/**
 * Main PDF generation function.
 */
export const generateBillPDF = async (data, settings, type = 'monthly') => {
  const logoBase64 = await getBase64Logo();

  const html = type === 'monthly'
    ? generateMonthlyStatementHTML(data, settings, logoBase64)
    : generateInvoiceHTML(data, settings, logoBase64);

  let browser;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    
    // Default Windows Chrome paths for local development
    const localExecutable = process.env.CHROME_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    browser = await puppeteer.launch({
      args: isLocal ? puppeteer.defaultArgs() : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: isLocal ? localExecutable : await chromium.executablePath(),
      headless: isLocal ? 'new' : chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return Buffer.from(pdf);
  } finally {
    if (browser) await browser.close();
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
  
  // Convert amount to words
  const words = numberToWordsUtil(totalBilled);
  const amountInWords = `${words} Rupees`;

  const formattedTransactions = [];

  // Add opening balance if present
  if (data.openingBalance && data.openingBalance > 0) {
    formattedTransactions.push({
      date: '',
      particulars: 'Opening Balance (Previous Month)',
      amount: data.openingBalance,
    });
  }

  // Add actual transactions
  for (const t of transactions) {
    formattedTransactions.push({
      date: formatDate(t.date),
      particulars: t.particulars,
      amount: t.amount,
    });
  }

  // If it's a regular bill (not a statement with transactions)
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
 * Maps existing bill data fields to the template's expected format.
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

  // Map bill items to template format
  const templateItems = items.map((item) => ({
    name: item.name,
    qty: item.quantity,
    rate: item.unitPrice,
    total: item.totalPrice,
  }));

  const subtotalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Amount in words
  const words = numberToWordsUtil(subtotalAmount);
  const amountInWords = `${words} Rupees`;

  // Received/paid amount — pull from database, default to 0
  const receivedAmount = data.paidAmount || 0;

  // Bank details from settings
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
    shipTo: customer.name || '', // Ship To = Bill To
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
