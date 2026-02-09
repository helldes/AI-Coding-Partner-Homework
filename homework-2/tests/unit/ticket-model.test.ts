import { CreateTicketSchema, UpdateTicketSchema } from '../../src/utils/validation';

describe('Ticket Model Validation', () => {
  const validTicket = {
    customer_id: 'CUST001',
    customer_email: 'test@example.com',
    customer_name: 'John Doe',
    subject: 'Test subject',
    description: 'This is a test description that is longer than 10 characters',
    metadata: {
      source: 'web_form' as const
    }
  };

  describe('CreateTicketSchema', () => {
    it('should validate correct ticket data', () => {
      expect(() => CreateTicketSchema.parse(validTicket)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalid = { ...validTicket, customer_email: 'not-an-email' };
      expect(() => CreateTicketSchema.parse(invalid)).toThrow();
    });

    it('should reject subject exceeding 200 characters', () => {
      const invalid = { ...validTicket, subject: 'A'.repeat(201) };
      expect(() => CreateTicketSchema.parse(invalid)).toThrow();
    });

    it('should reject description less than 10 characters', () => {
      const invalid = { ...validTicket, description: 'Short' };
      expect(() => CreateTicketSchema.parse(invalid)).toThrow();
    });

    it('should reject description exceeding 2000 characters', () => {
      const invalid = { ...validTicket, description: 'A'.repeat(2001) };
      expect(() => CreateTicketSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid category enum', () => {
      const invalid = { ...validTicket, category: 'invalid_category' };
      expect(() => CreateTicketSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid priority enum', () => {
      const invalid = { ...validTicket, priority: 'invalid_priority' };
      expect(() => CreateTicketSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid source enum in metadata', () => {
      const invalid = { ...validTicket, metadata: { source: 'invalid_source' } };
      expect(() => CreateTicketSchema.parse(invalid)).toThrow();
    });

    it('should accept optional fields', () => {
      const withOptionals = {
        ...validTicket,
        category: 'billing_question',
        priority: 'high',
        tags: ['urgent', 'payment']
      };
      expect(() => CreateTicketSchema.parse(withOptionals)).not.toThrow();
    });
  });
});
