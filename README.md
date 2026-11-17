# ImpactID: Volunteer Contribution Tracking & Impact Passport Platform

> **Course:** CSC4161 · Advanced Programming in Web Technology  
> **Institution:** American International University-Bangladesh (AIUB)  
> **Semester:** Fall 2026–2027 · Section E · Group 06  
> **Instructor:** Sultanul Arifeen Hamim, Lecturer, Department of Computer Science  

---

## 📌 Project Overview

**ImpactID** is a verification-based volunteer contribution tracking and Impact Passport REST API built with **NestJS 11, TypeScript, TypeORM, and PostgreSQL 18**. 

Volunteering claims are often scattered across informal certificates, social media posts, and unverified CV entries. ImpactID eliminates self-inflated and fraudulent volunteer claims by enforcing an **atomic multi-table verification workflow**:
- Every verified hour is confirmed by an **authorized Organization** or the **original Community Requester**.
- Approved decisions atomically generate private **Impact Passport records** using **pessimistic row locking**.
- Suspicious activities trigger automated **Fraud Flags**, while all administrative and verification decisions are recorded in an immutable, **append-only Audit Log**.
- Volunteers can share their achievements through a privacy-controlled **Public Share Link** without requiring third parties to register.

---

## 👥 Team Members & Contribution

| Student ID | Student Name | Assigned Modules & Responsibilities |
| :--- | :--- | :--- |
| **23-52918-2** | **Umme Fahmida Sultana** | **Identity & Access:** Authentication (`/auth`), User profiles (`/users`), Organization onboarding & management (`/organizations`), JWT Strategy & Role Guards. |
| **23-52359-2** | **Intisar Jaman Chowdhoury** | **Activities & Lifecycle:** Opportunities (`/opportunities`), Community Requests (`/community-requests`), Applications (`/applications`), Participations (`/participations`), Completion workflow. |
| **23-52849-2** | **Shazzad Hossain Setu** | **Trust & Administration:** Database schema & migrations, Verification decisions (`/verifications`), Admin actions & Revocation (`/admin/*`), Fraud Flag review queue (`/admin/fraud-flags`), Append-only Audit Logs (`/admin/audit-logs`). |
| **23-52867-2** | **Emran Ahmed Tanzim** | **Impact Passport & Catalogs:** Dynamic passport calculation (`/impact-passport`), Public verification sharing (`/public-sharing`), Skills catalog (`/skills`), Volunteer causes catalog (`/causes`). |

---

## 🛠️ Technology Stack & Architecture

- **Backend Framework:** NestJS 11.1.8 (Modular Monolith)
- **Language & Runtime:** TypeScript 5.9, Node.js 22 (`.nvmrc`), pnpm
- **Database & ORM:** PostgreSQL 18.6 with TypeORM 0.3.27 (`synchronize: false`, versioned migrations)
- **Authentication & Security:** `@nestjs/jwt`, `passport-jwt`, `bcrypt` password hashing, `helmet` security headers
- **Validation:** `class-validator` & `class-transformer` with global `ValidationPipe` (whitelist + forbidden unknown fields)
- **API Documentation:** Interactive Swagger UI (`@nestjs/swagger`) at `/api/docs`
- **Testing:** Jest integration test suite with isolated PostgreSQL schemas

---

## 📋 Course Requirements Coverage

### 1. Minimum Course Requirements (5/5 Complete)
- **Multiple Entities with Full CRUD:** 14 relational tables (`users`, `profiles`, `organizations`, `opportunities`, `community_requests`, `applications`, `participations`, `verifications`, `impact_records`, `fraud_flags`, `audit_logs`, `causes`, `skills`, `opportunity_skills`). Lists support offset/limit pagination and metadata.
- **Database Integration & Transactions:** PostgreSQL integration via TypeORM with foreign keys and check constraints. Multi-table state transitions execute inside `QueryRunner` database transactions with automatic rollback on error.
- **JWT Authentication & RBAC:** Register and login with bcrypt password hashing (minimum 10 salt rounds). Role-Based Access Control (`VOLUNTEER`, `ORGANIZATION`, `ADMINISTRATOR`) enforced with `@Roles()` decorator and `RolesGuard`.
- **Input Validation with DTOs:** Strict create/update DTOs for every write endpoint. Strips unwhitelisted fields and returns formatted `400 Bad Request` messages.
- **HTTP Exception Handling:** Global `HttpExceptionFilter` ensuring unified JSON responses (`{ success, statusCode, message, path, timestamp }`) and mapping conflict states (e.g., duplicate unique constraint or state conflict) to `409 Conflict`.

### 2. Bonus Features Implemented (8 Built)
- **Advanced Database Transactions:** Explicit `QueryRunner` control with `pessimistic_write` row locking to prevent race conditions during verification, application acceptance, and revocation.
- **Append-only Audit Log:** Immutable audit logging on all administrative actions, verifications, and user suspensions.
- **Fraud Flag Detection:** Automated flagging of suspicious activities (overlapping times, rapid completion) feeding an administrative review queue.
- **TypeORM Versioned Migrations:** Production-ready schema migration (`1794182400000-CreateImpactIdCoreSchema.ts`) with `synchronize: false`.
- **Custom Decorators:** `@CurrentUser()`, `@Roles()`, and parameter decorator `@ActorId()`.
- **Middleware:** Request logging middleware capturing method, path, and timestamp.
- **Swagger UI:** Complete OpenAPI documentation with interactive testing and Bearer auth at `/api/docs`.
- **Response Manipulation & Serialization:** `password_hash` excluded from user responses (`select: false`), pagination metadata envelopes.

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js 22.x
- pnpm (`npm install -g pnpm`)
- PostgreSQL 13 or later (running on port `5432`)

### Step 1: Clone & Install Dependencies
```powershell
git clone https://github.com/Noobie33/impactid-volunteer-platform.git
cd impactid-volunteer-platform
pnpm install --frozen-lockfile
```

### Step 2: Configure Environment Variables
Copy the example environment configuration:
```powershell
Copy-Item .env.example .env
```
Ensure your `.env` contains valid credentials for your local PostgreSQL:
```env
PORT=5000
NODE_ENV=development
JWT_BEARER_SECRET="your-secure-random-secret"

DB_CLIENT="postgres"
DB_HOST="localhost"
DB_PORT=5432
DB_USER="postgres"
DB_PASSWORD="your_password"
DB_DATABASE="impactid_dev"
```

### Step 3: Run Database Migrations
Create the database `impactid_dev` in PostgreSQL/pgAdmin, then run:
```powershell
pnpm run migration:run
```

### Step 4: Start the Development Server
```powershell
pnpm run start:dev
```

- **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)
- **Swagger Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🔄 Core End-to-End Workflow

1. **Registration & Approval:**
   - Organization registers (`POST /auth/register`) and creates an organization profile (`POST /organizations`).
   - Administrator reviews and approves the organization (`PATCH /admin/organizations/:id/approve`).
2. **Opportunity & Application:**
   - Approved Organization publishes an opportunity (`POST /opportunities`).
   - Volunteer applies (`POST /applications`).
   - Organization accepts the application (`PATCH /applications/:id/decision`), creating an atomic `participations` entry.
3. **Completion & Multi-Table Verification:**
   - Volunteer submits completion notes and proposed hours (`PATCH /participations/:id/complete`).
   - Organization approves completion (`POST /verifications/:participationId/approve`).
   - *In one atomic database transaction:* Verification row is inserted, participation becomes `VERIFIED`, private passport credit is created in `impact_records`, and an entry is written to `audit_logs`.
4. **Impact Passport & Public Verification:**
   - Volunteer views their verified hours and activities (`GET /impact-passport/me`).
   - Volunteer enables public sharing and generates/rotates a unguessable `shareToken`.
   - External reviewers view verified credentials without logging in (`GET /public-sharing/passport/:shareToken`).
5. **Administrative Oversight & Revocation:**
   - Administrator monitors the system audit trail (`GET /admin/audit-logs`) and resolves fraud flags (`PATCH /admin/fraud-flags/:id`).
   - If false credit is found, administrator revokes verification (`POST /admin/verifications/:id/revoke`), simultaneously updating verification, participation, and passport statuses with an audit reason.

---

## 📜 License & Academic Integrity

This project is submitted in partial fulfillment of the requirements for the **Advanced Programming in Web Technology (CSC4161)** course at **American International University-Bangladesh (AIUB)**.  
Licensed under the [MIT License](LICENSE).