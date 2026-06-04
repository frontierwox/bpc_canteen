# 🍽️ BPC CANTEEN BILLING SYSTEM — MASTER PROMPT
### For: Balaji Perfect Caters (BPC) | Full MERN Stack | End-to-End | Production-Ready

---

## 📋 SYSTEM OVERVIEW

Build a **complete, production-grade, end-to-end MERN Stack Canteen Billing System** for **Balaji Perfect Caters (BPC)**, a professional catering business. The system must be fully mobile-responsive, ultra-secure, and beautifully designed using a **dark maroon (#7B1C1C), golden amber (#D4A017), and white (#FFFFFF)** color scheme that matches the BPC brand identity. No errors, no shortcuts — every feature must be complete and functional.

---

## 🏗️ TECH STACK — USE EXACTLY THIS

### Backend
- **Node.js** + **Express.js** (REST API, versioned: `/api/v1/`)
- **MongoDB** + **Mongoose** (with proper schema validation)
- **JWT** (JSON Web Tokens) for auth — access token (15min) + refresh token (7d) in httpOnly cookies
- **bcryptjs** (salt rounds: 12) for password hashing
- **Multer** + **Cloudinary** for image uploads (logo, menu item photos)
- **PDFKit** or **Puppeteer** for server-side PDF generation of bills/quotations
- **qrcode** npm package for QR code generation
- **express-validator** for input validation
- **express-rate-limit** + **helmet** + **cors** + **mongoSanitize** for security
- **morgan** for logging, **dotenv** for environment variables
- **nodemailer** for optional email invoices

### Frontend
- **React 18** + **Vite** (fast HMR)
- **React Router v6** (protected routes, role-based)
- **Axios** with interceptors for API calls + token refresh
- **React Hook Form** + **Zod** for all forms
- **Zustand** for global state management
- **TanStack Query (React Query v5)** for server state, caching, and refetching
- **Tailwind CSS v3** for styling — customize with BPC brand colors
- **Shadcn/UI** components as base (Card, Dialog, Table, Badge, etc.)
- **React-PDF** or **jsPDF** + **html2canvas** for client-side PDF previews
- **QRCode.react** for frontend QR display
- **Recharts** for admin analytics charts
- **React Hot Toast** for notifications
- **date-fns** for all date calculations
- **Framer Motion** for smooth animations

---

## 🎨 DESIGN SYSTEM — STRICTLY ENFORCE

```
Primary (Dark Maroon):  #7B1C1C  — headers, navbar, primary buttons
Secondary (Golden):     #D4A017  — accents, highlights, borders, icons
Background:             #FFFDF8  — page background (warm white)
Surface:                #FFFFFF  — cards, modals, panels
Text Primary:           #1A1A1A  — headings
Text Secondary:         #4A4A4A  — body text
Text Muted:             #9A9A9A  — placeholders, hints
Success:                #2D7A3A  — paid, active
Warning:                #C97B00  — pending, partial
Danger:                 #C0392B  — overdue, deleted
Border:                 #E8E0D0  — card borders (warm tone)
Sidebar BG:             #5A1212  — darker maroon for sidebar
```

**Font:** Use `Inter` for UI, `Playfair Display` for headings/brand name.

**BPC Brand:** Use the uploaded `logo.jpeg` everywhere the BPC logo appears.

---

## 👥 USER ROLES — 3 DISTINCT ROLES

### 1. 🌐 PUBLIC (No Login Required)
- Can access `/menu` — live menu page via QR code scan
- Can browse menu items by category, see prices, availability
- Cannot access any billing or admin features

### 2. 👨‍💼 EMPLOYEE (Login Required)
- Create, view, edit, and delete bills
- Add items to a bill from the live menu
- Support two billing modes:
  - **Immediate Bill**: Paid on the spot
  - **Monthly Credit Bill**: Added to customer's running monthly tab
- Print/download bills as PDF (matches BPC letterhead)
- View customer's bill history
- View and print end-of-month summary statements
- Cannot access admin-only settings

### 3. 👑 ADMIN (Login Required)
- Full system access
- All employee permissions +
- CRUD for menu items (name, description, price, category, image, availability, special price)
- CRUD for customers/accounts
- CRUD for employees
- Manage and override any bill
- Generate and print monthly bills for all credit customers
- View analytics dashboard (revenue charts, top items, monthly trends)
- Manage QR code for menu page
- System settings (business info, GSTIN, bank details, tax rates)
- Export reports (CSV, PDF)

---

## 📁 PROJECT STRUCTURE

```
bpc-canteen/
├── server/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── cloudinary.js            # Cloudinary config
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verify + role guard
│   │   ├── validate.middleware.js    # express-validator runner
│   │   ├── errorHandler.middleware.js
│   │   └── upload.middleware.js      # Multer config
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Customer.model.js
│   │   ├── MenuItem.model.js
│   │   ├── Category.model.js
│   │   ├── Bill.model.js
│   │   ├── BillItem.model.js
│   │   ├── MonthlyStatement.model.js
│   │   └── Settings.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── menu.controller.js
│   │   ├── category.controller.js
│   │   ├── customer.controller.js
│   │   ├── bill.controller.js
│   │   ├── statement.controller.js
│   │   ├── analytics.controller.js
│   │   └── settings.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── menu.routes.js
│   │   ├── category.routes.js
│   │   ├── customer.routes.js
│   │   ├── bill.routes.js
│   │   ├── statement.routes.js
│   │   ├── analytics.routes.js
│   │   └── settings.routes.js
│   ├── services/
│   │   ├── pdf.service.js            # PDF generation (BPC template)
│   │   ├── qr.service.js             # QR code generation
│   │   ├── email.service.js          # Nodemailer
│   │   └── billing.service.js        # Monthly billing calculation
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── invoiceNumber.js          # BPC + auto-increment (BPC001...)
│   ├── assets/
│   │   ├── logo.jpeg                 # BPC logo
│   │   ├── quotation.jpeg            # letterhead template reference
│   │   └── reference_quotation.jpeg  # handwritten bill reference
│   ├── app.js
│   └── server.js
│
└── client/
    ├── src/
    │   ├── assets/
    │   │   └── logo.jpeg
    │   ├── components/
    │   │   ├── ui/                   # Shadcn base components
    │   │   ├── layout/
    │   │   │   ├── AdminLayout.jsx
    │   │   │   ├── EmployeeLayout.jsx
    │   │   │   ├── PublicLayout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── Navbar.jsx
    │   │   ├── bill/
    │   │   │   ├── BillForm.jsx
    │   │   │   ├── BillPreview.jsx
    │   │   │   ├── BillPDF.jsx        # PDF template matching BPC letterhead
    │   │   │   └── BillTable.jsx
    │   │   ├── menu/
    │   │   │   ├── MenuGrid.jsx
    │   │   │   ├── MenuCard.jsx
    │   │   │   └── MenuCategoryFilter.jsx
    │   │   ├── customer/
    │   │   │   ├── CustomerCard.jsx
    │   │   │   └── CustomerSelector.jsx
    │   │   └── common/
    │   │       ├── ProtectedRoute.jsx
    │   │       ├── RoleGuard.jsx
    │   │       ├── LoadingSpinner.jsx
    │   │       ├── ErrorBoundary.jsx
    │   │       └── ConfirmDialog.jsx
    │   ├── pages/
    │   │   ├── public/
    │   │   │   ├── MenuPage.jsx       # Public QR menu view
    │   │   │   └── NotFound.jsx
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── ForgotPassword.jsx
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── MenuManagement.jsx
    │   │   │   ├── CategoryManagement.jsx
    │   │   │   ├── CustomerManagement.jsx
    │   │   │   ├── EmployeeManagement.jsx
    │   │   │   ├── AllBills.jsx
    │   │   │   ├── MonthlyStatements.jsx
    │   │   │   ├── Analytics.jsx
    │   │   │   ├── QRManagement.jsx
    │   │   │   └── Settings.jsx
    │   │   └── employee/
    │   │       ├── EmployeeDashboard.jsx
    │   │       ├── CreateBill.jsx
    │   │       ├── MyBills.jsx
    │   │       ├── BillDetail.jsx
    │   │       └── CustomerStatement.jsx
    │   ├── store/
    │   │   ├── authStore.js           # Zustand
    │   │   ├── cartStore.js           # Bill items cart
    │   │   └── uiStore.js
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── useBilling.js
    │   │   └── useMenu.js
    │   ├── api/
    │   │   ├── axios.instance.js      # Interceptors + refresh
    │   │   ├── auth.api.js
    │   │   ├── menu.api.js
    │   │   ├── bill.api.js
    │   │   ├── customer.api.js
    │   │   └── analytics.api.js
    │   ├── utils/
    │   │   ├── pdf.utils.js           # PDF generation helpers
    │   │   ├── currency.utils.js      # Indian rupee formatting
    │   │   └── date.utils.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🗄️ DATABASE MODELS — COMPLETE SCHEMAS

### User.model.js
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

### Customer.model.js
```javascript
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organization: { type: String, trim: true },     // e.g., "St. Joseph's College"
  department: { type: String },                    // e.g., "Office A/C", "Civil Engg Dept"
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  accountType: {
    type: String,
    enum: ['immediate', 'monthly_credit'],
    default: 'immediate'
  },
  isActive: { type: Boolean, default: true },
  outstandingBalance: { type: Number, default: 0 },  // running total of unpaid
  notes: { type: String }
}, { timestamps: true });
```

### Category.model.js
```javascript
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  icon: { type: String },          // emoji or icon name
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### MenuItem.model.js
```javascript
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  basePrice: { type: Number, required: true, min: 0 },
  specialPrice: {
    price: { type: Number },
    label: { type: String },         // e.g., "Combo Price", "Bulk Discount"
    isActive: { type: Boolean, default: false },
    validFrom: { type: Date },
    validUntil: { type: Date }
  },
  image: {
    url: { type: String },
    publicId: { type: String }
  },
  unit: { type: String, default: 'NOS' },   // NOS, KG, PLATE, etc.
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  tags: [{ type: String }]
}, { timestamps: true });
```

### Bill.model.js
```javascript
const billSchema = new mongoose.Schema({
  billNumber: { type: String, unique: true },     // Auto-generated: BPC001, BPC002...
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billType: {
    type: String,
    enum: ['immediate', 'monthly_credit'],
    required: true
  },
  billDate: { type: Date, required: true, default: Date.now },
  // For monthly credit bills — the actual service date
  serviceDate: { type: Date },

  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },     // snapshot at time of billing
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'NOS' },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],

  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },        // GST % if applicable
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'cancelled'],
    default: 'paid'
  },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'credit', 'other'],
    default: 'cash'
  },

  // For monthly credit — which monthly statement this belongs to
  monthlyStatement: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyStatement' },

  notes: { type: String },
  isVoid: { type: Boolean, default: false },
  voidReason: { type: String },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  voidedAt: { type: Date }
}, { timestamps: true });
```

### MonthlyStatement.model.js
```javascript
const monthlyStatementSchema = new mongoose.Schema({
  statementNumber: { type: String, unique: true },  // BPC-STMT-2026-04-001
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  month: { type: Number, required: true },           // 1-12
  year: { type: Number, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },

  bills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bill' }],

  // Flat snapshot of all transactions for this month
  transactions: [{
    date: { type: Date, required: true },
    billNumber: { type: String },
    particulars: { type: String, required: true },   // e.g., "Tea-5 Biscuits-3 Snack-1"
    amount: { type: Number, required: true }
  }],

  openingBalance: { type: Number, default: 0 },     // from previous month
  totalBilled: { type: Number, required: true },
  totalPaid: { type: Number, default: 0 },
  closingBalance: { type: Number, required: true },  // what's still owed

  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue'],
    default: 'draft'
  },

  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: { type: Date },
  paidAt: { type: Date },
  notes: { type: String },
  amountInWords: { type: String }     // "Seven Hundred Seventy Seven Rupees Only"
}, { timestamps: true });
```

### Settings.model.js
```javascript
const settingsSchema = new mongoose.Schema({
  businessName: { type: String, default: 'Balaji Perfect Caters' },
  tagline: { type: String, default: 'High Class Veg & Non Veg Caterers' },
  gstin: { type: String, default: '33CADPB6649D1Z3' },
  fssai: { type: String, default: '12424028000583' },
  address: { type: String, default: 'C2/1, Raaj Iswariyam, No.48, Warner\'s Road, Cantonment, Trichy-620 001.' },
  phone1: { type: String, default: '99438 73993' },
  phone2: { type: String, default: '90805 97330' },
  email: { type: String, default: 'balajiperfectcaters@gmail.com' },
  bankDetails: {
    vendorName: { type: String, default: 'Balaji Perfect Caters' },
    bankName: { type: String, default: 'South Indian Bank' },
    branch: { type: String, default: 'Trichy Main Branch' },
    ifscCode: { type: String, default: 'SIBL0000082' },
    accountNumber: { type: String, default: '0082073000002485' }
  },
  logoUrl: { type: String },
  defaultTaxRate: { type: Number, default: 0 },
  invoicePrefix: { type: String, default: 'BPC' },
  invoiceCounter: { type: Number, default: 1 },
  menuQrUrl: { type: String },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' }
}, { timestamps: true });
```

---

## 🔐 AUTHENTICATION & SECURITY

### auth.controller.js — Implement ALL of these:

```javascript
// POST /api/v1/auth/login
// POST /api/v1/auth/logout
// POST /api/v1/auth/refresh-token
// POST /api/v1/auth/forgot-password
// POST /api/v1/auth/reset-password/:token
// GET  /api/v1/auth/me
// PUT  /api/v1/auth/change-password
```

**JWT Strategy:**
- Access Token: expires 15 minutes, stored in memory (Zustand)
- Refresh Token: expires 7 days, stored in httpOnly cookie with `SameSite=Strict; Secure`
- On 401, Axios interceptor silently calls refresh-token endpoint and retries

**Security Middleware Stack (in app.js):**
```javascript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true
}));
app.use(mongoSanitize());                          // prevent NoSQL injection
app.use(xss());                                    // prevent XSS
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.'
});
app.use('/api/v1/auth/login', authLimiter);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use('/api/v1/', apiLimiter);
```

**auth.middleware.js:**
```javascript
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new ApiError(401, 'Not authorized. Token missing.');
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  req.user = await User.findById(decoded._id).select('-password -refreshToken');
  if (!req.user || !req.user.isActive) throw new ApiError(401, 'Account inactive or not found.');
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, `Role '${req.user.role}' is not authorized to access this route.`);
  }
  next();
};
```

---

## 📋 API ROUTES — COMPLETE

### Public Routes (no auth)
```
GET  /api/v1/menu/public              # All available menu items for public QR view
GET  /api/v1/menu/public/:categoryId  # Filter by category
```

### Auth Routes
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh-token
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password/:token
GET  /api/v1/auth/me
PUT  /api/v1/auth/change-password
```

### Menu Routes (Admin only for CUD)
```
GET    /api/v1/menu                          # All items (admin/employee)
GET    /api/v1/menu/:id
POST   /api/v1/menu                          # [ADMIN] Create item + image upload
PUT    /api/v1/menu/:id                      # [ADMIN] Update item
DELETE /api/v1/menu/:id                      # [ADMIN] Soft delete
PUT    /api/v1/menu/:id/special-price        # [ADMIN] Set/update special price
PUT    /api/v1/menu/:id/toggle-availability  # [ADMIN/EMPLOYEE] Toggle available
```

### Category Routes
```
GET    /api/v1/categories
POST   /api/v1/categories              # [ADMIN]
PUT    /api/v1/categories/:id          # [ADMIN]
DELETE /api/v1/categories/:id          # [ADMIN]
```

### Customer Routes
```
GET    /api/v1/customers
GET    /api/v1/customers/:id
GET    /api/v1/customers/:id/balance
POST   /api/v1/customers               # [ADMIN/EMPLOYEE]
PUT    /api/v1/customers/:id           # [ADMIN]
DELETE /api/v1/customers/:id           # [ADMIN]
```

### Bill Routes
```
GET    /api/v1/bills                                          # All bills (admin) / own bills (employee)
GET    /api/v1/bills/:id                                      # Bill detail
GET    /api/v1/bills/:id/pdf                                  # Download bill as PDF
GET    /api/v1/bills/customer/:customerId                     # All bills for a customer
POST   /api/v1/bills                                          # Create new bill
PUT    /api/v1/bills/:id                                      # Edit bill (if not finalized)
PUT    /api/v1/bills/:id/payment                              # Record payment
DELETE /api/v1/bills/:id/void                                 # [ADMIN] Void/cancel a bill
```

### Monthly Statement Routes
```
GET    /api/v1/statements                                     # All statements
GET    /api/v1/statements/:id                                 # Statement detail
GET    /api/v1/statements/:id/pdf                             # Download statement PDF
GET    /api/v1/statements/customer/:customerId                # All statements for customer
POST   /api/v1/statements/generate                            # [ADMIN/EMPLOYEE] Generate monthly statement
PUT    /api/v1/statements/:id/mark-paid                       # [ADMIN] Mark as paid
```

### Analytics Routes (Admin only)
```
GET /api/v1/analytics/summary                # Total revenue, bills, customers
GET /api/v1/analytics/monthly-revenue        # Last 12 months revenue chart data
GET /api/v1/analytics/top-items              # Top 10 selling items
GET /api/v1/analytics/payment-status         # Paid vs pending breakdown
GET /api/v1/analytics/customer-outstanding   # All customers with outstanding balance
```

### Settings Routes
```
GET  /api/v1/settings
PUT  /api/v1/settings                         # [ADMIN]
GET  /api/v1/settings/qr                      # Get menu QR code
POST /api/v1/settings/logo                    # [ADMIN] Upload logo
```

---

## 🖨️ PDF BILL/QUOTATION GENERATION — CRITICAL

**This is the most important feature. The PDF must EXACTLY match the BPC letterhead design.**

The bill PDF must replicate this layout (from the uploaded reference files):

### PDF Template Structure (pdf.service.js using PDFKit or Puppeteer):

```
┌─────────────────────────────────────────────────────────────────┐
│  [BPC LOGO - left]    BALAJI PERFECT CATERS       Cell: 99438 73993│
│                       OFFICE: C2/1, Raaj Iswariyam...  90805 97330│
│  GSTIN: 33CADPB6649D1Z3                                            │
│  Fssai: 12424028000583   E-mail: balajiperfectcaters@gmail.com     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               TAX INVOICE  (or BILL OF SUPPLY)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          Date: DD/MM/YY          │
│  No. [BPC001]                                                    │
│                             ┌─────────────────────────────────┐ │
│  To: [Customer Name]        │ BANK DETAILS:                   │ │
│  [Organization]             │ Vendor: Balaji Perfect Caters   │ │
│  [Department/Account]       │ Bank: South Indian Bank         │ │
│                             │ Branch: Trichy Main Branch      │ │
│  A/C For Month of [Month]   │ IFSC: SIBL0000082               │ │
│                             │ A/C: 0082073000002485           │ │
│                             └─────────────────────────────────┘ │
│  ─────────────────────────────────────────────────────────────  │
│  Date          Particulars                         Amount        │
│  ─────────────────────────────────────────────────────────────  │
│  [date]        [item description line]             [₹XX]         │
│  [date]        [item description line]             [₹XX]         │
│  ... (all transactions for the month)                            │
│  ─────────────────────────────────────────────────────────────  │
│                                              Rs. [TOTAL]         │
│  ─────────────────────────────────────────────────────────────  │
│  Rupees [Amount in Words]...............only                     │
│                                                                  │
│  [Signature area]                   BALAJI PERFECT CATERS       │
│                                                                  │
│  [BG WATERMARK: BPC logo, very light opacity]                    │
├─────────────────────────────────────────────────────────────────┤
│  [Dark maroon footer bar]                                        │
└─────────────────────────────────────────────────────────────────┘
```

**For the Bill of Supply format (from another_type_of_quotation.pdf):**
- Header with logo + company info
- Invoice No. + Invoice Date in top-right box
- Bill To / Ship To side-by-side
- Table with: No | Items | Qty | Rate | Total
- SUBTOTAL row
- Bank Details (left) + Total Amount box (right)
- Amount in words
- Signature section + "ORIGINAL" watermark stamp box top-right

**PDF Generation Code Pattern:**
```javascript
// services/pdf.service.js
import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

export const generateBillPDF = async (billData, type = 'monthly') => {
  const logoBase64 = await getBase64Logo();  // convert BPC logo to base64

  const html = type === 'monthly'
    ? generateMonthlyStatementHTML(billData, logoBase64)
    : generateInvoiceHTML(billData, logoBase64);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });
  await browser.close();
  return pdf;
};
```

The HTML template for the PDF must:
1. Use `quotation.jpeg` background as a faint watermark (the letterhead)
2. Show the BPC logo (logo.jpeg) prominently in the header — top left
3. Include the full company details header matching the reference bill
4. Show "TAX INVOICE" in a bordered box, centered
5. Have a decorative golden border/line matching the BPC brand
6. Show bank details in a right-aligned box
7. List all items in a date | particulars | amount table format for monthly bills
8. Show "Rs. [TOTAL]" in bold at the bottom right
9. Show "Rupees [Amount in Words]...only" at the bottom
10. Include a dark maroon footer bar
11. The BPC logo as a very faint watermark in the page center background

---

## 🍽️ PUBLIC MENU PAGE (No Login)

Route: `/menu` — accessible by QR code scan

**Features:**
- Beautiful, mobile-first menu display
- Categories displayed as horizontal scrollable tabs
- Menu items shown as cards with: image, name, description, price badge (green for veg, red for non-veg), special price badge if active
- "Special Today" section at the top if any items have active special pricing
- Search/filter within menu
- Availability status (grey out unavailable items)
- Auto-refresh every 5 minutes for live price updates
- QR code for the menu URL can be downloaded from admin panel

---

## 👑 ADMIN DASHBOARD

### AdminDashboard.jsx — Summary Cards + Charts
Show these metric cards:
- Today's Revenue
- This Month's Revenue
- Pending Bills (count + amount)
- Active Customers
- Menu Items Count
- Outstanding Dues

Charts:
- Line chart: Monthly Revenue (last 12 months) using Recharts
- Bar chart: Top 10 Selling Items
- Pie chart: Payment Status Distribution (Paid / Pending / Overdue)
- Table: Customers with Outstanding Balance

### MenuManagement.jsx — Full CRUD
- DataTable with search, filter by category, sort
- Add Item Modal: name, description, category (dropdown), base price, unit, isVeg toggle, image upload, availability toggle
- Edit Item: inline edit or modal
- Special Price Modal: set a temporary promotional price with label, start date, end date
- Toggle availability with single click
- Soft delete with confirmation dialog
- Image preview before upload
- Drag to reorder within category (sortOrder update)

### CustomerManagement.jsx
- DataTable with search
- Add/Edit Customer: name, organization, department, phone, email, address, account type (immediate/monthly credit)
- View customer's complete bill history + outstanding balance
- Quick action: Mark balance as paid
- Export customer list as CSV

### EmployeeManagement.jsx
- Add/Edit/Deactivate employees
- Reset employee password (admin only)
- View employee activity (bills created)

### QRManagement.jsx
- Generate QR code for the public menu URL
- Download QR as PNG/SVG
- Preview how it looks
- Option to print QR code sheet (for physical display)

### Settings.jsx
- Update all business info (name, GSTIN, FSSAI, address, phones, email)
- Update bank details
- Upload/change logo
- Set default tax rate
- Invoice number prefix settings

---

## 👨‍💼 EMPLOYEE DASHBOARD

### EmployeeDashboard.jsx
Show:
- Today's Bills (count + total)
- My Bills this month
- Quick action buttons: "New Bill", "New Monthly Entry", "Generate Statement"
- Recent bills I created

### CreateBill.jsx — This is the core billing screen

**Step 1 — Select Customer:**
- Search/select customer (autocomplete dropdown)
- Customer info preview (name, org, account type, outstanding balance warning)
- OR "New Customer" quick-add inline

**Step 2 — Select Bill Type:**
- Immediate (paid now)
- Monthly Credit (add to monthly tab)
- If monthly credit: date picker for service date

**Step 3 — Add Items:**
- Browse menu categories as tabs
- Click to add items to the bill
- Adjust quantity with +/- controls
- Price auto-populates (use special price if active)
- Running total shown in a sticky footer
- Notes field per line item

**Step 4 — Bill Summary:**
- Review all items, quantities, prices
- Subtotal, Tax (if any), Discount, Total
- Payment method selector (for immediate bills)
- Additional notes field

**Step 5 — Confirm & Generate:**
- Preview the bill
- "Save Bill" — saves to DB
- "Save & Print" — saves + opens print dialog
- "Save & Download PDF" — saves + downloads PDF

**Keyboard Shortcuts:**
- `Ctrl+N` — New Bill
- `Ctrl+P` — Print
- `Ctrl+S` — Save

### MyBills.jsx
- DataTable of all bills I've created
- Filter by: date range, customer, payment status, bill type
- Quick view (expand row) or full view
- Download PDF for any bill
- Print any bill

### CustomerStatement.jsx
- Select customer + month + year
- Auto-fetch all credit bills for that customer+month
- Show a preview of the monthly statement (matches the handwritten bill reference format)
- Consolidate: each row = date | particulars | amount
- Calculate: Opening Balance + Total Billed = Closing Balance
- "Generate Statement PDF" button → creates PDF matching the BPC letterhead

---

## 📊 MONTHLY BILLING LOGIC — CRITICAL

```javascript
// services/billing.service.js

export const generateMonthlyStatement = async (customerId, month, year, generatedBy) => {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59); // last day of month

  // Fetch all credit bills for this customer in this period
  const bills = await Bill.find({
    customer: customerId,
    billType: 'monthly_credit',
    serviceDate: { $gte: periodStart, $lte: periodEnd },
    isVoid: false,
    paymentStatus: { $ne: 'cancelled' }
  }).populate('items.menuItem').sort({ serviceDate: 1 });

  // Build transactions array — each bill becomes one or more rows
  const transactions = bills.map(bill => ({
    date: bill.serviceDate || bill.billDate,
    billNumber: bill.billNumber,
    particulars: formatParticulars(bill.items),  // "Tea-5 Biscuits-3 Snack-1"
    amount: bill.totalAmount
  }));

  // Get previous month's closing balance as opening balance
  const prevStatement = await MonthlyStatement.findOne({
    customer: customerId,
    month: month === 1 ? 12 : month - 1,
    year: month === 1 ? year - 1 : year
  });
  const openingBalance = prevStatement?.closingBalance || 0;

  const totalBilled = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = 0; // will be updated when payment is recorded
  const closingBalance = openingBalance + totalBilled - totalPaid;

  // Format amount in words
  const amountInWords = numberToWords(closingBalance) + ' Rupees Only';

  // Generate statement number: BPC-STMT-2026-04-001
  const statementNumber = await generateStatementNumber(month, year);

  const statement = await MonthlyStatement.create({
    statementNumber, customer: customerId, month, year,
    periodStart, periodEnd, bills: bills.map(b => b._id),
    transactions, openingBalance, totalBilled, totalPaid,
    closingBalance, status: 'draft', generatedBy, amountInWords
  });

  // Update customer's outstanding balance
  await Customer.findByIdAndUpdate(customerId, {
    $inc: { outstandingBalance: totalBilled }
  });

  return statement;
};

// Format particulars like the reference bill: "Tea.5 Biscuits.3 Snack.1"
const formatParticulars = (items) => {
  return items.map(item => {
    const shortName = item.name.length > 10 ? item.name.substring(0, 4) + '.' : item.name;
    return `${shortName} ${item.quantity}`;
  }).join(' ');
};
```

---

## 🔔 NOTIFICATIONS & FEEDBACK

- Every form submission: success/error toast (React Hot Toast)
- Loading states on all async operations (skeleton loaders + spinner)
- Empty states with illustrated placeholders
- Error boundaries at route level
- 404 page with BPC branding
- Global error handler in Express (returns structured `{ success, message, errors }`)
- Network error handling (retry logic via React Query)
- Session expiry: silent token refresh, or if refresh fails — redirect to login with message "Session expired. Please log in again."

---

## 📱 MOBILE RESPONSIVENESS

All pages must work perfectly on mobile (min-width: 320px):

- Sidebar collapses to bottom navigation on mobile (or hamburger menu)
- Bill creation form: vertical stepper (not horizontal tabs)
- PDF download instead of print preview on mobile
- QR code page is specifically optimized for mobile viewing
- Tables use horizontal scroll on small screens with sticky first column
- Modals are full-screen on mobile
- Font sizes scale correctly
- Touch-friendly tap targets (min 44x44px)

---

## 🚀 ADDITIONAL FEATURES (All Required)

### 1. Number to Words Converter (for bill totals)
```javascript
// utils in server
export const numberToWords = (num) => {
  // Full implementation for Indian numbering system
  // 777 → "Seven Hundred Seventy Seven"
  // Support up to lakhs/crores
};
```

### 2. Invoice Auto-Numbering
```javascript
// BPC001, BPC002... BPC999, BPC1000
// Thread-safe: use findOneAndUpdate with $inc on Settings.invoiceCounter
export const generateInvoiceNumber = async () => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { invoiceCounter: 1 } },
    { new: true, upsert: true }
  );
  const counter = settings.invoiceCounter;
  return `${settings.invoicePrefix}${String(counter).padStart(3, '0')}`;
};
```

### 3. QR Code Generation
```javascript
// Generate QR for public menu URL
import QRCode from 'qrcode';
export const generateMenuQR = async (menuUrl) => {
  const qr = await QRCode.toDataURL(menuUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 400,
    color: { dark: '#7B1C1C', light: '#FFFFFF' }   // BPC maroon QR
  });
  return qr;
};
```

### 4. Currency Formatting
```javascript
// utils/currency.utils.js
export const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};
```

### 5. Search & Filter
- Debounced search (300ms) on all DataTables
- URL state for filters (so they survive refresh)
- Date range picker for all date filters

### 6. Data Export
- Admin can export any bills list as CSV
- Monthly statement data exportable as CSV
- All PDFs downloadable

---

## 🌱 SEED DATA (server/seeders/)

Create a seeder file that creates:
1. Admin user: `admin@bpc.com` / `Admin@BPC2024`
2. Employee user: `employee@bpc.com` / `Employee@BPC2024`
3. 5 categories: Beverages, Snacks, Meals, Combos, Bakery
4. 15+ menu items across categories with realistic prices
5. 5 customers (mix of immediate and monthly credit)
6. 20+ sample bills (mix of types and payment statuses)
7. 2 monthly statements for current month

---

## 🔧 ENVIRONMENT VARIABLES

### server/.env
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bpc-canteen
ACCESS_TOKEN_SECRET=bpc_access_secret_change_in_production_32chars
REFRESH_TOKEN_SECRET=bpc_refresh_secret_change_in_production_32chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=balajiperfectcaters@gmail.com
EMAIL_PASS=your_app_password
```

### client/.env
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=BPC Canteen
```

---

## 📦 PACKAGE.JSON

### server/package.json
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-mongo-sanitize": "^2.2.0",
    "xss-clean": "^0.1.4",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "puppeteer": "^21.0.0",
    "qrcode": "^1.5.3",
    "cookie-parser": "^1.4.6",
    "morgan": "^1.10.0",
    "nodemailer": "^6.9.7",
    "date-fns": "^3.0.0"
  }
}
```

### client/package.json
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "recharts": "^2.9.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^3.0.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "qrcode.react": "^3.1.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    "lucide-react": "^0.294.0",
    "framer-motion": "^10.16.4",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  }
}
```

---

## 🎯 TAILWIND CONFIG — BPC COLORS

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bpc: {
          maroon: {
            50:  '#FDF2F2',
            100: '#FAE0E0',
            200: '#F5BFBF',
            300: '#EC8080',
            400: '#DE4848',
            500: '#C0392B',
            600: '#9B2C2C',
            700: '#7B1C1C',    // PRIMARY
            800: '#5A1212',    // SIDEBAR
            900: '#3D0A0A',
          },
          gold: {
            50:  '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#D4A017',    // PRIMARY GOLD
            600: '#B7791F',
            700: '#92600A',
            800: '#78350F',
            900: '#451A03',
          },
          cream: '#FFFDF8',    // PAGE BACKGROUND
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'bpc': '0 4px 24px rgba(123, 28, 28, 0.12)',
        'bpc-lg': '0 8px 40px rgba(123, 28, 28, 0.18)',
      }
    }
  },
  plugins: []
};
```

---

## ✅ FINAL CHECKLIST — VERIFY ALL ARE IMPLEMENTED

- [ ] Public menu page accessible without login at `/menu`
- [ ] QR code generation for public menu URL
- [ ] JWT auth with access + refresh token rotation
- [ ] Role-based access control (admin vs employee)
- [ ] Rate limiting on auth routes
- [ ] Full Menu CRUD (admin) with image upload to Cloudinary
- [ ] Special price feature with date range
- [ ] Customer CRUD with account type (immediate / monthly credit)
- [ ] Bill creation with item selector from live menu
- [ ] Monthly credit billing: each transaction recorded with service date
- [ ] Monthly statement generation (groups all credit transactions by customer/month)
- [ ] PDF generation EXACTLY matching BPC letterhead (logo, company info, bank details, totals, amount in words)
- [ ] Bill PDF matching the monthly bill format (Date | Particulars | Amount rows)
- [ ] Invoice PDF matching the Bill of Supply format (itemized table with Qty/Rate/Total)
- [ ] Amount in words (Indian number system)
- [ ] Print functionality from browser
- [ ] Outstanding balance tracking per customer
- [ ] Admin analytics dashboard with charts
- [ ] Employee dashboard with their own bills
- [ ] CSV export for bills/statements
- [ ] Seed data for testing
- [ ] Mobile responsive (all pages)
- [ ] Error handling (API + UI)
- [ ] Loading states throughout
- [ ] 404 + error pages
- [ ] Environment variable setup
- [ ] README.md with setup instructions

---

## 📖 README.md — Include This

```markdown
# BPC Canteen Billing System

Balaji Perfect Caters — Professional Canteen Billing System

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm 9+

### Setup
1. Clone the repo
2. `cd server && npm install && cp .env.example .env`
3. Fill in `.env` values (MongoDB URI, JWT secrets, Cloudinary)
4. `cd ../client && npm install && cp .env.example .env`
5. Place `logo.jpeg` and `quotation.jpeg` in `server/assets/`
6. `cd server && npm run seed` — seeds initial data
7. `cd server && npm run dev` — starts backend on :5000
8. `cd client && npm run dev` — starts frontend on :5173

### Default Logins
- Admin: admin@bpc.com / Admin@BPC2024
- Employee: employee@bpc.com / Employee@BPC2024

### Public Menu
Visit http://localhost:5173/menu (no login required)
```

---

> **Important Note:** The uploaded files (logo.jpeg, quotation.jpeg, reference_quotation.jpeg, another_type_of_quotation.pdf) must be stored in `server/assets/` and referenced correctly in the PDF generation service. The `quotation.jpeg` is the letterhead template. The `reference_quotation.jpeg` shows the exact handwritten bill format to replicate. The `another_type_of_quotation.pdf` shows the digital invoice format. Both PDF types must be supported.
