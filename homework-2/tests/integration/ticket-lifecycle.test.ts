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


describe('Ticket Lifecycle Integration Tests', () => {
  it('should complete full ticket lifecycle', async () => {
    const createResponse = await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST001',
        customer_email: 'lifecycle@example.com',
        customer_name: 'Lifecycle Test',
        subject: 'Test ticket',
        description: 'This is a full lifecycle test',
        metadata: { source: 'web_form' }
      });

    expect(createResponse.status).toBe(201);
    const ticketId = createResponse.body.id;

    const classifyResponse = await request(app)
      .post(`/tickets/${ticketId}/auto-classify`);

    expect(classifyResponse.status).toBe(200);
    expect(classifyResponse.body).toHaveProperty('category');
    expect(classifyResponse.body).toHaveProperty('priority');

    const updateResponse = await request(app)
      .put(`/tickets/${ticketId}`)
      .send({ status: 'in_progress', assigned_to: 'agent@example.com' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.status).toBe('IN_PROGRESS');

    const resolveResponse = await request(app)
      .put(`/tickets/${ticketId}`)
      .send({ status: 'resolved', resolved_at: new Date().toISOString() });

    expect(resolveResponse.status).toBe(200);
    expect(resolveResponse.body.status).toBe('RESOLVED');

    const deleteResponse = await request(app).delete(`/tickets/${ticketId}`);
    expect(deleteResponse.status).toBe(204);
  });

  it('should handle bulk import with auto-classification', async () => {
    const beforeCount = await request(app).get('/tickets');
    const initialCount = beforeCount.body.length;

    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,user1@example.com,User One,Login problem,Cannot access account with password,web_form
CUST002,user2@example.com,User Two,Billing issue,Need refund for payment,email`;

    const importResponse = await request(app)
      .post('/tickets/import')
      .attach('file', Buffer.from(csvData), 'tickets.csv');

    expect(importResponse.status).toBe(200);
    expect(importResponse.body.successful).toBe(2);

    const listResponse = await request(app).get('/tickets');
    expect(listResponse.body.length).toBe(initialCount + 2);
  }, 10000);

  it('should filter by multiple criteria', async () => {
    await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Urgent billing',
      description: 'Critical payment issue',
      category: 'billing_question',
      priority: 'urgent',
      metadata: { source: 'email' }
    });

    const response = await request(app).get('/tickets?category=billing_question&priority=urgent');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should handle concurrent ticket creation', async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      request(app).post('/tickets').send({
        customer_id: `CUST${i}`,
        customer_email: `user${i}@example.com`,
        customer_name: `User ${i}`,
        subject: `Test ${i}`,
        description: `Concurrent test description ${i}`,
        metadata: { source: 'api' }
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 201).length;

    expect(successCount).toBe(20);
  });

  it('should maintain data integrity during updates', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'CUST001',
      customer_email: 'integrity@example.com',
      customer_name: 'Integrity Test',
      subject: 'Test',
      description: 'Test description',
      metadata: { source: 'web_form' }
    });

    const ticketId = createResponse.body.id;

    await request(app).put(`/tickets/${ticketId}`).send({ status: 'in_progress' });
    await request(app).put(`/tickets/${ticketId}`).send({ priority: 'high' });
    await request(app).put(`/tickets/${ticketId}`).send({ assigned_to: 'agent@test.com' });

    const finalResponse = await request(app).get(`/tickets/${ticketId}`);

    expect(finalResponse.body.status).toBe('IN_PROGRESS');
    expect(finalResponse.body.priority).toBe('HIGH');
    expect(finalResponse.body.assignedTo).toBe('agent@test.com');
  });
});
