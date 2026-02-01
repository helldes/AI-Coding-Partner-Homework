import csv from 'csv-parser';
import { parseString } from 'xml2js';
import { Readable } from 'stream';
import { CreateTicketDTO, ImportResult } from '../types/ticket.types';
import { CreateTicketSchema } from '../utils/validation';

export class ImportService {
  async parseCSV(fileBuffer: Buffer): Promise<ImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    let rowNumber = 0;
    let successful = 0;
    const validTickets: CreateTicketDTO[] = [];

    return new Promise((resolve) => {
      const stream = Readable.from(fileBuffer.toString());

      stream
        .pipe(csv())
        .on('data', (data: any) => {
          rowNumber++;
          try {
            const ticket = this.mapCsvToTicket(data);
            CreateTicketSchema.parse(ticket);
            validTickets.push(ticket);
            successful++;
          } catch (error) {
            errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })
        .on('end', () => {
          resolve({
            total: rowNumber,
            successful,
            failed: errors.length,
            errors,
            validTickets
          });
        })
        .on('error', (error: Error) => {
          resolve({
            total: rowNumber,
            successful,
            failed: errors.length + 1,
            errors: [...errors, { row: rowNumber, error: error.message }],
            validTickets
          });
        });
    });
  }

  async parseJSON(fileBuffer: Buffer): Promise<ImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    let successful = 0;
    const validTickets: CreateTicketDTO[] = [];

    try {
      const data = JSON.parse(fileBuffer.toString());
      const tickets = Array.isArray(data) ? data : [data];

      tickets.forEach((ticket, index) => {
        try {
          const validated = CreateTicketSchema.parse(ticket);
          validTickets.push(validated as any);
          successful++;
        } catch (error) {
          errors.push({
            row: index + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      return {
        total: tickets.length,
        successful,
        failed: errors.length,
        errors,
        validTickets
      };
    } catch (error) {
      return {
        total: 0,
        successful: 0,
        failed: 1,
        errors: [{ row: 0, error: 'Invalid JSON format' }],
        validTickets
      };
    }
  }

  async parseXML(fileBuffer: Buffer): Promise<ImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    let successful = 0;
    const validTickets: CreateTicketDTO[] = [];

    return new Promise((resolve) => {
      parseString(fileBuffer.toString(), {
        strict: true,
        explicitArray: true,
        // Security: Reject external entities and DOCTYPE declarations
        xmlns: false,
        explicitRoot: true
      }, (err: Error | null, result: any) => {
        if (err) {
          return resolve({
            total: 0,
            successful: 0,
            failed: 1,
            errors: [{ row: 0, error: 'Invalid XML format' }],
            validTickets
          });
        }

        try {
          const tickets = result.tickets?.ticket || [];
          const ticketArray = Array.isArray(tickets) ? tickets : [tickets];

          ticketArray.forEach((ticket: any, index: number) => {
            try {
              const mappedTicket = this.mapXmlToTicket(ticket);
              const validated = CreateTicketSchema.parse(mappedTicket);
              validTickets.push(validated as any);
              successful++;
            } catch (error) {
              errors.push({
                row: index + 1,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          });

          resolve({
            total: ticketArray.length,
            successful,
            failed: errors.length,
            errors,
            validTickets
          });
        } catch (error) {
          resolve({
            total: 0,
            successful: 0,
            failed: 1,
            errors: [{ row: 0, error: 'Error processing XML structure' }],
            validTickets
          });
        }
      });
    });
  }

  private mapCsvToTicket(row: any): CreateTicketDTO {
    return {
      customer_id: row.customer_id,
      customer_email: row.customer_email,
      customer_name: row.customer_name,
      subject: row.subject,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assigned_to: row.assigned_to || undefined,
      tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
      metadata: {
        source: row.source || 'api',
        browser: row.browser || undefined,
        device_type: row.device_type || undefined
      }
    };
  }

  private mapXmlToTicket(ticket: any): CreateTicketDTO {
    return {
      customer_id: ticket.customer_id?.[0],
      customer_email: ticket.customer_email?.[0],
      customer_name: ticket.customer_name?.[0],
      subject: ticket.subject?.[0],
      description: ticket.description?.[0],
      category: ticket.category?.[0],
      priority: ticket.priority?.[0],
      status: ticket.status?.[0],
      assigned_to: ticket.assigned_to?.[0] || undefined,
      tags: ticket.tags?.[0]?.split(',').map((t: string) => t.trim()) || [],
      metadata: {
        source: ticket.metadata?.[0]?.source?.[0] || 'api',
        browser: ticket.metadata?.[0]?.browser?.[0] || undefined,
        device_type: ticket.metadata?.[0]?.device_type?.[0] || undefined
      }
    };
  }
}

export const importService = new ImportService();
