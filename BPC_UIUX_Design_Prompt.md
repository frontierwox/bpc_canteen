# 🎨 BPC CANTEEN — ULTRA-PROFESSIONAL UI/UX DESIGN PROMPT
### Fine-Tuned · Pixel-Perfect · Jaw-Dropping · Production-Grade

> Paste this prompt into a fresh Claude session (with the architecture prompt already implemented),
> or run it as a separate UI overhaul pass on the existing codebase.

---

## 🎯 DESIGN MANDATE

You are a world-class UI/UX engineer building the visual layer for **Balaji Perfect Caters (BPC)** — a premium catering brand. The aesthetic must feel like a **luxury restaurant POS meets a premium SaaS dashboard**: warm, rich, authoritative, and deeply trustworthy. Every pixel must feel intentional. Users should feel like they're using software worth ₹5 lakh — not a free open-source template.

**The one thing users must remember:** The moment they open any screen, they feel the warmth of the BPC brand — dark maroon and burnished gold — and every interaction feels smooth, satisfying, and effortless.

**Forbidden:** Generic dashboards, Bootstrap grids, flat white admin panels, purple gradients, system fonts, cookie-cutter card layouts, and anything that looks like it was built from a free template. Zero tolerance.

---

## 🎨 DESIGN SYSTEM — COMPLETE TOKEN SET

### Typography — Use EXACTLY these fonts (Google Fonts)
```css
/* Display / Brand headings */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

--font-display:   'Cormorant Garamond', Georgia, serif;   /* BPC brand name, page titles, bill headings */
--font-body:      'DM Sans', sans-serif;                  /* ALL UI text, labels, buttons, body */
--font-mono:      'JetBrains Mono', monospace;            /* Bill numbers, amounts, invoice IDs */
```

**Why this pairing:** Cormorant Garamond's elegant serifs evoke luxury hospitality and premium print media (menus, bills, letterheads). DM Sans is clean and highly legible at small sizes. JetBrains Mono makes numbers feel precise and financial.

### Color Tokens — Full Scale
```css
:root {
  /* === BPC BRAND PALETTE === */
  --bpc-maroon-950: #1A0505;
  --bpc-maroon-900: #2E0A0A;
  --bpc-maroon-800: #4A1212;
  --bpc-maroon-700: #5A1818;
  --bpc-maroon-600: #7B1C1C;   /* ← PRIMARY BRAND */
  --bpc-maroon-500: #9B2424;
  --bpc-maroon-400: #BB3535;
  --bpc-maroon-300: #D45C5C;
  --bpc-maroon-200: #E89898;
  --bpc-maroon-100: #F5DADA;
  --bpc-maroon-50:  #FDF5F5;

  --bpc-gold-900:  #2C1A00;
  --bpc-gold-800:  #4A2E00;
  --bpc-gold-700:  #704500;
  --bpc-gold-600:  #9A6200;
  --bpc-gold-500:  #C08000;
  --bpc-gold-400:  #D4A017;   /* ← PRIMARY GOLD */
  --bpc-gold-300:  #E6BC4A;
  --bpc-gold-200:  #F0D080;
  --bpc-gold-100:  #F8EABB;
  --bpc-gold-50:   #FDFAF0;

  /* === SURFACE SYSTEM === */
  --surface-page:    #FDFAF5;   /* Warm off-white page background */
  --surface-card:    #FFFFFF;   /* Cards, panels */
  --surface-raised:  #FFFDF8;   /* Elevated cards */
  --surface-overlay: rgba(26, 5, 5, 0.65); /* Modal backdrops */
  --surface-sidebar: #2E0A0A;  /* Sidebar — very dark maroon */
  --surface-sidebar-hover: #4A1212;
  --surface-sidebar-active: #7B1C1C;

  /* === SEMANTIC COLORS === */
  --success-bg:   #F0F9F0;
  --success-text: #1A5C1A;
  --success-border: #4CAF50;

  --warning-bg:   #FFF8E6;
  --warning-text: #7A4A00;
  --warning-border: #D4A017;

  --danger-bg:    #FFF0F0;
  --danger-text:  #8B1A1A;
  --danger-border: #E53935;

  --info-bg:      #EFF6FF;
  --info-text:    #1E3A5F;
  --info-border:  #3B82F6;

  /* === TEXT === */
  --text-primary:   #1A0505;
  --text-secondary: #5A3A3A;
  --text-muted:     #9A7A7A;
  --text-inverse:   #FFF8F8;
  --text-gold:      #B8860B;

  /* === BORDERS === */
  --border-light:  rgba(123, 28, 28, 0.08);
  --border-medium: rgba(123, 28, 28, 0.15);
  --border-strong: rgba(123, 28, 28, 0.25);
  --border-gold:   rgba(212, 160, 23, 0.35);

  /* === SHADOWS — warm-tinted === */
  --shadow-sm:  0 1px 4px rgba(123, 28, 28, 0.08);
  --shadow-md:  0 4px 16px rgba(123, 28, 28, 0.10);
  --shadow-lg:  0 8px 32px rgba(123, 28, 28, 0.14);
  --shadow-xl:  0 16px 48px rgba(123, 28, 28, 0.18);
  --shadow-gold: 0 0 0 3px rgba(212, 160, 23, 0.25);

  /* === SPACING === */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* === BORDER RADIUS === */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* === TRANSITIONS === */
  --ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --dur-fast:     120ms;
  --dur-normal:   220ms;
  --dur-slow:     380ms;
  --dur-page:     480ms;
}
```

---

## 🏗️ GLOBAL LAYOUT ARCHITECTURE

### App Shell (src/components/layout/AppShell.jsx)
```
┌────────────────────────────────────────────────────────┐
│  SIDEBAR (260px fixed)  │  MAIN CONTENT AREA           │
│  [dark maroon #2E0A0A]  │  [warm off-white #FDFAF5]    │
│                         │                               │
│  ┌─────────────────┐    │  ┌─────────────────────────┐ │
│  │  BPC LOGO       │    │  │  TOP HEADER BAR (64px)  │ │
│  │  + tagline      │    │  │  breadcrumb + actions   │ │
│  └─────────────────┘    │  └─────────────────────────┘ │
│                         │                               │
│  [nav items]            │  [PAGE CONTENT]               │
│                         │                               │
│  ─── divider ───        │                               │
│                         │                               │
│  [user avatar]          │                               │
│  [logout]               │                               │
└────────────────────────────────────────────────────────┘
```

### Sidebar Implementation
```jsx
// The sidebar has 3 visual zones:

// ZONE 1 — Brand header
<div className="sidebar-brand">
  <img src={logo} className="sidebar-logo" alt="BPC" />
  <div>
    <h1 className="sidebar-brand-name">BPC</h1>
    <p className="sidebar-brand-tagline">Balaji Perfect Caters</p>
  </div>
</div>

// ZONE 2 — Navigation items
// Each nav item: icon (24px) + label + optional badge
// Active state: gold left border (3px) + lighter maroon bg + gold text
// Hover state: slightly lighter maroon bg, smooth 220ms

// ZONE 3 — User footer
// Avatar circle (32px, initials) + name + role badge + logout icon
```

```css
.sidebar {
  width: 260px;
  min-height: 100vh;
  background: var(--surface-sidebar);
  border-right: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
}

.sidebar-brand {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.sidebar-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--bpc-gold-400);
  box-shadow: 0 0 16px rgba(212, 160, 23, 0.3);
}

.sidebar-brand-name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: #FFFDF8;
  letter-spacing: 0.04em;
  line-height: 1;
}

.sidebar-brand-tagline {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 400;
  color: var(--bpc-gold-300);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 3px;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  padding: 20px 20px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  margin: 2px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-smooth);
  color: rgba(255,255,255,0.55);
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 400;
  position: relative;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.85);
}

.nav-item.active {
  background: rgba(212, 160, 23, 0.10);
  color: var(--bpc-gold-300);
  border-left: 3px solid var(--bpc-gold-400);
  font-weight: 500;
}

.nav-item .nav-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
  flex-shrink: 0;
}

.nav-item.active .nav-icon {
  opacity: 1;
  color: var(--bpc-gold-400);
}

.nav-badge {
  margin-left: auto;
  background: var(--bpc-maroon-600);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

.nav-badge.urgent {
  background: #C0392B;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% { box-shadow: 0 0 0 0 rgba(192, 57, 43, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(192, 57, 43, 0); }
}
```

### Top Header Bar
```css
.page-header {
  height: 64px;
  background: var(--surface-card);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(8px);
  background: rgba(255, 253, 248, 0.92);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-muted);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-time {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 10px;
  background: var(--surface-page);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
}
```

---

## 📊 ADMIN DASHBOARD — (AdminDashboard.jsx)

### Stat Cards — Elevated with animated number counters
```jsx
// 4 cards in top row — each with:
// - Large animated number (count up on mount using useCountUp hook)
// - Trend indicator (↑ +12% this week) with color
// - Subtle background pattern (diagonal lines or dots, very faint maroon)
// - Left accent stripe in the card's semantic color

const statCards = [
  {
    label: "Today's Revenue",
    value: 4820,
    prefix: "₹",
    trend: "+18%",
    trendUp: true,
    icon: <TrendingUp />,
    color: "gold"
  },
  {
    label: "Pending Bills",
    value: 7,
    trend: "3 overdue",
    trendUp: false,
    icon: <Clock />,
    color: "warning"
  },
  {
    label: "Active Customers",
    value: 43,
    trend: "+2 this month",
    trendUp: true,
    icon: <Users />,
    color: "maroon"
  },
  {
    label: "Outstanding Dues",
    value: 18450,
    prefix: "₹",
    trend: "4 accounts",
    trendUp: false,
    icon: <AlertCircle />,
    color: "danger"
  }
]
```

```css
.stat-card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: transform var(--dur-normal) var(--ease-spring),
              box-shadow var(--dur-normal) var(--ease-smooth);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--card-accent-color);
  border-radius: 0 2px 2px 0;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background: var(--card-accent-color);
  opacity: 0.04;
  border-radius: 50%;
  transform: translate(30%, -30%);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
  margin: 12px 0 6px;
  letter-spacing: -0.02em;
}

.stat-label {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}
.stat-trend.up { color: var(--success-text); }
.stat-trend.down { color: var(--danger-text); }
```

### Charts Section — Below stat cards
```
[Left — 60% width]                    [Right — 40% width]
┌────────────────────────────────┐    ┌──────────────────────┐
│  Monthly Revenue               │    │  Payment Status      │
│  (Area chart — maroon + gold)  │    │  (Donut chart)       │
│  Last 12 months                │    │  Paid/Pending/Overdue│
└────────────────────────────────┘    └──────────────────────┘

[Below — full width]
┌────────────────────────────────────────────────────────────┐
│  Top 10 Items This Month (Horizontal bar chart in gold)     │
└────────────────────────────────────────────────────────────┘
```

### Recharts Theming
```jsx
// Area Chart — Revenue
<AreaChart data={data}>
  <defs>
    <linearGradient id="maroonGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#7B1C1C" stopOpacity={0.15}/>
      <stop offset="95%" stopColor="#7B1C1C" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <Area
    type="monotone"
    dataKey="revenue"
    stroke="#7B1C1C"
    strokeWidth={2.5}
    fill="url(#maroonGrad)"
    dot={{ fill: '#D4A017', strokeWidth: 0, r: 4 }}
    activeDot={{ fill: '#7B1C1C', r: 6, stroke: '#D4A017', strokeWidth: 2 }}
  />
  <Tooltip
    contentStyle={{
      background: '#2E0A0A',
      border: '1px solid rgba(212,160,23,0.3)',
      borderRadius: '10px',
      color: '#FFF8F8',
      fontFamily: 'DM Sans',
      fontSize: '13px'
    }}
    formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
  />
</AreaChart>
```

### Outstanding Balance Table
```
Pinned to dashboard — shows customers with pending dues.
Each row has:
  [Avatar initials] [Name + Org]  [Month]  [Amount]  [Days overdue badge]  [Action button]

Days overdue badge:
  < 7 days:  gold pill "Due"
  7-30 days: orange pill "Overdue"
  > 30 days: red pill "Critical" + pulse animation
```

---

## 🔐 LOGIN PAGE — (LoginPage.jsx)

This must be a jaw-dropping, memorable login screen.

### Concept: "Split Canvas"
```
LEFT HALF (45%):                    RIGHT HALF (55%):
┌─────────────────────┐             ┌───────────────────────────┐
│  Dark maroon bg     │             │  Warm off-white bg        │
│  [BPC logo large]   │             │  [Login form panel]       │
│                     │             │                           │
│  "BALAJI PERFECT    │             │  "Welcome back"           │
│   CATERS"           │             │  (Cormorant 32px)        │
│  (Cormorant 42px)   │             │                           │
│                     │             │  Email input              │
│  [Faint pattern:    │             │  Password input           │
│   diagonal fine     │             │  [Remember me]            │
│   lines in gold     │             │                           │
│   at 3% opacity]    │             │  [SIGN IN button]         │
│                     │             │  ─────────────────────    │
│  "High Class Veg &  │             │  "Forgot password?"       │
│   Non Veg Caterers" │             │                           │
│  (DM Sans, gold)    │             └───────────────────────────┘
└─────────────────────┘
```

```css
.login-root {
  display: grid;
  grid-template-columns: 45% 55%;
  min-height: 100vh;
  font-family: var(--font-body);
}

.login-brand-panel {
  background: var(--bpc-maroon-900);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 48px;
  position: relative;
  overflow: hidden;
}

/* Diagonal line pattern overlay */
.login-brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 24px,
    rgba(212, 160, 23, 0.025) 24px,
    rgba(212, 160, 23, 0.025) 25px
  );
}

/* Gold horizontal line beneath BPC title */
.login-brand-divider {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--bpc-gold-400), transparent);
  margin: 20px auto;
}

.login-brand-title {
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 700;
  color: #FFF8F8;
  text-align: center;
  letter-spacing: 0.03em;
  line-height: 1.1;
}

.login-brand-sub {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--bpc-gold-300);
  text-align: center;
  margin-top: 12px;
}

.login-logo {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 2px solid rgba(212, 160, 23, 0.5);
  margin-bottom: 28px;
  box-shadow: 0 0 40px rgba(212, 160, 23, 0.15);
}

.login-form-panel {
  background: var(--surface-page);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 64px;
}

.login-form-card {
  width: 100%;
  max-width: 400px;
}

.login-greeting {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  color: var(--bpc-maroon-600);
  margin-bottom: 6px;
}

.login-subgreeting {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 36px;
}

/* Input fields — warm, refined */
.form-field-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color var(--dur-normal) var(--ease-smooth),
              box-shadow var(--dur-normal) var(--ease-smooth);
  outline: none;
}

.form-input:focus {
  border-color: var(--bpc-maroon-400);
  box-shadow: 0 0 0 3px rgba(123, 28, 28, 0.08);
}

.form-input.error {
  border-color: var(--danger-border);
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.08);
}

/* Primary CTA button */
.btn-primary {
  width: 100%;
  height: 50px;
  background: var(--bpc-maroon-600);
  color: #FFF8F8;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-smooth);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  background: var(--bpc-maroon-700);
  box-shadow: 0 4px 16px rgba(123, 28, 28, 0.30);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0px);
  box-shadow: none;
}

/* Shimmer effect on button hover */
.btn-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.08),
    transparent
  );
  transition: left 0.5s var(--ease-smooth);
}
.btn-primary:hover::after { left: 100%; }
```

**Mobile:** On screens < 768px, stack the panels vertically. The brand panel becomes a compact header (180px tall) with just the logo + title. The form panel is full-width below.

---

## 🌐 PUBLIC MENU PAGE — (MenuPage.jsx)

### Concept: "The Living Menu" — feels like a premium restaurant menu come to life

```
┌──────────────────────────────────────────────────────────┐
│  HERO HEADER                                             │
│  [BPC logo]  BALAJI PERFECT CATERS                       │
│              "High Class Veg & Non Veg Caterers"         │
│              [Today's date + live "Open Now" badge]      │
│  ──────────────────── gold divider ──────────────────── │
│                                                          │
│  [Horizontal scrollable category pills]                  │
│  [All] [Beverages ☕] [Snacks 🍟] [Meals 🍛] [Combos]  │
│                                                          │
│  ─── SPECIAL TODAY (if any) ──────────────────────────  │
│  [Special price items in a horizontal scroll row]        │
│                                                          │
│  ─── BEVERAGES ────────────────────────────────────────  │
│  [item card] [item card] [item card]                     │
│                                                          │
│  ─── SNACKS ────────────────────────────────────────────  │
│  [item card] [item card]                                 │
└──────────────────────────────────────────────────────────┘
```

### Menu Page Header
```css
.menu-hero {
  background: var(--bpc-maroon-900);
  padding: 32px 24px 24px;
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 2px solid var(--bpc-gold-400);
}

.menu-hero-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.menu-hero-logo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--bpc-gold-400);
}

.menu-hero-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  color: #FFF8F8;
  letter-spacing: 0.02em;
}

.menu-hero-sub {
  font-size: 11px;
  color: var(--bpc-gold-300);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-top: 2px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(45, 122, 58, 0.9);
  color: #E8F5E9;
  font-size: 10px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  letter-spacing: 0.06em;
}

.live-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4CAF50;
  animation: live-pulse 1.5s infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

### Category Filter Pills
```css
.category-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 24px 16px;
  scrollbar-width: none;
  background: var(--bpc-maroon-900);
}

.category-pill {
  flex-shrink: 0;
  padding: 7px 16px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.65);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-smooth);
  white-space: nowrap;
}

.category-pill:hover,
.category-pill.active {
  background: var(--bpc-gold-400);
  border-color: var(--bpc-gold-400);
  color: var(--bpc-maroon-900);
  font-weight: 500;
}
```

### Menu Item Card
```css
.menu-item-card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
  transition: all var(--dur-normal) var(--ease-spring);
  position: relative;
}

.menu-item-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-gold);
}

.menu-item-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: var(--bpc-maroon-50);   /* placeholder if no image */
}

.menu-item-body {
  padding: 14px 16px;
}

.menu-item-name {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.menu-item-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 12px;
}

.menu-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-item-price {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 500;
  color: var(--bpc-maroon-600);
}

.menu-item-price.has-special {
  text-decoration: line-through;
  font-size: 13px;
  color: var(--text-muted);
}

.special-price {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--success-text);
}

.veg-dot {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}
.veg-dot.veg { border-color: #2E7D32; }
.veg-dot.veg::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #2E7D32; }
.veg-dot.nonveg { border-color: #C62828; }
.veg-dot.nonveg::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #C62828; }

.unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
}
.unavailable-badge {
  background: var(--bpc-maroon-100);
  color: var(--bpc-maroon-700);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--bpc-maroon-200);
}
```

### Special Offers Section
```
When any items have an active special price, show a horizontal scroll strip at top:
Background: warm gold (#FFF8E6)
Label: "✦ SPECIAL TODAY" in small caps
Cards in this strip have a "SPECIAL" ribbon in top-right corner (maroon ribbon)
```

---

## 👨‍💼 EMPLOYEE DASHBOARD — (EmployeeDashboard.jsx)

### Concept: "Action-First Command Center"
The employee dashboard prioritizes speed — they need to create a bill in under 3 taps.

```
┌──────────────────────────────────────────────────────────────┐
│  Good morning, [Name] 👋                     [Date + Time]  │
│  "Here's your day at a glance"                               │
├──────────────────────────────────────────────────────────────┤
│  [NEW BILL ─────────────]  [MONTHLY ENTRY ──]  [STATEMENT ─] │
│  [Large primary CTA btn]   [Secondary btn]      [Tertiary]   │
├──────────────────────────────────────────────────────────────┤
│  My Stats Today                                              │
│  [Bills Created: 4] [Total Billed: ₹2,380] [Pending: 1]    │
├──────────────────────────────────────────────────────────────┤
│  Recent Bills (last 5)                                       │
│  [Table with status badges, quick print action]              │
└──────────────────────────────────────────────────────────────┘
```

### Quick Action Buttons
```css
.quick-action-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  margin: 24px 0;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-spring);
}

.quick-action-btn.primary {
  background: var(--bpc-maroon-600);
  color: white;
  box-shadow: var(--shadow-md);
}

.quick-action-btn.primary:hover {
  background: var(--bpc-maroon-700);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.quick-action-btn.secondary {
  background: var(--surface-card);
  color: var(--text-primary);
  border: 1.5px solid var(--border-medium);
}

.quick-action-btn.secondary:hover {
  border-color: var(--bpc-maroon-300);
  background: var(--bpc-maroon-50);
  transform: translateY(-2px);
}

.qab-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qab-icon.primary { background: rgba(255,255,255,0.15); }
.qab-icon.secondary { background: var(--bpc-maroon-50); color: var(--bpc-maroon-600); }

.qab-label { font-size: 15px; font-weight: 500; }
.qab-sub { font-size: 11px; opacity: 0.65; margin-top: 2px; }
```

---

## 🧾 CREATE BILL PAGE — (CreateBill.jsx)

### Concept: "Elegant POS Terminal"
This is the most critical screen. It must feel fast, intuitive, and professional.

### Layout: 2-column on desktop, stacked on mobile
```
LEFT PANEL (55%)                    RIGHT PANEL (45%)
┌─────────────────────────┐         ┌────────────────────────┐
│  STEP 1: Customer       │         │  BILL SUMMARY          │
│  [Search + autocomplete]│         │  ─────────────────     │
│  [Customer info card]   │         │  [Customer name]       │
├─────────────────────────┤         │  [Date]                │
│  STEP 2: Bill Type      │         │  [Bill type badge]     │
│  [Immediate] [Monthly]  │         │  ─────────────────     │
│  [Date picker if monthly]│         │  [Item rows]           │
├─────────────────────────┤         │  ─────────────────     │
│  STEP 3: Menu Items     │         │  Subtotal: ₹0          │
│  [Category tabs]        │         │  Tax: ₹0               │
│  [Item grid]            │         │  ─────────────────     │
│                         │         │  TOTAL: ₹0             │
│                         │         │  (font-mono, large)    │
│                         │         │                        │
│                         │         │  [SAVE BILL]           │
│                         │         │  [SAVE & PRINT]        │
└─────────────────────────┘         └────────────────────────┘
```

### Item Selection Card (in menu grid)
```css
.bill-menu-item {
  background: var(--surface-card);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bill-menu-item:hover {
  border-color: var(--bpc-maroon-300);
  background: var(--bpc-maroon-50);
}

.bill-menu-item.selected {
  border-color: var(--bpc-maroon-500);
  background: var(--bpc-maroon-50);
  box-shadow: 0 0 0 3px rgba(123, 28, 28, 0.08);
}

.item-qty-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-full);
  padding: 3px;
}

.qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bpc-maroon-600);
  transition: background var(--dur-fast);
}

.qty-btn:hover { background: var(--bpc-maroon-100); }

.qty-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 20px;
  text-align: center;
}
```

### Bill Summary Panel
```css
.bill-summary-panel {
  position: sticky;
  top: 80px;
  background: var(--surface-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.bill-summary-header {
  background: var(--bpc-maroon-600);
  padding: 16px 20px;
  color: white;
}

.bill-summary-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.bill-summary-body { padding: 16px 20px; }

.bill-item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-light);
  animation: slideIn 200ms var(--ease-out);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(8px); }
  to   { opacity: 1; transform: translateX(0); }
}

.bill-item-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.bill-item-qty  { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.bill-item-price { font-family: var(--font-mono); font-size: 14px; color: var(--bpc-maroon-600); }

.bill-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  margin-top: 8px;
  border-top: 2px solid var(--bpc-maroon-600);
}

.bill-total-label { font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
.bill-total-amount {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 600;
  color: var(--bpc-maroon-600);
  transition: all var(--dur-fast);
}
```

---

## 📋 BILLS TABLE — (MyBills.jsx & AllBills.jsx)

### Custom DataTable — Not a generic table
```css
.data-table-wrapper {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-input-wrapper input {
  padding-left: 40px;
  height: 38px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border-light);
  font-size: 13px;
  width: 100%;
  transition: all var(--dur-normal);
}

.search-input-wrapper input:focus {
  border-color: var(--bpc-maroon-300);
  box-shadow: 0 0 0 3px rgba(123,28,28,0.08);
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  background: var(--bpc-maroon-50);
  border-bottom: 2px solid var(--border-medium);
}

th {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  padding: 12px 16px;
  text-align: left;
  white-space: nowrap;
}

td {
  padding: 14px 16px;
  font-size: 13.5px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

tbody tr:hover { background: var(--bpc-maroon-50); transition: background var(--dur-fast); }
tbody tr:last-child td { border-bottom: none; }
```

### Status Badges
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.status-badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.badge-paid    { background: var(--success-bg); color: var(--success-text); }
.badge-paid::before { background: var(--success-text); }

.badge-pending { background: var(--warning-bg); color: var(--warning-text); }
.badge-pending::before { background: #D4A017; }

.badge-overdue { background: var(--danger-bg); color: var(--danger-text); }
.badge-overdue::before { background: var(--danger-text); animation: pulse-badge 2s infinite; }

.badge-partial { background: var(--info-bg); color: var(--info-text); }
.badge-partial::before { background: var(--info-text); }

.badge-credit  { background: var(--bpc-maroon-50); color: var(--bpc-maroon-700); }
.badge-credit::before { background: var(--bpc-maroon-400); }
```

---

## 🍽️ MENU MANAGEMENT — (MenuManagement.jsx)

### Grid + List Toggle View
```
Toolbar: [Search] [Filter by Category] [Grid|List toggle] [Add Item button]

GRID VIEW (3 columns):
Each card shows:
  [Item image — 180px tall]
  [Veg/NonVeg dot + Name]
  [Category badge]
  [Base price] [Special price if active — with badge "SPECIAL"]
  [Available toggle switch]
  [Edit | Delete action icons]

LIST VIEW:
Compact table rows. Faster to scan 20+ items.
```

### Add/Edit Item Modal
```css
/* Full-screen on mobile, centered 680px modal on desktop */
.modal-overlay {
  position: fixed; inset: 0;
  background: var(--surface-overlay);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: fadeIn var(--dur-normal) var(--ease-out);
}

.modal-card {
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideUp var(--dur-slow) var(--ease-spring);
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(32px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 24px 28px 20px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  color: var(--bpc-maroon-600);
}
```

### Special Price Panel (within Edit Modal)
```
A collapsible section within the edit form:
[Toggle: "Enable Special Price"]
  → When ON, reveals:
     [Special Price field] [Label/description]
     [Valid From] [Valid Until date pickers]
     Preview badge: "SPECIAL ₹80 (was ₹100)"
```

---

## 📅 MONTHLY STATEMENT PAGE — (CustomerStatement.jsx)

### Concept: "Digital Ledger"
Make it feel like a premium accounting ledger — precise, clean, trustworthy.

```
┌──────────────────────────────────────────────────────────────┐
│  [Customer selector + Month/Year pickers]                    │
│  [Generate Statement button]                                 │
├──────────────────────────────────────────────────────────────┤
│  STATEMENT PREVIEW                                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [BPC logo]  BALAJI PERFECT CATERS         Cell: ...  │   │
│  │            Office: ...                               │   │
│  │ GSTIN: ...                                           │   │
│  │ ─────────────── TAX INVOICE ─────────────────        │   │
│  │ No. BPC052          Date: 30/4/26                    │   │
│  │ To: The Principal, St Joseph's College               │   │
│  │ A/C For Month of April-26                            │   │
│  │                                                      │   │
│  │ Date     Particulars                  Amount         │   │
│  │ 5/3/26   Tea.5 Biscuits.3 Snack.1     86             │   │
│  │ 6/3/26   Tea.3 Biscuits.1             40             │   │
│  │ ...                                                  │   │
│  │ ──────────────────────────────  Rs. 777 ───          │   │
│  │ Rupees Seven Hundred Seventy Seven Only              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [DOWNLOAD PDF]  [PRINT]  [MARK AS SENT]                    │
└──────────────────────────────────────────────────────────────┘
```

```css
.statement-preview-wrapper {
  background: white;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  /* A4 aspect ratio preview */
  max-width: 794px;
  margin: 0 auto;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
  font-size: 13.5px;
}

.ledger-table th {
  padding: 8px 12px;
  font-weight: 500;
  text-align: left;
  border-bottom: 1.5px solid var(--bpc-maroon-900);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.ledger-table td {
  padding: 7px 12px;
  border-bottom: 1px dashed #DDD;
  vertical-align: top;
}

.ledger-table td:last-child {
  font-family: var(--font-mono);
  text-align: right;
  font-weight: 500;
  color: var(--bpc-maroon-800);
}

.ledger-total-row td {
  font-weight: 600;
  font-size: 15px;
  border-top: 2px solid var(--bpc-maroon-900);
  border-bottom: 2px solid var(--bpc-maroon-900);
  padding: 10px 12px;
}
```

---

## ⚙️ ADMIN SETTINGS — (Settings.jsx)

### Tab-based layout with live preview
```
[General Info] [Bank Details] [Invoice Settings] [Logo & Branding]

Each tab is a clean form section.
On the right: live preview of the bill header as you type.

Logo section:
  Current logo preview (large, with gold ring border)
  Drag-and-drop upload zone
  "Changes will reflect in all new PDF bills"
```

---

## 🔔 NOTIFICATION SYSTEM — (Toast + Alert)

```jsx
// Custom toast styles using React Hot Toast
import toast from 'react-hot-toast';

const toastOptions = {
  style: {
    background: '#2E0A0A',
    color: '#FFF8F8',
    border: '1px solid rgba(212,160,23,0.3)',
    borderRadius: '10px',
    fontFamily: 'DM Sans',
    fontSize: '14px',
    padding: '12px 18px',
    boxShadow: '0 8px 32px rgba(46,10,10,0.4)',
  },
  iconTheme: {
    primary: '#D4A017',
    secondary: '#2E0A0A',
  },
  duration: 3500,
  position: 'bottom-right',
};

// Usage
toast.success('Bill created successfully', toastOptions);
toast.error('Something went wrong', toastOptions);
toast.loading('Generating PDF...', toastOptions);
```

---

## 📱 MOBILE NAVIGATION — Bottom Tab Bar

On screens < 768px, replace sidebar with a bottom tab bar:

```css
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bpc-maroon-900);
  border-top: 1px solid rgba(255,255,255,0.08);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-nav { display: flex; }
  .main-content { margin-left: 0; padding-bottom: 80px; }
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: rgba(255,255,255,0.4);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  transition: color var(--dur-fast);
  cursor: pointer;
}

.mobile-nav-item.active { color: var(--bpc-gold-400); }

.mobile-nav-icon { font-size: 22px; }

/* FAB for "New Bill" — primary action */
.mobile-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bpc-maroon-600);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(123,28,28,0.5);
  border: none;
  cursor: pointer;
  font-size: 24px;
  transition: all var(--dur-normal) var(--ease-spring);
  z-index: 99;
}

.mobile-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(123,28,28,0.6);
}
```

---

## ✨ MICRO-INTERACTIONS & ANIMATIONS

Implement ALL of these using Framer Motion:

```jsx
// 1. Page transition — each route fades + slides up
const pageVariants = {
  initial:   { opacity: 0, y: 16 },
  animate:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
  exit:      { opacity: 0, y: -8, transition: { duration: 0.18 } }
};

// 2. Stat card number counter (useEffect + requestAnimationFrame)
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    let startTime;
    requestAnimationFrame(step);
  }, [target]);
  return count;
};

// 3. Bill item row — staggered list entrance
const listVariants = {
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};
const itemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } }
};

// 4. Bill total — pulse when amount changes
<motion.span
  key={totalAmount}
  initial={{ scale: 1.1, color: '#D4A017' }}
  animate={{ scale: 1,   color: '#7B1C1C' }}
  transition={{ duration: 0.25 }}
>
  ₹{totalAmount.toLocaleString('en-IN')}
</motion.span>

// 5. Delete confirmation shake
<motion.div
  animate={isError ? { x: [-6, 6, -6, 6, 0] } : {}}
  transition={{ duration: 0.4 }}
>
```

---

## 🔒 EMPTY STATES & ERROR STATES

Design each empty state with a custom illustration-style SVG or icon + message:

```jsx
// Empty bills list
<EmptyState
  icon={<ReceiptIcon size={56} strokeWidth={1} color="#E89898" />}
  title="No bills yet"
  subtitle="Create your first bill using the button above"
  action={{ label: "Create Bill", onClick: () => navigate('/bills/new') }}
/>

// Network error
<ErrorState
  icon={<WifiOffIcon size={56} strokeWidth={1} color="#E89898" />}
  title="Connection lost"
  subtitle="Check your network and try again"
  action={{ label: "Retry", onClick: refetch }}
/>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon-bg {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--bpc-maroon-50);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.empty-sub {
  font-size: 14px;
  color: var(--text-muted);
  max-width: 280px;
  line-height: 1.6;
}
```

---

## 🌐 SKELETON LOADERS

Every data-fetch shows skeletons, not spinners:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bpc-maroon-50) 25%,
    var(--bpc-maroon-100) 50%,
    var(--bpc-maroon-50) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.skeleton-text  { height: 14px; margin-bottom: 8px; }
.skeleton-title { height: 22px; margin-bottom: 12px; }
.skeleton-card  { height: 120px; border-radius: var(--radius-lg); }
```

---

## 📐 TAILWIND CONFIGURATION — COMPLETE

```js
// tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{jsx,js,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        maroon: {
          50: '#FDF5F5', 100: '#F5DADA', 200: '#E89898', 300: '#D45C5C',
          400: '#BB3535', 500: '#9B2424', 600: '#7B1C1C', 700: '#5A1818',
          800: '#4A1212', 900: '#2E0A0A', 950: '#1A0505',
        },
        gold: {
          50: '#FDFAF0', 100: '#F8EABB', 200: '#F0D080', 300: '#E6BC4A',
          400: '#D4A017', 500: '#C08000', 600: '#9A6200', 700: '#704500',
          800: '#4A2E00', 900: '#2C1A00',
        },
      },
      boxShadow: {
        'bpc-sm': '0 1px 4px rgba(123,28,28,0.08)',
        'bpc':    '0 4px 16px rgba(123,28,28,0.10)',
        'bpc-lg': '0 8px 32px rgba(123,28,28,0.14)',
        'bpc-xl': '0 16px 48px rgba(123,28,28,0.18)',
        'gold':   '0 0 0 3px rgba(212,160,23,0.25)',
      },
      borderRadius: {
        'sm': '6px', 'md': '10px', 'lg': '16px', 'xl': '24px',
      },
      backgroundImage: {
        'diagonal-gold': `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 24px,
          rgba(212,160,23,0.025) 24px,
          rgba(212,160,23,0.025) 25px
        )`,
      },
      animation: {
        'count-up':    'countUp 1.2s cubic-bezier(0,0,0.2,1)',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':     'shimmer 1.6s infinite',
        'pulse-gold':  'pulseGold 2s infinite',
      },
      keyframes: {
        countUp:   { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '200% center' }, '100%': { backgroundPosition: '-200% center' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,160,23,0.4)' }, '50%': { boxShadow: '0 0 0 6px rgba(212,160,23,0)' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

---

## ✅ UI/UX QUALITY CHECKLIST — VERIFY ALL

### Visual Polish
- [ ] Cormorant Garamond used for all headings, page titles, brand text
- [ ] DM Sans for all body/UI text
- [ ] JetBrains Mono for all numbers, amounts, bill IDs
- [ ] Warm maroon (#7B1C1C) + gold (#D4A017) color scheme — no other primary colors
- [ ] Warm-tinted shadows (maroon-hued, not grey)
- [ ] Sidebar: very dark maroon (#2E0A0A) with gold active indicator
- [ ] Login page: split-canvas layout, NOT a centered card on white
- [ ] No generic blue links anywhere — all interactions in maroon/gold

### Interactions
- [ ] Page transitions (fade + slide up) on every route change
- [ ] Stat card number count-up animation on mount
- [ ] Bill total pulses gold when amount changes
- [ ] Bill item rows slide-in with stagger when added
- [ ] Buttons have shimmer effect on hover
- [ ] Modal: fade in backdrop + spring scale-in card
- [ ] Toast: bottom-right, dark maroon bg with gold icon

### States
- [ ] Skeleton loaders on every data-fetch (not spinners)
- [ ] Custom empty state designs (not blank white pages)
- [ ] Error state with retry button
- [ ] Confirmation dialogs with red "danger" button for destructive actions
- [ ] Disabled states look disabled (not just greyed out — slightly translucent)
- [ ] Loading button state (spinner replaces text, button stays same width)

### Accessibility
- [ ] Focus ring: 3px maroon-tinted outline on all interactive elements
- [ ] ARIA labels on all icon-only buttons
- [ ] Color is never the ONLY indicator (always paired with text/icon)
- [ ] Minimum 4.5:1 contrast ratio on all text
- [ ] All forms have proper labels (not just placeholders)
- [ ] Keyboard navigation works on all modals and dropdowns

### Mobile
- [ ] Bottom tab bar on < 768px (not sidebar)
- [ ] FAB button (+) for "New Bill" on mobile
- [ ] All tables horizontally scrollable with sticky first column
- [ ] Login: stacked layout (brand header + form below)
- [ ] All tap targets minimum 44px
- [ ] No horizontal overflow anywhere
- [ ] PDF downloads instead of print preview on mobile
- [ ] Menu page: primary optimized for mobile (QR scan use case)
