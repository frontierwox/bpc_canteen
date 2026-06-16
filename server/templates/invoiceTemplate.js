/**
 * Bill of Supply HTML Template — Pixel-Perfect Match
 *
 * Generates the complete HTML string for a Bill of Supply invoice
 * that is rendered to PDF via Puppeteer. All CSS is inline/embedded;
 * no external resources are needed except the base64-encoded logo.
 *
 * Design matches the Balaji Perfect Caters reference invoice exactly:
 * - Gold ornamental double-border with corner flourish SVGs
 * - Header with circular BPC logo, company name in serif, GSTIN, address
 * - "BILL OF SUPPLY / ORIGINAL" box top-right
 * - Invoice meta row, Bill To / Ship To row
 * - Salmon-pink table header, items with "NOS" suffix
 * - Bank details + totals section
 * - Signature box with SVG signature
 *
 * @module templates/invoiceTemplate
 */

/**
 * SVG corner ornament for decorative border flourishes.
 * Intricate floral/scroll vector in antique gold (#C9A84C).
 */
const cornerOrnamentSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <g fill="none" stroke="#C9A84C" stroke-width="1.2">
    <path d="M5,5 Q5,25 15,35 Q25,45 20,55 Q15,65 5,65" />
    <path d="M5,5 Q25,5 35,15 Q45,25 55,20 Q65,15 65,5" />
    <path d="M15,15 Q20,25 25,25 Q30,25 30,20 Q30,15 25,12 Q20,10 15,15Z" fill="#C9A84C" opacity="0.3"/>
    <path d="M10,10 C15,5 25,8 22,18 C20,25 12,22 10,10Z" fill="#C9A84C" opacity="0.2"/>
    <circle cx="18" cy="18" r="2.5" fill="#C9A84C" opacity="0.5"/>
    <circle cx="28" cy="12" r="1.5" fill="#C9A84C" opacity="0.4"/>
    <circle cx="12" cy="28" r="1.5" fill="#C9A84C" opacity="0.4"/>
    <path d="M8,35 Q12,30 18,32" stroke-width="0.8"/>
    <path d="M35,8 Q30,12 32,18" stroke-width="0.8"/>
    <path d="M5,5 L10,5 M5,5 L5,10" stroke-width="2"/>
    <path d="M22,22 Q28,28 25,35 Q22,42 15,40" stroke-width="0.6" opacity="0.5"/>
    <path d="M22,22 Q28,28 35,25 Q42,22 40,15" stroke-width="0.6" opacity="0.5"/>
  </g>
</svg>`;

/**
 * SVG handwritten-style signature.
 */
const signatureSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="160" height="60">
  <g fill="none" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20,55 C25,20 35,15 40,30 C45,45 35,55 30,50 C25,45 35,25 45,20 C55,15 50,40 60,35"/>
    <path d="M60,35 C70,30 75,25 80,35 C85,45 75,50 85,40 C95,30 90,45 100,40"/>
    <path d="M100,40 C105,38 108,35 115,38 C120,40 118,45 125,42"/>
    <path d="M70,55 C90,52 110,50 140,48" stroke-width="1" opacity="0.6"/>
    <path d="M130,30 L135,22 L140,30" stroke-width="1.2"/>
  </g>
</svg>`;

/**
 * Formats a number with Indian comma grouping (e.g., 1,23,456).
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
const formatIndianNumber = (num) => {
  const n = Number(num || 0);
  const str = Math.round(n).toString();
  if (str.length <= 3) return str;

  let lastThree = str.substring(str.length - 3);
  const remaining = str.substring(0, str.length - 3);
  if (remaining.length > 0) {
    lastThree = ',' + lastThree;
  }
  const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return formatted;
};

/**
 * Builds the complete Bill of Supply HTML string.
 *
 * @param {Object} params
 * @param {string} params.invoiceNo - Invoice number (e.g., "BPC79")
 * @param {string} params.invoiceDate - Invoice date (e.g., "25/05/2026")
 * @param {string} params.billTo - Customer/client name
 * @param {string} params.shipTo - Ship-to name (defaults to billTo)
 * @param {string} params.placeOfSupply - Place of supply (e.g., "Tamil Nadu")
 * @param {Array<{name: string, qty: number, rate: number, total: number}>} params.items - Line items
 * @param {number} params.subtotalQty - Sum of all quantities
 * @param {number} params.subtotalAmount - Sum of all item totals
 * @param {string} params.amountInWords - Total amount in Indian English words
 * @param {number} params.receivedAmount - Amount already received (default 0)
 * @param {string} params.logoBase64 - Base64-encoded logo data URI
 * @param {Object} params.bankDetails - Bank details object
 * @returns {string} Complete HTML document string
 */
export const buildBillOfSupplyHTML = ({
  invoiceNo,
  invoiceDate,
  billTo,
  shipTo,
  placeOfSupply,
  items,
  subtotalQty,
  subtotalAmount,
  cgstRate = 0,
  sgstRate = 0,
  cgstAmount = 0,
  sgstAmount = 0,
  grandTotal,
  amountInWords,
  receivedAmount = 0,
  logoBase64,
  bankDetails = {},
}) => {
  // Build item rows
  let itemRowsHTML = '';
  items.forEach((item, index) => {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-no">${index + 1}</td>
        <td class="item-cell item-name">${item.name}</td>
        <td class="item-cell item-qty">${item.qty} NOS</td>
        <td class="item-cell item-rate">${formatIndianNumber(item.rate)}</td>
        <td class="item-cell item-total">${formatIndianNumber(item.total)}</td>
      </tr>`;
  });

  // Calculate minimum empty rows to fill the table area
  const minRows = 12;
  const emptyRowsNeeded = Math.max(0, minRows - items.length);
  for (let i = 0; i < emptyRowsNeeded; i++) {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-no">&nbsp;</td>
        <td class="item-cell item-name">&nbsp;</td>
        <td class="item-cell item-qty">&nbsp;</td>
        <td class="item-cell item-rate">&nbsp;</td>
        <td class="item-cell item-total">&nbsp;</td>
      </tr>`;
  }

  const bankName = bankDetails.vendorName || 'Balaji S';
  const bankIFSC = bankDetails.ifscCode || 'SIBL0000082';
  const bankAccountNo = bankDetails.accountNumber || '0082073000002485';
  const bankBankName = bankDetails.bankName || 'South Indian Bank';
  const bankBranch = bankDetails.branch || 'TIRUCHIRAPALLI';
  const bankFullName = `${bankBankName}, ${bankBranch}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bill of Supply - ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1a1a2e;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      background: #FFFFFF;
    }

    /* ─── DECORATIVE GOLD BORDER ─── */
    .border-outer {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    .border-inner {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 1px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      z-index: 3;
      pointer-events: none;
    }
    .corner-tl { top: 4px; left: 4px; }
    .corner-tr { top: 4px; right: 4px; transform: scaleX(-1); }
    .corner-bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
    .corner-br { bottom: 4px; right: 4px; transform: scale(-1, -1); }

    /* ─── CONTENT AREA ─── */
    .content {
      position: relative;
      z-index: 1;
      padding: 28px 32px 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* ─── HEADER SECTION ─── */
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 18px;
    }

    .header-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
      padding-top: 6px;
    }

    .company-name {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .gstin-line {
      font-size: 11px;
      color: #1a1a2e;
      margin-bottom: 5px;
    }

    .gstin-label {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .address-line {
      font-size: 11px;
      color: #666666;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .address-pin {
      color: #D4A017;
      font-size: 12px;
      flex-shrink: 0;
    }

    /* ─── BILL OF SUPPLY BOX (top-right) ─── */
    .bill-type-box {
      position: absolute;
      top: 28px;
      right: 32px;
      z-index: 5;
      text-align: center;
    }

    .bill-type-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .bill-type-original {
      border: 1px solid #333333;
      padding: 3px 20px;
      font-size: 10px;
      color: #555555;
      background: #f9f9f9;
      display: inline-block;
    }

    /* ─── DIVIDER ─── */
    .divider {
      width: 100%;
      height: 1px;
      background: #cccccc;
    }

    /* ─── INVOICE META ROW ─── */
    .invoice-meta {
      display: flex;
      padding: 12px 0;
      gap: 40px;
    }

    .meta-group {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    /* ─── BILL TO / SHIP TO ─── */
    .bill-ship-row {
      display: flex;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
    }

    .bill-to-section {
      flex: 1;
      padding: 12px 16px;
    }

    .ship-to-section {
      flex: 1;
      padding: 12px 16px;
      border-left: 1px solid #e0e0e0;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .section-value {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 3px;
    }

    .place-supply {
      font-size: 11px;
      color: #1a1a2e;
    }

    .place-supply-label {
      font-weight: 700;
    }

    /* ─── ITEMS TABLE ─── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      flex: 1;
    }

    .items-table thead th {
      background: rgba(244, 197, 192, 0.45);
      color: #1a1a2e;
      font-weight: 700;
      font-size: 11px;
      padding: 9px 10px;
      text-align: left;
      border-bottom: 1px solid #e8d8d5;
    }

    .items-table thead th.th-no {
      width: 6%;
      text-align: center;
    }

    .items-table thead th.th-items {
      width: 48%;
      text-align: left;
    }

    .items-table thead th.th-qty {
      width: 14%;
      text-align: center;
    }

    .items-table thead th.th-rate {
      width: 14%;
      text-align: center;
    }

    .items-table thead th.th-total {
      width: 18%;
      text-align: right;
    }

    .item-cell {
      padding: 8px 10px;
      font-size: 11px;
      color: #1a1a2e;
      border-bottom: 1px solid #f2f2f2;
      vertical-align: middle;
    }

    .item-no { text-align: center; }
    .item-name { text-align: left; }
    .item-qty { text-align: center; }
    .item-rate { text-align: center; }
    .item-total { text-align: right; }

    /* ─── SUBTOTAL ROW ─── */
    .subtotal-row {
      background: rgba(244, 197, 192, 0.45);
    }

    .subtotal-row td {
      padding: 9px 10px;
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      border-top: 1px solid #e8d8d5;
    }

    /* ─── BOTTOM SECTION: BANK + TOTALS ─── */
    .bottom-section {
      display: flex;
      margin-top: 8px;
      gap: 0;
    }

    .bank-details {
      flex: 1;
      padding: 10px 0 0 0;
    }

    .bank-title {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }

    .bank-row {
      display: flex;
      font-size: 11px;
      color: #1a1a2e;
      margin-bottom: 3px;
    }

    .bank-label {
      font-weight: 700;
      width: 90px;
      flex-shrink: 0;
    }

    .bank-value {
      font-weight: 400;
    }

    .totals-section {
      flex: 1;
      padding: 0 0 0 20px;
      border-left: 1px solid #e0e0e0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 8px 0;
      border-top: 1px solid #cccccc;
    }

    .total-row:first-child {
      border-top: 2px solid #cccccc;
    }

    .total-label {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .total-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .received-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 6px 0;
    }

    .received-label {
      font-size: 11px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .received-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .amount-words-section {
      padding: 8px 0 0 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    }

    .amount-words-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .amount-words-value {
      font-size: 10.5px;
      color: #444444;
      font-weight: 400;
    }

    /* ─── SIGNATURE BOX ─── */
    .signature-box {
      border: 1px solid #cccccc;
      border-radius: 6px;
      padding: 10px 16px 8px;
      text-align: center;
      margin-top: 12px;
      margin-left: auto;
      width: 210px;
    }

    .signature-image {
      margin-bottom: 2px;
    }

    .signature-label {
      font-size: 10px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 1px;
    }

    .signature-company {
      font-size: 10px;
      color: #444444;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Decorative Gold Borders -->
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <!-- Corner Ornaments -->
    <div class="corner corner-tl">${cornerOrnamentSVG}</div>
    <div class="corner corner-tr">${cornerOrnamentSVG}</div>
    <div class="corner corner-bl">${cornerOrnamentSVG}</div>
    <div class="corner corner-br">${cornerOrnamentSVG}</div>

    <!-- Main Content -->
    <div class="content">
      <!-- BILL OF SUPPLY Box (top-right) -->
      <div class="bill-type-box">
        <div class="bill-type-title">BILL OF SUPPLY</div>
        <div class="bill-type-original">ORIGINAL</div>
      </div>

      <!-- Header -->
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="BPC Logo" />` : ''}
        <div class="header-info">
          <div class="company-name">Balaji Perfect Caters</div>
          <div class="gstin-line">
            <span class="gstin-label">GSTIN</span>&nbsp; 33CADPB6649D1Z3
          </div>
          <div class="address-line">
            <span class="address-pin">📍</span>
            <span>Raaj Iswariyam, Cantonment, Trichy, Trichy, Tamil Nadu, 620001</span>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Invoice Meta -->
      <div class="invoice-meta">
        <div class="meta-group">
          <span class="meta-label">Invoice No.</span>
          <span class="meta-value">${invoiceNo}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">Invoice Date</span>
          <span class="meta-value">${invoiceDate}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Bill To / Ship To -->
      <div class="bill-ship-row">
        <div class="bill-to-section">
          <div class="section-label">Billing Address</div>
          <div class="section-value">${billTo}</div>
          <div class="place-supply">
            <span class="place-supply-label">Place of Supply</span> ${placeOfSupply}
          </div>
        </div>
        <div class="ship-to-section">
          <div class="section-label">Shipping Address</div>
          <div class="section-value">${shipTo || billTo}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="th-no">No</th>
            <th class="th-items">Items</th>
            <th class="th-qty">Qty.</th>
            <th class="th-rate">Rate</th>
            <th class="th-total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHTML}
          <!-- Subtotal -->
          <tr class="subtotal-row">
            <td></td>
            <td style="font-weight:700;">SUBTOTAL</td>
            <td style="text-align:center; font-weight:700;">${subtotalQty}</td>
            <td></td>
            <td style="text-align:right; font-weight:700;">₹ ${formatIndianNumber(subtotalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Bottom Section: Bank Details + Totals -->
      <div class="bottom-section">
        <!-- Bank Details -->
        <div class="bank-details">
          <div class="bank-title">Bank Details</div>
          <div class="bank-row">
            <span class="bank-label">Name</span>
            <span class="bank-value">${bankName}</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">IFSC</span>
            <span class="bank-value">${bankIFSC}</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">Account No</span>
            <span class="bank-value">${bankAccountNo}</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">Bank Name</span>
            <span class="bank-value">${bankFullName}</span>
          </div>
        </div>

        <!-- Totals + Signature -->
        <div class="totals-section">
          <!-- Subtotal -->
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">₹ ${formatIndianNumber(subtotalAmount)}</span>
          </div>

          ${cgstAmount > 0 ? `
          <!-- CGST -->
          <div class="received-row">
            <span class="received-label">CGST @ ${cgstRate}%</span>
            <span class="received-value">₹${formatIndianNumber(cgstAmount)}</span>
          </div>

          <!-- SGST -->
          <div class="received-row">
            <span class="received-label">SGST @ ${sgstRate}%</span>
            <span class="received-value">₹${formatIndianNumber(sgstAmount)}</span>
          </div>
          ` : ''}

          <!-- Grand Total -->
          <div class="total-row">
            <span class="total-label">Grand Total</span>
            <span class="total-value">₹ ${formatIndianNumber(grandTotal || subtotalAmount)}</span>
          </div>

          <!-- Received Amount -->
          <div class="received-row">
            <span class="received-label">Received Amount</span>
            <span class="received-value">₹${formatIndianNumber(receivedAmount)}</span>
          </div>

          <!-- Amount in Words -->
          <div class="amount-words-section">
            <div class="amount-words-label">Total Amount (in words)</div>
            <div class="amount-words-value">${amountInWords}</div>
          </div>

          <!-- Signature -->
          <div class="signature-box">
            <div class="signature-image">${signatureSVG}</div>
            <div class="signature-label">Signature</div>
            <div class="signature-company">Balaji Perfect Caters</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Builds the complete Monthly Statement HTML string using the same pixel-perfect template design.
 *
 * @param {Object} params
 * @param {string} params.statementNo - Statement number
 * @param {string} params.statementDate - Statement generation date or period
 * @param {string} params.billTo - Customer/client name
 * @param {string} params.placeOfSupply - Place of supply (e.g., "Tamil Nadu")
 * @param {Array<{date: string, particulars: string, amount: number}>} params.transactions - List of transactions
 * @param {number} params.totalBilled - Sum of all transactions (or total amount)
 * @param {string} params.amountInWords - Total amount in Indian English words
 * @param {number} params.receivedAmount - Amount already received
 * @param {string} params.logoBase64 - Base64-encoded logo data URI
 * @param {Object} params.bankDetails - Bank details object
 * @returns {string} Complete HTML document string
 */
export const buildMonthlyStatementHTML = ({
  statementNo,
  statementDate,
  billTo,
  settlementBy,
  placeOfSupply = 'Tamil Nadu',
  transactions,
  totalBilled,
  amountInWords,
  receivedAmount = 0,
  logoBase64,
  bankDetails = {},
}) => {
  // Build transaction rows
  let itemRowsHTML = '';
  transactions.forEach((t) => {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-qty" style="width: 15%;">${t.date}</td>
        <td class="item-cell item-name" style="width: 65%;">${t.particulars}</td>
        <td class="item-cell item-total" style="width: 20%;">${formatIndianNumber(t.amount)}</td>
      </tr>`;
  });

  // Calculate minimum empty rows to fill the table area
  const minRows = 12;
  const emptyRowsNeeded = Math.max(0, minRows - transactions.length);
  for (let i = 0; i < emptyRowsNeeded; i++) {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-qty">&nbsp;</td>
        <td class="item-cell item-name">&nbsp;</td>
        <td class="item-cell item-total">&nbsp;</td>
      </tr>`;
  }

  const bankName = bankDetails.vendorName || 'Balaji S';
  const bankIFSC = bankDetails.ifscCode || 'SIBL0000082';
  const bankAccountNo = bankDetails.accountNumber || '0082073000002485';
  const bankBankName = bankDetails.bankName || 'South Indian Bank';
  const bankBranch = bankDetails.branch || 'TIRUCHIRAPALLI';
  const bankFullName = `${bankBankName}, ${bankBranch}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Monthly Statement - ${statementNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1a1a2e;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      background: #FFFFFF;
    }

    /* ─── DECORATIVE GOLD BORDER ─── */
    .border-outer {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    .border-inner {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 1px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      z-index: 3;
      pointer-events: none;
    }
    .corner-tl { top: 4px; left: 4px; }
    .corner-tr { top: 4px; right: 4px; transform: scaleX(-1); }
    .corner-bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
    .corner-br { bottom: 4px; right: 4px; transform: scale(-1, -1); }

    /* ─── CONTENT AREA ─── */
    .content {
      position: relative;
      z-index: 1;
      padding: 28px 32px 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* ─── HEADER SECTION ─── */
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 18px;
    }

    .header-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
      padding-top: 6px;
    }

    .company-name {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .gstin-line {
      font-size: 11px;
      color: #1a1a2e;
      margin-bottom: 5px;
    }

    .gstin-label {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .address-line {
      font-size: 11px;
      color: #666666;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .address-pin {
      color: #D4A017;
      font-size: 12px;
      flex-shrink: 0;
    }

    /* ─── STATEMENT BOX (top-right) ─── */
    .bill-type-box {
      position: absolute;
      top: 28px;
      right: 32px;
      z-index: 5;
      text-align: center;
    }

    .bill-type-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .bill-type-original {
      border: 1px solid #333333;
      padding: 3px 20px;
      font-size: 10px;
      color: #555555;
      background: #f9f9f9;
      display: inline-block;
    }

    /* ─── DIVIDER ─── */
    .divider {
      width: 100%;
      height: 1px;
      background: #cccccc;
    }

    /* ─── INVOICE META ROW ─── */
    .invoice-meta {
      display: flex;
      padding: 12px 0;
      gap: 40px;
    }

    .meta-group {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    /* ─── BILL TO / SHIP TO ─── */
    .bill-ship-row {
      display: flex;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
    }

    .bill-to-section {
      flex: 1;
      padding: 12px 16px;
    }

    .ship-to-section {
      flex: 1;
      padding: 12px 16px;
      border-left: 1px solid #e0e0e0;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .section-value {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 3px;
    }

    .place-supply {
      font-size: 11px;
      color: #1a1a2e;
    }

    .place-supply-label {
      font-weight: 700;
    }

    /* ─── ITEMS TABLE ─── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      flex: 1;
    }

    .items-table thead th {
      background: rgba(244, 197, 192, 0.45);
      color: #1a1a2e;
      font-weight: 700;
      font-size: 11px;
      padding: 9px 10px;
      text-align: left;
      border-bottom: 1px solid #e8d8d5;
    }

    .item-cell {
      padding: 8px 10px;
      font-size: 11px;
      color: #1a1a2e;
      border-bottom: 1px solid #f2f2f2;
      vertical-align: middle;
    }

    .item-no { text-align: center; }
    .item-name { text-align: left; }
    .item-qty { text-align: center; }
    .item-rate { text-align: center; }
    .item-total { text-align: right; }

    /* ─── SUBTOTAL ROW ─── */
    .subtotal-row {
      background: rgba(244, 197, 192, 0.45);
    }

    .subtotal-row td {
      padding: 9px 10px;
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      border-top: 1px solid #e8d8d5;
    }

    /* ─── BOTTOM SECTION: BANK + TOTALS ─── */
    .bottom-section {
      display: flex;
      margin-top: 8px;
      gap: 0;
    }

    .bank-details {
      flex: 1;
      padding: 10px 0 0 0;
    }

    .bank-title {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }

    .bank-row {
      display: flex;
      font-size: 11px;
      color: #1a1a2e;
      margin-bottom: 3px;
    }

    .bank-label {
      font-weight: 700;
      width: 90px;
      flex-shrink: 0;
    }

    .bank-value {
      font-weight: 400;
    }

    .totals-section {
      flex: 1;
      padding: 0 0 0 20px;
      border-left: 1px solid #e0e0e0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 8px 0;
      border-top: 1px solid #cccccc;
    }

    .total-row:first-child {
      border-top: 2px solid #cccccc;
    }

    .total-label {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .total-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .received-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 6px 0;
    }

    .received-label {
      font-size: 11px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .received-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .amount-words-section {
      padding: 8px 0 0 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    }

    .amount-words-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .amount-words-value {
      font-size: 10.5px;
      color: #444444;
      font-weight: 400;
    }

    /* ─── SIGNATURE BOX ─── */
    .signature-box {
      border: 1px solid #cccccc;
      border-radius: 6px;
      padding: 10px 16px 8px;
      text-align: center;
      margin-top: 12px;
      margin-left: auto;
      width: 210px;
    }

    .signature-image {
      margin-bottom: 2px;
    }

    .signature-label {
      font-size: 10px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 1px;
    }

    .signature-company {
      font-size: 10px;
      color: #444444;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Decorative Gold Borders -->
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <!-- Corner Ornaments -->
    <div class="corner corner-tl">${cornerOrnamentSVG}</div>
    <div class="corner corner-tr">${cornerOrnamentSVG}</div>
    <div class="corner corner-bl">${cornerOrnamentSVG}</div>
    <div class="corner corner-br">${cornerOrnamentSVG}</div>

    <!-- Main Content -->
    <div class="content">
      <!-- STATEMENT Box (top-right) -->
      <div class="bill-type-box">
        <div class="bill-type-title">MONTHLY STATEMENT</div>
        <div class="bill-type-original">ORIGINAL</div>
      </div>

      <!-- Header -->
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="BPC Logo" />` : ''}
        <div class="header-info">
          <div class="company-name">Balaji Perfect Caters</div>
          <div class="gstin-line">
            <span class="gstin-label">GSTIN</span>&nbsp; 33CADPB6649D1Z3
          </div>
          <div class="address-line">
            <span class="address-pin">📍</span>
            <span>Raaj Iswariyam, Cantonment, Trichy, Trichy, Tamil Nadu, 620001</span>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Invoice Meta -->
      <div class="invoice-meta">
        <div class="meta-group">
          <span class="meta-label">Statement No.</span>
          <span class="meta-value">${statementNo}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">Date / Period</span>
          <span class="meta-value">${statementDate}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Bill To / Settlement By -->
      <div class="bill-ship-row">
        <div class="bill-to-section">
          <div class="section-label">Billing Address</div>
          <div class="section-value">${billTo}</div>
          <div class="place-supply">
            <span class="place-supply-label">Place of Supply</span> ${placeOfSupply}
          </div>
        </div>
        <div class="ship-to-section">
          <div class="section-label">${settlementBy ? 'Settlement By' : 'Shipping Address'}</div>
          <div class="section-value">${settlementBy || billTo}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="th-qty" style="width: 15%; text-align: center;">Date</th>
            <th class="th-items" style="width: 65%;">Particulars</th>
            <th class="th-total" style="width: 20%; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHTML}
          <!-- Subtotal -->
          <tr class="subtotal-row">
            <td></td>
            <td style="font-weight:700;">TOTAL AMOUNT</td>
            <td style="text-align:right; font-weight:700;">₹ ${formatIndianNumber(totalBilled)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Bottom Section: Bank Details + Totals -->
      <div class="bottom-section">
        <!-- Bank Details -->
        <div class="bank-details">
          <div class="bank-title">Bank Details</div>
          <div class="bank-row">
            <span class="bank-label">Name</span>
            <span class="bank-value">${bankName}</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">IFSC</span>
            <span class="bank-value">${bankIFSC}</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">Account No</span>
            <span class="bank-value">${bankAccountNo}</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">Bank Name</span>
            <span class="bank-value">${bankFullName}</span>
          </div>
        </div>

        <!-- Totals + Signature -->
        <div class="totals-section">
          <!-- Total Amount -->
          <div class="total-row">
            <span class="total-label">Total Billed</span>
            <span class="total-value">₹ ${formatIndianNumber(totalBilled)}</span>
          </div>

          <!-- Received Amount -->
          <div class="received-row">
            <span class="received-label">Received Amount</span>
            <span class="received-value">₹${formatIndianNumber(receivedAmount)}</span>
          </div>

          <!-- Total Balance due if any -->
          <div class="total-row" style="margin-top: 4px; padding-top: 4px;">
             <span class="total-label">Balance Due</span>
             <span class="total-value" style="color: #c0392b;">₹ ${formatIndianNumber(Math.max(0, totalBilled - receivedAmount))}</span>
          </div>

          <!-- Amount in Words -->
          <div class="amount-words-section">
            <div class="amount-words-label">Total Amount (in words)</div>
            <div class="amount-words-value">${amountInWords}</div>
          </div>

          <!-- Signature -->
          <div class="signature-box">
            <div class="signature-image">${signatureSVG}</div>
            <div class="signature-label">Signature</div>
            <div class="signature-company">Balaji Perfect Caters</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Builds the HTML string for the Invoice Generator (Admin-only).
 * Identical design to Bill of Supply, but EXCLUDES bank details.
 */
export const buildInvoiceGeneratorHTML = ({
  invoiceNo,
  invoiceDate,
  billTo,
  settlementBy,
  placeOfSupply,
  purpose,
  items,
  subtotalQty,
  subtotalAmount,
  cgstRate = 0,
  sgstRate = 0,
  cgstAmount = 0,
  sgstAmount = 0,
  grandTotal,
  amountInWords,
  logoBase64,
  notes,
}) => {
  // Build item rows
  let itemRowsHTML = '';
  items.forEach((item, index) => {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-no">${index + 1}</td>
        <td class="item-cell item-name">${item.name}</td>
        <td class="item-cell item-qty">${item.qty} NOS</td>
        <td class="item-cell item-rate">${formatIndianNumber(item.rate)}</td>
        <td class="item-cell item-total">${formatIndianNumber(item.total)}</td>
      </tr>`;
  });

  const minRows = 12;
  const emptyRowsNeeded = Math.max(0, minRows - items.length);
  for (let i = 0; i < emptyRowsNeeded; i++) {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-no">&nbsp;</td>
        <td class="item-cell item-name">&nbsp;</td>
        <td class="item-cell item-qty">&nbsp;</td>
        <td class="item-cell item-rate">&nbsp;</td>
        <td class="item-cell item-total">&nbsp;</td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice - ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1a1a2e;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      background: #FFFFFF;
    }

    /* ─── DECORATIVE GOLD BORDER ─── */
    .border-outer {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    .border-inner {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 1px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      z-index: 3;
      pointer-events: none;
    }
    .corner-tl { top: 4px; left: 4px; }
    .corner-tr { top: 4px; right: 4px; transform: scaleX(-1); }
    .corner-bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
    .corner-br { bottom: 4px; right: 4px; transform: scale(-1, -1); }

    /* ─── CONTENT AREA ─── */
    .content {
      position: relative;
      z-index: 1;
      padding: 28px 32px 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* ─── HEADER SECTION ─── */
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 18px;
    }

    .header-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
      padding-top: 6px;
    }

    .company-name {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .gstin-line {
      font-size: 11px;
      color: #1a1a2e;
      margin-bottom: 5px;
    }

    .gstin-label {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .address-line {
      font-size: 11px;
      color: #666666;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .address-pin {
      color: #D4A017;
      font-size: 12px;
      flex-shrink: 0;
    }

    /* ─── BILL TYPE BOX (top-right) ─── */
    .bill-type-box {
      position: absolute;
      top: 28px;
      right: 32px;
      z-index: 5;
      text-align: center;
    }

    .bill-type-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .bill-type-original {
      border: 1px solid #333333;
      padding: 3px 20px;
      font-size: 10px;
      color: #555555;
      background: #f9f9f9;
      display: inline-block;
    }

    /* ─── DIVIDER ─── */
    .divider {
      width: 100%;
      height: 1px;
      background: #cccccc;
    }

    /* ─── INVOICE META ROW ─── */
    .invoice-meta {
      display: flex;
      padding: 12px 0;
      gap: 40px;
    }

    .meta-group {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    /* ─── BILL TO / SHIP TO ─── */
    .bill-ship-row {
      display: flex;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
    }

    .bill-to-section {
      flex: 1;
      padding: 12px 16px;
    }

    .ship-to-section {
      flex: 1;
      padding: 12px 16px;
      border-left: 1px solid #e0e0e0;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .section-value {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 3px;
    }

    .place-supply {
      font-size: 11px;
      color: #1a1a2e;
    }

    .place-supply-label {
      font-weight: 700;
    }

    /* ─── ITEMS TABLE ─── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      flex: 1;
    }

    .items-table thead th {
      background: rgba(244, 197, 192, 0.45);
      color: #1a1a2e;
      font-weight: 700;
      font-size: 11px;
      padding: 9px 10px;
      text-align: left;
      border-bottom: 1px solid #e8d8d5;
    }

    .items-table thead th.th-no {
      width: 6%;
      text-align: center;
    }

    .items-table thead th.th-items {
      width: 48%;
      text-align: left;
    }

    .items-table thead th.th-qty {
      width: 14%;
      text-align: center;
    }

    .items-table thead th.th-rate {
      width: 14%;
      text-align: center;
    }

    .items-table thead th.th-total {
      width: 18%;
      text-align: right;
    }

    .item-cell {
      padding: 8px 10px;
      font-size: 11px;
      color: #1a1a2e;
      border-bottom: 1px solid #f2f2f2;
      vertical-align: middle;
    }

    .item-no { text-align: center; }
    .item-name { text-align: left; }
    .item-qty { text-align: center; }
    .item-rate { text-align: center; }
    .item-total { text-align: right; }

    /* ─── SUBTOTAL ROW ─── */
    .subtotal-row {
      background: rgba(244, 197, 192, 0.45);
    }

    .subtotal-row td {
      padding: 9px 10px;
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      border-top: 1px solid #e8d8d5;
    }

    /* ─── BOTTOM SECTION: TOTALS ─── */
    .bottom-section {
      display: flex;
      margin-top: 8px;
      gap: 0;
    }

    .empty-left {
      flex: 1;
      padding: 10px 20px 0 0;
      font-size: 11px;
      color: #444;
    }

    .totals-section {
      flex: 1;
      padding: 0 0 0 20px;
      border-left: 1px solid #e0e0e0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 8px 0;
      border-top: 1px solid #cccccc;
    }

    .total-row:first-child {
      border-top: 2px solid #cccccc;
    }

    .total-label {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .total-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .received-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 6px 0;
    }

    .received-label {
      font-size: 11px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .received-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .amount-words-section {
      padding: 8px 0 0 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    }

    .amount-words-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .amount-words-value {
      font-size: 10.5px;
      color: #444444;
      font-weight: 400;
    }

    /* ─── SIGNATURE BOX ─── */
    .signature-box {
      border: 1px solid #cccccc;
      border-radius: 6px;
      padding: 10px 16px 8px;
      text-align: center;
      margin-top: 12px;
      margin-left: auto;
      width: 210px;
    }

    .signature-image {
      margin-bottom: 2px;
    }

    .signature-label {
      font-size: 10px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 1px;
    }

    .signature-company {
      font-size: 10px;
      color: #444444;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <div class="corner corner-tl">${cornerOrnamentSVG}</div>
    <div class="corner corner-tr">${cornerOrnamentSVG}</div>
    <div class="corner corner-bl">${cornerOrnamentSVG}</div>
    <div class="corner corner-br">${cornerOrnamentSVG}</div>

    <div class="content">
      <div class="bill-type-box">
        <div class="bill-type-title">INVOICE</div>
        <div class="bill-type-original">ORIGINAL</div>
      </div>

      <!-- Header -->
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="BPC Logo" />` : ''}
        <div class="header-info">
          <div class="company-name">Balaji Perfect Caters</div>
          <div class="gstin-line">
            <span class="gstin-label">GSTIN</span>&nbsp; 33CADPB6649D1Z3
          </div>
          <div class="address-line">
            <span class="address-pin">📍</span>
            <span>Raaj Iswariyam, Cantonment, Trichy, Trichy, Tamil Nadu, 620001</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Invoice Meta -->
      <div class="invoice-meta">
        <div class="meta-group">
          <span class="meta-label">Invoice No.</span>
          <span class="meta-value">${invoiceNo}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">Invoice Date</span>
          <span class="meta-value">${invoiceDate}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- To / Purpose -->
      <div class="bill-ship-row">
        <div class="bill-to-section">
          <div class="section-label">To</div>
          <div class="section-value">${billTo}</div>
          <div class="place-supply">
            <span class="place-supply-label">Department</span> ${placeOfSupply}
          </div>
        </div>
        <div class="ship-to-section">
          <div class="section-label">${settlementBy ? 'Settlement By' : 'Purpose'}</div>
          <div class="section-value">${settlementBy || purpose || billTo}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="th-no">No</th>
            <th class="th-items">Items</th>
            <th class="th-qty">Qty.</th>
            <th class="th-rate">Rate</th>
            <th class="th-total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHTML}
          <!-- Subtotal -->
          <tr class="subtotal-row">
            <td></td>
            <td style="font-weight:700;">SUBTOTAL</td>
            <td style="text-align:center; font-weight:700;">${subtotalQty}</td>
            <td></td>
            <td style="text-align:right; font-weight:700;">₹ ${formatIndianNumber(subtotalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Bottom Section: Totals (NO BANK DETAILS) -->
      <div class="bottom-section">
        <div class="empty-left">
          ${notes ? `<strong>Notes:</strong><br/>${notes}` : ''}
        </div>

        <div class="totals-section">
          <!-- Subtotal -->
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">₹ ${formatIndianNumber(subtotalAmount)}</span>
          </div>

          ${cgstAmount > 0 ? `
          <!-- CGST -->
          <div class="received-row">
            <span class="received-label">CGST @ ${cgstRate}%</span>
            <span class="received-value">₹${formatIndianNumber(cgstAmount)}</span>
          </div>

          <!-- SGST -->
          <div class="received-row">
            <span class="received-label">SGST @ ${sgstRate}%</span>
            <span class="received-value">₹${formatIndianNumber(sgstAmount)}</span>
          </div>
          ` : ''}

          <!-- Grand Total -->
          <div class="total-row">
            <span class="total-label">Grand Total</span>
            <span class="total-value">₹ ${formatIndianNumber(grandTotal || subtotalAmount)}</span>
          </div>

          <!-- Amount in Words -->
          <div class="amount-words-section">
            <div class="amount-words-label">Total Amount (in words)</div>
            <div class="amount-words-value">${amountInWords}</div>
          </div>

          <!-- Signature -->
          <div class="signature-box">
            <div class="signature-image">${signatureSVG}</div>
            <div class="signature-label">Signature</div>
            <div class="signature-company">Balaji Perfect Caters</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Builds the HTML string for the Quotation Generator.
 * Same gold-border ornamental design, but with:
 * - Title: "QUOTATION" instead of "TAX INVOICE"
 * - Fields: Customer Details, Event Location, Service Venue
 * - Validity date
 * - Terms & Conditions section
 * - No bank details
 */
export const buildQuotationHTML = ({
  quotationNo,
  quotationDate,
  validUntil,
  customerName,
  customerOrg,
  customerPhone,
  eventLocation,
  serviceVenue,
  items,
  subtotalQty,
  subtotalAmount,
  cgstRate = 0,
  sgstRate = 0,
  cgstAmount = 0,
  sgstAmount = 0,
  grandTotal,
  amountInWords,
  logoBase64,
  notes,
  termsAndConditions,
}) => {
  // Build item rows
  let itemRowsHTML = '';
  items.forEach((item, index) => {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-no">${index + 1}</td>
        <td class="item-cell item-name">${item.name}</td>
        <td class="item-cell item-qty">${item.qty} ${item.unit || 'NOS'}</td>
        <td class="item-cell item-rate">${formatIndianNumber(item.rate)}</td>
        <td class="item-cell item-total">${formatIndianNumber(item.total)}</td>
      </tr>`;
  });

  const minRows = 10;
  const emptyRowsNeeded = Math.max(0, minRows - items.length);
  for (let i = 0; i < emptyRowsNeeded; i++) {
    itemRowsHTML += `
      <tr>
        <td class="item-cell item-no">&nbsp;</td>
        <td class="item-cell item-name">&nbsp;</td>
        <td class="item-cell item-qty">&nbsp;</td>
        <td class="item-cell item-rate">&nbsp;</td>
        <td class="item-cell item-total">&nbsp;</td>
      </tr>`;
  }

  // Build terms lines
  let termsHTML = '';
  if (termsAndConditions) {
    const lines = termsAndConditions.split('\n').filter(l => l.trim());
    termsHTML = lines.map((line, i) => `<div style="margin-bottom:2px;">${i + 1}. ${line.trim()}</div>`).join('');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quotation - ${quotationNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1a1a2e;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      background: #FFFFFF;
    }

    /* ─── DECORATIVE GOLD BORDER ─── */
    .border-outer {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    .border-inner {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 1px solid #C9A84C;
      pointer-events: none;
      z-index: 2;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      z-index: 3;
      pointer-events: none;
    }
    .corner-tl { top: 4px; left: 4px; }
    .corner-tr { top: 4px; right: 4px; transform: scaleX(-1); }
    .corner-bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
    .corner-br { bottom: 4px; right: 4px; transform: scale(-1, -1); }

    /* ─── CONTENT AREA ─── */
    .content {
      position: relative;
      z-index: 1;
      padding: 28px 32px 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* ─── HEADER SECTION ─── */
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 18px;
    }

    .header-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
      padding-top: 6px;
    }

    .company-name {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .gstin-line {
      font-size: 11px;
      color: #1a1a2e;
      margin-bottom: 5px;
    }

    .gstin-label {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .address-line {
      font-size: 11px;
      color: #666666;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .address-pin {
      color: #D4A017;
      font-size: 12px;
      flex-shrink: 0;
    }

    /* ─── QUOTATION BOX (top-right) ─── */
    .bill-type-box {
      position: absolute;
      top: 28px;
      right: 32px;
      z-index: 5;
      text-align: center;
    }

    .bill-type-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .bill-type-original {
      border: 1px solid #333333;
      padding: 3px 20px;
      font-size: 10px;
      color: #555555;
      background: #f9f9f9;
      display: inline-block;
    }

    /* ─── DIVIDER ─── */
    .divider {
      width: 100%;
      height: 1px;
      background: #cccccc;
    }

    /* ─── QUOTATION META ROW ─── */
    .invoice-meta {
      display: flex;
      padding: 12px 0;
      gap: 40px;
    }

    .meta-group {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .meta-value.validity {
      color: #C9A84C;
      font-weight: 600;
    }

    /* ─── CUSTOMER DETAILS / SERVICE VENUE ─── */
    .bill-ship-row {
      display: flex;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
    }

    .bill-to-section {
      flex: 1;
      padding: 12px 16px;
    }

    .ship-to-section {
      flex: 1;
      padding: 12px 16px;
      border-left: 1px solid #e0e0e0;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .section-value {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 3px;
    }

    .section-sub {
      font-size: 11px;
      color: #444;
      margin-bottom: 2px;
    }

    .place-supply {
      font-size: 11px;
      color: #1a1a2e;
    }

    .place-supply-label {
      font-weight: 700;
    }

    /* ─── ITEMS TABLE ─── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      flex: 1;
    }

    .items-table thead th {
      background: rgba(244, 197, 192, 0.45);
      color: #1a1a2e;
      font-weight: 700;
      font-size: 11px;
      padding: 9px 10px;
      text-align: left;
      border-bottom: 1px solid #e8d8d5;
    }

    .items-table thead th.th-no {
      width: 6%;
      text-align: center;
    }

    .items-table thead th.th-items {
      width: 48%;
      text-align: left;
    }

    .items-table thead th.th-qty {
      width: 14%;
      text-align: center;
    }

    .items-table thead th.th-rate {
      width: 14%;
      text-align: center;
    }

    .items-table thead th.th-total {
      width: 18%;
      text-align: right;
    }

    .item-cell {
      padding: 8px 10px;
      font-size: 11px;
      color: #1a1a2e;
      border-bottom: 1px solid #f2f2f2;
      vertical-align: middle;
    }

    .item-no { text-align: center; }
    .item-name { text-align: left; }
    .item-qty { text-align: center; }
    .item-rate { text-align: center; }
    .item-total { text-align: right; }

    /* ─── SUBTOTAL ROW ─── */
    .subtotal-row {
      background: rgba(244, 197, 192, 0.45);
    }

    .subtotal-row td {
      padding: 9px 10px;
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      border-top: 1px solid #e8d8d5;
    }

    /* ─── BOTTOM SECTION: TERMS + TOTALS ─── */
    .bottom-section {
      display: flex;
      margin-top: 8px;
      gap: 0;
    }

    .terms-left {
      flex: 1;
      padding: 10px 20px 0 0;
    }

    .terms-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 6px;
    }

    .terms-content {
      font-size: 10px;
      color: #444;
      line-height: 1.6;
    }

    .notes-section {
      margin-top: 10px;
    }

    .notes-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .notes-content {
      font-size: 10px;
      color: #444;
      line-height: 1.5;
    }

    .totals-section {
      flex: 1;
      padding: 0 0 0 20px;
      border-left: 1px solid #e0e0e0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 8px 0;
      border-top: 1px solid #cccccc;
    }

    .total-row:first-child {
      border-top: 2px solid #cccccc;
    }

    .total-label {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .total-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .received-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 6px 0;
    }

    .received-label {
      font-size: 11px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .received-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 400;
    }

    .amount-words-section {
      padding: 8px 0 0 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    }

    .amount-words-label {
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .amount-words-value {
      font-size: 10.5px;
      color: #444444;
      font-weight: 400;
    }

    /* ─── SIGNATURE BOX ─── */
    .signature-box {
      border: 1px solid #cccccc;
      border-radius: 6px;
      padding: 10px 16px 8px;
      text-align: center;
      margin-top: 12px;
      margin-left: auto;
      width: 210px;
    }

    .signature-image {
      margin-bottom: 2px;
    }

    .signature-label {
      font-size: 10px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 1px;
    }

    .signature-company {
      font-size: 10px;
      color: #444444;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <div class="corner corner-tl">${cornerOrnamentSVG}</div>
    <div class="corner corner-tr">${cornerOrnamentSVG}</div>
    <div class="corner corner-bl">${cornerOrnamentSVG}</div>
    <div class="corner corner-br">${cornerOrnamentSVG}</div>

    <div class="content">
      <div class="bill-type-box">
        <div class="bill-type-title">QUOTATION</div>
        <div class="bill-type-original">ESTIMATE</div>
      </div>

      <!-- Header -->
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="BPC Logo" />` : ''}
        <div class="header-info">
          <div class="company-name">Balaji Perfect Caters</div>
          <div class="gstin-line">
            <span class="gstin-label">GSTIN</span>&nbsp; 33CADPB6649D1Z3
          </div>
          <div class="address-line">
            <span class="address-pin">📍</span>
            <span>Raaj Iswariyam, Cantonment, Trichy, Trichy, Tamil Nadu, 620001</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Quotation Meta -->
      <div class="invoice-meta">
        <div class="meta-group">
          <span class="meta-label">Quotation No.</span>
          <span class="meta-value">${quotationNo}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">Date</span>
          <span class="meta-value">${quotationDate}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">Valid Until</span>
          <span class="meta-value validity">${validUntil}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Customer Details / Service Venue -->
      <div class="bill-ship-row">
        <div class="bill-to-section">
          <div class="section-label">Customer Details</div>
          <div class="section-value">${customerName}</div>
          ${customerOrg ? `<div class="section-sub">${customerOrg}</div>` : ''}
          ${customerPhone ? `<div class="section-sub">📞 ${customerPhone}</div>` : ''}
          <div class="place-supply">
            <span class="place-supply-label">Event Location</span> ${eventLocation || '—'}
          </div>
        </div>
        <div class="ship-to-section">
          <div class="section-label">Service Venue</div>
          <div class="section-value">${serviceVenue || eventLocation || '—'}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="th-no">No</th>
            <th class="th-items">Items / Services</th>
            <th class="th-qty">Qty.</th>
            <th class="th-rate">Rate</th>
            <th class="th-total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHTML}
          <!-- Subtotal -->
          <tr class="subtotal-row">
            <td></td>
            <td style="font-weight:700;">SUBTOTAL</td>
            <td style="text-align:center; font-weight:700;">${subtotalQty}</td>
            <td></td>
            <td style="text-align:right; font-weight:700;">₹ ${formatIndianNumber(subtotalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Bottom Section: Terms + Totals -->
      <div class="bottom-section">
        <div class="terms-left">
          ${termsHTML ? `
          <div class="terms-title">Terms & Conditions</div>
          <div class="terms-content">${termsHTML}</div>
          ` : ''}
          ${notes ? `
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div class="notes-content">${notes}</div>
          </div>
          ` : ''}
        </div>

        <div class="totals-section">
          <!-- Subtotal -->
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">₹ ${formatIndianNumber(subtotalAmount)}</span>
          </div>

          ${cgstAmount > 0 ? `
          <!-- CGST -->
          <div class="received-row">
            <span class="received-label">CGST @ ${cgstRate}%</span>
            <span class="received-value">₹${formatIndianNumber(cgstAmount)}</span>
          </div>

          <!-- SGST -->
          <div class="received-row">
            <span class="received-label">SGST @ ${sgstRate}%</span>
            <span class="received-value">₹${formatIndianNumber(sgstAmount)}</span>
          </div>
          ` : ''}

          <!-- Grand Total -->
          <div class="total-row">
            <span class="total-label">Estimated Total</span>
            <span class="total-value">₹ ${formatIndianNumber(grandTotal || subtotalAmount)}</span>
          </div>

          <!-- Amount in Words -->
          <div class="amount-words-section">
            <div class="amount-words-label">Amount (in words)</div>
            <div class="amount-words-value">${amountInWords}</div>
          </div>

          <!-- Signature -->
          <div class="signature-box">
            <div class="signature-image">${signatureSVG}</div>
            <div class="signature-label">Authorized Signatory</div>
            <div class="signature-company">Balaji Perfect Caters</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};
