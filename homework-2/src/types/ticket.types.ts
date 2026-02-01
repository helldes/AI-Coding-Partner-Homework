export enum Category {
  ACCOUNT_ACCESS = 'account_access',
  TECHNICAL_ISSUE = 'technical_issue',
  BILLING_QUESTION = 'billing_question',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  OTHER = 'other'
}

export enum Priority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum Status {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum Source {
  WEB_FORM = 'web_form',
  EMAIL = 'email',
  API = 'api',
  CHAT = 'chat',
  PHONE = 'phone'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet'
}

export interface TicketMetadata {
  source: Source;
  browser?: string;
  device_type?: DeviceType;
}

export interface CreateTicketDTO {
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category?: Category;
  priority?: Priority;
  status?: Status;
  assigned_to?: string;
  tags?: string[];
  metadata: TicketMetadata;
}

export interface UpdateTicketDTO {
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  subject?: string;
  description?: string;
  category?: Category;
  priority?: Priority;
  status?: Status;
  assigned_to?: string;
  tags?: string[];
  resolved_at?: Date;
}

export interface TicketResponse {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  assigned_to?: string;
  tags: string[];
  metadata: TicketMetadata;
}

export interface ClassificationResult {
  category: Category;
  priority: Priority;
  confidence: number;
  reasoning: string;
  keywords: string[];
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  validTickets: CreateTicketDTO[];
}
