import { prisma } from './database.service';
import { CreateTicketDTO, UpdateTicketDTO, TicketResponse } from '../types/ticket.types';
import { classificationService } from './classification.service';

const categoryMap: Record<string, string> = {
  'account_access': 'ACCOUNT_ACCESS',
  'technical_issue': 'TECHNICAL_ISSUE',
  'billing_question': 'BILLING_QUESTION',
  'feature_request': 'FEATURE_REQUEST',
  'bug_report': 'BUG_REPORT',
  'other': 'OTHER'
};

const priorityMap: Record<string, string> = {
  'urgent': 'URGENT',
  'high': 'HIGH',
  'medium': 'MEDIUM',
  'low': 'LOW'
};

const statusMap: Record<string, string> = {
  'new': 'NEW',
  'in_progress': 'IN_PROGRESS',
  'waiting_customer': 'WAITING_CUSTOMER',
  'resolved': 'RESOLVED',
  'closed': 'CLOSED'
};

export class TicketService {
  async createTicket(data: CreateTicketDTO, autoClassify: boolean = true): Promise<any> {
    let category = data.category;
    let priority = data.priority;
    let classificationData: any = {};

    if (autoClassify || !category || !priority) {
      const result = classificationService.classify(data.subject, data.description);

      if (!category) category = result.category;
      if (!priority) priority = result.priority;

      classificationData = {
        classificationConfidence: result.confidence,
        classificationReasoning: result.reasoning,
        classificationKeywords: result.keywords
      };
    }

    const ticket = await prisma.ticket.create({
      data: {
        customerId: data.customer_id,
        customerEmail: data.customer_email,
        customerName: data.customer_name,
        subject: data.subject,
        description: data.description,
        category: categoryMap[category!] as any,
        priority: priorityMap[priority!] as any,
        status: data.status ? statusMap[data.status] as any : 'NEW',
        assignedTo: data.assigned_to,
        tags: data.tags || [],
        source: data.metadata.source,
        browser: data.metadata.browser,
        deviceType: data.metadata.device_type,
        ...classificationData
      }
    });

    return ticket;
  }

  async getTickets(filters?: any): Promise<any[]> {
    const where: any = {};

    if (filters?.category) where.category = categoryMap[filters.category];
    if (filters?.priority) where.priority = priorityMap[filters.priority];
    if (filters?.status) where.status = statusMap[filters.status];
    if (filters?.customer_id) where.customerId = filters.customer_id;
    if (filters?.assigned_to) where.assignedTo = filters.assigned_to;

    return prisma.ticket.findMany({ where });
  }

  async getTicketById(id: string): Promise<any | null> {
    return prisma.ticket.findUnique({ where: { id } });
  }

  async updateTicket(id: string, data: UpdateTicketDTO): Promise<any> {
    const updateData: any = {};

    if (data.customer_id) updateData.customerId = data.customer_id;
    if (data.customer_email) updateData.customerEmail = data.customer_email;
    if (data.customer_name) updateData.customerName = data.customer_name;
    if (data.subject) updateData.subject = data.subject;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = categoryMap[data.category];
    if (data.priority) updateData.priority = priorityMap[data.priority];
    if (data.status) updateData.status = statusMap[data.status];
    if (data.assigned_to !== undefined) updateData.assignedTo = data.assigned_to;
    if (data.tags) updateData.tags = data.tags;
    if (data.resolved_at) updateData.resolvedAt = new Date(data.resolved_at);

    return prisma.ticket.update({
      where: { id },
      data: updateData
    });
  }

  async deleteTicket(id: string): Promise<void> {
    try {
      await prisma.ticket.delete({ where: { id } });
    } catch (error) {
      throw new Error('Ticket not found');
    }
  }

  async autoClassifyTicket(id: string): Promise<any> {
    const ticket = await this.getTicketById(id);
    if (!ticket) throw new Error('Ticket not found');

    const result = classificationService.classify(ticket.subject, ticket.description);

    return prisma.ticket.update({
      where: { id },
      data: {
        category: categoryMap[result.category] as any,
        priority: priorityMap[result.priority] as any,
        classificationConfidence: result.confidence,
        classificationReasoning: result.reasoning,
        classificationKeywords: result.keywords
      }
    });
  }

  async bulkCreateTickets(tickets: CreateTicketDTO[]): Promise<any[]> {
    const created = [];
    for (const ticketData of tickets) {
      try {
        const ticket = await this.createTicket(ticketData);
        created.push(ticket);
      } catch (error) {
        console.error('Failed to create ticket:', error);
      }
    }
    return created;
  }
}

export const ticketService = new TicketService();
