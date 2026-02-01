import { importService } from '../../src/services/import.service';

describe('CSV Import', () => {
  it('should parse valid CSV file', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,test@example.com,John Doe,Login issue,Cannot access my account - this is urgent,web_form`;

    const result = await importService.parseCSV(Buffer.from(csvData));

    expect(result.total).toBe(1);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should handle multiple rows', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,user1@example.com,User One,Issue 1,Description for issue one is here,email
CUST002,user2@example.com,User Two,Issue 2,Description for issue two is here,web_form`;

    const result = await importService.parseCSV(Buffer.from(csvData));

    expect(result.total).toBe(2);
    expect(result.successful).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('should reject rows with invalid email', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,invalid-email,John Doe,Test,Test description here,web_form`;

    const result = await importService.parseCSV(Buffer.from(csvData));

    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
  });

  it('should reject rows with description too short', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,test@example.com,John Doe,Test,Short,web_form`;

    const result = await importService.parseCSV(Buffer.from(csvData));

    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('description');
  });

  it('should handle mixed valid and invalid rows', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,valid@example.com,Valid User,Valid Subject,This is a valid description,web_form
CUST002,invalid-email,Invalid User,Subject,Description here,email`;

    const result = await importService.parseCSV(Buffer.from(csvData));

    expect(result.total).toBe(2);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('should parse tags correctly', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,tags,source
CUST001,test@example.com,John Doe,Test,Test description here,"urgent,payment",web_form`;

    const result = await importService.parseCSV(Buffer.from(csvData));

    expect(result.successful).toBe(1);
  });

  it('should extract valid tickets from CSV', async () => {
    const csvData = `customer_id,customer_email,customer_name,subject,description,source
CUST001,test@example.com,John Doe,Login issue,Cannot access my account,web_form
CUST002,invalid-email,Jane Doe,Test,Description here,email
CUST003,valid@example.com,Bob Smith,Issue,Valid description here,api`;

    const tickets = await importService.extractValidTicketsFromCSV(Buffer.from(csvData));

    expect(tickets.length).toBe(2);
    expect(tickets[0].customer_id).toBe('CUST001');
    expect(tickets[1].customer_id).toBe('CUST003');
  });
});
