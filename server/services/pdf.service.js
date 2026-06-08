import puppeteer from 'puppeteer-core';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildBillOfSupplyHTML, buildMonthlyStatementHTML, buildInvoiceGeneratorHTML } from '../templates/invoiceTemplate.js';
import { numberToWords as numberToWordsUtil, amountInWordsSimple } from '../utils/numberToWords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts the BPC logo to a base64 data URI for embedding in PDF HTML.
 */
const getBase64Logo = async () => {
  try {
    const logoPath = join(__dirname, '..', 'assets', 'logo.jpeg');
    const logoBuffer = await readFile(logoPath);
    return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
  } catch (err) {
    console.warn('[PDF] Logo not found, using text fallback:', err.message);
    return '';
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main PDF generation function.
 * Uses puppeteer-core + @sparticuz/chromium for serverless / local compatibility.
 *
 * @param {Object} data     - Bill or MonthlyStatement document (populated)
 * @param {Object} settings - Settings document
 * @param {string} type     - 'monthly' | 'invoice'
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateBillPDF = async (data, settings, type = 'monthly') => {
  const logoBase64 = await getBase64Logo();

  const html = type === 'monthly'
    ? buildMonthlyStatementPDFHTML(data, settings, logoBase64)
    : type === 'invoice_generator'
    ? buildInvoiceGeneratorPDFHTML(data, settings, logoBase64)
    : buildInvoicePDFHTML(data, settings, logoBase64);

  let browser;
  try {
    process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs20.x';
    const { default: chromium } = await import('@sparticuz/chromium');

    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (!executablePath && process.env.NODE_ENV === 'development') {
      const fs = await import('fs');
      const localPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ];
      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    }

    if (!executablePath) {
      executablePath = await chromium.executablePath();
    }

    console.log(`[PDF] Launching — env:${process.env.NODE_ENV} path:${executablePath}`);

    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless:        chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdf = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin:          { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    console.log(`[PDF] Generated — ${pdf.length} bytes`);
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

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY STATEMENT PDF builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Monthly Statement HTML for PDF.
 *
 * FIX: Uses data.totalBilled (not data.closingBalance) as the total billed amount.
 *      Uses data.totalPaid for received amount.
 *      Uses data.closingBalance for balance due.
 * These three values are guaranteed to reconcile by the billing service.
 */
const buildMonthlyStatementPDFHTML = (data, settings, logoBase64) => {
  const customer   = data.customer || {};
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName  = monthNames[(data.month || 1) - 1];
  const year       = data.year || new Date().getFullYear();

  // ── Use transactions for flat list, or dailySummary for grouped ──────────
  const transactions = data.transactions || [];

  const formatDate = (d) => {
    if (!d) return '';
    const istMs = new Date(d).getTime() + 330 * 60 * 1000;
    const date  = new Date(istMs);
    return `${String(date.getUTCDate()).padStart(2,'0')}/${String(date.getUTCMonth()+1).padStart(2,'0')}/${date.getUTCFullYear()}`;
  };

  // ── Build PDF transaction rows ────────────────────────────────────────────
  const formattedTransactions = [];

  // Opening balance row (if non-zero)
  if (data.openingBalance && data.openingBalance > 0) {
    formattedTransactions.push({
      date:        '',
      particulars: 'Opening Balance (Brought Forward)',
      amount:      data.openingBalance,
      isMeta:      true,
    });
  }

  // One row per date (grouped by day) if dailySummary exists, else fallback to transactions
  if (data.dailySummary && data.dailySummary.length > 0) {
    for (const day of data.dailySummary) {
      const allParticulars = day.orders
        .map(o => o.particulars)
        .filter(p => p && p !== '-')
        .join(' ');
        
      formattedTransactions.push({
        date:        day.displayDate || formatDate(day.date),
        particulars: allParticulars || '-',
        billRef:     day.orders.length > 1 ? `${day.orderCount} orders` : (day.orders[0]?.billNumber || ''),
        amount:      day.dayTotal,
      });
    }
  } else {
    for (const t of transactions) {
      formattedTransactions.push({
        date:        formatDate(t.date),
        particulars: t.particulars || '-',
        billRef:     t.billNumber,
        amount:      t.amount,
      });
    }
  }

  // ── FIX: Use data.totalBilled — NOT data.closingBalance ──────────────────
  const totalBilled    = data.totalBilled  || 0;
  const receivedAmount = data.totalPaid    || 0;
  const balanceDue     = data.closingBalance || 0;

  const words         = numberToWordsUtil(balanceDue);
  const amountInWords = `${words} Rupees`;

  const bankDetails = {
    vendorName:    settings.bankDetails?.vendorName    || 'Balaji S',
    ifscCode:      settings.bankDetails?.ifscCode      || 'SIBL0000082',
    accountNumber: settings.bankDetails?.accountNumber || '0082073000002485',
    bankName:      settings.bankDetails?.bankName      || 'South Indian Bank',
    branch:        settings.bankDetails?.branch        || 'TIRUCHIRAPALLI',
  };

  return buildMonthlyStatementHTML({
    statementNo:    data.statementNumber || '',
    statementDate:  `For ${monthName} ${year}`,
    periodStart:    formatDate(data.periodStart),
    periodEnd:      formatDate(data.periodEnd),
    billTo:         customer.name || '',
    customerPhone:  customer.phone || '',
    customerEmail:  customer.email || '',
    placeOfSupply:  'Tamil Nadu',
    transactions:   formattedTransactions,
    totalOrders:    data.totalOrders || transactions.length,
    openingBalance: data.openingBalance || 0,
    totalBilled,        // ← FIXED
    receivedAmount,     // ← FIXED
    balanceDue,         // ← FIXED (was incorrectly using totalBilled before)
    amountInWords,
    logoBase64,
    bankDetails,
    settlementBy:   data.settlementDetails?.settledByName || '',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE / BILL OF SUPPLY PDF builder
// ─────────────────────────────────────────────────────────────────────────────

const buildInvoicePDFHTML = (data, settings, logoBase64) => {
  const customer = data.customer || {};
  const items    = data.items    || [];

  const formatDate = (d) => {
    if (!d) return '';
    const istMs = new Date(d).getTime() + 330 * 60 * 1000;
    const date  = new Date(istMs);
    return `${String(date.getUTCDate()).padStart(2,'0')}/${String(date.getUTCMonth()+1).padStart(2,'0')}/${date.getUTCFullYear()}`;
  };

  const templateItems = items.map((item) => ({
    name:  item.name,
    qty:   item.quantity,
    rate:  item.unitPrice,
    total: item.totalPrice,
  }));

  const subtotalQty    = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.totalPrice, 0);

  const words         = numberToWordsUtil(subtotalAmount);
  const amountInWords = `${words} Rupees`;
  const receivedAmount = data.paidAmount || 0;

  const bankDetails = {
    vendorName:    settings.bankDetails?.vendorName    || 'Balaji S',
    ifscCode:      settings.bankDetails?.ifscCode      || 'SIBL0000082',
    accountNumber: settings.bankDetails?.accountNumber || '0082073000002485',
    bankName:      settings.bankDetails?.bankName      || 'South Indian Bank',
    branch:        settings.bankDetails?.branch        || 'TIRUCHIRAPALLI',
  };

  return buildBillOfSupplyHTML({
    invoiceNo:      data.billNumber || '',
    invoiceDate:    formatDate(data.billDate),
    billTo:         customer.name || '',
    shipTo:         customer.name || '',
    placeOfSupply:  'Tamil Nadu',
    items:          templateItems,
    subtotalQty,
    subtotalAmount,
    cgstRate:       data.cgst || 0,
    sgstRate:       data.sgst || 0,
    cgstAmount:     data.cgstAmount || 0,
    sgstAmount:     data.sgstAmount || 0,
    grandTotal:     data.totalAmount,
    amountInWords,
    receivedAmount,
    logoBase64,
    bankDetails,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE GENERATOR PDF builder (Standalone)
// ─────────────────────────────────────────────────────────────────────────────

const buildInvoiceGeneratorPDFHTML = (data, settings, logoBase64) => {
  const customer = data.customer || {};
  const items    = data.items    || [];

  const formatDate = (d) => {
    if (!d) return '';
    const istMs = new Date(d).getTime() + 330 * 60 * 1000;
    const date  = new Date(istMs);
    return `${String(date.getUTCDate()).padStart(2,'0')}/${String(date.getUTCMonth()+1).padStart(2,'0')}/${date.getUTCFullYear()}`;
  };

  const templateItems = items.map((item) => ({
    name:  item.name,
    qty:   item.quantity,
    rate:  item.unitPrice,
    total: item.totalPrice,
  }));

  const subtotalQty    = items.reduce((sum, item) => sum + item.quantity, 0);

  const words         = amountInWordsSimple(data.totalAmount);

  return buildInvoiceGeneratorHTML({
    invoiceNo:      data.invoiceNumber || '',
    invoiceDate:    formatDate(data.invoiceDate),
    billTo:         customer.name || '',
    settlementBy:   data.settlementDetails?.settledByName || '',
    placeOfSupply:  data.placeOfSupply || 'Tamil Nadu',
    items:          templateItems,
    subtotalQty,
    subtotalAmount: data.subtotal,
    cgstRate:       data.cgst || 0,
    sgstRate:       data.sgst || 0,
    cgstAmount:     data.cgstAmount || 0,
    sgstAmount:     data.sgstAmount || 0,
    grandTotal:     data.totalAmount,
    amountInWords:  words,
    logoBase64,
    notes:          data.notes,
  });
};
