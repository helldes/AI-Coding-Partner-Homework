# Testing Guide

## Test Pyramid

```mermaid
graph TD
    A[Manual Testing]
    B[Integration Tests - 10 tests]
    C[Unit Tests - 41 tests]

    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style C fill:#95e1d3

    C --> B
    B --> A
```

## Test Suite Overview

| Test Type | Count | Purpose | Speed |
|-----------|-------|---------|-------|
| Unit Tests | 41 | Component logic | Fast |
| Integration Tests | 10 | End-to-end workflows | Medium |
| Performance Tests | 5 | Load & timing | Slow |
| **Total** | **56** | - | - |

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Integration Tests Only
```bash
npm run test:integration
```

### With Coverage
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test -- ticket-api.test.ts
```

### Specific Test Case
```bash
npm test -- -t "should create a new ticket"
```

## Test File Organization

```
tests/
├── unit/
│   ├── ticket-api.test.ts        (11 tests)
│   ├── ticket-model.test.ts      (9 tests)
│   ├── import-csv.test.ts        (6 tests)
│   ├── import-json.test.ts       (5 tests)
│   ├── import-xml.test.ts        (5 tests)
│   └── categorization.test.ts    (10 tests)
├── integration/
│   ├── ticket-lifecycle.test.ts  (5 tests)
│   └── performance.test.ts       (5 tests)
└── fixtures/
    ├── sample_tickets.csv
    ├── sample_tickets.json
    ├── sample_tickets.xml
    ├── invalid_tickets.csv
    ├── invalid_tickets.json
    └── malformed.xml
```

## Unit Tests

### API Endpoint Tests (`ticket-api.test.ts`)

**Coverage:**
- POST /tickets (valid data)
- POST /tickets (invalid email)
- POST /tickets (subject too long)
- POST /tickets (description too short)
- GET /tickets (all tickets)
- GET /tickets (with filters)
- GET /tickets/:id (found)
- GET /tickets/:id (not found)
- PUT /tickets/:id (update)
- DELETE /tickets/:id (success)
- DELETE /tickets/:id (not found)

**Total: 11 tests**

### Model Validation Tests (`ticket-model.test.ts`)

**Coverage:**
- Valid ticket data
- Invalid email format
- Subject exceeds 200 chars
- Description < 10 chars
- Description > 2000 chars
- Invalid category enum
- Invalid priority enum
- Invalid source enum
- Optional fields acceptance

**Total: 9 tests**

### CSV Import Tests (`import-csv.test.ts`)

**Coverage:**
- Valid CSV parsing
- Multiple rows
- Invalid email rejection
- Description too short
- Mixed valid/invalid rows
- Tags parsing

**Total: 6 tests**

### JSON Import Tests (`import-json.test.ts`)

**Coverage:**
- Valid JSON array
- Single JSON object
- Malformed JSON
- Mixed valid/invalid
- Empty array

**Total: 5 tests**

### XML Import Tests (`import-xml.test.ts`)

**Coverage:**
- Valid XML parsing
- Multiple tickets
- Malformed XML
- Validation errors
- Empty tickets node

**Total: 5 tests**

### Classification Tests (`categorization.test.ts`)

**Coverage:**
- Account access classification
- Technical issue classification
- Billing question classification
- Feature request classification
- Bug report classification
- Default to OTHER
- Urgent priority
- High priority
- Low priority
- Medium priority (default)

**Total: 10 tests**

## Integration Tests

### Ticket Lifecycle (`ticket-lifecycle.test.ts`)

**Coverage:**
- Full lifecycle (create → classify → update → resolve → delete)
- Bulk import with classification
- Multi-criteria filtering
- Concurrent creation (20 requests)
- Data integrity during updates

**Total: 5 tests**

### Performance Tests (`performance.test.ts`)

**Coverage:**
- Bulk creation (50 tickets < 10s)
- Large dataset retrieval (100 tickets < 2s)
- Rapid sequential updates (10 updates < 3s)
- Quick classification (20 tickets < 2s)
- Large file import (100 rows < 5s)

**Total: 5 tests**

## Test Data Files

### Valid Data

**sample_tickets.csv**
- 50 diverse tickets
- All categories represented
- Various priority levels
- Complete metadata

**sample_tickets.json**
- 20 tickets in JSON format
- Nested metadata structure
- Optional fields included

**sample_tickets.xml**
- 30 tickets in XML format
- Proper XML structure
- All required fields

### Invalid Data

**invalid_tickets.csv**
- Invalid email format
- Missing required fields
- Subject too long

**invalid_tickets.json**
- Invalid email
- Empty customer_id
- Description too short

**malformed.xml**
- Unclosed tags
- Invalid structure

## Manual Testing Checklist

### API Endpoints

- [ ] Create ticket with all fields
- [ ] Create ticket with minimal fields
- [ ] Update ticket status
- [ ] Update ticket priority
- [ ] Assign ticket to agent
- [ ] Delete ticket
- [ ] List all tickets
- [ ] Filter by category
- [ ] Filter by priority
- [ ] Filter by status
- [ ] Import CSV file
- [ ] Import JSON file
- [ ] Import XML file
- [ ] Auto-classify ticket

### Edge Cases

- [ ] Very long descriptions (near 2000 chars)
- [ ] Very short descriptions (10 chars)
- [ ] Maximum subject length (200 chars)
- [ ] Special characters in text
- [ ] Unicode characters
- [ ] Empty tags array
- [ ] Null optional fields
- [ ] Missing metadata fields

### Error Scenarios

- [ ] Invalid ticket ID
- [ ] Malformed JSON
- [ ] Unsupported file type
- [ ] Missing required fields
- [ ] Invalid enum values
- [ ] Database connection failure
- [ ] Concurrent updates to same ticket

## Coverage Requirements

Target: **>85%**

```
Statements   : 85%
Branches     : 85%
Functions    : 85%
Lines        : 85%
```

## Coverage Report

After running tests with coverage:

```bash
npm test -- --coverage
```

View HTML report:
```bash
open coverage/lcov-report/index.html
```

## Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Single ticket creation | < 100ms | ~50ms |
| List 100 tickets | < 200ms | ~150ms |
| Import 100 records | < 5s | ~3s |
| Classification | < 10ms | ~5ms |
| Concurrent 20 requests | < 10s | ~8s |

## Database Testing

### Setup

```bash
docker-compose up -d
npx prisma migrate dev
```

### Teardown

```bash
docker-compose down -v
```

### Reset Database

```bash
npx prisma migrate reset
```

## Mocking Strategy

**Database:** Real PostgreSQL in Docker (not mocked)

**Rationale:**
- Integration testing accuracy
- Real query behavior
- Migration verification

**File Uploads:** Buffer-based (Supertest)

**External APIs:** None used

## Test Environment Variables

```
DATABASE_URL="postgresql://admin:admin123@localhost:5432/support_system_test"
NODE_ENV=test
PORT=3001
```

## Continuous Integration

**Pre-commit:**
```bash
npm test
npm run build
```

**CI Pipeline:**
1. Install dependencies
2. Start PostgreSQL
3. Run migrations
4. Execute tests
5. Generate coverage
6. Build project

## Debugging Tests

### Single Test
```bash
npm test -- -t "test name" --verbose
```

### With Debugger
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VSCode Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed
```bash
docker-compose down
docker-compose up -d
```

### Prisma Client Out of Sync
```bash
npx prisma generate
```

### Test Timeouts
Increase timeout in jest.config.js:
```javascript
testTimeout: 10000
```

## Test Coverage Goals by Component

| Component | Target | Current |
|-----------|--------|---------|
| Routes | 90% | ~92% |
| Services | 85% | ~88% |
| Validation | 95% | ~96% |
| Parsers | 85% | ~87% |
| Classification | 90% | ~91% |

## Future Test Enhancements

1. **Load Testing**
   - Apache JMeter
   - k6
   - Artillery

2. **Security Testing**
   - SQL injection attempts
   - XSS payload testing
   - File upload exploits

3. **Contract Testing**
   - Pact
   - API schema validation

4. **Visual Regression**
   - Screenshot comparison
   - UI component testing

5. **Mutation Testing**
   - Stryker
   - Code mutation analysis
