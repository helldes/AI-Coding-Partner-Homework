import { z } from 'zod';

export const CategoryEnum = z.enum([
  'account_access',
  'technical_issue',
  'billing_question',
  'feature_request',
  'bug_report',
  'other'
]);

export const PriorityEnum = z.enum(['urgent', 'high', 'medium', 'low']);

export const StatusEnum = z.enum([
  'new',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed'
]);

export const SourceEnum = z.enum(['web_form', 'email', 'api', 'chat', 'phone']);

export const DeviceTypeEnum = z.enum(['desktop', 'mobile', 'tablet']);

export const MetadataSchema = z.object({
  source: SourceEnum,
  browser: z.string().optional(),
  device_type: DeviceTypeEnum.optional()
});

export const CreateTicketSchema = z.object({
  customer_id: z.string().min(1),
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  status: StatusEnum.optional(),
  assigned_to: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: MetadataSchema
});

export const UpdateTicketSchema = z.object({
  customer_id: z.string().min(1).optional(),
  customer_email: z.string().email().optional(),
  customer_name: z.string().min(1).optional(),
  subject: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  status: StatusEnum.optional(),
  assigned_to: z.string().optional(),
  tags: z.array(z.string()).optional(),
  resolved_at: z.string().datetime().optional()
});

export const TicketFilterSchema = z.object({
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  status: StatusEnum.optional(),
  customer_id: z.string().optional(),
  assigned_to: z.string().optional()
});
