# Fullstack Core Tech Stack & Development Rules
(Standard Reusable Reference & Workspace System Rules)

---

## 1. Project Overview & Core Non-Negotiable Engineering Pillars

### 1.1 Architecture & Hosting Target
- **Primary Hosting Environment:** CloudLinux OS + LiteSpeed Web Server + cPanel (`Setup Node.js App` via Phusion Passenger / LiteSpeed).
- **Resource Constraints:** Shared Hosting Environment (10 GB NVMe SSD, CloudLinux LVE memory limit ~1–2 GB RAM, cPanel MySQL).
- **Future VPS Migration Ready:** Zero-lock-in modular architecture. When scaling to a VPS, code remains untouched; only infrastructure adapters (Docker, local Redis, Nginx) are switched via environment variables.
- **Strict Typing & Single Source of Truth:** Shared Zod schemas and TypeScript types between Frontend and Backend in a modular workspace.

---

### 1.2 Mandatory Core Directives (বাধ্যতামূলক মূল নীতিসমূহ)

1. **পূর্বের সিস্টেম ও ডেটাবেজের সাথে সামঞ্জস্যতা (System & Database Consistency First):**
   - যেকোনো নতুন ফিচার বা কোড লেখার আগে বিদ্যমান আর্কিটেকচার, স্কিমা, রিলেশন এবং কনভেনশন পুঙ্খানুপুঙ্খভাবে পর্যালোচনা করতে হবে।
   - পূর্বের সিস্টেম বাইপাস করে কোনো বিচ্ছিন্ন/অসঙ্গতিপূর্ণ টেবিল, ফিল্ড বা অ্যাড-হক লজিক তৈরি করা যাবে না।
   - প্রজেক্টের নির্ধারিত মডিউলার বাউন্ডারি ও প্যাটার্ন শতভাগ অনুসরণ করতে হবে।

2. **অ্যাডাপ্টিভ ডিভাইস-ভিত্তিক ভিউ — মোবাইল অ্যাপ বনাম ডেস্কটপ ওয়েবসাইট (Adaptive Device Experience):**
   - **ছোট স্ক্রিন / মোবাইল (Mobile App-like Experience):**
     - লুক ও ফিলে খাঁটি মোবাইল অ্যাপের অনুভূতি: স্ক্রিনের নিচে ফিক্সড বটম নেভিগেশন বার (Bottom Navigation Bar — Home, Donate, Activities, Profile ইত্যাদি)।
     - মোবাইল অ্যাপ হেডার (User Avatar, Notification Bell, Back / Menu Drawer)।
     - সেন্ট্রাল ডায়ালগের বদলে বটম শিট মডাল (Bottom Sheet / Drawer)।
     - থাম্ব-ফ্রেন্ডলি টাচ টার্গেট (কমপক্ষে ৪৪px-৪৮px) এবং Safe Area Inset (`env(safe-area-inset-bottom)`) সমর্থন।
   - **মাঝারি ও বড় স্ক্রিন / ট্যাবলেট ও ডেস্কটপ (Modern Website Experience):**
     - ক্লাসিক প্রিমিয়াম ওয়েবসাইট লেআউট: স্টিকি টপ নেভিগেশন বার, ড্রপডাউন মেনু, অ্যাকশন বাটন।
     - মাল্টি-কলাম গ্রিড লেআউট (২, ৩ বা ৪ কলাম), এক্সপ্যান্ডেড সাইডবার ও ডেটা টেবিল।
     - স্ট্যান্ডার্ড সেন্ট্রালাইজড ডায়ালগ/মডাল এবং রিচ হোভার ইন্টারঅ্যাকশন।
   - **পারফরম্যান্স সতর্কতা:** শুধুমাত্র CSS `display: none` দিয়ে ডেস্কটপ DOM মোবাইলে লুকিয়ে মেমোরি নষ্ট করা যাবে না; রেসপন্সিভ কন্ডিশনাল রেন্ডারিং ব্যবহার করতে হবে যাতে মোবাইলে লাইটওয়েট এক্সপেরিয়েন্স নিশ্চিত হয়।

3. **সর্বোচ্চ পারফরম্যান্স অপ্টিমাইজেশন (High-Performance Engineering):**
   - ডেটাবেজ লেভেলে: B-Tree/Composite/FULLTEXT ইনডেক্সিং, কার্সার পেজিনেশন, `SELECT *` পরিহার, N+1 কোয়েরি প্রতিরোধ।
   - ব্যাকএন্ড লেভেলে: Fastify/Express লাইটওয়েট অ্যাডাপ্টার, মেমোরি-দক্ষ ক্যাশিং, এবং অ্যাসিনক্রোনাস ব্যাকগ্রাউন্ড প্রসেসিং।
   - ফ্রন্টএন্ড লেভেলে: RSC (React Server Components), Streaming with Suspense, TanStack Virtual, Next.js Standalone Build, WebP/AVIF ইমেজ অপ্টিমাইজেশন।

4. **নিশ্ছিদ্র সিকিউরিটি ও হ্যাকার আক্রমণ প্রতিরোধ (Bulletproof Security & Threat Defense):**
   - OWASP Top 10 আক্রমণ (SQL Injection, XSS, CSRF, SSRF, RCE) থেকে কঠোর সুরক্ষা।
   - অথেনটিকেশন: Firebase Authentication (Email/Password ও Google Login), পাসওয়ার্ড গুগলের সিকিউর ইনফ্রাস্ট্রাকচারে সংরক্ষিত, লোকাল ডিবিতে কোনো র পাসওয়ার্ড স্টোর হবে না।
   - ব্যাকএন্ড ভেরিফিকেশন: Firebase Admin SDK দিয়ে ভেরিফাইড টোকেন ও `httpOnly`, `secure`, `sameSite: 'strict'` সেশন কুকি।
   - Drizzle ORM-এর Parameterized Query ব্যবহার — কোনো র (raw) আনস্যানিটাইজড SQL নয়।
   - রেট লিমিটিং (`@nestjs/throttler`), Helmet সিকিউরিটি হেডার, Imunify360 ও LiteSpeed WAF সামঞ্জস্যপূর্ণ ক্লিন কোড।
   - বোট প্রটেকশন: Cloudflare Turnstile; পারমিশন কন্ট্রোল: CASL।

5. **শেয়ার্ড হোস্টিং ফ্রেন্ডলি লাইটওয়েট ও রিসোর্স সাশ্রয়ী আর্কিটেকচার (CloudLinux LVE Optimized):**
   - মেমোরি ও সিপিইউ খরচ সর্বনিম্ন রাখার ডিজাইন (CloudLinux LVE RAM কোটা সাধারণত ১-২ জিবি, তাই প্রসেস মেমোরি ১৫০ এমবির নিচে রাখা বাধ্যতামূলক)।
   - ফ্রন্টএন্ড বান্ডেল সাইজ অপ্টিমাইজেশন, Next.js `output: 'standalone'` বিল্ড (যাতে ১০ জিবি এসএসডি নষ্ট না হয়)।
   - ডকার সম্পূর্ণ পরিহার (শেয়ার্ড হোস্টিংয়ে কোনো ডকার ডেমন নেই; নেটিভ Node.js রানটাইম ব্যবহার করা হবে)।
   - ব্যাকএন্ডে অপ্টিমাইজড `mysql2` কানেকশন পুলিং।
   - ব্যবহারকারীর আপলোড করা ফাইল/মিডিয়া ১০ জিবি ডিস্কে না রেখে ক্লাউড অবজেক্ট স্টোরেজে (Cloudflare R2) সংরক্ষণ করা।

6. **সম্পূর্ণ দ্বিভাষিক সমর্থন (100% Strict Bilingual Support: Bengali & English):**
   - পুরো অ্যাপ্লিকেশনে বাংলা (`bn`) ও ইংরেজি (`en`) উভয়ের পূর্ণ সমর্থন থাকতে হবে।
   - কোনো UI কম্পোনেন্ট, ফর্ম লেবেল, বাটন বা প্লেসহোল্ডারে কোনো হার্ডকোডেড টেক্সট থাকবে না — সবই `next-intl` ডিকশনারির মাধ্যমে লোড হবে।
   - ব্যাকএন্ড এরর মেসেজ ও ভ্যালিডেশন নোটিফিকেশনেও সঠিক লোকালাইজড মেসেজ সাপোর্ট বজায় রাখতে হবে।

---

## 2. Tech Stack Definition

### A. Frontend Core Tech Stack
- **Framework & Language:** Next.js (App Router) + TypeScript (Strict Mode)
- **Deployment Build:** Next.js Standalone Mode (`output: 'standalone'` — ক্ষুদ্র ফুটপ্রিন্ট, সার্ভারে ভারী `node_modules` লাগে না)
- **Architecture:** React Server Components (RSC) + Client Components + Streaming with Suspense
- **Device-Adaptive UI Architecture:**
  - *Mobile (< 768px):* Bottom Navigation Bar + App Bar Header + Drawer / Bottom Sheets + Touch-optimized List Views
  - *Tablet & Desktop (>= 768px):* Top Navigation Bar + Mega/Dropdown Menus + Multi-column Grids + Desktop Dialogs
- **Authentication & Auth UI:** Firebase Client SDK (`firebase/auth`) — Email/Password Login & Google OAuth Login
- **Push Notifications:** Firebase Cloud Messaging (`firebase/messaging` Web Push via Service Worker)
- **Client-side State Management:** Zustand (অতি লাইটওয়েট ও পারফরম্যান্ট)
- **Server State & Data Fetching:** TanStack Query (React Query)
- **Form Management:** React Hook Form
- **Form & Schema Validation:** Zod
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** CSS Modules + CSS Variables (Avoid TailwindCSS unless explicitly instructed)
- **Design System:** CSS Variables (Design Tokens)
- **Component Variants & Composition:** Class Variance Authority (CVA)
- **Large List / Dropdown Performance:** TanStack Virtual
- **Animations & Transitions:** Motion (Framer Motion)
- **Internationalization (i18n):** next-intl (বাংলা ও ইংরেজি উভয় ভাষার পূর্ণ ইন্টিগ্রেশন)
- **PDF Generation:** @react-pdf/renderer
- **Image Optimization:** `next/image` (WebP/AVIF, Lazy Loading, priority property for above-the-fold)
- **Error Tracking & Logging:** Sentry (with production source maps)
- **Error Handling:** React Error Boundary (per page/module) + Next.js `error.tsx`
- **API & HTTP Client:** Native Fetch API
- **Code Quality & Linting:** ESLint + Prettier
- **Unit & Component Testing:** Vitest + React Testing Library
- **E2E Testing:** Playwright
- **Git Hooks:** Husky + lint-staged
- **Security:** Security Headers + CSP (Content Security Policy)
- **Bot Protection:** Cloudflare Turnstile
- **Package Manager:** pnpm

### B. Backend Core Tech Stack
- **Framework & Language:** NestJS (Fastify/Express Adapter — cPanel Node.js Selector / Phusion Passenger ফ্রেন্ডলি) + TypeScript
- **Architecture:** Modular Architecture (প্রতিটি ফিচার আলাদা মডিউল — controller, service, DTO, repository আলাদা আলাদা)
- **Database:** MySQL (InnoDB Engine, utf8mb4 charset & collation, cPanel MySQL)
- **ORM / Database Access:** Drizzle ORM (`drizzle-orm/mysql2` — জিরো-ওভারহেড, টাইপ-সেফ ও এক্সট্রিমলি ফাস্ট)
- **Authentication & User Management:** Firebase Admin SDK (`firebase-admin/auth`) — ID Token / Session Cookie Verification, MySQL `users` টেবিলের সাথে সিঙ্ক
- **Push Notifications (Server):** Firebase Admin SDK (`firebase-admin/messaging` — FCM Push Notifications)
- **Authorization & RBAC:** CASL (Role & Permission Based Access Control)
- **Cache & Queue Layer (Modular Dual-Mode):**
  - *Shared Hosting (বর্তমান):* In-Memory Cache (অথবা Serverless Upstash Redis HTTP REST) + MySQL/DB-based lightweight queue অথবা cPanel Cron Job
  - *VPS (ভবিষ্যত):* Local Redis + BullMQ (একই ইন্টারফেসের মাধ্যমে শুধু `.env` পরিবর্তনে সক্ষম)
- **Validation & Transformation:** Zod (`nestjs-zod` এর মাধ্যমে DTO হিসেবে ব্যবহার, ফ্রন্টএন্ডের সাথে schema শেয়ারড)
- **API Documentation:** NestJS Swagger (`@nestjs/swagger`)
- **Logging:** Pino (`nestjs-pino`) — হাই-থ্রুপুট স্ট্রাকচার্ড JSON লগার
- **Error Tracking:** Sentry
- **Security Middleware:** Helmet, `@nestjs/throttler` (Rate Limiting), HPP (HTTP Parameter Pollution Protection)
- **Health Check:** `@nestjs/terminus` (Liveness & Readiness probes)
- **Testing:** Jest (Unit/Integration) + Supertest (E2E)
- **Package Manager:** pnpm

### C. Infrastructure & Hosting Environment (Shared Hosting Focus)
- **Hosting OS:** CloudLinux OS (LVE Manager CPU/RAM limits)
- **Web Server:** LiteSpeed Web Server
- **Control Panel:** cPanel (`Setup Node.js App` via Phusion Passenger / LiteSpeed)
- **No Docker Requirement:** ডকার ডেমনের প্রয়োজন নেই; সরাসরি cPanel Node.js এনভায়রনমেন্টে প্রোডাকশন বিল্ড চলবে।
- **Web Server Configuration:** `.htaccess` (LiteSpeed রিভার্স প্রক্সি, গ্লিপ/ব্রটলি কম্প্রেশন, SSL এনফোর্সমেন্ট, সিকিউরিটি হেডার)
- **Local Development:** সরাসরি লোকাল মেশিনে `pnpm dev` ও লোকাল MySQL
- **Monorepo:** Turborepo / pnpm workspaces — Zod schema ও TypeScript types shared package আকারে FE ও BE দুই জায়গায় ব্যবহারের জন্য
- **File / Object Storage:** Cloudflare R2 (১০ জিবি এসএসডি ডিস্ক স্পেস সুরক্ষিত রাখতে ডাটাবেজে বা লোকাল ড্রাইভে ফাইল না রেখে R2 ফ্রি টিয়ার ব্যবহার করা)
- **Uptime & Monitoring:** Uptime Kuma + Sentry
- **Future VPS Migration Template:** Dockerfile ও Docker Compose ফাইল প্রজেক্টে সংরক্ষিত থাকবে শুধুমাত্র ভবিষ্যৎ VPS মাইগ্রেশনের জন্য।

---

## 3. Database Optimization Rules (MySQL + Drizzle ORM)

### D.1 Connection & Pooling (cPanel MySQL)
1. **App-level Pool Sizing:** শেয়ার্ড হোস্টিংয়ের কানেকশন লিমিট (সাধারণত ২০-৩০ টি) মাথায় রেখে Drizzle `mysql2` pool সাইজ কনফিগার করতে হবে (যেমন `connectionLimit: 10`)।
2. **Idle Connection Cleanup:** `wait_timeout` ও অ্যাপ-লেভেলে idle timeout ছোট রাখতে হবে যাতে ঝুলে থাকা কানেকশন স্লট ব্লক না করে।
3. **No Connection Leaks:** প্রতিটি ট্রানজেকশন ও কোয়েরি সম্পন্নের সাথে সাথে কানেকশন যাতে পুলে ফেরত যায় তা নিশ্চিত করতে হবে।

### D.2 Indexing Strategy
1. **B-Tree Indexing:** ফিল্টারিং, সর্টিং, এবং Foreign Key ফিল্ডে B-Tree ইনডেক্স বাধ্যতামূলক (InnoDB ডিফল্ট)। `firebase_uid` কলামে ইউনিক B-Tree ইনডেক্স থাকতে হবে।
2. **Composite Index:** একাধিক কলাম দিয়ে ফিল্টার/সর্ট হলে (যেমন `WHERE status = ? ORDER BY created_at`) composite index তৈরি করতে হবে (Leftmost Prefix Rule মেনে)।
3. **Full-text Search Index:** টেক্সট সার্চের ফিল্ডে MySQL `FULLTEXT` ইনডেক্স (`MATCH ... AGAINST`) ব্যবহার করতে হবে।
4. **Prefix Indexing:** দীর্ঘ VARCHAR বা TEXT ফিল্ডে ইনডেক্স করার প্রয়োজন হলে prefix length নির্দিষ্ট করে ইনডেক্স সাইজ অপ্টিমাইজ করতে হবে।
5. **Unused / Duplicate Index Audit:** ডুপ্লিকেট ইনডেক্স পরিহার করতে হবে যা অপ্রয়োজনীয় ডিস্ক স্পেস ও রাইট ওভারহেড তৈরি করে।

### D.3 Query Optimization
1. **Cursor-based Pagination:** অফসেট-ভিত্তিক পেজিনেশনের (`LIMIT offset, count`) বদলে আইডি/টাইমস্ট্যাম্প-ভিত্তিক কার্সার পেজিনেশন ব্যবহার করতে হবে।
2. **N+1 Query Prevention:** Drizzle-র relational query (`with` / `join`) ব্যবহার করে নেস্টেড লুপ কোয়েরি এড়াতে হবে।
3. **Select Only Required Columns:** `SELECT *` পরিহার করে শুধু প্রয়োজনীয় কলাম টানতে হবে — সীমিত সার্ভার মেমোরি ও নেটওয়ার্ক পে-লোড সুরক্ষিত থাকবে।
4. **EXPLAIN Practice:** জটিল কোয়েরি চালানোর আগে `EXPLAIN` দিয়ে Index Scan যাচাই করতে হবে।
5. **Batch Writes:** একাধিক row একসাথে ইনসার্ট/আপডেট করতে bulk insert বা `ON DUPLICATE KEY UPDATE` ব্যবহার করতে হবে।
6. **Avoid Heavy Computation in DB:** জটিল বিজনেস লজিক ডেটাবেজে না রেখে অ্যাপ লেয়ারে রাখতে হবে।

### D.4 Caching (Shared Hosting Strategy)
1. **In-Memory / Serverless Cache:** সার্ভারলেস Upstash Redis (HTTP REST API) অথবা অ্যাপ-লেভেল LRU In-Memory Cache ব্যবহার করতে হবে, যা শেয়ার্ড হোস্টিংয়ের লোকাল মেমোরি নষ্ট করে না।
2. **TTL Discipline:** প্রতিটি ক্যাশ কী-তে যৌক্তিক TTL (Time-to-Live) বাধ্যতামূলক।
3. **Namespaced Keys:** `user:{id}:profile` এর মতো স্ট্রাকচার্ড কী ব্যবহার করতে হবে।
4. **VPS Ready:** ক্যাশ সার্ভিস এমন ইন্টারফেসে থাকবে যাতে পরবর্তীতে VPS-এ লোকাল Redis-এ এক ক্লিকে সুইচ করা যায়।

### D.5 Background Jobs (Shared Hosting Strategy)
1. **Lightweight Job Offloading:** শেয়ার্ড হোস্টিংয়ে ভারী প্রসেস দীর্ঘক্ষণ চললে CloudLinux তা কিল করে দেয়। তাই ইমেইল, FCM নোটিফিকেশন বা ব্যাকগ্রাউন্ড টাস্কের জন্য MySQL-based queue অথবা cPanel Cron Job ব্যবহার করা হবে।
2. **Idempotency:** জব হ্যান্ডলার idempotent রাখতে হবে যাতে ডুপ্লিকেট নোটিফিকেশন বা এক্সিকিউশন রোধ হয়।
3. **Retry & Backoff:** ব্যর্থ জবের জন্য ব্যাকঅফ রিট্রাই লজিক থাকতে হবে।
4. **VPS Ready:** ইন্টারফেসটি BullMQ কমপ্যাটিবল থাকবে যাতে VPS-এ গেলে সহজেই লোকাল BullMQ সক্রিয় করা যায়।

### D.6 Data Integrity & Migration
1. **Transactional Integrity:** একাধিক ধাপের রাইট অপারেশনে ডেটাবেজ ইন্টিগ্রিটি বজায় রাখতে Drizzle-র transaction ব্লক ব্যবহার করতে হবে (`db.transaction(...)`)।
2. **Schema Migrations:** প্রতিটি স্কিমা পরিবর্তন Drizzle Kit মাইগ্রেশন ফাইল দিয়ে ট্র্যাক করতে হবে।
3. **Soft Delete Pattern:** গুরুত্বপূর্ণ এন্টিটিতে `deleted_at` কলাম দিয়ে soft delete ব্যবহার করতে হবে।
4. **Backup:** cPanel JetBackup Solution ও ম্যানুয়াল mysqldump ব্যাকআপ নিশ্চিত করতে হবে।

---

## 4. Development Rules — Backend (NestJS + Fastify/Express)

1. **cPanel Node.js App Compatibility:** অ্যাপ্লিকেশনের এন্ট্রি পয়েন্ট এমন হতে হবে যাতে Phusion Passenger / LiteSpeed প্রক্সি সহজে পোর্ট/সকেট বাইন্ড করতে পারে।
2. **Strict Memory Budget (< 150 MB):** মেমোরি লিকিং অবজেক্ট বা অপ্রয়োজনীয় বড় লাইব্রেরি পরিহার করতে হবে যাতে CloudLinux LVE লিমিট এক্সিড না করে।
3. **Strict Request Validation:** প্রতিটি এন্ডপয়েন্টে schema-ভিত্তিক ভ্যালিডেশন (`nestjs-zod`) করতে হবে — অপরিচিত ফিল্ড স্ট্রিপ ও রিজেক্ট করতে হবে।
4. **Rate Limiting:** `@nestjs/throttler` দিয়ে প্রতি IP ও অ্যাকাউন্টে রিকোয়েস্ট লিমিট রাখতে হবে।
5. **Authentication Handling (Firebase Admin):**
   - ক্লায়েন্ট থেকে আসা Firebase ID Token বা Session Cookie ব্যাকএন্ডের `FirebaseAuthGuard`-এ `firebase-admin.auth().verifyIdToken()` দিয়ে ভেরিফাই করতে হবে।
   - ভেরিফাইড ইউজার প্রথমবারের মতো লগইন করলে MySQL `users` টেবিলে প্রোফাইল সিঙ্ক (Upsert) হবে।
6. **Token Strategy:** Session cookie তৈরি করা হলে তা অবশ্যই `httpOnly`, `secure`, `sameSite: 'strict'` কুকিতে পাঠাতে হবে।
7. **SQL Injection & XSS Protection:** Drizzle ORM Parameterized Query বাধ্যতামূলক; Fastify/Express Helmet দিয়ে সিকিউরিটি হেডার নিশ্চিত করতে হবে।
8. **Imunify360 Harmony:** সার্ভারে কোনো অপ্রত্যাশিত ইভাল বা ডায়নামিক স্ক্রিপ্ট জেনারেশন করা যাবে না যাতে Imunify360 WAF ফলস পজিটিভ ফ্ল্যাগ না তোলে।
9. **Global Error Handling:** গ্লোবাল `HttpExceptionFilter` দিয়ে ইন্টারনাল ফাইলপাথ বা ডিবি এরর ইউজারের কাছে লুকানো বাধ্যতামূলক।
10. **Secure Logging:** Pino দিয়ে লাইটওয়েট স্ট্রাকচার্ড JSON লগ; সংবেদনশীল ডেটা কখনো লগে যাবে না।
11. **Environment Validation:** অ্যাপ স্টার্টআপেই env variables Zod schema দিয়ে ভ্যালিডেট হবে।

---

## 5. Development Rules — Frontend (Next.js App Router)

1. **Device-Adaptive UI Architecture (মোবাইল অ্যাপ বনাম ডেস্কটপ ওয়েবসাইট):**
   - **Mobile Layout (< 768px):** 
     - ফিক্সড বটম নেভিগেশন বার (Bottom Navigation Bar) থাকবে, যা থাম্ব দিয়ে সহজে অ্যাক্সেসযোগ্য।
     - হেডার হবে ক্লিন মোবাইল অ্যাপ বার (App Bar), যাতে নোটিফিকেশন আইকন, অবতার এবং ড্রয়ার/ব্যাক বাটন থাকবে।
     - মোবাইল ভিউতে ভারী সেন্ট্রালাইজড পপআপের বদলে বটম শিট (Bottom Sheet / Drawer) ব্যবহার করতে হবে।
     - Safe Area Inset (`padding-bottom: env(safe-area-inset-bottom)`) বজায় রাখতে হবে।
   - **Desktop Layout (>= 768px):** 
     - ফুল-ফিচার্ড টপ হেডার ও নেভিগেশন মেনু (Top Navbar), ব্র্যান্ডিং লোগো এবং অ্যাকশন বাটন।
     - মাল্টি-কলাম রেসপন্সিভ গ্রিড (Desktop Cards, Data Tables, Sidebars)।
     - স্ট্যান্ডার্ড সেন্ট্রালাইজড ডায়ালগ/মডাল এবং প্রফেশনাল হোভার এফেক্ট।
   - **Clean Rendering:** শুধুমাত্র CSS `display: none` দিয়ে ডেস্কটপের ভারী উপাদান মোবাইলে হাইড না করে প্রয়োজন অনুযায়ী অ্যাডাপ্টিভ কন্ডিশনাল রেন্ডারিং ব্যবহার করতে হবে।
2. **Next.js Standalone Build (`output: 'standalone'`):** প্রোডাকশন বিল্ডে standalone মোড বাধ্যতামূলক, যাতে শেয়ার্ড হোস্টিংয়ে বিশাল `node_modules` ছাড়াই অতি হালকা ও দ্রুত চলে।
3. **Firebase Auth Integration:**
   - Email/Password এবং Google Sign-In এর জন্য Firebase Modular SDK (`firebase/auth`) ব্যবহার করতে হবে।
   - অথেনটিকেশন স্টেট হ্যান্ডলিংয়ের জন্য রিঅ্যাক্টিভ হুক ও Zustand Auth Store ব্যবহার করতে হবে।
4. **Push Notifications (FCM):**
   - `firebase/messaging` এর মাধ্যমে ব্রাউজার নোটিফিকেশন পারমিশন রিকোয়েস্ট ও FCM টোকেন সংগ্রহ করে ব্যাকএন্ডে সংরক্ষণ করতে হবে।
   - ব্যাকগ্রাউন্ড মেসেজিংয়ের জন্য `firebase-messaging-sw.js` সার্ভিস ওয়ার্কার কনফিগার করতে হবে।
5. **Static & Dynamic Balance:** স্ট্যাটিক পেইজে SSG/ISR ব্যবহার করে সার্ভার সিপিইউ ও র‍্যামের ওপর লোড সর্বনিম্ন রাখতে হবে।
6. **RSC & Streaming:** ড্যাশবোর্ড ও ডেটা পেইজে React Server Components + Streaming Suspense ব্যবহার করতে হবে।
7. **Image Optimization:** `next/image` ব্যবহার করে WebP/AVIF ফরম্যাট ও Lazy Loading নিশ্চিত করতে হবে।
8. **Query Caching:** TanStack Query-র `staleTime` ও `gcTime` সঠিকভাবে কনফিগার করতে হবে।
9. **Pagination & Virtualization:** বড় তালিকায় কার্সার পেজিনেশন ও TanStack Virtual ব্যবহার বাধ্যতামূলক।
10. **Strict i18n Discipline (বাংলা ও ইংরেজি):** পুরো অ্যাপ্লিকেশনের প্রতিটি টেক্সট `next-intl` ডিকশনারি কী থেকে লোড হবে। হার্ডকোডেড বাংলা বা ইংরেজি স্ট্রিং কোডে সরাসরি লেখা সম্পূর্ণ নিষিদ্ধ।
11. **Fault Isolation:** প্রতিটি পেইজ ও মডিউলকে React Error Boundary দিয়ে প্রটেক্ট করতে হবে।
12. **Shared Validation:** ফ্রন্টএন্ড ফর্ম ভ্যালিডেশনে ব্যাকএন্ডের সাথে শেয়ারড Zod schema ব্যবহার করতে হবে।

---

## 6. Shared & Cross-cutting Rules

1. **Single Source of Truth:** Zod schema ও TypeScript types একবার লিখে (`packages/schema`) FE ও BE দুই জায়গায় ব্যবহার করতে হবে।
2. **Static Asset Offloading:** LiteSpeed ক্যাশিং ও Cloudflare CDN সক্রিয় রেখে স্ট্যাটিক ফাইলের চাপ সার্ভার থেকে সরাতে হবে।
3. **Disk Space Discipline (10 GB NVMe Guard):** সার্ভার ড্রাইভে কখনো ইউজার ফাইল বা লগ জমিয়ে রাখা যাবে না; ফাইল Cloudflare R2-এ স্টোর করতে হবে।
4. **Zero Secrets in Git:** `.env` ফাইল কখনো কমিট হবে না; ফায়ারবেজ ও অন্যান্য ক্রেডেনশিয়াল `.env.example` ফাইলে প্লেসহোল্ডার হিসেবে থাকবে।
5. **Future VPS Readiness:** কোডবেস এমন ক্লিন ও মডুলার রাখতে হবে যাতে পরবর্তীতে এক কমান্ডে ডকারাইজ করে VPS-এ ডেডিকেটেড Nginx ও Redis সহ শিফট করা যায়।
