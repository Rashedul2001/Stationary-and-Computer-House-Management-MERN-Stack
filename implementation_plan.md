# Project Building Plan — Laksam IT Knowledge & Paper House (`laksam_db`)

## 1. Architecture & Tech Stack
- **Monorepo Layout** (strictly following the directory structure in [RequirementsAndApplicationBasedInstructions.txt](file:///home/rashedul_2001/Project/Stationary-And-Computer-House-Management-System/RequirementsAndApplicationBasedInstructions.txt)):
  - `server/` — Node.js + Express REST API + Mongoose (`laksam_db`) + Better Auth + Cloudinary + Multer + Nodemailer
  - `client/` — Vite + React (JavaScript, `.jsx`/`.js`) + Tailwind CSS + **shadcn/ui** (`tsx: false`) + TanStack Query + `react-i18next` + `sonner` + `react-icons` + `recharts` (shadcn Charts) + `react-to-print`
- **Brand Assets Integration**:
  - `client/public/favicon.png` ← [favicon.png](file:///home/rashedul_2001/Project/Stationary-And-Computer-House-Management-System/favicon.png)
  - `client/src/assets/logo.png` ← [LIKPH Smart Stationery & Tech Logo.png](file:///home/rashedul_2001/Project/Stationary-And-Computer-House-Management-System/LIKPH%20Smart%20Stationery%20%26%20Tech%20Logo.png)
  - `client/public/images/hero-default.jpeg` ← [WhatsApp Image 2026-11-19 at 2.01.10 PM (1).jpeg](file:///home/rashedul_2001/Project/Stationary-And-Computer-House-Management-System/WhatsApp%20Image%202026-11-19%20at%202.01.10%20PM%20(1).jpeg)
  - `client/public/images/store-banner.jpeg` ← [WhatsApp Image 2026-11-18 at 2.14.54 PM.jpeg](file:///home/rashedul_2001/Project/Stationary-And-Computer-House-Management-System/WhatsApp%20Image%202026-11-18%20at%202.14.54%20PM.jpeg) (used in Goods/Contact showcase)
  - `client/public/images/store-front.jpeg` ← [WhatsApp Image 2026-11-19 at 2.01.10 PM.jpeg](file:///home/rashedul_2001/Project/Stationary-And-Computer-House-Management-System/WhatsApp%20Image%202026-11-19%20at%202.01.10%20PM.jpeg)

---

## 2. Database Design (`laksam_db`)

All dynamic content supports **bilingual fields** (`{ en: String, bn: String }`) so toggling English/Bengali translates both UI chrome and database content. All timestamps are stored as Dates and queried/formatted in **`Asia/Dhaka` (`+06:00`)** with **`BDT` (`৳`)** currency formatting.

1. **User (Better Auth collection `user`)**
   - `name`, `email`, `image` (Cloudinary URL + `imagePublicId`), `role` (`'admin' | 'assistant'`), `emailVerified`, `createdAt`, `updatedAt`.
   - Public registration disabled; accounts are seeded from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, `ASSISTANT_EMAIL` / `ASSISTANT_PASSWORD`) and managed by Admin in **User Management**.
2. **SiteSettings (singleton)**
   - `storeName: { en, bn }`, `proprietor: { en, bn }`, `heroTitle: { en, bn }`, `heroSubtitle: { en, bn }`, `heroImageUrl`, `heroImagePublicId`
   - `address: { en, bn }`, `coordinates: { lat, lng }` (defaults to Laksam, Cumilla `23.2400, 91.1214` and geocoded on address update via Open-Meteo Geocoding)
   - `phones: [String]`, `whatsappNumber`, `email`, `facebookUrl`, `openingHours: { en, bn }`, `githubUrl` (`https://github.com/Rashedul2001`)
   - `pageHeaders`: `{ home, products, services, courses }` each with `{ title: { en, bn }, subtitle: { en, bn } }`
   - `productCategories`: `[{ _id, slug, name: { en, bn } }]`
   - `expenseCategories`: `[{ _id, slug, name: { en, bn } }]`
3. **Product**
   - `name: { en, bn }`, `details: { en, bn }`, `categorySlug`, `imageUrl` (direct URL link, optional — falls back to initials avatar), `retailPrice`, `wholesalePrice`, `availableUnits`, `createdBy`, `updatedBy`.
4. **Service**
   - `name: { en, bn }`, `details: { en, bn }`, `cost`, `createdBy`, `updatedBy`.
5. **Course**
   - `title: { en, bn }`, `description: { en, bn }`, `totalFee`, `duration: { en, bn }`, `createdBy`, `updatedBy`.
6. **Student**
   - `name`, `phone`, `email`, `address`, `courseId` (ref `Course`), `courseTitleSnapshot: { en, bn }`, `totalFee`, `totalPaid`, `dueFee`, `enrolledAt`, `createdBy`, `updatedBy`.
7. **Income**
   - `invoiceNumber` (auto-incremented/formatted e.g. `LIKPH-20261126-0001`)
   - `type`: `'product_sale' | 'service_sale' | 'course_fee'`
   - `itemId` (Product / Service / Course ObjectId), `itemTitle: { en, bn }`, `studentId` (if `course_fee`)
   - `customerName`, `details`, `quantity`, `priceType`: `'retail' | 'wholesale' | 'service' | 'course'`
   - `unitPrice`, `calculatedTotal` (`unitPrice * quantity`), `isDiscounted` (Boolean), `discountedPrice` (final overridden amount when edited below/different from `calculatedTotal`), `finalAmount` (actual BDT recorded)
   - `enteredBy`: `{ userId, name, email, role }`, `transactionDate`
8. **Expense**
   - `categorySlug`, `title: { en, bn }`, `details`, `amount`, `enteredBy`: `{ userId, name, email, role }`, `transactionDate`.
9. **ActivityLog**
   - Records every create/update/delete/transaction action with `{ action, entityType, entityId, dataSnapshot, performedBy: { userId, name, email, role }, createdAt }`.

---

## 3. Authentication, Security & RBAC
- **Better Auth (`server/src/config/auth.js`)**:
  - Uses native MongoDB client from Mongoose connection (`laksam_db`), `disableSignUp: true`, `emailAndPassword.enabled: true`, `sendResetPassword` using `nodemailer` with `.env` SMTP placeholders (logging reset URL to server console when SMTP is not yet configured).
- **Role Guards**:
  - **Guest**: Public read access to Landing, Products, Services, Courses, and public Site Settings.
  - **Authenticated (`admin` + `assistant`)**: Can access floating `+` action menu on all public pages (`Enter Product Record`, `Enter Service Record`, `Enter Expense Record`, `Collect Student Fee`, `Print Invoice`). User icon dropdown shows logged-in user info + **LogOut** (`assistant` does **not** see `Owner Panel` and is blocked from `/admin/*`).
  - **Admin only (`verifyAuth` + `verifyAdmin`)**: Sees `Owner Panel` in dropdown, full access to `/admin/*` (Dashboard, Products, Services, Courses, Students, Users, Site Settings) and all `/api/admin/*` endpoints.

---

## 4. Key Business Workflows
1. **Product Sale (`+` → Enter Product Record)**:
   - Searchable scrollable product list (auto-scrolls to searched match), selected item badge, Retail/Wholesale toggle, customer name, details, quantity.
   - Auto-calculates total; **Total Amount** remains editable. If edited, marks `isDiscounted: true` and saves `discountedPrice` alongside `calculatedTotal`.
   - If `quantity > availableUnits` or `availableUnits === 0`, blocks submission, shows a Sonner error toast, and **keeps the modal open** for editing.
   - On success, atomically decrements `Product.availableUnits` (never below 0) and saves `Income` + `ActivityLog`.
2. **Service Record (`+` → Enter Service Record)**:
   - Same searchable/scrollable list & editable Total Amount (with `discountedPrice` tracking), without wholesale/retail toggle.
3. **Expense Record (`+` → Enter Expense Record)**:
   - Category dropdown populated from `SiteSettings.expenseCategories`, details, amount.
4. **Student Enrollment & Fee Collection**:
   - Adding a student in **Student Management** accepts `initialPayment`; automatically computes `dueFee = max(0, course.totalFee - initialPayment)` and creates a `course_fee` `Income` record if `initialPayment > 0`.
   - `+` → **Collect Student Fee**: Search/scroll student, view course & remaining `dueFee`, enter payment (validated `> 0` and `<= dueFee`), updates `Student.totalPaid` & `Student.dueFee`, and creates a `course_fee` `Income` record.
5. **Multi-Transaction 80mm Thermal POS Invoice (`+` → Print Invoice)**:
   - Displays recent Income transactions sorted newest-first with **search + multi-select checkboxes** so the user can pick **one or multiple transactions** to bundle onto a single receipt.
   - Live 80mm thermal POS preview (`width: 80mm`, logo, store name, proprietor, address, phones, receipt #, `Asia/Dhaka` date/time, customer info, itemized rows showing qty, unit/wholesale price, original vs. **Discounted Price** if applicable, grand total in BDT, served-by user, and thank-you footer).
   - Printed cleanly via `react-to-print` with `@media print` `@page { size: 80mm auto; margin: 2mm; }` and `#000000` ink on transparent background.
6. **Admin Dashboard**:
   - **Greeting Card (left)**: Current user greeting, live `Asia/Dhaka` clock & date, live **Open-Meteo** weather (no API key) using Site Settings address/coordinates.
   - **Date Filter Pills (right)**: `Today` (default), `This Week`, `This Month`, `Date Range` picker.
   - **KPI Cards**: `Total Income`, `Total Expense`, `Net Balance` (computed for selected filter).
   - **Side-by-Side Income & Expense Graphs** (shadcn/ui Charts + Recharts, BDT Y-axis):
     - `Today` / `This Week`: **Dynamic rolling 7 days** (today + previous 6 days in `Asia/Dhaka`).
     - `This Month`: **4 weeks** of the selected/current month.
     - `Date Range`: **6 most recent months**.
   - **2 Log Tabs**: `Income Log` and `Expense Log` with backend pagination (**30 rows/page**) filtered by active date range, showing `---` for non-applicable fields and displaying `enteredBy` and `discountedPrice` badge where applicable.

---

## 5. Step-by-Step Build Procedure
1. **Phase 1 — Workspace & Environment Setup**: Initialize `server/` and `client/`, configure `.env` & `.env.example` (MongoDB `laksam_db`, Better Auth secret, seeded Admin/Assistant credentials, Cloudinary & SMTP placeholders), copy static brand assets, and set up `TODO.md`.
2. **Phase 2 — Backend Core, Auth & Models**: Connect Mongoose to `laksam_db`, configure Better Auth (`disableSignUp: true`, Nodemailer password reset hook, roles), define all Mongoose schemas, validation middlewares, auth/admin guards, and `MockDataSeeds/` idempotent seeder (auto-runs if DB is empty).
3. **Phase 3 — Backend REST APIs & Cloudinary/Weather Services**: Implement public endpoints (`/api/public/*`), POS transaction endpoints (`/api/transactions/*` for authenticated users), Admin CRUD & Dashboard analytics/pagination endpoints (`/api/admin/*`), Cloudinary image upload service, and Open-Meteo weather proxy/helper.
4. **Phase 4 — Frontend Foundation & Design System**: Configure Tailwind CSS, shadcn/ui components (`jsx`), Navy & Ice Blue Light/Dark theme CSS variables in `client/src/index.css` (plus `@media print` thermal styles), `ThemeContext`, `AuthContext` (Better Auth client), `react-i18next` (`en/common.json` & `bn/common.json`), TanStack Query client, and `Sonner` toaster.
5. **Phase 5 — Public Pages, Navbar, Footer & Floating `+` POS Suite**: Build responsive Navbar (350px–desktop), Login + Forgot Password modal, Landing Page (Hero, Services overview, Goods/Visiting card showcase, Contact & GitHub Footer), Products page (search + category pills + stock/retail/wholesale cards), Services page, Courses page, Floating `+` speed-dial menu, Product/Service/Expense/StudentFee modals, and Multi-Transaction 80mm Thermal POS Invoice modal with `react-to-print`.
6. **Phase 6 — Admin Panel**: Build `AdminLayout` (Sidebar + Topbar with EN/BN, Theme, User dropdown), Dashboard (Greeting/Dhaka Time/Weather, KPI cards, Recharts graphs, 2 paginated 30/page logs), Product Management (+ restock input on edit), Service Management, Course Management, Student Management (with initial payment), User Management (Cloudinary dropzone), and Site Settings (Cloudinary hero upload, bilingual titles/subtitles, contact/hours/Facebook/WhatsApp, dynamic Product & Expense categories CRUD).
7. **Phase 7 — Verification & End-to-End Testing**: Seed `laksam_db`, verify backend API routes & role guards, verify frontend Vite production build, and test responsive UI, bilingual toggle, dark/light themes, stock validation/discounts, student fee math, thermal invoice preview, and role permissions in the browser.
