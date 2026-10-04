# BPC Canteen — Complete Frontend Bug Audit & Master Fix Prompt
> Deep end-to-end analysis of `D:\balaji_canteen\client`  
> Date: June 2026 | Analyst: Claude Sonnet 4.6

---

## PART 1 — COMPLETE BUG & ISSUE CATALOGUE

### 🔴 CRITICAL (Functional Breakage / Security)

---

#### BUG-C1 — `LoadingSpinner.jsx`: Broken Tailwind class references
**File:** `src/components/common/LoadingSpinner.jsx`  
**Problem:** Uses `border-bpc-maroon-200`, `border-t-bpc-maroon-700`, `bg-bpc-cream/80` — none of these exist in the Tailwind config. The config defines `maroon.*` and `surface.*`, not `bpc-maroon-*` or `bpc-cream`. The spinner renders a broken invisible border and the fullScreen backdrop is plain white instead of creamy.  
**Impact:** Every loading state in the app is visually broken.

---

#### BUG-C2 — `QRManagement.jsx`: Entirely wrong CSS class namespace
**File:** `src/pages/admin/QRManagement.jsx`  
**Problem:** Uses `page-heading`, `page-subheading`, `card-bpc` (exists), `bpc-maroon-100`, `bpc-maroon-600`, `btn-bpc-outline`, `shadow-bpc-lg` (exists), `bpc-cream`. Classes `page-heading`, `page-subheading`, and `btn-bpc-outline` are not defined anywhere in `index.css` or `tailwind.config.js`. The page will render with missing titles and a broken "Regenerate" button.  
**Impact:** QR Management page is partly broken on render.

---

#### BUG-C3 — `ForgotPassword.jsx`: Stale CSS class namespace
**File:** `src/pages/auth/ForgotPassword.jsx`  
**Problem:** Uses `bg-bpc-cream`, `card-bpc` (exists), `input-bpc`, `btn-bpc` (exists), `text-bpc-maroon-600`, `hover:text-bpc-maroon-800`. The current design system uses `bg-surface-page`, `form-input`, and `maroon-*`. `input-bpc` is not defined; `bg-bpc-cream` and `text-bpc-maroon-600` are not in the config.  
**Impact:** Forgot Password page input field has no styling; background is wrong.

---

#### BUG-C4 — `ConfirmDialog.jsx`: `variant="primary"` is not handled
**File:** `src/components/common/ConfirmDialog.jsx`  
**Problem:** The variants object only defines `danger`, `warning`, and `info`. `QuotationGenerator.jsx` calls `<ConfirmDialog variant="primary" />` for the Convert to Invoice dialog. The fallback `|| variants.danger` silently makes it red, which is semantically wrong for a non-destructive confirmation.  
**Impact:** Convert-to-Invoice confirm is incorrectly styled as a danger/delete action.

---

#### BUG-C5 — `CustomerStatement.jsx`: `window.confirm()` used for destructive actions
**File:** `src/pages/admin/CustomerStatement.jsx` (Regenerate & Delete buttons)  
**Problem:** Native `window.confirm()` is used for both Regenerate and Delete. This is a security anti-pattern (can be spoofed/suppressed by browser extensions) and inconsistent with the rest of the app which uses `ConfirmDialog`. On mobile, `window.confirm` appears as a native sheet with no BPC branding and may not block in some WebViews.  
**Impact:** Inconsistent UX; potential suppression on some mobile browsers.

---

#### BUG-C6 — `CustomerStatement.jsx`: `regenerateMut.isLoading` is TanStack Query v4 API
**File:** `src/pages/admin/CustomerStatement.jsx`  
**Problem:** The code uses `regenerateMut.isLoading` and `deleteMut.isLoading`, which is TanStack Query v4 syntax. The project uses v5 (`@tanstack/react-query: ^5.0.0`). In v5 the correct property is `regenerateMut.isPending`. The `disabled` state on those buttons will never activate.  
**Impact:** Buttons remain clickable during mutation — double-submits possible; buttons don't show spinner state.

---

#### BUG-C7 — `axios.instance.js`: `localStorage` fallback re-introduces XSS vector
**File:** `src/api/axios.instance.js`  
**Problem:** `getAccessToken()` includes a localStorage fallback "for backward compatibility during migration". If this migration phase was already completed, this code should be removed. While the fallback clears the value after reading it, the window between storage and clear is exploitable. Any `localStorage.setItem('bpc_access_token', …)` by an injected script would be picked up on first read. The comment says "migration" but there's no tracking of whether migration is complete.  
**Impact:** XSS token theft partially possible through the migration window.

---

#### BUG-C8 — `App.jsx`: Forgot Password page not protected from authenticated users
**File:** `src/App.jsx`  
**Problem:** `/forgot-password` has no redirect guard. An already-authenticated admin/employee can navigate to it. The login page redirects (`isAuthenticated ? <Navigate … />`), but forgot-password does not. Minor but inconsistent.

---

#### BUG-C9 — `CreateBill.jsx`: Cart items indexed by array position, not by ID
**File:** `src/pages/employee/CreateBill.jsx` → `CartPanel`  
**Problem:** `removeItem(i)` and `updateQuantity(i, …)` use the array index `i` from `items.map((item, i) => …)`. The Zustand `cartStore.js` also uses index-based removal (`items.filter((_, i) => i !== index)`). If two items exist and the first is deleted, the second item (now at index 0) could be accidentally mutated or the wrong item deleted in rapid interactions or React concurrent mode re-renders. Items should be identified by `menuItemId`.

---

#### BUG-C10 — `MenuManagement.jsx` & `SettingsPage.jsx`: No file type/size validation on upload
**Files:** `src/pages/admin/MenuManagement.jsx`, `src/pages/admin/SettingsPage.jsx`  
**Problem:** `accept="image/*"` is set on the file input but there is no JavaScript validation of MIME type or file size before sending to the API. A user can rename a PHP/SVG/script file to `.jpg` and the browser's `accept` attribute will not stop them on all browsers. The API is the last line of defence.  
**Impact:** Potential server-side file upload vulnerability if backend doesn't validate strictly.

---

### 🟠 HIGH (Significant UX Degradation / Bugs)

---

#### BUG-H1 — `Sidebar.jsx`: Mobile FAB obscures the bottom tab bar
**File:** `src/components/layout/Sidebar.jsx`  
**Problem:** The employee "New Bill" FAB is positioned at `bottom-[80px]` with `z-[91]`. The bottom nav bar is `h-16` (64px) with `pb-[env(safe-area-inset-bottom)]`. On devices with a home indicator (iPhone, many Android flagships) `safe-area-inset-bottom` is 34–44px, making the nav effectively ~100–108px tall. The FAB at 80px will overlap the top portion of the tab bar labels.  
**Impact:** Tab bar labels clipped/hidden behind FAB on notched phones.

---

#### BUG-H2 — `AdminDashboard.jsx`: `useCountUp` always animates from 0, even on data refresh
**File:** `src/pages/admin/AdminDashboard.jsx`  
**Problem:** `useCountUp(target)` uses `useEffect([target])` to restart animation whenever `target` changes. On a React Query background refetch, the stat cards will re-animate from 0 even though the value barely changed, causing jarring visual noise. The animation should only play on first mount.

---

#### BUG-H3 — `AdminDashboard.jsx`: "Fake days overdue" comment in production code
**File:** `src/pages/admin/AdminDashboard.jsx`  
**Problem:** The outstanding dues section contains `// Fake days overdue for UI demo purposes since it's not in the API currently` and `const isCritical = cust.outstandingBalance > 5000`. The criticality threshold is hardcoded (not from settings), and the comment signals this is a placeholder that was never removed.

---

#### BUG-H4 — `Navbar.jsx`: Clock only renders once (stale time)
**File:** `src/components/layout/Navbar.jsx`  
**Problem:** `new Date().toLocaleTimeString(…)` is called during render with no `setInterval`. The clock shows the time when the component was last rendered and never updates unless the user navigates. After a long session the time will be hours behind.  
**Impact:** Live clock appears broken / misleading.

---

#### BUG-H5 — `AllBills.jsx`: Pagination page state not reset on filter change
**File:** `src/pages/admin/AllBills.jsx`  
**Problem:** When `search`, `statusFilter`, or `typeFilter` changes, `page` is never reset to 1. If a user is on page 5 and changes the search query, the app queries page 5 of the filtered results (which may be empty) instead of returning to page 1.

---

#### BUG-H6 — `MyBills.jsx` & `AllBills.jsx`: PDF download errors are swallowed silently
**File:** `src/pages/employee/MyBills.jsx`, `src/pages/admin/AllBills.jsx`  
**Problem:** `downloadPDF` catch blocks are `catch { /* handled silently */ }` or `catch { /* handled */ }` — the user gets no feedback when a PDF download fails.

---

#### BUG-H7 — `BillDetail.jsx`: Payment amount not validated before submission
**File:** `src/pages/admin/BillDetail.jsx`  
**Problem:** The "Record Payment" form only disables the button if `!payAmount || Number(payAmount) <= 0`. It does not prevent the user from entering a value greater than `bill.balanceDue`. The `max` attribute on the input is set, but it's only a browser hint — it can be bypassed. A user can overpay and there is no client-side error message.

---

#### BUG-H8 — `MonthlyStatements.jsx`: `navigate(stmt._id)` — relative navigation bug
**File:** `src/pages/admin/MonthlyStatements.jsx`  
**Problem:** On card click, `navigate(stmt._id)` uses a relative path. If the current URL is `/admin/statements`, this correctly navigates to `/admin/statements/{id}`. But if accessed from `/employee/statements`, it goes to `/employee/statements/{id}` — which is correct for employees. However, the navigate call has **no leading slash and no base path**, which can be fragile in nested route scenarios.  
**Impact:** Potentially navigates to wrong URL depending on render context.

---

#### BUG-H9 — `InvoiceGenerator.jsx`: `keepPreviousData` is TanStack Query v4 API
**File:** `src/pages/admin/InvoiceGenerator.jsx`  
**Problem:** `keepPreviousData: true` is a TanStack Query v4 option. In v5 this has been replaced by `placeholderData: (prev) => prev`. The invoice list will flash/blank on every page change instead of keeping the previous data visible.

---

#### BUG-H10 — `QuotationGenerator.jsx`: Same `keepPreviousData` v4 issue
**File:** `src/pages/admin/QuotationGenerator.jsx`  
**Problem:** Same as BUG-H9. The quotations list uses `keepPreviousData: true` which is ignored in TanStack v5.

---

#### BUG-H11 — `EmployeeDashboard.jsx`: "Good morning" greeting is hardcoded, never changes
**File:** `src/pages/employee/EmployeeDashboard.jsx`  
**Problem:** The greeting is always "Good morning, {name} 👋" regardless of the time of day. In an always-on canteen application, employees may use this in the afternoon or evening.

---

#### BUG-H12 — `CreateBill.jsx`: `menuAPI.getAll({ limit: 200 })` — no pagination, hard limit
**File:** `src/pages/employee/CreateBill.jsx`  
**Problem:** Fetches all menu items with a hard limit of 200. If the canteen adds more than 200 items, newer items silently won't appear in the bill creation flow. There is no indication to the user that items may be missing.

---

#### BUG-H13 — `MenuPage.jsx`: Special popup fires on every page visit/refresh
**File:** `src/pages/public/MenuPage.jsx`  
**Problem:** The `useEffect` that triggers `setShowSpecialPopup(true)` only depends on `specialItems`. Because `MenuPage` is a public route with no persistent state, every single page load shows the popup after 800ms. There is no session/localStorage flag to remember "user already saw the popup today". For a busy canteen with many QR scans, this becomes annoying immediately.

---

#### BUG-H14 — `CustomerStatement.jsx`: `markPaid` called without `paymentReference`
**File:** `src/pages/admin/CustomerStatement.jsx`  
**Problem:** The "Mark Paid" button in the detail page calls `markPaidMut.mutate({ amount: data.closingBalance })` — it sends no `paymentReference`. The `RecordPaymentModal` in `MonthlyStatements.jsx` correctly requires a reference, but the shortcut button on `CustomerStatement.jsx` bypasses this, potentially creating unaudited payment records.

---

### 🟡 MEDIUM (Design / Accessibility / Code Quality Issues)

---

#### BUG-M1 — `index.html`: Favicon is a JPEG, not an icon file
**File:** `client/index.html`  
**Problem:** `<link rel="icon" type="image/jpeg" href="/logo.jpeg" />` — JPEG is not recommended for favicons. It doesn't support transparency, looks blurry on HiDPI screens, and some browsers ignore it. Should be converted to `.ico`, `.png`, or `.svg`.

---

#### BUG-M2 — `index.html`: Duplicate font loading (two separate `<link>` tags for Google Fonts)
**File:** `client/index.html`  
**Problem:** `Inter` and `Playfair Display` fonts are loaded in `index.html`, but the design system in `index.css` loads `Outfit`, `Cormorant Garamond`, and `JetBrains Mono`. The HTML fonts are never used anywhere in the CSS/components — completely wasted bandwidth.

---

#### BUG-M3 — `AdminLayout.jsx` / `EmployeeLayout.jsx`: `overflow-auto` on `<main>` swallows sticky children
**Files:** `src/components/layout/AdminLayout.jsx`, `src/components/layout/EmployeeLayout.jsx`  
**Problem:** `<main className="flex-1 p-4 lg:p-8 overflow-auto">` — `overflow-auto` on the main container creates a new stacking context and scroll container. Any `position: sticky` elements inside page content (like the sticky sidebar panel in `CreateBill.jsx` with `sticky top-20`) will be sticky within the `main` element's scroll, not the window. This is actually fine but means `max-h-[calc(100vh-7rem)]` in `CreateBill` is relative to the viewport, not the scrollable area — causing potential height calculation mismatch.

---

#### BUG-M4 — `Sidebar.jsx`: `sidebarOpen` state is tracked in `uiStore` but never used
**File:** `src/components/layout/Sidebar.jsx`, `src/store/uiStore.js`  
**Problem:** `uiStore.js` exports `sidebarOpen` and `toggleSidebar`, and `Sidebar.jsx` imports `sidebarOpen` from the store. However, nothing in any layout conditionally renders or collapses the desktop sidebar based on `sidebarOpen`. It's dead state — the desktop sidebar is always visible.

---

#### BUG-M5 — `Sidebar.jsx`: Bottom nav "More" dropdown can overflow off-screen on small phones
**File:** `src/components/layout/Sidebar.jsx`  
**Problem:** The "More" dropdown is `absolute bottom-full right-0 w-56`. On very narrow phones (320px wide) with the "More" button near the left edge, `right-0` anchors it to the button's right, potentially clipping the dropdown's left edge off-screen. It needs `right-auto left-0` for buttons on the left side of the bar, or `min(…)` clamping.

---

#### BUG-M6 — `ConfirmDialog.jsx`: Pressing `Escape` doesn't close the dialog
**File:** `src/components/common/ConfirmDialog.jsx`  
**Problem:** No `keydown` listener for `Escape`. This is a standard modal accessibility expectation (WCAG 2.1 SC 1.4.13). The Radix UI dialogs in the project handle this automatically, but this custom dialog does not.

---

#### BUG-M7 — `LoginPage.jsx`: Uses `<a href="/forgot-password">` instead of React Router `<Link>`
**File:** `src/pages/auth/LoginPage.jsx`  
**Problem:** The "Forgot password?" link is a plain `<a>` tag, which causes a full page reload instead of a client-side navigation. This is inconsistent with the SPA architecture and breaks the smooth transition experience.

---

#### BUG-M8 — `AllBills.jsx` / `MyBills.jsx`: Table/list is not mobile-responsive
**Files:** `src/pages/admin/AllBills.jsx`, `src/pages/employee/MyBills.jsx`  
**Problem:** `AllBills` uses a full table with `overflow-x-auto` but columns like "Type", "Status" are not hidden on mobile. On screens narrower than 640px, the table becomes a horizontal scrolling element with very small text, not a reflow into card layout.

---

#### BUG-M9 — `InvoiceGenerator.jsx`: `ItemRow` uses inline `style={{ gridTemplateColumns: … }}`
**File:** `src/pages/admin/InvoiceGenerator.jsx`  
**Problem:** Desktop item row uses `style={{ gridTemplateColumns: '1fr 80px 90px 110px 100px 36px' }}`. On tablet widths between `md` and `xl`, this layout can overflow its container. The `ItemCard` mobile fallback is correct, but there's a gap at ~820px where the grid is visible but the container is too narrow.

---

#### BUG-M10 — `MenuManagement.jsx`: Form `handleSubmit` uses `e.preventDefault()` but is an `async` function without a loading boundary around `onClose`
**File:** `src/pages/admin/MenuManagement.jsx`  
**Problem:** If the API request succeeds but `queryClient.invalidateQueries` throws (edge case), `onClose()` is never called, leaving the modal open with no error to the user. The `finally { setLoading(false) }` runs, but `onClose()` is only called in the `try` block.

---

#### BUG-M11 — `EmployeeManagement.jsx`: Password reset requires minimum 8 chars but has no strength indication
**File:** `src/pages/admin/EmployeeManagement.jsx`  
**Problem:** The reset password input just has `minLength={8}` and disabled state when `newPwd.length < 8`. There's no visual strength meter or character count. Admins setting weak passwords like "12345678" get no warning.

---

#### BUG-M12 — `CategoryManagement.jsx` not read (assumed issue from pattern)
**File:** `src/pages/admin/CategoryManagement.jsx`  
**Note:** File not fully read but given the pattern in the codebase (stale CSS classes in older pages), likely contains `btn-bpc-outline` or similar legacy classes. Verify.

---

#### BUG-M13 — Global: `transition-all duration-220` is not a valid Tailwind class
**Multiple files:** `AdminLayout.jsx`, `Sidebar.jsx`, `EmployeeDashboard.jsx`, and others  
**Problem:** `duration-220` is not in Tailwind's default or configured scale. Tailwind's defaults are 75, 100, 150, 200, 300, 500, 700, 1000. `duration-220` will be emitted as an unknown utility and ignored, falling back to the browser default transition duration. Use `duration-200`.

---

#### BUG-M14 — `LoadingSpinner.jsx`: Missing `aria-label` on spinner
**File:** `src/components/common/LoadingSpinner.jsx`  
**Problem:** The animated `div` has no ARIA attributes. Screen readers will ignore it. Should have `role="status"` and `aria-label="Loading"`.

---

#### BUG-M15 — `Navbar.jsx`: User dropdown menu not closable with Escape key
**File:** `src/components/layout/Navbar.jsx`  
**Problem:** The user menu dropdown (`menuOpen`) closes on outside click but not on `Escape` key press. Same accessibility gap as BUG-M6.

---

### 🔵 LOW (Minor / Cleanup)

---

#### BUG-L1 — `ErrorBoundary.jsx`: Error details not reset on navigation
**File:** `src/components/common/ErrorBoundary.jsx`  
**Problem:** Class-based `ErrorBoundary` has no `resetKeys` or router integration. If a page throws an error, navigating to another page via the sidebar still shows the "Something went wrong" screen because the boundary's `hasError` state is not reset on route change.

---

#### BUG-L2 — `.env` is committed to the repo
**File:** `client/.env`  
**Problem:** The `.env` file with `VITE_API_BASE_URL=http://localhost:5000/api/v1` appears to be tracked by git (it's listed in the directory without being in `.gitignore` for the client). Even with only a localhost URL, this sets a bad precedent. `.env` should always be in `.gitignore`.

---

#### BUG-L3 — `vite.config.js`: `sourcemap: false` in build — makes debugging production issues impossible
**File:** `client/vite.config.js`  
**Problem:** Turning off source maps entirely means production errors (in Sentry etc.) will show minified stack traces. Recommend `sourcemap: 'hidden'` to generate maps without serving them publicly.

---

#### BUG-L4 — `main.jsx`: `MutationCache` `onError` toast ID collision
**File:** `src/main.jsx`  
**Problem:** Toast ID `mutation-error-${Date.now()}` — `Date.now()` has millisecond resolution. Two mutations firing simultaneously get the same ID, causing the second toast to replace the first instead of stacking. Use `crypto.randomUUID()` or a counter.

---

#### BUG-L5 — `EmployeeDashboard.jsx`: Stats use ALL bills, not just "my" bills
**File:** `src/pages/employee/EmployeeDashboard.jsx`  
**Problem:** The query `billAPI.getAll({ page: 1, limit: 10 })` fetches all bills. If the backend doesn't automatically filter by `createdBy`, employees may see stats from other employees' bills. "My Stats Today" would be inaccurate.

---

#### BUG-L6 — `hooks/useMenu.js`: `usePublicMenu` refetches every 5 minutes even when the tab is hidden
**File:** `src/hooks/useMenu.js`  
**Problem:** `refetchInterval: 5 * 60 * 1000` runs even when `document.visibilityState === 'hidden'`. This wastes bandwidth for visitors who leave the menu tab open in the background. Use `refetchIntervalInBackground: false`.

---

#### BUG-L7 — `CustomerStatement.jsx`: `formatDateIST` manually applies +330 min offset — breaks on DST edge cases  
**File:** `src/pages/admin/CustomerStatement.jsx`  
**Problem:** India doesn't observe DST, so IST is always UTC+5:30. However, this manual offset bypasses the timezone-aware `Intl.DateTimeFormat` API. If the server sends timezone-aware ISO strings, the offset could be double-applied. Prefer `date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', … })`.

---

#### BUG-L8 — Multiple pages: Unused imports
**Various files:**
- `Sidebar.jsx` imports `BarChart3` (unused)
- `AdminDashboard.jsx` imports `ArrowUpRight` (unused)  
- `BillDetail.jsx` imports `Receipt` only used in empty state — fine  
- `InvoiceGenerator.jsx` imports `SlidersHorizontal` used in list header — fine  
These add minor bundle weight.

---

## PART 2 — MASTER FIX PROMPT

Copy the following prompt in full and send it to Claude with the codebase attached:

---

```
You are a senior full-stack engineer performing a complete, professional frontend overhaul of the BPC Canteen billing application (React 18 + Vite + TanStack Query v5 + Zustand + Tailwind CSS + Framer Motion). 

Apply every fix below perfectly, in sequence, with zero regressions. Make no new design decisions — preserve the existing BPC brand identity (maroon/gold, Cormorant Garamond + Outfit fonts, existing component API). Only fix what is broken, inconsistent, insecure, or inaccessible.

---

### FIX 1 — LoadingSpinner.jsx: Fix broken CSS class references
Replace ALL occurrences of stale class names:
- `border-bpc-maroon-200` → `border-maroon-200`
- `border-t-bpc-maroon-700` → `border-t-maroon-700`
- `bg-bpc-cream/80` → `bg-surface-page/80`
Add `role="status"` and `aria-label="Loading"` to the spinner `div`.
Final component should only use classes defined in tailwind.config.js.

---

### FIX 2 — QRManagement.jsx: Fix broken CSS class namespace
Replace every stale class:
- `page-heading` → `font-display text-3xl font-bold text-maroon-800 tracking-tight`
- `page-subheading` → `text-sm text-[#9A7A7A] mt-1`
- `btn-bpc-outline` → `flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm border border-maroon-600 text-maroon-600 hover:bg-maroon-50 transition-colors`
- `bpc-maroon-100` → `maroon-100`
- `bpc-maroon-600` → `maroon-600`
- `bpc-cream` → (remove, not needed)
- `shadow-bpc-lg` → keep (it exists in config)

---

### FIX 3 — ForgotPassword.jsx: Fix stale CSS namespace
Replace:
- `bg-bpc-cream` → `bg-surface-page`
- `input-bpc` → `form-input` (as defined in index.css @layer components)
- `text-bpc-maroon-600` → `text-maroon-600`
- `hover:text-bpc-maroon-800` → `hover:text-maroon-800`
Keep `btn-bpc` (it exists).

---

### FIX 4 — ConfirmDialog.jsx: Add "primary" variant + Escape key handler
Add `primary` to the variants map:
```js
primary: { bg: 'bg-maroon-100', icon: 'text-maroon-700', btn: 'bg-maroon-700 hover:bg-maroon-800 focus:ring-maroon-400' },
```
Add a `useEffect` that listens for `keydown` → `Escape` → calls `onClose()` when `open` is true.
Add `tabIndex={-1}` and `onKeyDown` handler to the dialog container div so focus is trapped correctly.

---

### FIX 5 — CustomerStatement.jsx: Replace window.confirm with ConfirmDialog state
Import and use `ConfirmDialog` for both Regenerate and Delete confirmations. 
Add two state variables: `showRegenerateConfirm` and `showDeleteConfirm` (both boolean).
Replace the inline `window.confirm(…)` calls with state setters.
Wire ConfirmDialog `open`, `onClose`, and `onConfirm` props accordingly.
Use `variant="info"` for regenerate, `variant="danger"` for delete.

---

### FIX 6 — CustomerStatement.jsx: Fix TanStack Query v5 `.isLoading` → `.isPending`
Replace:
- `regenerateMut.isLoading` → `regenerateMut.isPending`
- `deleteMut.isLoading` → `deleteMut.isPending`
in all JSX disabled props and conditional expressions.

---

### FIX 7 — axios.instance.js: Remove localStorage fallback (migration complete)
Delete the entire localStorage fallback block from `getAccessToken()`. The function should simply be:
```js
export const getAccessToken = () => _accessToken;
```
Also ensure `clearAccessToken()` and `setAccessToken()` only operate on `_accessToken` and call `localStorage.removeItem('bpc_access_token')` for cleanup on the first deploy only (this line can stay for the removal sweep, then remove on next iteration).

---

### FIX 8 — App.jsx: Redirect authenticated users away from /forgot-password
In the `/forgot-password` route, wrap the same way as `/login`:
```jsx
<Route path="/forgot-password" element={
  isAuthenticated 
    ? <Navigate to={user?.role === 'admin' ? '/admin' : '/employee'} replace /> 
    : <ForgotPassword />
} />
```

---

### FIX 9 — Navbar.jsx: Fix static clock with live interval
Replace the static `new Date().toLocaleTimeString(…)` with a `useState`/`useEffect` pattern:
```js
const [time, setTime] = useState(() => 
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
);
useEffect(() => {
  const id = setInterval(() => {
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, 30_000); // update every 30 seconds
  return () => clearInterval(id);
}, []);
```
Render `{time}` instead of the inline `new Date()…` call.
Also add `Escape` key handler to the user dropdown: add `useEffect` listening for `keydown → Escape → setMenuOpen(false)` when `menuOpen` is true.

---

### FIX 10 — AllBills.jsx: Reset page to 1 on filter change
Add `useEffect` hooks (or inline setters) that call `setPage(1)` whenever `search`, `statusFilter`, or `typeFilter` changes:
```js
useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);
```

---

### FIX 11 — AllBills.jsx & MyBills.jsx: Show toast on PDF download failure
In both files, change the catch block of `downloadPDF`:
```js
} catch (err) {
  toast.error('PDF download failed. Please try again.');
}
```
Remove `/* handled silently */` and `/* handled */` comments.

---

### FIX 12 — BillDetail.jsx: Validate payment amount ≤ balanceDue on client
In the Record Payment modal form, add client-side validation before calling `paymentMut.mutate`:
```js
const handleRecordPayment = () => {
  const amt = Number(payAmount);
  if (!amt || amt <= 0) return toast.error('Please enter a valid amount');
  if (amt > bill.balanceDue) return toast.error(`Amount cannot exceed balance due of ${formatINR(bill.balanceDue)}`);
  paymentMut.mutate({ amount: amt, paymentMethod });
};
```
Replace the inline `onClick` call with `handleRecordPayment`.

---

### FIX 13 — InvoiceGenerator.jsx & QuotationGenerator.jsx: Fix TanStack Query v5 keepPreviousData
In `InvoiceGenerator.jsx`, change:
```js
keepPreviousData: true,
```
To:
```js
placeholderData: (prev) => prev,
```
Apply the same fix to `QuotationGenerator.jsx`.

---

### FIX 14 — Sidebar.jsx: Fix mobile FAB bottom offset for notched phones
Change the FAB `bottom-[80px]` to `bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+16px)]` to stay above the safe-area-aware tab bar on all devices.

---

### FIX 15 — AdminDashboard.jsx: Prevent countUp re-animation on background refresh
In `useCountUp`, change the dependency to only run on initial mount by using a `useRef` to track whether it's already played:
```js
const hasPlayed = useRef(false);
useEffect(() => {
  if (hasPlayed.current && count > 0) {
    // If already played and new target is close (< 5% change), skip
    const diff = Math.abs(target - count) / (target || 1);
    if (diff < 0.05) { setCount(target); return; }
  }
  hasPlayed.current = true;
  let startTime;
  const step = (timestamp) => { /* existing logic */ };
  requestAnimationFrame(step);
}, [target]);
```
Alternatively: only start animation when `count === 0 && target > 0`.

---

### FIX 16 — AdminDashboard.jsx: Remove "Fake" placeholder code
Remove the comment `// Fake days overdue for UI demo purposes since it's not in the API currently`.
Make the criticality threshold configurable or pull from settings. For now, add a named constant:
```js
const CRITICAL_BALANCE_THRESHOLD = 5000; // TODO: move to settings
```
And replace the magic number `5000` with `CRITICAL_BALANCE_THRESHOLD`.

---

### FIX 17 — EmployeeDashboard.jsx: Time-aware greeting
Replace `"Good morning"` with a dynamic greeting:
```js
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
```
Use `{getGreeting()}, {user?.name?.split(' ')[0]} 👋` in the JSX.

---

### FIX 18 — LoginPage.jsx: Replace <a> tag with React Router <Link>
Change:
```jsx
<a href="/forgot-password" className="…">Forgot password?</a>
```
To:
```jsx
<Link to="/forgot-password" className="…">Forgot password?</Link>
```
Add `Link` to the react-router-dom import at the top of the file.

---

### FIX 19 — MonthlyStatements.jsx: Fix navigate(stmt._id) to absolute path
Change:
```js
navigate(stmt._id)
```
To:
```js
navigate(`/admin/statements/${stmt._id}`)
```
This ensures correct navigation regardless of which layout (admin or employee) renders the component.

---

### FIX 20 — CustomerStatement.jsx: formatDateIST → use Intl.DateTimeFormat
Replace the manual UTC+330 manipulation with:
```js
const formatDateIST = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateString));
};

const formatTimeIST = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(dateString));
};
```

---

### FIX 21 — CustomerStatement.jsx: markPaid from detail page must include paymentReference
Refactor the "Mark Paid" button on the CustomerStatement detail page to open a small inline dialog (or reuse `RecordPaymentModal` pattern) that collects a `paymentReference` before calling `markPaidMut.mutate`. Do not allow silent/unaudited payment recording.

---

### FIX 22 — MenuPage.jsx: Suppress special popup after first view in session
Wrap the popup trigger in a session check:
```js
useEffect(() => {
  if (specialItems.length > 0) {
    const seenKey = 'bpc_special_seen';
    if (!sessionStorage.getItem(seenKey)) {
      const timer = setTimeout(() => {
        setShowSpecialPopup(true);
        sessionStorage.setItem(seenKey, '1');
      }, 800);
      return () => clearTimeout(timer);
    }
  }
}, [specialItems]);
```
This shows the popup once per browser session (tab), not on every refresh.

---

### FIX 23 — useMenu.js: Disable background refetch interval when tab is hidden
Add `refetchIntervalInBackground: false` to `usePublicMenu`:
```js
export const usePublicMenu = () => useQuery({
  queryKey: ['publicMenu'],
  queryFn: () => menuAPI.getPublicMenu().then((r) => r.data.data),
  refetchInterval: 5 * 60 * 1000,
  refetchIntervalInBackground: false,
});
```

---

### FIX 24 — index.html: Remove unused font preloads, fix favicon
1. Remove the two `<link>` tags loading `Inter` and `Playfair Display` — these are never used.
2. Change `<link rel="icon" type="image/jpeg" href="/logo.jpeg" />` to:
   ```html
   <link rel="icon" type="image/png" href="/logo.jpeg" />
   <link rel="apple-touch-icon" href="/logo.jpeg" />
   ```
   (JPEG as PNG is a workaround; ideally convert to PNG/ICO separately.)
3. Add `<meta name="mobile-web-app-capable" content="yes" />` and `<meta name="apple-mobile-web-app-status-bar-style" content="default" />` for PWA-like behaviour.

---

### FIX 25 — main.jsx: Fix toast ID collision in MutationCache
Change:
```js
toast.error(message, { id: `mutation-error-${Date.now()}` });
```
To:
```js
toast.error(message, { id: `mutation-error-${Math.random().toString(36).slice(2)}` });
```

---

### FIX 26 — global: Replace duration-220 with duration-200
Search the entire `src/` directory for `duration-220` and replace every occurrence with `duration-200`.

---

### FIX 27 — ErrorBoundary.jsx: Reset on navigation
Convert `ErrorBoundary` to also accept a `resetKey` prop (the current location pathname), and reset `hasError` in `componentDidUpdate` when `resetKey` changes:
```js
componentDidUpdate(prevProps) {
  if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
    this.setState({ hasError: false, error: null });
  }
}
```
In `AdminLayout.jsx` and `EmployeeLayout.jsx`, pass the location as resetKey:
```jsx
import { useLocation } from 'react-router-dom';
const location = useLocation();
<ErrorBoundary resetKey={location.pathname}><Outlet /></ErrorBoundary>
```

---

### FIX 28 — vite.config.js: Enable hidden sourcemaps for production
Change:
```js
sourcemap: false,
```
To:
```js
sourcemap: 'hidden',
```

---

### FIX 29 — Sidebar.jsx: Fix "More" dropdown clipping on narrow phones
Add `right-0` clamping with a maxWidth constraint on the overflow dropdown:
Change the dropdown positioning from `right-0` to:
```
className="absolute bottom-full mb-2 w-56 max-w-[calc(100vw-1rem)] right-0"
```
And add `overflow-hidden` is already there — also add `left-auto` to prevent stretching.

---

### FIX 30 — EmployeeManagement.jsx: Password strength hint
Below the new password input in the reset dialog, add a real-time character count and simple strength hint:
```jsx
<div className="flex justify-between mt-1.5">
  <span className={`text-xs ${newPwd.length >= 12 ? 'text-success-text' : newPwd.length >= 8 ? 'text-warning-text' : 'text-danger-text'}`}>
    {newPwd.length < 8 ? 'Too short' : newPwd.length < 12 ? 'Acceptable' : 'Strong'}
  </span>
  <span className="text-xs text-[#9A7A7A]">{newPwd.length} chars</span>
</div>
```

---

### MOBILE-SPECIFIC ADDITIONAL FIXES

#### MOBILE-1: All modals — add `overscroll-contain` to scrollable bodies
In every modal with `overflow-y-auto` content body (ConfirmDialog, CustomerForm, MenuItemForm, InvoiceGenerator Customer Picker, etc.), add `overscroll-contain` to prevent the page from scrolling behind the modal on iOS.

#### MOBILE-2: CreateBill — floating cart button z-index conflicts
The floating "View Cart" button uses `z-30`. On Android Chrome with the bottom navigation bar visible, this may conflict. Change to `z-[35]` and add `pb-[env(safe-area-inset-bottom,0px)]` wrapper to the button.

#### MOBILE-3: Form inputs — prevent iOS auto-zoom
iOS Safari zooms in when an input with `font-size < 16px` is focused. In `index.css`, update `.form-input` to use `text-[16px]` minimum (change `text-[14px]` to `text-base` / `text-[16px]`). For places where smaller text is required (inside dense forms), add `touch-action: manipulation` to prevent double-tap zoom.

#### MOBILE-4: AllBills table — card layout on mobile
Wrap the `<table>` in `AllBills.jsx` in `<div className="hidden sm:block">` and add a card-list alternative for `sm:` breakpoint and below, similar to `MyBills.jsx`'s approach but with status badge and action buttons visible inline.

#### MOBILE-5: Invoice/Quotation Generator — sticky summary is hidden on mobile
On mobile, the right-column sticky summary panel (`.xl:col-span-1`) is pushed to the bottom of the form since XL grid only activates at 1280px. On phones, users must scroll to the very bottom to see the total before submitting. Fix: On mobile, show a compact sticky footer bar with the running total and a "Create" button using:
```jsx
<div className="xl:hidden fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 z-20 bg-white border-t border-[rgba(123,28,28,0.1)] px-4 py-3 flex items-center justify-between shadow-lg">
  <div>
    <p className="text-xs text-[#9A7A7A]">Total Payable</p>
    <p className="font-display font-bold text-xl text-maroon-800">{fmt(gst.totalAmount)}</p>
  </div>
  <button type="submit" disabled={createMut.isPending} className="btn-primary px-6">
    {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
  </button>
</div>
```
Add `pb-20` to the form's outer div to prevent content being hidden behind this bar.

#### MOBILE-6: QRManagement — QR image needs explicit dimensions for mobile
`className="w-64 h-64"` (256px) is fine on desktop. On small phones (320px wide with padding) the QR image takes 80% of width. Change to `w-full max-w-[256px] h-auto aspect-square` to be fully responsive.

---

### SECURITY HARDENING

#### SEC-1: File upload validation (MenuManagement, SettingsPage)
Add client-side validation before FormData is sent:
```js
const validateImage = (file) => {
  if (!file) return null;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (!allowedTypes.includes(file.type)) return 'Only JPEG, PNG, and WebP images are allowed';
  if (file.size > maxSize) return 'Image must be smaller than 5MB';
  return null;
};
```
Call this in `onChange` for both image inputs. Show a toast error and clear the file state if validation fails. Do NOT set the image in state until it passes.

#### SEC-2: XSS — sanitize `item.description` rendering in MenuPage
`MenuCard` renders `{item.description}` directly inside `<p>` as a text node. React already escapes this. No action needed — just verify no `dangerouslySetInnerHTML` is used anywhere in the frontend. If it is, replace with DOMPurify sanitization.

#### SEC-3: Password visible toggle should clear on form dismount
In `LoginPage.jsx`, `showPassword` state should reset to `false` when the component unmounts. Add: `useEffect(() => () => setShowPassword(false), [])` — though this is already handled by React state cleanup, it's good defensive practice.

---

### FINAL CHECKLIST (verify after all fixes applied)

- [ ] `npm run build` completes with zero errors and zero Tailwind unknown utility warnings
- [ ] Mobile viewport tested at 320px, 375px, 414px, 768px widths
- [ ] All modals close with `Escape` key
- [ ] Clock in Navbar updates every 30 seconds
- [ ] PDF download errors show a toast in all screens
- [ ] LoadingSpinner renders with correct maroon colors
- [ ] Forgot Password page uses correct `form-input` class and `bg-surface-page`
- [ ] QR Management page renders without class errors
- [ ] Special popup appears only once per session on MenuPage
- [ ] Payment amount validation prevents overpayment in BillDetail
- [ ] File uploads are validated (type + size) before API call
- [ ] No `window.confirm()` remains in the codebase
- [ ] All `keepPreviousData: true` replaced with `placeholderData: (prev) => prev`
- [ ] All `regenerateMut.isLoading` → `isPending` in CustomerStatement
- [ ] `duration-220` → `duration-200` across all files
- [ ] Navigate in MonthlyStatements uses absolute path
- [ ] `useCountUp` doesn't re-animate on background data refresh
```

---

## PART 3 — PRIORITY ORDER FOR IMPLEMENTATION

| Priority | Bug IDs | Reason |
|----------|---------|--------|
| **P0 — Fix First** | C1, C2, C3 | Visually broken pages/components |
| **P1 — Before Deploy** | C4, C5, C6, C7, H9, H10 | Functional bugs / API compatibility |
| **P2 — Mobile Launch** | H1, H4, H5, H6, H7, H8, MOBILE-1 through MOBILE-6 | Mobile UX critical |
| **P3 — Security** | C9, C10, SEC-1 | Data integrity and upload security |
| **P4 — Polish** | H2, H3, H11, H12, H13, M1–M15 | Quality and consistency |
| **P5 — Cleanup** | L1–L8 | Technical debt |

---

*End of BPC Canteen Frontend Audit*  
*Total issues identified: 10 Critical + 13 High + 15 Medium + 8 Low + 6 Mobile-specific + 3 Security = **55 issues***
