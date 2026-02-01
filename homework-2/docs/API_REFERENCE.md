# API Reference

Complete API documentation for the Customer Support Ticket Management System.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required. Future versions will implement JWT-based authentication.

---

## Endpoints

### 1. Create Ticket

Create a new support ticket with optional auto-classification.

**Endpoint:** `POST /tickets`

**Request Body:**

```json
{
  "customer_id": "string",
  "customer_email": "user@example.com",
  "customer_name": "string",
  "subject": "string (1-200 chars)",
  "description": "string (10-2000 chars)",
  "category": "account_access | technical_issue | billing_question | feature_request | bug_report | other",
  "priority": "urgent | high | medium | low",
  "status": "new | in_progress | waiting_customer | resolved | closed",
  "assigned_to": "string (optional)",
  "tags": ["string"],
  "metadata": {
    "source": "web_form | email | api | chat | phone",
    "browser": "string (optional)",
    "device_type": "desktop | mobile | tablet (optional)"
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "customerId": "CUST001",
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "subject": "Cannot login to account",
  "description": "I forgot my password and cannot access my account",
  "category": "ACCOUNT_ACCESS",
  "priority": "URGENT",
  "status": "NEW",
  "createdAt": "2026-02-01T08:00:00.000Z",
  "updatedAt": "2026-02-01T08:00:00.000Z",
  "resolvedAt": null,
  "assignedTo": null,
  "tags": ["login", "password"],
  "source": "web_form",
  "browser": "Chrome",
  "deviceType": "desktop",
  "classificationConfidence": 0.9,
  "classificationReasoning": "Category: Matched 2 keyword(s). Priority: Matched 1 priority keyword(s)",
  "classificationKeywords": ["login", "password", "cannot access"]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "customer_email": "john.doe@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to account",
    "description": "I forgot my password and cannot access my account",
    "tags": ["login", "password"],
    "metadata": {
      "source": "web_form",
      "browser": "Chrome",
      "device_type": "desktop"
    }
  }'
```

---

### 2. Bulk Import Tickets

Import multiple tickets from CSV, JSON, or XML files.

**Endpoint:** `POST /tickets/import`

**Request:** `multipart/form-data`

- **file**: CSV, JSON, or XML file

**Response:** `200 OK`

```json
{
  "total": 50,
  "successful": 45,
  "failed": 5,
  "errors": [
    {
      "row": 12,
      "error": "Invalid email format"
    },
    {
      "row": 28,
      "error": "Description too short (minimum 10 characters)"
    }
  ]
}
```

**cURL Example (CSV):**

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.csv"
```

**cURL Example (JSON):**

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.json"
```

**cURL Example (XML):**

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.xml"
```

---

### 3. List Tickets

Retrieve all tickets with optional filtering.

**Endpoint:** `GET /tickets`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `priority` | string | Filter by priority |
| `status` | string | Filter by status |
| `customer_id` | string | Filter by customer ID |
| `assigned_to` | string | Filter by assignee |

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "customerId": "CUST001",
    "customerEmail": "user@example.com",
    "customerName": "John Doe",
    "subject": "Cannot login",
    "description": "Password issue",
    "category": "ACCOUNT_ACCESS",
    "priority": "URGENT",
    "status": "NEW",
    "createdAt": "2026-02-01T08:00:00.000Z",
    "updatedAt": "2026-02-01T08:00:00.000Z",
    "resolvedAt": null,
    "assignedTo": null,
    "tags": ["login"],
    "source": "web_form",
    "browser": "Chrome",
    "deviceType": "desktop",
    "classificationConfidence": 0.9,
    "classificationReasoning": "Auto-classified",
    "classificationKeywords": ["login", "password"]
  }
]
```

**cURL Examples:**

```bash
# Get all tickets
curl http://localhost:3000/tickets

# Filter by category
curl "http://localhost:3000/tickets?category=technical_issue"

# Filter by priority and status
curl "http://localhost:3000/tickets?priority=urgent&status=new"

# Filter by customer
curl "http://localhost:3000/tickets?customer_id=CUST001"
```

---

### 4. Get Ticket by ID

Retrieve a specific ticket by its ID.

**Endpoint:** `GET /tickets/:id`

**Path Parameters:**

- `id`: Ticket UUID

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "CUST001",
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "subject": "Cannot login",
  "description": "Password issue",
  "category": "ACCOUNT_ACCESS",
  "priority": "URGENT",
  "status": "NEW",
  "createdAt": "2026-02-01T08:00:00.000Z",
  "updatedAt": "2026-02-01T08:00:00.000Z",
  "resolvedAt": null,
  "assignedTo": null,
  "tags": ["login"],
  "source": "web_form",
  "browser": "Chrome",
  "deviceType": "desktop",
  "classificationConfidence": 0.9,
  "classificationReasoning": "Auto-classified",
  "classificationKeywords": ["login", "password"]
}
```

**Response:** `404 Not Found`

```json
{
  "error": "Ticket not found"
}
```

**cURL Example:**

```bash
curl http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### 5. Update Ticket

Update an existing ticket.

**Endpoint:** `PUT /tickets/:id`

**Path Parameters:**

- `id`: Ticket UUID

**Request Body:**

```json
{
  "subject": "string (optional)",
  "description": "string (optional)",
  "category": "account_access | technical_issue | ... (optional)",
  "priority": "urgent | high | medium | low (optional)",
  "status": "new | in_progress | ... (optional)",
  "assigned_to": "string (optional)",
  "tags": ["string"] (optional),
  "resolved_at": "ISO 8601 datetime (optional)"
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "customerId": "CUST001",
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "subject": "Updated subject",
  "description": "Updated description",
  "category": "TECHNICAL_ISSUE",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "createdAt": "2026-02-01T08:00:00.000Z",
  "updatedAt": "2026-02-01T08:15:00.000Z",
  "resolvedAt": null,
  "assignedTo": "agent@example.com",
  "tags": ["updated"],
  "source": "web_form",
  "browser": "Chrome",
  "deviceType": "desktop"
}
```

**Response:** `404 Not Found`

```json
{
  "error": "Ticket not found"
}
```

**cURL Example:**

```bash
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "agent@example.com"
  }'
```

---

### 6. Delete Ticket

Delete a ticket by ID.

**Endpoint:** `DELETE /tickets/:id`

**Path Parameters:**

- `id`: Ticket UUID

**Response:** `204 No Content`

(No response body)

**Response:** `404 Not Found`

```json
{
  "error": "Ticket not found"
}
```

**cURL Example:**

```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### 7. Auto-Classify Ticket

Automatically classify a ticket's category and priority based on its content.

**Endpoint:** `POST /tickets/:id/auto-classify`

**Path Parameters:**

- `id`: Ticket UUID

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "category": "ACCOUNT_ACCESS",
  "priority": "URGENT",
  "confidence": 0.85,
  "reasoning": "Category: Matched 3 keyword(s). Priority: Matched 2 priority keyword(s)",
  "keywords": ["login", "password", "cannot access", "urgent", "critical"]
}
```

**Response:** `404 Not Found`

```json
{
  "error": "Ticket not found"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

---

## Data Models

### Ticket Schema

```typescript
{
  id: string (UUID)
  customerId: string
  customerEmail: string (email format)
  customerName: string
  subject: string (1-200 chars)
  description: string (10-2000 chars)
  category: CategoryEnum
  priority: PriorityEnum
  status: StatusEnum
  createdAt: DateTime
  updatedAt: DateTime
  resolvedAt: DateTime | null
  assignedTo: string | null
  tags: string[]
  source: string
  browser: string | null
  deviceType: string | null
  classificationConfidence: number | null
  classificationReasoning: string | null
  classificationKeywords: string[]
}
```

### Enumerations

**CategoryEnum:**
- `ACCOUNT_ACCESS` / `account_access`
- `TECHNICAL_ISSUE` / `technical_issue`
- `BILLING_QUESTION` / `billing_question`
- `FEATURE_REQUEST` / `feature_request`
- `BUG_REPORT` / `bug_report`
- `OTHER` / `other`

**PriorityEnum:**
- `URGENT` / `urgent`
- `HIGH` / `high`
- `MEDIUM` / `medium`
- `LOW` / `low`

**StatusEnum:**
- `NEW` / `new`
- `IN_PROGRESS` / `in_progress`
- `WAITING_CUSTOMER` / `waiting_customer`
- `RESOLVED` / `resolved`
- `CLOSED` / `closed`

**SourceEnum:**
- `web_form`
- `email`
- `api`
- `chat`
- `phone`

**DeviceTypeEnum:**
- `desktop`
- `mobile`
- `tablet`

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | OK - Request successful |
| `201` | Created - Resource created successfully |
| `204` | No Content - Resource deleted successfully |
| `400` | Bad Request - Invalid input or validation error |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error - Server error |

---

## Import File Formats

### CSV Format

```csv
customer_id,customer_email,customer_name,subject,description,category,priority,tags,source,browser,device_type
CUST001,john@example.com,John Doe,Subject,Description text here,account_access,urgent,"tag1,tag2",web_form,Chrome,desktop
```

**Rules:**
- First row must be headers
- All fields are required except `browser` and `device_type`
- Tags must be comma-separated within quotes
- Category and priority values must be lowercase with underscores

### JSON Format

```json
[
  {
    "customer_id": "CUST001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Subject",
    "description": "Description text here",
    "category": "account_access",
    "priority": "urgent",
    "tags": ["tag1", "tag2"],
    "metadata": {
      "source": "web_form",
      "browser": "Chrome",
      "device_type": "desktop"
    }
  }
]
```

**Rules:**
- Root must be an array of ticket objects
- All required fields must be present
- Metadata object is required

### XML Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>john@example.com</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>Subject</subject>
    <description>Description text here</description>
    <category>account_access</category>
    <priority>urgent</priority>
    <tags>
      <tag>tag1</tag>
      <tag>tag2</tag>
    </tags>
    <metadata>
      <source>web_form</source>
      <browser>Chrome</browser>
      <device_type>desktop</device_type>
    </metadata>
  </ticket>
</tickets>
```

**Rules:**
- Root element must be `<tickets>`
- Each ticket is a `<ticket>` element
- Tags are nested under `<tags>` as individual `<tag>` elements
- Metadata is a nested object with required fields

---

## Validation Rules

### Field Constraints

| Field | Type | Constraints |
|-------|------|-------------|
| `customer_id` | string | Required, min length 1 |
| `customer_email` | string | Required, valid email format |
| `customer_name` | string | Required, min length 1 |
| `subject` | string | Required, 1-200 characters |
| `description` | string | Required, 10-2000 characters |
| `category` | enum | Optional, must be valid CategoryEnum |
| `priority` | enum | Optional, must be valid PriorityEnum |
| `status` | enum | Optional, must be valid StatusEnum |
| `assigned_to` | string | Optional |
| `tags` | array | Optional, array of strings |
| `metadata.source` | enum | Required, must be valid SourceEnum |
| `metadata.browser` | string | Optional |
| `metadata.device_type` | enum | Optional, must be valid DeviceTypeEnum |

---

## Rate Limiting

Currently, no rate limiting is implemented. Future versions will include:
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Bulk import limited to 10 files per hour

---

## Versioning

Current API version: **v1.0.0**

API versioning will be introduced in future releases using URL path versioning:
```
http://localhost:3000/v1/tickets
```

---

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/helldes/AI-Coding-Partner-Homework/issues)
- Email: support@example.com
