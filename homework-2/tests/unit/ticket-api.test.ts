import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../../src/services/database.service';

beforeAll(async () => {
  await prisma.$connect();
  await prisma.ticket.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});


describe('POST /tickets', () => {
  it('should create a new ticket with valid data', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Login issue',
        description: 'Cannot login to my account',
        metadata: { source: 'web_form' }
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.customerEmail).toBe('test@example.com');
  });

  it('should reject ticket with invalid email', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST001',
        customer_email: 'invalid-email',
        customer_name: 'Test User',
        subject: 'Test',
        description: 'Test description here',
        metadata: { source: 'web_form' }
      });

    expect(response.status).toBe(400);
  });

  it('should reject ticket with subject exceeding 200 characters', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'A'.repeat(201),
        description: 'Test description',
        metadata: { source: 'web_form' }
      });

    expect(response.status).toBe(400);
  });

  it('should reject ticket with description less than 10 characters', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test',
        description: 'Short',
        metadata: { source: 'web_form' }
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /tickets', () => {
  it('should return all tickets', async () => {
    await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test1@example.com',
      customer_name: 'User 1',
      subject: 'Issue 1',
      description: 'Description for issue 1',
      metadata: { source: 'web_form' }
    });

    const response = await request(app).get('/tickets');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should filter tickets by category', async () => {
    await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Billing question',
      description: 'I have a payment issue',
      category: 'billing_question',
      metadata: { source: 'email' }
    });

    const response = await request(app).get('/tickets?category=billing_question');
    expect(response.status).toBe(200);
    expect(response.body.every((t: any) => t.category === 'BILLING_QUESTION')).toBe(true);
  });
});

describe('GET /tickets/:id', () => {
  it('should return a specific ticket', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Test',
      description: 'Test description here',
      metadata: { source: 'api' }
    });

    const response = await request(app).get(`/tickets/${createResponse.body.id}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
  });

  it('should return 404 for non-existent ticket', async () => {
    const response = await request(app).get('/tickets/00000000-0000-0000-0000-000000000000');
    expect(response.status).toBe(404);
  });
});

describe('PUT /tickets/:id', () => {
  it('should update ticket status', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Test',
      description: 'Test description',
      metadata: { source: 'api' }
    });

    const response = await request(app)
      .put(`/tickets/${createResponse.body.id}`)
      .send({ status: 'in_progress' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
  });
});

describe('POST /tickets/import', () => {
  it('should return 400 when no file provided', async () => {
    const response = await request(app)
      .post('/tickets/import');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No file provided');
  });

  it('should return 400 for unsupported file format', async () => {
    const response = await request(app)
      .post('/tickets/import')
      .attach('file', Buffer.from('test data'), 'test.txt');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Unsupported file format. Use CSV, JSON, or XML');
  });

  it('should successfully import CSV file', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,import@test.com,Import User,Test Subject,Test description for import,web_form`;

    const response = await request(app)
      .post('/tickets/import')
      .attach('file', Buffer.from(csvData), 'test.csv');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.successful).toBe(1);
  });
});

describe('GET /tickets with filters', () => {
  it('should return 400 for invalid filter parameters', async () => {
    const response = await request(app).get('/tickets?category=invalid_category');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid filters');
  });
});

describe('PUT /tickets/:id', () => {
  it('should update ticket status', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Test',
      description: 'Test description',
      metadata: { source: 'api' }
    });

    const response = await request(app)
      .put(`/tickets/${createResponse.body.id}`)
      .send({ status: 'in_progress' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
  });

  it('should return 400 for invalid update data', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Test',
      description: 'Test description',
      metadata: { source: 'api' }
    });

    const response = await request(app)
      .put(`/tickets/${createResponse.body.id}`)
      .send({ customer_email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 404 for non-existent ticket', async () => {
    const response = await request(app)
      .put('/tickets/00000000-0000-0000-0000-000000000000')
      .send({ status: 'in_progress' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Ticket not found');
  });
});

describe('POST /tickets/:id/auto-classify', () => {
  it('should auto-classify an existing ticket', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'classify@example.com',
      customer_name: 'Classify User',
      subject: 'Cannot login to account',
      description: 'I forgot my password and cannot access my account',
      metadata: { source: 'web_form' }
    });

    const response = await request(app)
      .post(`/tickets/${createResponse.body.id}/auto-classify`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('category');
    expect(response.body).toHaveProperty('priority');
    expect(response.body).toHaveProperty('confidence');
    expect(response.body).toHaveProperty('reasoning');
    expect(response.body).toHaveProperty('keywords');
  });

  it('should return 404 for non-existent ticket', async () => {
    const response = await request(app)
      .post('/tickets/00000000-0000-0000-0000-000000000000/auto-classify');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Ticket not found');
  });
});

describe('DELETE /tickets/:id', () => {
  it('should delete a ticket', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Test',
      description: 'Test description',
      metadata: { source: 'api' }
    });

    const response = await request(app).delete(`/tickets/${createResponse.body.id}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existent ticket', async () => {
    const response = await request(app).delete('/tickets/00000000-0000-0000-0000-000000000000');
    expect(response.status).toBe(404);
  });
});
