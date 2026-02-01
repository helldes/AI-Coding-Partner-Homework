import { importService } from '../../src/services/import.service';

describe('JSON Import', () => {
  it('should parse valid JSON array', async () => {
    const jsonData = JSON.stringify([
      {
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'John Doe',
        subject: 'Test',
        description: 'Test description here',
        metadata: { source: 'api' }
      }
    ]);

    const result = await importService.parseJSON(Buffer.from(jsonData));

    expect(result.total).toBe(1);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should parse single JSON object', async () => {
    const jsonData = JSON.stringify({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'John Doe',
      subject: 'Test',
      description: 'Test description here',
      metadata: { source: 'email' }
    });

    const result = await importService.parseJSON(Buffer.from(jsonData));

    expect(result.total).toBe(1);
    expect(result.successful).toBe(1);
  });

  it('should handle malformed JSON', async () => {
    const malformedJson = '{invalid json';

    const result = await importService.parseJSON(Buffer.from(malformedJson));

    expect(result.total).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toBe('Invalid JSON format');
  });

  it('should validate each ticket in array', async () => {
    const jsonData = JSON.stringify([
      {
        customer_id: 'CUST001',
        customer_email: 'valid@example.com',
        customer_name: 'Valid User',
        subject: 'Valid',
        description: 'Valid description',
        metadata: { source: 'api' }
      },
      {
        customer_id: 'CUST002',
        customer_email: 'invalid-email',
        customer_name: 'Invalid User',
        subject: 'Invalid',
        description: 'Invalid description',
        metadata: { source: 'api' }
      }
    ]);

    const result = await importService.parseJSON(Buffer.from(jsonData));

    expect(result.total).toBe(2);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('should handle empty array', async () => {
    const result = await importService.parseJSON(Buffer.from('[]'));

    expect(result.total).toBe(0);
    expect(result.successful).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('should extract valid tickets from JSON', async () => {
    const jsonData = JSON.stringify([
      {
        customer_id: 'CUST001',
        customer_email: 'valid@example.com',
        customer_name: 'Valid User',
        subject: 'Valid',
        description: 'Valid description',
        metadata: { source: 'api' }
      },
      {
        customer_id: 'CUST002',
        customer_email: 'invalid-email',
        customer_name: 'Invalid User',
        subject: 'Invalid',
        description: 'Invalid description',
        metadata: { source: 'api' }
      }
    ]);

    const result = await importService.parseJSON(Buffer.from(jsonData));

    expect(result.validTickets.length).toBe(1);
    expect(result.validTickets[0].customer_id).toBe('CUST001');
  });

  it('should handle malformed JSON in extract method', async () => {
    const result = await importService.parseJSON(Buffer.from('{invalid'));

    expect(result.validTickets.length).toBe(0);
  });
});
