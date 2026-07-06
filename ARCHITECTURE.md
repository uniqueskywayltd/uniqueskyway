# Architecture — Unique Sky Way Platform v1.0

System architecture reference with diagrams. See `DEVELOPER_GUIDE.md` for implementation details and `DECISIONS.md` for ADRs.

---

## 1. System Context

```mermaid
flowchart TB
    subgraph Users
        C[Customer Browser]
        A[Admin Browser]
        CRON[Vercel Cron]
    end

    subgraph Vercel
        APP[Next.js App<br/>platform/]
    end

    subgraph Supabase
        AUTH[Auth]
        PG[(Postgres + RLS)]
        STOR[Storage]
    end

    RESEND[Resend Email]
    CF[Cloudflare DNS/CDN]

    C --> CF --> APP
    A --> CF --> APP
    CRON --> APP
    APP --> AUTH
    APP --> PG
    APP --> STOR
    APP --> RESEND
```

---

## 2. Application Layers

```mermaid
flowchart TB
    subgraph Presentation
        MKT[Marketing Pages]
        DASH[Customer Dashboard]
        ADMIN[Admin Console]
    end

    subgraph API
        PUB[Public API]
        CUST[Customer API]
        ADM[Admin API]
        CRON_API[Cron API]
    end

    subgraph Domain
        SVC[Service Layer<br/>lib/services/]
        LED[LedgerService]
        AUD[AuditService]
    end

    subgraph Data
        DRIZZLE[Drizzle ORM]
        DB[(Postgres)]
    end

    MKT --> PUB
    DASH --> CUST
    ADMIN --> ADM
    PUB --> SVC
    CUST --> SVC
    ADM --> SVC
    CRON_API --> SVC
    SVC --> LED
    SVC --> AUD
    SVC --> DRIZZLE --> DB
```

---

## 3. Request Flow (Authenticated Customer)

```mermaid
sequenceDiagram
    participant B as Browser
    participant M as Middleware
    participant API as API Route
    participant S as Service
    participant L as LedgerService
    participant DB as Postgres

    B->>M: Request + session cookie
    M->>M: Privacy shield check
    M->>M: Session refresh (Supabase)
    M->>API: Forward request
    API->>API: Auth guard + rate limit
    API->>S: Business operation
    S->>L: postEntry (if financial)
    L->>DB: INSERT ledger_entries
    S->>DB: UPDATE domain tables
    S-->>API: ServiceResult
    API-->>B: JSON response
```

---

## 4. Financial Ledger Model

```mermaid
flowchart LR
    subgraph Accounts
        WA[Wallet Available]
        WR[Wallet Reserved]
        WI[Wallet Invested]
        SYS[System Accounts]
    end

    DEP[Deposit Approved] --> WA
    INV[Investment Created] --> WA
    INV --> WI
    ROI[Daily ROI] --> WI
    ROI --> WA
    WD[Withdrawal Approved] --> WA
    WD --> WR
    TRE[Treasury Complete] --> WR
    REF[Referral Commission] --> WA
```

**Principle:** Balances are computed from `ledger_entries`; no mutable balance columns.

---

## 5. Deposit Workflow

```mermaid
stateDiagram-v2
    [*] --> pending: Customer submits
    pending --> approved: Admin approves
    pending --> rejected: Admin rejects
    approved --> [*]: Ledger credit + notification
    rejected --> [*]: Notification sent
```

---

## 6. Withdrawal Workflow

```mermaid
stateDiagram-v2
    [*] --> pending: Customer requests
    pending --> approved: Admin approves
    pending --> rejected: Admin rejects
    approved --> processing: Treasury queue
    processing --> completed: Treasury marks paid
    rejected --> [*]
    completed --> [*]
```

---

## 7. ROI Scheduler

```mermaid
flowchart TB
    CRON[Vercel Cron 06:00 UTC] --> ROI[/api/cron/roi]
    ROI --> AUTH{CRON_SECRET valid?}
    AUTH -->|No| REJECT[401]
    AUTH -->|Yes| PROC[RoiSchedulerService]
    PROC --> ACTIVE[Get active investments]
    ACTIVE --> LOOP[For each investment]
    LOOP --> IDEM{Already processed today?}
    IDEM -->|Yes| SKIP[Skip]
    IDEM -->|No| POST[LedgerService.postEntry]
    POST --> NOTIFY[NotificationService]
    LOOP --> LOG[Log run to roi_processing_runs]
```

---

## 8. Notification Pipeline

```mermaid
flowchart LR
    EVENT[Financial Event] --> NS[NotificationService]
    NS --> INAPP[In-app notification]
    NS --> QUEUE[Email queue pending]
    CRON[Cron every 15min] --> NP[NotificationProcessor]
    NP --> RESEND[Resend API]
    NP --> UPDATE[Update status sent/failed]
```

---

## 9. Admin RBAC

```mermaid
flowchart TB
    SA[Super Admin] --> ALL[All permissions]
    ADM[Admin] --> OPS[Operations permissions]
    FIN[Finance] --> FINP[Deposits, withdrawals, treasury]
    SUP[Support] --> SUPP[Customers read, notifications]
    RO[Read Only] --> READ[Read permissions only]

    REQ[API Request] --> SESS{Admin session?}
    SESS -->|No| DENY[403]
    SESS -->|Yes| PERM{Has permission?}
    PERM -->|No| DENY
    PERM -->|Yes| AUDIT[AuditService.log + execute]
```

Roles defined in `admin_users.role` enum. Permissions in `permissions` + `role_permissions` tables.

---

## 10. Legacy Migration Pipeline

```mermaid
flowchart TB
    SQL[Legacy SQL Dump] --> PARSE[legacy-sql-parser]
    PARSE --> TRANS[transform-legacy]
    TRANS --> VAL[validate-legacy]
    VAL -->|Dry run| REPORT[Report only]
    VAL -->|Live| LOAD[MigrationLoadService]
    LOAD --> USERS[profiles + auth]
    LOAD --> LEDGER[ledger_entries]
    LOAD --> INV[investments]
    LOAD --> IMG[Avatar upload]
    LOAD --> VERIFY[Balance verification]
```

---

## 11. Security Boundaries

| Boundary | Mechanism |
|----------|-----------|
| Customer data isolation | Postgres RLS (`auth.uid()` → `current_profile_id()`) |
| Admin access | `is_admin()` RLS + API permission checks |
| Pre-launch privacy | `SITE_ACCESS_KEY` middleware gate |
| Crawler blocking | User-agent filter in middleware |
| Cron protection | `CRON_SECRET` bearer token |
| File uploads | Supabase Storage RLS + MIME validation |
| Secrets | Server-only env vars; never in client bundle |

---

## 12. Deployment Topology

```
                    ┌─────────────┐
                    │ Cloudflare  │
                    │ DNS + CDN   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Vercel    │
                    │  (platform) │
                    │  + Cron     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐
       │  Supabase   │ │Resend │ │  GitHub   │
       │ Auth+DB+    │ │ Email │ │  Source   │
       │ Storage     │ │       │ │  (future) │
       └─────────────┘ └───────┘ └───────────┘
```

---

## 13. Database Schema Overview

| Domain | Tables |
|--------|--------|
| Identity | `profiles`, `admin_users`, `user_sessions`, `login_history` |
| Ledger | `ledger_accounts`, `ledger_entries` |
| Financial | `deposit_requests`, `withdrawal_requests`, `investments`, `investment_plans` |
| Referrals | `referral_relationships`, `referral_commissions` |
| Operations | `audit_logs`, `notifications`, `notification_events`, `feature_flags`, `system_settings` |
| Migration | `migration_runs`, `migration_checkpoints`, `legacy_transactions_archive` |
| RBAC | `permissions`, `role_permissions` |

Full schema: `src/db/schema/` + `supabase/migrations/0000_initial_schema.sql`

---

*Architecture v1.0 — July 2026*
