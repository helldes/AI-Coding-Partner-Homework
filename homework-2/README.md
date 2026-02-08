# Customer Support Ticket Management System

Production-grade REST API for managing customer support tickets with automatic classification, multi-format import, and comprehensive filtering.

## Features

- **Multi-Format Import**: CSV, JSON, XML file parsing
- **Auto-Classification**: AI-driven category and priority assignment
- **REST API**: Full CRUD operations with filtering
- **Validation**: Strict input validation with Zod
- **PostgreSQL**: Reliable data persistence
- **Type-Safe**: Full TypeScript implementation
- **Test Coverage**: >85% code coverage

## Architecture

```mermaid
graph TD
    A[Client] -->|HTTP| B[Express API]
    B --> C[Validation Layer]
    C --> D[Ticket Service]
    D --> E[Classification Service]
    D --> F[Database]
    B --> G[Import Service]
    G --> C
    E --> D
```

## Installation

```bash
npm install
```

## Configuration

Create `.env`:

```
DATABASE_URL="postgresql://admin:admin123@localhost:5432/support_system"
PORT=3000
NODE_ENV=development
```

## Database Setup

```bash
docker-compose up -d
npx prisma generate
npx prisma migrate dev
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## Testing

Run all tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

Coverage:
```bash
npm test -- --coverage
```

## Project Structure

```
homework-2/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── tickets.routes.ts
│   ├── services/
│   │   ├── classification.service.ts
│   │   ├── database.service.ts
│   │   ├── import.service.ts
│   │   └── ticket.service.ts
│   ├── types/
│   │   └── ticket.types.ts
│   └── utils/
│       └── validation.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── prisma/
│   └── schema.prisma
└── docs/
```

## API Endpoints

- `POST /tickets` - Create ticket
- `POST /tickets/import` - Bulk import
- `GET /tickets` - List tickets
- `GET /tickets/:id` - Get ticket
- `PUT /tickets/:id` - Update ticket
- `DELETE /tickets/:id` - Delete ticket
- `POST /tickets/:id/auto-classify` - Classify ticket

See [API_REFERENCE.md](docs/API_REFERENCE.md) for details.

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Parsers**: csv-parser, xml2js

## License

ISC
