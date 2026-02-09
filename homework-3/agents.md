# AI Agent Guidelines — Virtual Card Management System

> These guidelines define how an AI coding partner (Copilot, Claude Code, Cursor, Codex, etc.) should behave when generating, reviewing, or modifying code in this project.

---

## 1. Project Context

- **Domain**: FinTech — virtual card issuance, transaction processing, double-entry bookkeeping, compliance/audit.
- **Regulatory environment**: PCI DSS v4.0, PSD2, GDPR. Every decision must consider auditability, data protection, and separation of concerns for sensitive data.
- **Specification**: all business rules, state machines, invariants, and data models are defined in `specification.md`. When in doubt, the specification is the single source of truth.
- **No implementation exists yet** — the codebase is greenfield.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Language | **TypeScript** | 5.x (strict mode) | Statically typed, enterprise-grade backend |
| Runtime | **Node.js** | 20 LTS | Long-term support, native ESM |
| Framework | **NestJS** | 10.x | Modular architecture, DI, interceptors/guards/pipes, Swagger/OpenAPI generation |
| Database | **PostgreSQL** | 16.x | Serializable isolation, partial indexes, JSONB, `tsvector` FTS, role-based access, table partitioning |
| ORM | **Prisma** | 5.x | Type-safe queries, declarative schema, migrations, explicit `$transaction()` with isolation levels |
| Cache | **Redis** | 7.x | Rate limiting, step-up session storage, idempotency key TTL |
| Message Broker | **Apache Kafka** | 3.x (via KafkaJS) | Event streaming, consumer groups, at-least-once delivery, DLQ topics |
| Auth | **@nestjs/jwt** + **@nestjs/passport** | — | RS256 JWT access tokens, Passport strategies |
| Hashing | **argon2** (native binding) | — | Refresh token hashing, TOTP recovery code hashing |
| Encryption | **Node.js `crypto`** (built-in) | — | AES-256-GCM for PAN/PII, HMAC-SHA256 for webhooks |
| Validation | **class-validator** + **class-transformer** | — | DTO schema validation, request pipe |
| Testing | **Jest** | 29.x | Unit + integration tests, coverage reporting |
| Integration testing | **Testcontainers** | — | Containerized PostgreSQL + Redis for integration tests |
| API docs | **@nestjs/swagger** | — | Auto-generated OpenAPI 3.1 spec |
| Containerization | **Docker** + **Docker Compose** | — | Multi-stage build, local dev orchestration |
| CI | **GitHub Actions** | — | Lint → test → audit → build pipeline |
| Linting | **ESLint** + **Prettier** | — | Code style enforcement, consistent formatting |

### Key Library Choices

- **UUIDv7**: `uuidv7` package — guarantees monotonicity within a single process (timestamp + monotonic counter).
- **Decimal arithmetic**: `decimal.js` — arbitrary-precision decimals for monetary calculations (never IEEE 754 floats).
- **TOTP**: `otplib` — RFC 6238 compliant, 6-digit codes, 30-second window.
- **Structured logging**: `nestjs-pino` + `pino` — JSON logging with redaction paths for sensitive fields.
- **OWASP ZAP**: Docker image `zaproxy/zap-stable` for baseline security scans in CI.

### Conventions for Framework-Specific Code

- Use NestJS **decorators** for cross-cutting concerns: `@Roles()`, `@RequireStepUp()`, `@Auditable()`.
- Use NestJS **guards** for auth (`AuthGuard`, `RolesGuard`, `StepUpGuard`).
- Use NestJS **interceptors** for audit logging (`AuditInterceptor`) and correlation ID injection (`CorrelationIdInterceptor`).
- Use NestJS **exception filters** for global error handling (`GlobalExceptionFilter`).
- Use Prisma **`$transaction()`** with `isolationLevel: Prisma.TransactionIsolationLevel.Serializable` for critical business operations.
- Use `@nestjs/microservices` with KafkaJS transport for event consumers.
- Keep business logic in **service classes** — controllers are thin (validate input, call service, return response).

---

## 3. Domain Rules (Banking / FinTech)

### 3.1 Card Lifecycle FSM

- Valid states: `PENDING → ACTIVE → FROZEN ↔ ACTIVE → CLOSED`.
- `CLOSED` is a terminal state — no transitions out.
- Every state transition must be wrapped in a **serializable DB transaction** with retry (3x, exponential backoff: 100/200/400 ms).
- Every transition emits an **audit event** and a **domain event** to the message broker.

### 3.2 Transaction Model (Two-Phase)

- `AUTHORIZATION` creates the Transaction + ledger entries (DEBIT/CREDIT pair).
- `SETTLEMENT` updates the existing Transaction status in-place — **no new ledger entries**.
- `REFUND` creates a new Transaction (`type: REFUND`) with **reverse ledger entries**.
- `DECLINE` creates a Transaction (`type: AUTHORIZATION`, `status: DECLINED`) — **no ledger entries**.
- Settlement amount must equal authorization amount; partial settlement is not supported.

### 3.3 Double-Entry Bookkeeping

- Every authorized/refunded transaction produces exactly **two** `LedgerEntry` records with equal positive `amountMinor` values.
- Invariant: `SUM(DEBIT) = SUM(CREDIT)` per transaction — enforced at application level and, where supported, via a DB-level deferred constraint.
- `LedgerEntry` is **append-only**: no updates, no deletes. Enforce via DB role permissions (`INSERT` + `SELECT` only) and, where supported, a `BEFORE UPDATE OR DELETE` trigger (recommended for PostgreSQL). In dev/CI, soft-enforcement is acceptable; in prod, hard-enforcement is required.

### 3.4 Monetary Precision

- **Source of truth**: `amountMinor` (BIGINT) — smallest currency unit (cents, kopecks, etc.).
- `amount` (Decimal) is derived and display-only.
- **Never use IEEE 754 floats** for monetary calculations. Use arbitrary-precision decimals.
- Currency exponent resolved from a static ISO 4217 lookup table.

### 3.5 Spending Limits

- Evaluation order (fail-fast): MCC blocklist → per-transaction → daily aggregate → monthly aggregate.
- Aggregation includes only `AUTHORIZED` and `SETTLED` transactions.
- Refunds do **not** restore limit headroom (design decision).
- Time windows use **UTC**.

---

## 4. Code Style & Conventions

### 4.1 Naming

- **Files**: kebab-case (e.g., `card-lifecycle.service.ts`, `spending-limit.strategy.ts`).
- **Classes/Types**: PascalCase (e.g., `TransactionsService`, `CardStatus`).
- **Functions/Methods**: camelCase (e.g., `processAuthorization`, `evaluateLimits`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`, `DEFAULT_MCC_BLOCKLIST`).
- **Database columns**: snake_case (e.g., `amount_minor`, `created_at`, `merchant_category_code`).
- **Enums**: UPPER_SNAKE_CASE values (e.g., `AUTHORIZED`, `CARD_HOLDER`, `PER_TRANSACTION`).

### 4.2 Module Structure

Each domain module follows a consistent internal structure:

```
src/<module>/
  ├── controller    # HTTP endpoints, request/response DTOs
  ├── service       # Business logic
  ├── dto/          # Data transfer objects (input validation)
  ├── entities/     # Data models / ORM entities
  └── (optional)    # strategies/, state-machine/, etc.
```

### 4.3 Error Handling

- Use **typed domain error classes** (e.g., `InvalidStateTransitionError`, `SpendingLimitExceededError`).
- Map domain errors to HTTP status codes in a **global exception filter** — never throw raw HTTP errors from services.
- Return `{ statusCode, message, correlationId }` — never stack traces in production.
- Log all errors with structured JSON and correlation ID.

### 4.4 DTOs and Validation

- Every endpoint has a dedicated **request DTO** with schema-based validation.
- Use parameterized queries only — **no raw SQL strings**.
- Output encoding to prevent XSS in any future UI layer.

---

## 5. Security & Compliance Constraints

### 5.1 What the Agent Must NEVER Do

- **Never log or print** PAN, CVV, passwords, encryption keys, TOTP secrets, or PII fields.
- **Never store PAN in plaintext** — always `encryptedPan` (AES-256-GCM with keyId prefix).
- **Never expose more than `maskedPan`** (last 4 digits) in API responses.
- **Never use floats** for monetary calculations.
- **Never allow `UPDATE` or `DELETE` on `LedgerEntry` or `AuditEvent`** records.
- **Never return stack traces** in HTTP error responses.
- **Never skip HMAC validation** on webhook endpoints.
- **Never use `SELECT *` in raw SQL** — always specify exact columns, especially when joining tables with encrypted fields. With ORM query builders, explicitly select fields where possible.
- **Never include PII in audit snapshots** — use the per-resource-type allowlist defined in the specification.

### 5.2 Authentication & Authorization

- All endpoints require JWT Bearer token (RS256, 15-min expiry).
- Refresh tokens: opaque, stored hashed (Argon2id), single-use with rotation.
- Reuse of a consumed refresh token invalidates the entire token family.
- Sensitive operations require step-up TOTP verification (scoped to session + device fingerprint).
- Role-based access: `USER`, `COMPLIANCE_OFFICER`, `ADMIN` — enforce via guards/middleware.

### 5.3 PCI DSS Compliance

- PAN encrypted with AES-256-GCM; ciphertext format: `keyId(4B) || iv(12B) || ciphertext || authTag(16B)`.
- Key management via `KmsService` interface (HSM in production, software stub in dev/CI).
- PAN keys are system-level (not per-user); they survive crypto-shredding.

### 5.4 GDPR Compliance

- Per-user PII encryption keys (AES-256); right-to-erasure via crypto-shredding.
- After shredding: PII unreadable, but PAN (PCI key), masked PAN, transactions, ledger entries, and audit records remain intact.

### 5.5 Audit Requirements

- Every state change and sensitive-data access produces an `AuditEvent`.
- Audit on failures: `new_state = null`, `error_reason` captured.
- Audit writes use a **separate DB connection** with `INSERT`+`SELECT` only.
- Audit is best-effort (does not block business transactions); failures logged at `CRITICAL` level.

---

## 6. Testing Expectations

### 6.1 Coverage

- **>= 90% line coverage** for domain services and validators.
- **Excluded from coverage**: `test/`, `src/config/`, generated ORM clients/migrations (`db/`), application entry point (`src/main.*`), Docker/CI configuration.

### 6.2 Test Types

| Type | Scope | Infrastructure |
|------|-------|----------------|
| Unit | Domain services, validators, strategies, state machine | Mocked dependencies |
| Integration | Full request lifecycle, DB interactions | Containerized DB + cache (Docker) |
| Contract | OpenAPI request/response validation | Schema-driven |
| Security | OWASP ZAP baseline scan, dependency audit | CI pipeline |

### 6.3 Mandatory Negative Tests

The agent must generate tests for:

- Unauthorized access (missing/invalid JWT, wrong role).
- Refresh token reuse detection (must invalidate family).
- Invalid state transitions (e.g., `CLOSED → ACTIVE`).
- Spending limit violations (per-tx, daily, monthly, MCC).
- Webhook HMAC signature tampering.
- Idempotency key replay (same key, different payload → 409).
- Anti-enumeration (404 for both "not found" and "not authorized" on user endpoints).
- Test fixtures must use synthetic data only; never use real PAN/PII in fixtures.

---

## 7. Patterns & Architecture

### 7.1 Required Patterns

- **Finite State Machine** for card lifecycle transitions.
- **Chain of Responsibility** for spending limit evaluation (fail-fast order).
- **Strategy Pattern** for notification delivery (email, SMS, push — all stubs).
- **Outbox Pattern** (upgrade path) for audit consistency if best-effort becomes insufficient.
- **Double-Entry Bookkeeping** with balanced ledger pairs.

### 7.2 Idempotency

- Client mutations require `Idempotency-Key` header.
- Webhooks use processor-provided `idempotencyKey`.
- Scope:
  - Client mutations: `<method>:<actual_path>:<actor_id>`.
  - Webhooks: `<method>:<actual_path>:<processor_id>` (or tenant identifier in multi-tenant setups).
- Same key + same payload → cached response; different payload → 409.
- Storage: `idempotency_keys` table with TTL (24h client, 7d webhook).

### 7.3 Event-Driven Communication

- Domain events follow a standardized envelope (see `specification.md § Event Schema Contract`).
- Topics: `card.*`, `transaction.*`, `ops.alerts`.
- Consumer deduplication by `event_id`.
- DLQ after 5 retries with exponential backoff.

### 7.4 Concurrency

- **SERIALIZABLE** for: authorization + ledger, card state transitions, limit updates.
- **READ COMMITTED** for: read-only queries, audit writes, notification dispatch.
- All serializable transactions use 3x retry with exponential backoff.

---

## 8. Code Examples (Right vs Wrong)

### 8.1 Monetary Calculations

```typescript
// WRONG — floating point
const amount = transaction.amountMinor / 100;
const total = amount1 + amount2;

// RIGHT — arbitrary-precision decimal
import Decimal from 'decimal.js';
const amount = new Decimal(transaction.amountMinor).div(
  new Decimal(10).pow(currencyExponent),
);
```

### 8.2 Serializable Transaction with Retry

```typescript
// WRONG — no isolation, no retry
await this.prisma.transaction.create({ data: txData });
await this.prisma.ledgerEntry.createMany({ data: entries });

// RIGHT — serializable + retry
await retry(
  () =>
    this.prisma.$transaction(
      async (tx) => {
        const transaction = await tx.transaction.create({ data: txData });
        await tx.ledgerEntry.createMany({ data: entries });
        return transaction;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  { retries: 3, backoff: [100, 200, 400] },
);
```

### 8.3 Error Handling in Services

```typescript
// WRONG — throwing HTTP errors from service
throw new HttpException('Card not found', 404);

// RIGHT — typed domain error, mapped by filter
throw new InvalidStateTransitionError(card.status, CardStatus.ACTIVE);
```

### 8.4 Logging Sensitive Data

```typescript
// WRONG — PAN in logs
this.logger.log(`Processing card ${card.encryptedPan}`);
this.logger.log(`User email: ${user.email}`);

// RIGHT — only safe identifiers
this.logger.log(`Processing card ${card.id} (${card.maskedPan})`);
this.logger.log(`User ${user.id} action completed`);
```

### 8.5 Audit Snapshot Allowlist

```typescript
// WRONG — dumping full entity (leaks PII/PAN)
auditService.record({ previousState: card, newState: updatedCard });

// RIGHT — allowlist only safe fields
const CARD_AUDIT_FIELDS = ['id', 'status', 'currency', 'maskedPan',
  'singleTransactionLimit', 'dailyLimit', 'monthlyLimit', 'closedAt'] as const;

auditService.record({
  previousState: pick(card, CARD_AUDIT_FIELDS),
  newState: pick(updatedCard, CARD_AUDIT_FIELDS),
});
```

### 8.6 HMAC Webhook Validation

```typescript
// WRONG — string comparison (timing attack)
if (signature !== expectedSignature) throw new Error();

// RIGHT — constant-time comparison
import { timingSafeEqual } from 'crypto';
const sigBuffer = Buffer.from(signature, 'hex');
const expectedBuffer = Buffer.from(expectedSignature, 'hex');
if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
  throw new UnauthorizedException();
}
```

---

## 9. What to Reference

When generating or modifying code, the agent should always consult:

1. **`specification.md`** — business rules, state machines, data models, invariants.
2. **This file (`agents.md`)** — coding guidelines, security constraints, domain rules.
3. **Editor/AI rules** (`.github/copilot-instructions.md`, `.claude/claude.md`) — naming conventions, patterns, anti-patterns.
4. **Existing code** — follow established patterns; do not introduce inconsistencies.

When the specification and code diverge, **the specification wins** unless there is a documented reason for the deviation.
