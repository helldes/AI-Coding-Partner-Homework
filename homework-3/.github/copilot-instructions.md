# Copilot Instructions — Virtual Card Management System

## Project Overview

This is a FinTech backend system for virtual card management with double-entry bookkeeping, PCI DSS compliance, and regulatory audit trails. The full specification is in `specification.md`; agent guidelines are in `agents.md`.

## Tech Stack (with versions)

- **TypeScript** 5.x (strict mode), **Node.js** 20 LTS, **NestJS** 10.x
- **PostgreSQL** 16.x, **Prisma** 5.x, **Redis** 7.x, **Apache Kafka** 3.x (KafkaJS)
- **Jest** 29.x + **Testcontainers**, **ESLint** + **Prettier**
- Key libs: `decimal.js`, `uuidv7`, `otplib`, `nestjs-pino`, `argon2`

## Naming Conventions

- Files: `kebab-case` (e.g., `card-lifecycle.service.ts`)
- Classes/Interfaces: `PascalCase` (e.g., `TransactionsService`, `CardStatus`)
- Functions/Variables: `camelCase` (e.g., `processAuthorization`, `amountMinor`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)
- DB columns: `snake_case` (e.g., `amount_minor`, `created_at`)
- Enum values: `UPPER_SNAKE_CASE` (e.g., `AUTHORIZED`, `CARD_HOLDER`)

## Module Structure

Every domain module follows:
```
src/<module>/
  ├── controller    # HTTP layer
  ├── service       # Business logic
  ├── dto/          # Request/response validation
  ├── entities/     # ORM models
  └── (optional)    # strategies/, state-machine/, etc.
```

## Patterns to Follow

- **FSM** for card state transitions (PENDING → ACTIVE → FROZEN ↔ ACTIVE → CLOSED)
- **Chain of Responsibility** for spending limit evaluation (MCC → per-tx → daily → monthly)
- **Strategy** for notification delivery (email/SMS/push stubs)
- **Double-entry bookkeeping**: every authorization/refund creates exactly 2 LedgerEntry records (DEBIT + CREDIT, equal amounts)
- **Typed domain errors** mapped to HTTP codes via global exception filter
- **DTOs with class-validator** on every endpoint boundary

## Monetary Values

- Use `amountMinor` (BIGINT) as source of truth — smallest currency unit
- `amount` (Decimal) is derived, display-only
- NEVER use floats for money — use `decimal.js`
- Currency exponent from static ISO 4217 lookup table

## Security Rules — MUST Follow

- NEVER log PAN, CVV, passwords, encryption keys, TOTP secrets, or PII
- NEVER store PAN in plaintext — always AES-256-GCM encrypted
- NEVER expose more than `maskedPan` (last 4 digits) in API responses
- NEVER return stack traces in error responses
- NEVER allow UPDATE/DELETE on `LedgerEntry` or `AuditEvent` tables
- NEVER use `SELECT *` in raw SQL — specify columns explicitly
- NEVER skip HMAC validation on webhook endpoints
- NEVER include PII in audit event snapshots — use per-resource allowlist
- ALWAYS use parameterized queries — no raw SQL concatenation
- ALWAYS validate input with schema-based DTOs at API boundaries
- ALWAYS use constant-time comparison for HMAC signatures

## Database Transactions

- SERIALIZABLE isolation for: authorization + ledger writes, card state transitions, limit updates
- READ COMMITTED for: read-only queries, audit writes, notification dispatch
- Retry policy: 3 attempts, exponential backoff (100/200/400 ms) on serialization failures

## Idempotency

- Client mutations: require `Idempotency-Key` header
- Webhooks: use processor-provided `idempotencyKey`
- Scope:
  - Client: `<method>:<path>:<actor_id>`
  - Webhook: `<method>:<path>:<processor_id>` (or tenant identifier in multi-tenant setups)
- Same key + same payload → return cached response
- Same key + different payload → 409 Conflict

## Testing

- >= 90% line coverage for domain services and validators
- Must include negative tests: invalid JWT, wrong role, state transition violations, limit breaches, HMAC tampering, idempotency replay
- Integration tests use Testcontainers (PostgreSQL + Redis)
- Use synthetic data only in fixtures — never real PAN/PII

## Code Examples

### Right: monetary calculation
```typescript
import Decimal from 'decimal.js';
const total = new Decimal(amountMinor).div(new Decimal(10).pow(exponent));
```

### Wrong: monetary calculation
```typescript
const total = amountMinor / 100; // IEEE 754 float — FORBIDDEN
```

### Right: domain error
```typescript
throw new InvalidStateTransitionError(card.status, CardStatus.ACTIVE);
// GlobalExceptionFilter maps this to { statusCode: 422, message, correlationId }
```

### Wrong: domain error
```typescript
throw new HttpException('Invalid transition', 422); // raw HTTP error in service
```

### Right: audit snapshot
```typescript
auditService.record({
  previousState: pick(card, CARD_AUDIT_FIELDS), // allowlist
  newState: pick(updatedCard, CARD_AUDIT_FIELDS),
});
```

### Wrong: audit snapshot
```typescript
auditService.record({ previousState: card }); // leaks encryptedPan, PII
```

## What to Avoid

- Do not introduce new dependencies without justification
- Do not add UI/frontend code — this is API-only
- Do not use IEEE 754 floats for monetary calculations
- Do not create `Merchant` entity — merchant metadata is denormalized into Transaction
- Do not support multi-currency exchange or partial settlement
- Do not use `any` types or disable type checking
- Do not create catch-all error handlers that swallow errors silently
- Do not store raw refresh tokens — always hash with Argon2id before storage
