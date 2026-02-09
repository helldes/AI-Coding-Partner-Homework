# Claude Code Instructions - Virtual Card Management System

## Source of Truth
- Always follow homework-3/specification.md for business rules, invariants, and data models.
- Follow homework-3/agents.md for coding constraints and security rules.

## Tech Stack
- TypeScript 5.x (strict), Node.js 20 LTS, NestJS 10.x, Prisma 5.x, PostgreSQL 16, Redis 7, Kafka 3 (KafkaJS), Jest 29, Testcontainers, Docker.
- Key libs: `decimal.js`, `uuidv7`, `otplib`, `nestjs-pino`, `argon2`, `class-validator`.

## Project Structure
```
src/
  ├── auth/            # JWT, refresh tokens, TOTP step-up
  ├── cards/           # Card lifecycle FSM, PAN encryption
  ├── transactions/    # Authorization, settlement, refund, ledger
  ├── limits/          # Spending limit strategies (chain of responsibility)
  ├── audit/           # Append-only audit trail, interceptor
  ├── notifications/   # Event consumers, delivery stubs
  ├── ops/             # Compliance dashboard, exports
  ├── common/          # Guards, filters, interceptors, utils
  └── config/          # Env validation, module config
test/
  ├── unit/            # Mocked dependencies
  ├── integration/     # Testcontainers (DB + Redis)
  ├── contract/        # OpenAPI validation
  └── security/        # OWASP ZAP config
db/
  └── migrations/      # Prisma migrations
```

## Domain Rules (Must Enforce)
- Card FSM: PENDING -> ACTIVE -> FROZEN <-> ACTIVE -> CLOSED (CLOSED is terminal).
- Two-phase transactions:
  - AUTHORIZATION creates Transaction + two LedgerEntry rows (DEBIT/CREDIT).
  - SETTLEMENT updates status in-place; no new ledger entries.
  - REFUND creates new Transaction + reverse ledger entries.
  - DECLINE is type AUTHORIZATION + status DECLINED; no ledger entries.
- Double-entry: exactly two LedgerEntry rows per authorized/refund; SUM(DEBIT)=SUM(CREDIT).
- amountMinor (BIGINT) is source of truth; Decimal is derived.
- Spending limits: MCC blocklist -> per-tx -> daily -> monthly; UTC windows; refunds do not restore headroom.

## Security and Compliance
- Never log or return PAN/CVV/PII/secrets. Only maskedPan (last 4).
- PAN encrypted with AES-256-GCM, keyId prefix; keys via KmsService.
- Refresh tokens: Argon2id hash; single-use; reuse invalidates family.
- Webhooks: HMAC-SHA256 validation required; constant-time compare.
- Audit: append-only; no UPDATE/DELETE; separate audit writer role; best-effort allowed.
- Audit snapshots must use a per-resource allowlist; never include PII or PAN in audit snapshots.

## Idempotency
- Client mutations require Idempotency-Key; webhooks use processor idempotencyKey.
- Same key+payload -> return cached response; different payload -> 409.
- Scope:
  - Client: `<method>:<path>:<actor_id>`
  - Webhook: `<method>:<path>:<processor_id>`

## Coding Guidelines
- Controllers thin; business logic in services.
- Use `prisma.$transaction()` with `Serializable` isolation + retry (3x, 100/200/400 ms) for critical ops.
- No raw SQL unless required; never use `SELECT *` in raw SQL.
- Use explicit DTO validation (`class-validator`); never expose stack traces.
- Throw typed domain errors (`InvalidStateTransitionError`), not `HttpException` from services.

## Framework Conventions
- Use NestJS decorators for cross-cutting concerns (`@Roles`, `@RequireStepUp`, `@Auditable`).
- Use guards for auth/roles/step-up, interceptors for audit/correlation IDs, exception filters for global error handling.

## Code Examples

### Right: monetary math
```typescript
import Decimal from 'decimal.js';
const display = new Decimal(amountMinor).div(new Decimal(10).pow(exponent));
```

### Wrong: monetary math
```typescript
const display = amountMinor / 100; // float — FORBIDDEN
```

### Right: audit snapshot
```typescript
auditService.record({ previousState: pick(card, CARD_AUDIT_FIELDS) }); // allowlist
```

### Wrong: audit snapshot
```typescript
auditService.record({ previousState: card }); // leaks encryptedPan, PII
```

## Testing
- >=90% line coverage for services/validators.
- Must include negative tests: auth failures, token reuse, invalid transitions, limit violations, webhook tampering, idempotency replay.
- Use synthetic data only in fixtures (no real PAN/PII).

## Output Expectations
- Prefer concise changes; update docs when behavior changes.
- When in doubt, ask for clarification before implementing risky changes.
