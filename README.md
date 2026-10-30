# Haru Control

> **Enterprise-grade Single-Page ERP & Operational POS tailored for an artisanal food boutique.**  
> Engineered for high-speed kitchen operations, strict manufacturing control (BOM), and auditable immutable stock accounting.

---

## 🌟 Executive Overview

**Haru Control** is a mission-critical, mobile-first Point of Sale (POS) and Enterprise Resource Planning (ERP) platform developed specifically for high-throughput artisanal cookie boutiques. 

Unlike traditional retail POS systems that manage inventory via simplistic scalar counters susceptible to race conditions and drift, Haru Control enforces strict financial-grade inventory integrity through an **Immutable Accounting Ledger**, automated **Bill of Materials (BOM)** unit conversions, predictive baking demand algorithms, and rapid touch-gesture operational workflows.

---

## 🏗️ Engineering Highlights

### 1. Financial-Grade Inventory Ledger (`LedgerEntry`)
- **Immutable Audit Trail:** Inventory levels are never directly mutated in place. All changes—stock-ins, order reservations, order cancellations, sales completions, manufacturing ingredient deductions, and operational waste—are recorded as immutable entries in an event ledger.
- **Race Condition Prevention:** Atomic database transactions (`prisma.$transaction`) ensure zero drift between customer orders and raw ingredient balances.
- **Multi-Reason Waste Auditing:** Formal operational waste tracking (`EXPIRED`, `DAMAGE`, `BAKING_FAILURE`, `TASTING`, `OTHER`) tied directly to monthly financial cost loss metrics.
- *Detailed Architecture Decision:* See [ADR-01: Estoque em Ledger Contábil](docs/ARCHITECTURE_DECISIONS.md#adr-01-estoque-em-ledger-contábil-auditabilidade-e-rastreabilidade-total).

### 2. Multi-Dimensional Bill of Materials (BOM) & Unit Engine
- **Hierarchical Recipe Decomposition:** Seamless relationship between finished goods (e.g., individual cookies) and semi-finished components (e.g., cookie dough batches) down to raw ingredients (flour, butter, chocolate).
- **Unit Engine (`@haru-control/utils`):** Bidirectional, dimensionally safe conversions across mass (`g`, `kg`), volume (`ml`, `L`), and discrete units (`un`).
- **Dynamic Yield Balancing:** Supports recipe yield ratios (e.g., 1 batch = 1,600g dough; 1 cookie = 60g dough), automatically calculating proportional ingredient consumption upon oven output.
- **Statistical Baking Forecasting:** Multi-day predictive engine calculating daily production requirements based on weighted historical sales averages and safety margins.

### 3. Mobile-First Gestures & Realtime Operational Kanban
- **Touch-Optimized Ergonomics:** 100% responsive interface designed for single-hand mobile operations during fast-paced kitchen rushes.
- **Horizontal Swipe Navigation:** Native touch gestures allow kitchen staff to glide seamlessly between Kanban columns (`Draft`, `In Preparation`, `Completed`) without blocking vertical scroll.
- **Interactive Cart Drawer:** Bottom-sheet checkout drawer with live delivery fee adjustments, waste mode toggling, and atomic batch submission.
- **Local EMVCo Pix Engine:** Client-side mathematical generation of Brazilian Central Bank (BACEN) standard dynamic QR codes and Copy & Paste strings with exact order totals, CRC16-CCITT checksums, and zero third-party latency.
- **Emergency Push Alerts (Pushover):** High-priority push notifications with sound overrides and two-way in-app acknowledgement (ACK) to silence alerts once noticed by kitchen staff.

### 4. Comprehensive End-to-End Test Suite (Playwright)
- **Real Device Emulation:** Automated tests run against real mobile viewports (`Pixel 7`, 412x915, native touch emulation).
- **Page Object Model (POM):** Decoupled, maintainable test architecture (`LoginPage`, `OrderBoardPage`, `OrderFormPage`, `OrderHistoryPage`).
- **Authentication Session Caching:** Instant PIN bypass in milliseconds via reusable storage states (`user.json`).

### 5. Modular Nx Monorepo Architecture
- **Strict Boundary Separation:** Clean domain segregation between backend services, frontend presentation, and shared contract packages.
- **Shared Type Safety:** Single source of truth for DTOs, data models, and business utilities, eliminating client-server drift.

---

## 📂 Repository Anatomy

```
haru-control/
├── apps/
│   ├── api/                    # NestJS 10 backend application
│   │   ├── prisma/             # Schema, migrations & seeds
│   │   └── src/
│   │       ├── modules/        # Modular domain services (auth, products, orders, stock, categories)
│   │       └── prisma/         # Prisma client service
│   │
│   └── mobile/                 # React 18 + Vite 5 mobile-first frontend
│       └── src/
│           ├── components/     # AppLayout, BottomNavigation, UI modals
│           ├── pages/          # OrderBoard, OrderForm, OrderHistory, Insights, Stock, Products
│           ├── store/          # Zustand client-side draft stores
│           └── services/       # Axios client with dynamic Wi-Fi IP discovery
│
├── libs/
│   ├── types/                  # Shared TypeScript interfaces, DTOs & response contracts
│   ├── utils/                  # Pure utility functions: Unit conversion, Pix EMVCo, formatting
│   └── ui/                     # Shared UI components (FloatingActionButton, Toast, NumberInput)
│
├── docs/                       # Architecture Decision Records (ADRs), specs & changelogs
├── e2e/                        # Playwright automated E2E test suites with Page Objects
├── docker-compose.yml          # PostgreSQL 15 container definition
├── nx.json                     # Nx workspace configuration
└── tsconfig.base.json          # Root TypeScript compiler options & path mappings
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | [Nx](https://nx.dev/) Workspace, TypeScript 5 |
| **Backend** | [NestJS 10](https://nestjs.com/), [Prisma ORM 5](https://www.prisma.io/), `class-validator`, `class-transformer` |
| **Database** | [PostgreSQL 15](https://www.postgresql.org/) (Running on Docker) |
| **Frontend** | [React 18](https://react.dev/), [Vite 5](https://vitejs.dev/), [Zustand](https://github.com/pmndrs/zustand), [Recharts](https://recharts.org/) |
| **Mobile UX** | Touch Gestures, CSS Viewport Containment, Bottom Sheets, EMVCo Pix Generator |
| **Testing** | [Jest](https://jestjs.io/) (Unit & Integration), [Playwright](https://playwright.dev/) (Mobile E2E) |
| **Infrastructure** | Docker Compose, [Coolify](https://coolify.io/) Cloud Deployments (Isolated Prod & Dev) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker & Docker Compose**: Installed and running

### Quickstart Guide

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CesarRyudi/Haru-Control.git
   cd Haru-Control
   ```

2. **Install workspace dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example apps/api/.env
   ```

4. **Spin up PostgreSQL database:**
   ```bash
   docker-compose up -d
   ```

5. **Generate Prisma client and execute migrations:**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed sample store catalog (optional):**
   ```bash
   npx prisma db seed
   ```

7. **Start the applications:**
   ```bash
   npm start
   ```

The applications will be running at:
- **Mobile Frontend:** `http://localhost:4200`
- **Backend API:** `http://localhost:3000`
- **Default PIN:** `1234` (configurable via `PIN_CODE` in `.env`)

---

## 🧪 Testing & Verification

Haru Control enforces 100% test pass rates across unit and E2E suites prior to releases.

```bash
# Run unit & integration test suites (Jest)
npm test

# Build all monorepo targets (NestJS API & Vite Frontend)
npm run build

# Run end-to-end tests with mobile emulation (Playwright)
npm run test:e2e

# Run Playwright in interactive UI mode
npm run test:e2e:ui
```

---

## 📚 Technical Documentation & ADRs

- **[Architecture Decisions (ADRs)](docs/ARCHITECTURE_DECISIONS.md):** Deep-dive into technical paradigms (Accounting Ledger, WebAuthn & PIN, Coolify Isolated Environments, and BOM).
- **[System Specifications](docs/SPECIFICATIONS.md):** Business rules, functional flows, and domain requirements.
- **[Project Context & Roadmap](docs/PROJECT_CONTEXT.md):** Domain glossary, module matrix, and milestone roadmap.

---

## 📄 License

Proprietary software. All rights reserved.
