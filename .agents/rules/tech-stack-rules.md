---
description: Fullstack Core Tech Stack & Rules (CloudLinux + LiteSpeed + cPanel + Firebase Auth & FCM + Adaptive Mobile App / Desktop Web View)
globs: ["**/*"]
always_on: true
---

# Fullstack Core Tech Stack & Rules (Sadaqahbd)

## Target Environment:
- **Shared Hosting:** CloudLinux OS (LVE memory limits ~1-2 GB RAM) + LiteSpeed Web Server + cPanel Node.js App (No Docker).
- **Authentication:** Firebase Auth (Email/Password & Google OAuth Login) + Firebase Admin SDK for backend verification.
- **Notifications:** Firebase Cloud Messaging (FCM) Web Push notifications.
- **Database:** cPanel MySQL (InnoDB, utf8mb4) via Drizzle ORM (`drizzle-orm/mysql2`).
- **Disk & Files:** 10 GB NVMe SSD protected by storing media in Cloudflare R2 object storage.
- **Future VPS Ready:** Codebase remains decoupled from hosting via modular cache/queue adapters.

## Mandatory Core Directives (বাধ্যতামূলক মূল নীতিসমূহ):
1. **পূর্বের সিস্টেম ও ডেটাবেজ ফলো করা (System & DB Consistency):** যেকোনো নতুন ফিচার তৈরির পূর্বে বিদ্যমান স্কিমা ও মডিউল প্যাটার্ন অক্ষুণ্ণ রাখতে হবে। `firebase_uid` দিয়ে MySQL `users` টেবিল ম্যাপিং হবে।
2. **অ্যাডাপ্টিভ ডিভাইস ভিউ (Adaptive Mobile App vs Desktop Web):**
   - ছোট স্ক্রিন / মোবাইল (< 768px): খাঁটি মোবাইল অ্যাপের অনুভূতি (ফিক্সড বটম নেভিগেশন বার, মোবাইল হেডার অ্যাপ বার, বটম শিট ড্রয়ার, এবং Safe Area Inset)।
   - মাঝারি ও বড় স্ক্রিন (>= 768px): ক্লাসিক ও আধুনিক ওয়েবসাইট ভিউ (টপ হেডার ও ড্রপডাউন মেনু, মাল্টি-কলাম গ্রিড ও সাইডবার, ডেস্কটপ ডায়ালগ)।
3. **সর্বোচ্চ পারফরম্যান্স অপ্টিমাইজেশন (High-Performance):** B-Tree/Composite/FULLTEXT ইনডেক্সিং, কার্সার পেজিনেশন, N+1 কোয়েরি প্রতিরোধ, Next.js Standalone বিল্ড, এবং RSC + Streaming।
4. **নিশ্ছিদ্র সিকিউরিটি ও হ্যাকার আক্রমণ প্রতিরোধ (Bulletproof Security):** Firebase Managed Auth (পাসওয়ার্ড গুগলের সিকিউর ভল্টে থাকবে), OWASP Top 10 সুরক্ষা, Drizzle parameterized queries, Helmet, Throttler, Imunify360 ফ্রেন্ডলি কোড, এবং strictly `httpOnly` secure cookies।
5. **রিসোর্স সাশ্রয়ী ও লাইটওয়েট অ্যাপ (Lightweight & CloudLinux LVE Friendly):** মেমোরি বাজেট <১৫০ এমবি, নো ডকার, Next.js Standalone মোড, লো-কানেকশন ডিবি পুলিং।
6. **১০০% দ্বিভাষিক (বাংলা ও ইংরেজি) সাপোর্ট (Full Bilingual i18n):** পুরো অ্যাপে বাংলা (`bn`) ও ইংরেজি (`en`) সমর্থন। কোডে কোনো হার্ডকোডেড স্ট্রিং থাকবে না — সবকিছু `next-intl` ডিকশনারি দিয়ে লোড হবে।

## Core Tech Stack:
- **Frontend:** Next.js (App Router, Strict TS, Standalone output) + Adaptive UI Architecture (Bottom Nav for Mobile, Top Navbar for Desktop) + Firebase Modular SDK (`firebase/auth`, `firebase/messaging`) + RSC + Zustand + TanStack Query + React Hook Form + Zod + shadcn/ui + Radix UI + CSS Modules & CSS Variables + CVA + TanStack Virtual + Motion + next-intl (বাংলা ও ইংরেজি) + @react-pdf/renderer.
- **Backend:** NestJS (Fastify/Express Adapter for cPanel Node.js) + Firebase Admin SDK (`firebase-admin`) + Modular Architecture + cPanel MySQL + Drizzle ORM (`drizzle-orm/mysql2`) + Modular Cache (In-Memory/Upstash) + Lightweight DB/Cron Queue (VPS-ready for BullMQ) + CASL + `nestjs-zod` + Swagger + Pino + Helmet + Throttler + Terminus.
