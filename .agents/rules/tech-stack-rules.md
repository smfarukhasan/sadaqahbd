---
description: Fullstack Core Tech Stack & Development Rules (Shared Hosting cPanel LiteSpeed CloudLinux + Future VPS)
globs: ["**/*"]
always_on: true
---

# Fullstack Core Tech Stack & Rules (CloudLinux + LiteSpeed + cPanel)

## Target Environment:
- **Shared Hosting:** CloudLinux OS (LVE memory limits ~1-2 GB RAM) + LiteSpeed Web Server + cPanel Node.js App (No Docker daemon).
- **Database:** cPanel MySQL (InnoDB, utf8mb4).
- **Disk & Files:** 10 GB NVMe SSD protected by storing media in Cloudflare R2 object storage.
- **Future VPS Ready:** Codebase remains decoupled from hosting via modular cache/queue adapters.

## 5 Mandatory Core Directives (বাধ্যতামূলক ৫টি মূল নীতি):
1. **পূর্বের সিস্টেম ও ডেটাবেজ ফলো করা (System & DB Consistency):** যেকোনো নতুন ফিচার তৈরির পূর্বে বিদ্যমান স্কিমা ও মডিউল প্যাটার্ন অক্ষুণ্ণ রাখতে হবে।
2. **সর্বোচ্চ পারফরম্যান্স অপ্টিমাইজেশন (High-Performance):** B-Tree/Composite/FULLTEXT ইনডেক্সিং, কার্সার পেজিনেশন, N+1 কোয়েরি প্রতিরোধ, Next.js Standalone বিল্ড, এবং RSC + Streaming।
3. **নিশ্ছিদ্র সিকিউরিটি ও হ্যাকার আক্রমণ প্রতিরোধ (Bulletproof Security):** OWASP Top 10 সুরক্ষা, Drizzle parameterized queries, Helmet, Throttler, Argon2, Imunify360 ফ্রেন্ডলি কোড, এবং strictly `httpOnly` secure cookies।
4. **রিসোর্স সাশ্রয়ী ও লাইটওয়েট অ্যাপ (Lightweight & CloudLinux LVE Friendly):** মেমোরি বাজেট <১৫০ এমবি, নো ডকার, Next.js Standalone মোড, লো-কানেকশন ডিবি পুলিং।
5. **১০০% দ্বিভাষিক (বাংলা ও ইংরেজি) সাপোর্ট (Full Bilingual i18n):** পুরো অ্যাপে বাংলা (`bn`) ও ইংরেজি (`en`) সমর্থন। কোডে কোনো হার্ডকোডেড স্ট্রিং থাকবে না — সবকিছু `next-intl` ডিকশনারি দিয়ে লোড হবে।

## Core Tech Stack:
- **Frontend:** Next.js (App Router, Strict TS, Standalone output) + RSC + Zustand + TanStack Query + React Hook Form + Zod + shadcn/ui + Radix UI + CSS Modules & CSS Variables + CVA + TanStack Virtual + Motion + next-intl (বাংলা ও ইংরেজি) + @react-pdf/renderer.
- **Backend:** NestJS (Fastify/Express Adapter for cPanel Node.js) + Modular Architecture + cPanel MySQL + Drizzle ORM (`drizzle-orm/mysql2`) + Modular Cache (In-Memory/Upstash) + Lightweight DB/Cron Queue (VPS-ready for BullMQ) + Passport.js + JWT + CASL + `nestjs-zod` + Swagger + Pino + Helmet + Throttler + Argon2 + Terminus.
