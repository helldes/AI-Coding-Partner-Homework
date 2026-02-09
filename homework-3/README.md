# Homework 3: Specification-Driven Design

**Student**: Andrii Kosholap
**Task**: Design a specification package for a finance-oriented application — Virtual Card Management System. Deliverables: specification, agent rules, editor/AI rules, and this README.

---

## Rationale

### Why this specification was written this way

The specification was designed to be **directly implementable by an AI coding partner** without requiring additional clarification rounds. Every business rule, state transition, data model constraint, and security requirement is defined explicitly enough that an agent can produce correct code on the first pass.

**Stack-specific for this homework**: while the specification emphasizes capability requirements, the project rules fix the implementation stack (TypeScript/NestJS/Prisma/PostgreSQL) in `agents.md` and the editor rules to ensure consistency. Low-level tasks and examples use this stack where needed for unambiguous AI-driven implementation.

**Two-level detail**: the document operates at two levels simultaneously:
- **Mid-Level Objectives** (7 items) give a product manager or tech lead a quick overview of what the system does.
- **Low-Level Tasks** (10 items) give an AI agent or developer the exact functions, DTOs, constraints, and edge cases needed to implement each module.

Each low-level task follows a structured template ("What prompt would you run?", "What file to create/update?", "What function?", "Details") that maps directly to how AI coding partners consume instructions.

**Iterative refinement with AI reviewers**: the specification went through multiple review cycles using Codex and Copilot as reviewers. Each round identified internal inconsistencies (e.g., ledger invariant conflicts with reversal handling, idempotency scope collisions, PII leaking into audit snapshots). These were resolved systematically, resulting in a specification that is internally consistent and free of contradictions.

---

## Industry Best Practices

The following FinTech, banking, and security best practices are incorporated into the specification. Each entry references the exact location where it appears.

### PCI DSS v4.0 Compliance

| Practice | Location in spec |
|----------|-----------------|
| AES-256-GCM encryption for PANs at rest | `specification.md` § Security & Compliance, § Task 1 |
| Key rotation via embedded `keyId` prefix in ciphertext | `specification.md` § Security & Compliance (PAN encryption) |
| `maskedPan` exposes only last 4 digits; API never returns more | `specification.md` § Security & Compliance (PAN masking) |
| HSM interface (`KmsService`) for key management | `specification.md` § Technology Requirements, § Out of Scope |
| PAN never appears in logs — enforced by redaction layer | `specification.md` § Error Handling & Logging |
| `audit_writer` DB role with INSERT-only permissions | `specification.md` § Audit, § Task 6 |
| Sensitive-read auditing (PAN decryption, PII viewing) | `specification.md` § Audit |

### GDPR / Data Protection

| Practice | Location in spec |
|----------|-----------------|
| Per-user PII encryption keys (separate from PCI PAN keys) | `specification.md` § Data Ownership & GDPR |
| Right-to-erasure via crypto-shredding | `specification.md` § Data Ownership & GDPR |
| Audit snapshots use allowlist — PII never enters audit records | `specification.md` § Audit (Audit payload safety) |
| `notificationPreferences` stores channel toggles only, no PII | `specification.md` § ER Diagram (USER entity), § Task 7 |
| 7-year retention with automatic archival to cold storage | `specification.md` § Audit |

### Double-Entry Bookkeeping & Financial Integrity

| Practice | Location in spec |
|----------|-----------------|
| Every authorization/refund produces exactly 2 balanced ledger entries | `specification.md` § Mid-Level Objective 2, § Task 5 |
| `amountMinor` (BIGINT) as source of truth, never IEEE 754 floats | `specification.md` § Financial Precision |
| Double-entry invariant (SUM(DEBIT)=SUM(CREDIT) per transaction) | `specification.md` § Task 1, § Task 5 |
| `LedgerEntry` append-only: DB role permissions + trigger protection | `specification.md` § Task 1 |
| Two-phase model prevents settlement double-counting | `specification.md` § Mid-Level Objective 2 |
| ISO 4217 currency exponent lookup table | `specification.md` § Financial Precision |

### Audit Trail & Compliance Reporting

| Practice | Location in spec |
|----------|-----------------|
| Immutable append-only `AuditEvent` table | `specification.md` § Audit |
| Audit on failures (declined transactions, invalid transitions) | `specification.md` § Audit |
| Correlation IDs for multi-step business operation tracing | `specification.md` § Audit, § Task 6 |
| Per-resource-type audit snapshot allowlist (Card, Transaction, User, SpendingLimit) | `specification.md` § Audit |
| Export with safety limits (90-day max, 1M records, field allowlist) | `specification.md` § Task 8 |

### Security & Authentication

| Practice | Location in spec |
|----------|-----------------|
| JWT (RS256, 15-min) + opaque refresh tokens (Argon2id-hashed) | `specification.md` § Technology Requirements, § Task 2 |
| Refresh token rotation with family invalidation on reuse | `specification.md` § Task 2 |
| TOTP step-up verification for sensitive operations | `specification.md` § Security & Compliance |
| HMAC-SHA256 webhook signature verification (constant-time comparison) | `specification.md` § Task 5 |
| Anti-enumeration: identical 404 for "not found" and "not authorized" | `specification.md` § Security & Compliance |
| Rate limiting on login (5/min/IP) | `specification.md` § Task 2 |

### Idempotency & Reliability

| Practice | Location in spec |
|----------|-----------------|
| Unified idempotency model for client mutations and webhooks | `specification.md` § Idempotency |
| Scope-based key namespacing to prevent collisions | `specification.md` § Idempotency |
| Dead letter queue with exponential backoff (5 retries) | `specification.md` § DLQ Policy |
| Consumer deduplication by `event_id` | `specification.md` § Event Schema Contract |
| Serializable transactions with retry policy for consistency | `specification.md` § Financial Precision, § Concurrency Model |

### Operational Observability

| Practice | Location in spec |
|----------|-----------------|
| Structured JSON logging with sensitive-field redaction | `specification.md` § Error Handling & Logging |
| HTTP status code contract (400/401/403/404/409/422/429/500) | `specification.md` § HTTP Status Code Contract |
| Performance SLOs (p95 latency targets) | `specification.md` § Performance Requirements |
| Materialized view with `asOf` freshness indicator | `specification.md` § Task 8 |
| OWASP ZAP baseline scan + dependency audit in CI | `specification.md` § Testing Requirements |

---

## Deliverables Checklist

| # | File | Description |
|---|------|-------------|
| 1 | `specification.md` | Full product specification: objectives, implementation notes, data models, architecture diagrams, 10 low-level tasks |
| 2 | `agents.md` | AI agent guidelines: domain rules, code style, security constraints, testing expectations |
| 3 | `.github/copilot-instructions.md` | Editor/AI rules: naming conventions, patterns, security must-follow rules, what to avoid |
| 4 | `README.md` | This file — rationale, industry best practices with references to specification |
