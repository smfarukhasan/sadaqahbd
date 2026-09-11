---
description: Fullstack Core Tech Stack & Development Rules with 5 Non-Negotiable Directives (MySQL + Drizzle)
globs: ["**/*"]
always_on: true
---

# Fullstack Core Tech Stack & 5 Mandatory Directives (Sadaqahbd)

## 5 Mandatory Core Directives (বাধ্যতামূলক ৫টি মূল নীতি)
1. **পূর্বের সিস্টেম ও ডেটাবেজ ফলো করা (System & DB Consistency):** যেকোনো নতুন ফিচার তৈরির পূর্বে বিদ্যমান স্কিমা, টেবিল রিলেশন ও মডিউল প্যাটার্ন গভীর পর্যালোচনার মাধ্যমে অক্ষুণ্ণ রাখতে হবে। বিচ্ছিন্ন বা দ্বিমুখী কোড নিষিদ্ধ।
2. **সর্বোচ্চ পারফরম্যান্স অপ্টিমাইজেশন (High-Performance):** B-Tree/Composite/FULLTEXT ইনডেক্সিং, কার্সার পেজিনেশন, N+1 কোয়েরি প্রতিরোধ, মাল্টি-লেয়ার Redis ক্যাশিং, BullMQ অফলোডিং, Fastify, এবং RSC + Streaming।
3. **নিশ্ছিদ্র সিকিউরিটি ও হ্যাকার আক্রমণ প্রতিরোধ (Bulletproof Security):** OWASP Top 10 প্রতিরক্ষা, Drizzle parameterized queries (নো raw SQL), Helmet, Throttler রেট লিমিটিং, Argon2 পাসওয়ার্ড হ্যাশিং, এবং strictly `httpOnly` secure cookies (নো LocalStorage)।
4. **রিসোর্স সাশ্রয়ী ও লাইটওয়েট অ্যাপ (Lightweight & Low Resource):** মেমোরি ও সিপিইউ খরচ সর্বনিম্ন রাখার আর্কিটেকচার, ক্ষুদ্র Alpine ডকার ইমেজ, Tree-shaking, এবং মিনিমাল ফ্রন্টএন্ড বান্ডেল।
5. **১০০% দ্বিভাষিক (বাংলা ও ইংরেজি) সাপোর্ট (Full Bilingual i18n):** পুরো অ্যাপে বাংলা (`bn`) ও ইংরেজি (`en`) সমর্থন। কোডে কোনো প্রকার হার্ডকোডেড স্ট্রিং থাকবে না — সবকিছু `next-intl` ডিকশনারির মাধ্যমে লোড হতে হবে।

## Core Tech Stack
- **Frontend:** Next.js (App Router, Strict TS) + RSC + Zustand + TanStack Query + React Hook Form + Zod + shadcn/ui + Radix UI + CSS Modules & CSS Variables + CVA + TanStack Virtual + Motion + next-intl (বাংলা ও ইংরেজি) + @react-pdf/renderer.
- **Backend:** NestJS (Fastify Adapter) + Modular Architecture + MySQL (InnoDB, utf8mb4) + Drizzle ORM (`drizzle-orm/mysql2`) + Redis + BullMQ + Passport.js + JWT (HTTP-Only Secure Cookies) + CASL + `nestjs-zod` + Swagger + Pino + Helmet + Throttler + Argon2 + Terminus.
- **DevOps & Infra:** Docker multi-stage Alpine + Docker Compose (MySQL, Redis, Backend, Frontend) + Nginx + Turborepo + MinIO / R2 + Sentry + Uptime Kuma + GitHub Actions CI/CD.
