import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

// Middleware
import errorHandler from './middleware/errorHandler.middleware.js';

// Routes
import authRoutes      from './routes/auth.routes.js';
import userRoutes      from './routes/user.routes.js';
import menuRoutes      from './routes/menu.routes.js';
import categoryRoutes  from './routes/category.routes.js';
import customerRoutes  from './routes/customer.routes.js';
import billRoutes      from './routes/bill.routes.js';
import statementRoutes from './routes/statement.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import settingsRoutes  from './routes/settings.routes.js';
import invoiceRoutes   from './routes/invoice.routes.js';
import quotationRoutes from './routes/quotation.routes.js';

const app = express();

// ─── Reverse Proxy (Vercel / nginx) ─────────────────────────────────────────
// Only trust the upstream proxy in production to prevent IP spoofing of the
// X-Forwarded-For header, which would allow attackers to bypass rate limiting.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'"],
        fontSrc:    ["'self'"],
        objectSrc:  ["'none'"],
        frameSrc:   ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(mongoSanitize());                                      // Prevent NoSQL injection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:         process.env.CLIENT_URL || 'http://localhost:5173',
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Request Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Strict limiter for login — blocks brute-force attacks
const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            10,
  message:        { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:  false,
});

// Strict limiter for forgot-password — prevents email bombing
const forgotPasswordLimiter = rateLimit({
  windowMs:       60 * 60 * 1000, // 1 hour
  max:            5,
  message:        { success: false, message: 'Too many password reset requests. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders:  false,
});

// General API limiter — prevents abusive scraping / DoS
const apiLimiter = rateLimit({
  windowMs:       60 * 1000, // 1 minute
  max:            100,
  message:        { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:  false,
});

// Register specific limiters BEFORE the general limiter
app.use('/api/v1/auth/login',          authLimiter);
app.use('/api/v1/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/v1/',                    apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     'BPC Canteen API is running',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/users',      userRoutes);
app.use('/api/v1/menu',       menuRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/customers',  customerRoutes);
app.use('/api/v1/bills',      billRoutes);
app.use('/api/v1/statements', statementRoutes);
app.use('/api/v1/analytics',  analyticsRoutes);
app.use('/api/v1/settings',   settingsRoutes);
app.use('/api/v1/invoices',   invoiceRoutes);
app.use('/api/v1/quotations', quotationRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
// NOTE: Do NOT echo req.originalUrl back in the response — it can contain
// user-controlled characters that may cause issues if rendered in a browser context.
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// ─── Global Error Handler (must be last middleware) ───────────────────────────
app.use(errorHandler);

export default app;
