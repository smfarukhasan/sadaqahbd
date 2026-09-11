# Sadaqahbd

Sadaqahbd is a modern, high-performance, secure, fullstack bilingual web platform tailored for lightweight resource efficiency.

## Target Hosting & Infrastructure

- **Primary Deployment:** Shared Hosting (CloudLinux OS + LiteSpeed Web Server + cPanel Node.js App)
- **Database:** cPanel MySQL (InnoDB, utf8mb4) via Drizzle ORM
- **Authentication:** Firebase Auth (Email/Password & Google Sign-In)
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Object Storage:** Cloudflare R2 (preserves 10 GB NVMe disk space)
- **Future Migration:** Zero-lock-in architecture ready for VPS & Docker scaling when needed

## Tech Stack

- **Frontend:** Next.js (App Router, Strict TypeScript, Standalone output) + Firebase Client SDK + RSC + Zustand + TanStack Query + shadcn/ui + Radix UI + CSS Modules & CSS Variables + next-intl (Bengali & English)
- **Backend:** NestJS (Fastify/Express for cPanel Node.js) + Firebase Admin SDK + MySQL + Drizzle ORM + Modular Cache (In-Memory/Upstash) + Lightweight Queue + CASL + Pino + Helmet
- **Monorepo:** Turborepo / pnpm workspaces

## Development Guidelines

Please refer to [GEMINI.md](GEMINI.md) / [AGENTS.md](AGENTS.md) for strict architectural and coding directives.
