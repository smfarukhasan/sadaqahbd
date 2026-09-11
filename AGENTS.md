# Fullstack Core Tech Stack & Development Rules
(Standard Reusable Reference & Workspace System Rules)

---

## 1. Project Overview & Core Non-Negotiable Engineering Pillars

### 1.1 Architecture & Core Principles
- **Architecture:** Scalable Fullstack Monorepo / Modular System (Turborepo).
- **Strict Typing & Single Source of Truth:** Shared Zod schemas and TypeScript types between Frontend and Backend.

---

### 1.2 Five Mandatory Core Directives (বাধ্যতামূলক ৫টি মূল নীতি)

1. **পূর্বের সিস্টেম ও ডেটাবেজের সাথে সামঞ্জস্যতা (System & Database Consistency First):**
   - যেকোনো নতুন ফিচার বা কোড লেখার আগে বিদ্যমান আর্কিটেকচার, স্কিমা, রিলেশন এবং কনভেনশন পুঙ্খানুপুঙ্খভাবে পর্যালোচনা করতে হবে।
   - পূর্বের সিস্টেম বাইপাস করে কোনো বিচ্ছিন্ন/অসঙ্গতিপূর্ণ টেবিল, ফিল্ড বা অ্যাড-হক লজিক তৈরি করা যাবে না।
   - প্রজেক্টের নির্ধারিত মডিউলার বাউন্ডারি ও প্যাটার্ন শতভাগ অনুসরণ করতে হবে।

2. **সর্বোচ্চ পারফরম্যান্স অপ্টিমাইজেশন (High-Performance Engineering):**
   - ডেটাবেজ লেভেলে: B-Tree/Composite/GIN ইনডেক্সিং, কার্সার পেজিনেশন, `SELECT *` পরিহার, N+1 কোয়েরি প্রতিরোধ।
   - ব্যাকএন্ড লেভেলে: Fastify অ্যাডাপ্টার, মাল্টি-লেয়ার Redis ক্যাশিং, BullMQ ব্যাকগ্রাউন্ড প্রসেসিং।
   - ফ্রন্টএন্ড লেভেলে: RSC (React Server Components), Streaming with Suspense, TanStack Virtual, WebP/AVIF ইমেজ অপ্টিমাইজেশন।

3. **নিশ্ছিদ্র সিকিউরিটি ও হ্যাকার আক্রমণ প্রতিরোধ (Bulletproof Security & Threat Defense):**
   - OWASP Top 10 আক্রমণ (SQL Injection, XSS, CSRF, SSRF, RCE) থেকে কঠোর সুরক্ষা।
   - Drizzle ORM-এর Parameterized Query ব্যবহার — কোনো র (raw) আনস্যানিটাইজড SQL নয়।
   - রেট লিমিটিং (`@nestjs/throttler` + Redis), Argon2 পাসওয়ার্ড হ্যাশিং, Helmet সিকিউরিটি হেডার।
   - টোকেন স্টোরেজ: শুধুমাত্র `httpOnly`, `secure`, `sameSite: 'strict'` কুকিতে (LocalStorage সম্পূর্ণ নিষিদ্ধ)।
   - বোট প্রটেকশন: Cloudflare Turnstile; পারমিশন কন্ট্রোল: CASL।

4. **লাইটওয়েট ও রিসোর্স সাশ্রয়ী আর্কিটেকচার (Lightweight Footprint & Resource Efficiency):**
   - মেমোরি ও সিপিইউ খরচ সর্বনিম্ন রাখার ডিজাইন।
   - ফ্রন্টএন্ড বান্ডেল সাইজ অপ্টিমাইজেশন, অপ্রয়োজনীয় ভারী লাইব্রেরি পরিহার, Tree-shaking।
   - ব্যাকএন্ডে অপ্টিমাইজড কানেকশন পুলিং (PgBouncer) ও লাইটওয়েট Alpine ডকার ইমেজ।

5. **সম্পূর্ণ দ্বিভাষিক সমর্থন (100% Strict Bilingual Support: Bengali & English):**
   - পুরো অ্যাপ্লিকেশনে বাংলা (`bn`) ও ইংরেজি (`en`) উভয়ের পূর্ণ সমর্থন থাকতে হবে।
   - কোনো UI কম্পোনেন্ট, ফর্ম লেবেল, বাটন বা প্লেসহোল্ডারে কোনো হার্ডকোডেড টেক্সট থাকবে না — সবই `next-intl` ডিকশনারির মাধ্যমে লোড হবে।
   - ব্যাকএন্ড এরর মেসেজ ও ভ্যালিডেশন নোটিফিকেশনেও সঠিক লোকালাইজড মেসেজ সাপোর্ট বজায় রাখতে হবে।

---

## 2. Tech Stack Definition

### A. Frontend Core Tech Stack
- **Framework & Language:** Next.js (App Router) + TypeScript (Strict Mode)
- **Architecture:** React Server Components (RSC) + Client Components + Streaming with Suspense
- **Client-side State Management:** Zustand (লাইটওয়েট ও পারফরম্যান্ট)
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
- **Security:** Next.js Security Headers + CSP (Content Security Policy)
- **Bot Protection:** Cloudflare Turnstile
- **Package Manager:** pnpm

### B. Backend Core Tech Stack
- **Framework & Language:** NestJS (Fastify Adapter — Express-এর তুলনায় দ্বিগুণ দ্রুত ও লাইটওয়েট) + TypeScript
- **Architecture:** Modular Architecture (প্রতিটি ফিচার আলাদা মডিউল — controller, service, DTO, repository আলাদা আলাদা)
- **Database:** PostgreSQL
- **ORM / Database Access:** Drizzle ORM (জিরো-ওভারহেড, টাইপ-সেফ ও এক্সট্রিমলি ফাস্ট)
- **In-Memory Cache & Queue Store:** Redis
- **Background Jobs:** BullMQ
- **Authentication & Authorization:** Passport.js + JWT (HTTP-Only, Secure, SameSite Cookies) + CASL (Role/Permission Based Access Control)
- **Validation & Transformation:** Zod (`nestjs-zod` এর মাধ্যমে DTO হিসেবে ব্যবহার, ফ্রন্টএন্ডের সাথে schema শেয়ারড)
- **API Documentation:** NestJS Swagger (`@nestjs/swagger`)
- **Logging:** Pino (`nestjs-pino`) — হাই-থ্রুপুট স্ট্রাকচার্ড JSON লগার
- **Error Tracking:** Sentry
- **Security Middleware:** Helmet, `@nestjs/throttler` (Rate Limiting), HPP (HTTP Parameter Pollution Protection)
- **Password Hashing:** Argon2
- **Health Check:** `@nestjs/terminus` (Liveness & Readiness probes)
- **Testing:** Jest (Unit/Integration) + Supertest (E2E)
- **Package Manager:** pnpm

### C. Infrastructure & DevOps
- **Containerization:** Docker (Multi-stage build, Alpine base image দিয়ে ছোট ও optimized image)
- **Local Development Orchestration:** Docker Compose (Postgres, Redis, Backend, Frontend একসাথে)
- **Reverse Proxy & Edge Layer:** Nginx (SSL termination, gzip/brotli compression, static caching, load balancing)
- **CI/CD:** GitHub Actions (lint → typecheck → test → build → deploy pipeline)
- **Monorepo:** Turborepo — Zod schema ও TypeScript types shared package আকারে FE ও BE দুই জায়গায় ব্যবহারের জন্য
- **File / Object Storage:** MinIO বা Cloudflare R2 (ডাটাবেজে blob/ফাইল না রেখে)
- **Uptime & Monitoring:** Uptime Kuma + Sentry

---

## 3. Database Optimization Rules (PostgreSQL + Drizzle ORM)

### D.1 Connection & Pooling
1. **Connection Pooling:** PgBouncer (transaction mode) ব্যবহার করতে হবে, বিশেষ করে কন্টেইনার/মাল্টি-ইনস্ট্যান্স এনভায়রনমেন্টে কানেকশন এক্সহশন ঠেকাতে।
2. **Pool Sizing:** অ্যাপ-লেভেল pool size (Drizzle/pg pool) হিসাব করে সেট করতে হবে — CPU কোর সংখ্যা ও DB max_connections অনুযায়ী, অতিরিক্ত বড় pool রিসোর্স নষ্ট করে।
3. **Idle Connection Timeout:** idle ও statement timeout কনফিগার করতে হবে যাতে ঝুলে থাকা কানেকশন/কোয়েরি রিসোর্স আটকে না রাখে।

### D.2 Indexing Strategy
1. **B-Tree Indexing:** ফিল্টারিং, সর্টিং, এবং Foreign Key ফিল্ডে B-Tree ইনডেক্স বাধ্যতামূলক।
2. **Composite Index:** একাধিক কলাম দিয়ে একসাথে ফিল্টার/সর্ট হলে (যেমন WHERE status = ? ORDER BY created_at) composite index তৈরি করতে হবে, কলামের অর্ডার query pattern অনুযায়ী ঠিক করতে হবে।
3. **Full-text Search Index:** টেক্সট সার্চের ফিল্ডে GIN ইনডেক্স (বা pg_trgm দিয়ে fuzzy/partial search) ব্যবহার করতে হবে।
4. **Partial Index:** নির্দিষ্ট subset ডেটার উপর বারবার কোয়েরি হলে (যেমন WHERE deleted_at IS NULL) partial index দিয়ে ইনডেক্স সাইজ ও লেখার overhead কমাতে হবে।
5. **Unused / Duplicate Index Audit:** পিরিয়ডিক্যালি (pg_stat_user_indexes) দেখে অব্যবহৃত বা ডুপ্লিকেট ইনডেক্স রিমুভ করতে হবে।

### D.3 Query Optimization
1. **Cursor-based Pagination:** অফসেট-ভিত্তিক পেজিনেশনের বদলে আইডি/টাইমস্ট্যাম্প-ভিত্তিক কার্সার পেজিনেশন ব্যবহার করতে হবে।
2. **N+1 Query Prevention:** Drizzle-র relational query (`with` / `join`) ব্যবহার করে নেস্টেড লুপ কোয়েরি এড়াতে হবে; দরকার হলে DataLoader প্যাটার্নে batch করতে হবে।
3. **Select Only Required Columns:** `SELECT *` পরিহার করে শুধু প্রয়োজনীয় কলাম টানতে হবে — নেটওয়ার্ক payload ও মেমোরি খরচ কমে।
4. **EXPLAIN ANALYZE Practice:** কোয়েরি স্লো মনে হলে প্রোডাকশনে যাওয়ার আগে `EXPLAIN ANALYZE` দিয়ে execution plan যাচাই করতে হবে (Seq Scan বনাম Index Scan)।
5. **Batch Writes:** একাধিক row একসাথে insert/update করতে হলে bulk insert/upsert ব্যবহার করতে হবে।
6. **Avoid Heavy Computation in DB:** জটিল বিজনেস লজিক ডেটাবেজ ফাংশন/ট্রিগারে না রেখে অ্যাপ লেয়ারে রাখতে হবে।
7. **Read/Write Separation:** হাই-ট্রাফিক অ্যাপে read-heavy কোয়েরির জন্য PostgreSQL read replica ব্যবহার করার প্রস্তুতি রাখতে হবে।

### D.4 Caching (Redis)
1. **Multi-Layer Caching:** কম পরিবর্তনশীল ডেটা (সেটিংস, প্ল্যান লিস্ট, প্রোফাইল, কনফিগ) সরাসরি DB থেকে না টেনে Redis-এ ক্যাশ করতে হবে।
2. **Cache Invalidation:** ডেটা আপডেট/ডিলিটের সাথে সাথেই সংশ্লিষ্ট Redis কী ইনভ্যালিডেট বা রি-ফ্রেশ করার মেকানিজম (write-through বা event-based invalidation) রাখতে হবে।
3. **TTL Discipline:** প্রতিটি cache key-তে যৌক্তিক TTL (Time-to-Live) সেট করতে হবে।
4. **Cache Key Naming Convention:** consistent, namespaced key pattern (যেমন `user:{id}:profile`) ব্যবহার করতে হবে।
5. **Cache Stampede Protection:** হাই-ট্রাফিক key expire হওয়ার মুহূর্তে ডিস্ট্রিবিউটেড লকিং/early-refresh প্যাটার্ন ব্যবহার করতে হবে।
6. **Rate Limiting Store:** Redis-কে rate-limiting ও session/token blacklist স্টোর হিসেবেও ব্যবহার করতে হবে (@nestjs/throttler-এর সাথে ইন্টিগ্রেটেড)।

### D.5 Background Jobs (BullMQ)
1. **Async Offloading:** ভারী/সময়সাপেক্ষ কাজ (PDF তৈরি, ইমেইল/SMS, রিপোর্ট, থার্ড-পার্টি API কল) মূল API থ্রেডে না করে BullMQ কিউতে পাঠিয়ে সাথে সাথে রেসপন্স রিটার্ন করতে হবে।
2. **Retry & Backoff:** প্রতিটি জবে exponential backoff সহ retry policy সেট করতে হবে।
3. **Idempotency:** জব হ্যান্ডলার idempotent রাখতে হবে (একই জব দুবার রান হলেও যাতে ডুপ্লিকেট সাইড-ইফেক্ট না হয়)।
4. **Dead Letter Queue (DLQ):** বারবার ফেইল হওয়া জব আলাদা failed-queue-এ রেখে মনিটরিং ও ম্যানুয়াল রিভিউ করার ব্যবস্থা রাখতে হবে।
5. **Job Concurrency Control:** প্রতিটি কিউতে concurrency limit সেট করতে হবে।
6. **Scheduled / Cron Jobs:** রিপিটিং টাস্কের জন্য BullMQ-র repeatable jobs ব্যবহার করতে হবে।

### D.6 Data Integrity & Migration
1. **Transactional Integrity:** একাধিক ধাপের রাইট অপারেশনে ডেটাবেজ ইন্টিগ্রিটি বজায় রাখতে Drizzle-র transaction ব্লক ব্যবহার করতে হবে (`db.transaction(...)`)।
2. **Schema Migrations:** প্রতিটি স্কিমা পরিবর্তন ভার্সনড মাইগ্রেশন ফাইল (Drizzle Kit) দিয়ে ট্র্যাক করতে হবে, প্রোডাকশনে সরাসরি ম্যানুয়াল পরিবর্তন নিষিদ্ধ।
3. **Soft Delete Pattern:** গুরুত্বপূর্ণ এন্টিটিতে `deleted_at` কলাম দিয়ে soft delete ব্যবহার করতে হবে।
4. **Backup & PITR:** নিয়মিত অটোমেটেড ব্যাকআপ ও Point-in-Time Recovery কনফিগার করতে হবে।
5. **Query Monitoring:** `pg_stat_statements` চালু রেখে সবচেয়ে ভারী কোয়েরি নিয়মিত পর্যবেক্ষণ করতে হবে।

---

## 4. Development Rules — Backend (NestJS + Fastify)

1. **System & Schema Harmony:** যেকোনো নতুন এন্ডপয়েন্ট বা ফিচার তৈরির আগে বিদ্যমান সার্ভিস, স্কিমা ও রিপোজিটরি ভালো করে দেখে নিয়ে তারই ধারাবাহিকতায় কোড লিখতে হবে।
2. **Strict Request Validation:** প্রতিটি এন্ডপয়েন্টে schema-ভিত্তিক ভ্যালিডেশন (`nestjs-zod`) করতে হবে — অপরিচিত ফিল্ড স্ট্রিপ (`whitelist`) ও রিজেক্ট (`forbidUnknownValues`) করতে হবে।
3. **Rate Limiting:** `@nestjs/throttler` দিয়ে প্রতি IP ও প্রতি অ্যাকাউন্টের জন্য রিকোয়েস্ট লিমিট কনফিগার করতে হবে, বিশেষ করে auth এন্ডপয়েন্টে।
4. **Password Security:** Argon2 দিয়ে হ্যাশ করতে হবে।
5. **Token Strategy:** Access token শর্ট-লিভড (১০–১৫ মিনিট), Refresh token লং-লিভড; উভয়ই `httpOnly`, `secure`, `sameSite: 'strict'` কুকিতে পাঠাতে হবে — কখনো LocalStorage-এ না।
6. **SQL Injection & XSS Protection:** Drizzle ORM-এর parameterized query ব্যবহার করতে হবে; raw SQL সম্পূর্ণ পরিহার করতে হবে; Fastify Helmet দিয়ে সিকিউরিটি হেডার ইনজেক্ট করতে হবে।
7. **CORS Policy:** শুধুমাত্র নির্দিষ্ট বিশ্বস্ত ফ্রন্টএন্ড ডোমেইন allow করতে হবে, প্রোডাকশনে `origin: "*"` কখনোই না।
8. **Global Error Handling:** একটি গ্লোবাল `HttpExceptionFilter` থাকতে হবে যাতে সার্ভারের ইন্টারনাল ফাইলপাথ বা ডেটাবেজ এরর মেসেজ ইউজারের কাছে এক্সপোজ না হয়।
9. **Modular Boundaries:** প্রতিটি ফিচার স্বনির্ভর মডিউল হিসেবে থাকবে (controller, service, DTO, repository); ক্রস-মডিউল সার্কুলার ডিপেন্ডেন্সি এড়াতে হবে।
10. **Secure Logging:** Pino দিয়ে স্ট্রাকচার্ড JSON লগ রাখতে হবে, পাসওয়ার্ড/টোকেন/সেনসিটিভ ডেটা কখনো লগে যাবে না।
11. **Environment Validation:** অ্যাপ স্টার্টআপেই env variable গুলো Zod schema দিয়ে ভ্যালিডেট করতে হবে।
12. **Health & Readiness Checks:** `@nestjs/terminus` দিয়ে liveness/readiness এন্ডপয়েন্ট রাখতে হবে।
13. **Resource Efficiency & Lightweight Footprint:** অপ্রয়োজনীয় গ্লোবাল ইন্টারসেপ্টর বা মেমোরি লিকিং অবজেক্ট পরিহার করে মেমোরি ফুটপ্রিন্ট সর্বনিম্ন রাখতে হবে।

---

## 5. Development Rules — Frontend (Next.js App Router)

1. **System Continuity & Consistency:** নতুন কোনো পেজ বা কম্পোনেন্ট যোগ করার সময় বিদ্যমান ডিজাইন সিস্টেম (CSS Variables), ফোল্ডার স্ট্রাকচার ও কনভেনশন হুবহু মেনে চলতে হবে।
2. **Rendering Strategy:** স্ট্যাটিক বা সেমি-ডায়নামিক পেইজে ISR বা SSG ব্যবহার করতে হবে।
3. **Data-heavy Pages:** ড্যাশবোর্ড বা ডেটা-হেভি পেইজে RSC + Streaming with Suspense ব্যবহার করে স্কেলিটন লোডার প্রদর্শন করতে হবে।
4. **Image Optimization:** `next/image` ব্যবহার করে WebP/AVIF ফরম্যাট, lazy loading, এবং above-the-fold ইমেজে priority প্রপার্টি নিশ্চিত করতে হবে।
5. **Query Caching:** TanStack Query-র staleTime ও gcTime ডেটার ধরন অনুযায়ী সঠিকভাবে কনফিগার করতে হবে।
6. **Pagination:** বড় লিস্ট/টেবিলে কার্সার-বেসড পেজিনেশন বা ইনফিনিট স্ক্রোল ব্যবহার করতে হবে।
7. **Duplicate Submission Prevention:** মিউটেশন চলাকালীন বাটন disable ও লোডিং স্টেট বাধ্যতামূলক করতে হবে।
8. **Component Consistency:** রিইউজেবল কম্পোনেন্ট (Button, Input, Card ইত্যাদি) একটি সিঙ্গেল UI ফোল্ডারে CVA + CSS Modules দিয়ে তৈরি করতে হবে।
9. **List Virtualization:** বড় ড্রপডাউন বা লিস্টে পারফরম্যান্স ঠিক রাখতে TanStack Virtual ব্যবহার করতে হবে।
10. **Device-aware & Lightweight Rendering:** ডেস্কটপ/মোবাইলের জন্য শুধু CSS `display: none` না করে কন্ডিশনাল রেন্ডারিং ব্যবহার করতে হবে, যাতে মোবাইলে লাইটওয়েট ও ফাস্ট লোডিং নিশ্চিত হয়।
11. **Strict i18n Discipline (বাংলা ও ইংরেজি):** পুরো অ্যাপ্লিকেশনের প্রতিটি টেক্সট `next-intl` ডিকশনারি কী থেকে লোড হবে। হার্ডকোডেড বাংলা বা ইংরেজি স্ট্রিং কোডে সরাসরি লেখা সম্পূর্ণ নিষিদ্ধ।
12. **Route-change Flicker Prevention:** রাউট পরিবর্তনের সময় স্ক্রিন ফ্লিকারিং ঠেকাতে TanStack Query-তে `placeholderData: keepPreviousData` ব্যবহার করতে হবে।
13. **Fault Isolation:** প্রতিটি পেইজ ও মডিউলকে React Error Boundary দিয়ে wrap করতে হবে।
14. **Validation Consistency:** Zod schema ব্যাকএন্ডের সাথে শেয়ারড (single source of truth) রাখতে হবে।
15. **Production Error Readability:** Sentry-তে source maps আপলোড কনফিগার করতে হবে।

---

## 6. Shared & Cross-cutting Rules

1. **Single Source of Truth:** Zod schema ও TypeScript types একবার লিখে (`packages/schema`) FE ও BE দুই জায়গায় ব্যবহার করতে হবে — ডুপ্লিকেট ভ্যালিডেশন লজিক নিষিদ্ধ।
2. **Docker Image Optimization:** প্রতিটি সার্ভিসের জন্য multi-stage Dockerfile, Alpine-ভিত্তিক অতি ক্ষুদ্র ফাইনাল ইমেজ।
3. **Edge / Reverse Proxy Responsibility:** SSL, compression (gzip/brotli), static asset caching, ও load balancing Nginx-এ হ্যান্ডেল করতে হবে — Node প্রসেসকে শুধু বিজনেস লজিকে ফোকাসড রাখতে হবে।
4. **CI Quality Gate:** প্রতিটি PR মার্জের আগে lint → typecheck → test → build ধাপ পাস করতে হবে।
5. **Secrets Management:** `.env` ফাইল কখনো কমিট হবে না; প্রোডাকশন সিক্রেট আলাদা secret manager/CI vault থেকে ইনজেক্ট করতে হবে।
