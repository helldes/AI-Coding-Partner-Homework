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


describe('Performance Tests', () => {
  it('should handle bulk creation within acceptable time', async () => {
    const startTime = Date.now();

    const promises = Array.from({ length: 50 }, (_, i) =>
      request(app).post('/tickets').send({
        customer_id: `PERF${i}`,
        customer_email: `perf${i}@example.com`,
        customer_name: `Performance User ${i}`,
        subject: `Performance test ${i}`,
        description: `Performance test description number ${i}`,
        metadata: { source: 'api' }
      })
    );

    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(10000);
  });

  it('should retrieve large dataset efficiently', async () => {
    const beforeCount = await request(app).get('/tickets');
    const initialCount = beforeCount.body.length;

    let successfulCreations = 0;
    for (let i = 0; i < 100; i++) {
      const createResponse = await request(app).post('/tickets').send({
        customer_id: `CUST${i}`,
        customer_email: `user${i}@example.com`,
        customer_name: `User ${i}`,
        subject: `Ticket ${i}`,
        description: `Description for ticket ${i}`,
        metadata: { source: 'web_form' }
      });
      if (createResponse.status === 201) {
        successfulCreations++;
      }
    }

    const startTime = Date.now();
    const response = await request(app).get('/tickets');
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(initialCount + successfulCreations);
    expect(endTime - startTime).toBeLessThan(2000);
  });

  it('should handle rapid sequential updates', async () => {
    const createResponse = await request(app).post('/tickets').send({
      customer_id: 'PERF001',
      customer_email: 'rapid@example.com',
      customer_name: 'Rapid Test',
      subject: 'Rapid update test',
      description: 'Testing rapid updates',
      metadata: { source: 'api' }
    });

    const ticketId = createResponse.body.id;
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await request(app).put(`/tickets/${ticketId}`).send({
        subject: `Updated subject ${i}`
      });
    }

    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(3000);
  });

  it('should classify tickets quickly', async () => {
    const tickets = Array.from({ length: 20 }, (_, i) => ({
      customer_id: `CLASS${i}`,
      customer_email: `class${i}@example.com`,
      customer_name: `Classify User ${i}`,
      subject: 'Cannot login to account',
      description: 'I forgot my password and need help',
      metadata: { source: 'email' }
    }));

    const createPromises = tickets.map(t => request(app).post('/tickets').send(t));
    const created = await Promise.all(createPromises);

    const startTime = Date.now();
    const classifyPromises = created.map(r =>
      request(app).post(`/tickets/${r.body.id}/auto-classify`)
    );
    await Promise.all(classifyPromises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });

  it('should parse large import files efficiently', async () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      `CUST${i},user${i}@example.com,User ${i},Subject ${i},Description for ticket ${i},web_form`
    );

    const csvData = `customer_id,customer_email,customer_name,subject,description,source\n${rows.join('\n')}`;

    const startTime = Date.now();
    const response = await request(app)
      .post('/tickets/import')
      .attach('file', Buffer.from(csvData), 'large.csv');
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(5000);
  });
});
