// CRM Types Definitions for LNG79 B2B Pipeline CRM

export type SolutionType = 'lng' | 'lpg' | 'conversion' | 'kitchen';
export type OpportunityStage = 'new' | 'qualified' | 'contacted' | 'survey' | 'design' | 'proposal' | 'negotiation' | 'review' | 'dormant' | 'won' | 'lost';
export type TaskType = 'call' | 'meeting' | 'survey' | 'proposal' | 'reminder' | 'document_request' | 'site_visit' | 'deadline';
export type TaskStatus = 'todo' | 'doing' | 'done' | 'overdue';
export type CompanyStatus = 'prospect' | 'customer' | 'inactive' | 'partner' | 'supplier';
export type ActivityType = 'status_change' | 'phone' | 'meeting' | 'survey' | 'proposal' | 'negotiation' | 'email' | 'note' | 'file';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type ContractStatus = 'draft' | 'review' | 'active' | 'terminated' | 'completed';

export interface CrmLeadSource {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface CrmIndustry {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface CrmCompany {
  id: string;
  company_number: string;
  name: string;
  industry_id?: string;
  industry?: CrmIndustry;
  tax_code?: string;
  website?: string;
  address?: string;
  province?: string;
  country?: string;
  notes?: string;
  status: CompanyStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CrmContact {
  id: string;
  company_id: string;
  company?: CrmCompany;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  department?: string;
  birthday?: string;
  is_decision_maker: boolean;
  is_technical_contact: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CrmOpportunity {
  id: string;
  opportunity_number: string;
  title: string;
  company_id: string;
  company?: CrmCompany;
  primary_contact_id?: string;
  primary_contact?: CrmContact;
  solution_type: SolutionType;
  deal_value: number;
  currency: string;
  probability: number;
  expected_close_date?: string;
  assigned_to?: string; // uuid referencing profiles.id
  assigned_profile?: { display_name: string; email: string };
  stage: OpportunityStage;
  source_id?: string;
  source?: CrmLeadSource;
  lost_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CrmTask {
  id: string;
  opportunity_id?: string;
  opportunity?: CrmOpportunity;
  title: string;
  task_type: TaskType;
  status: TaskStatus;
  due_date: string;
  assigned_to?: string; // uuid
  assigned_profile?: { display_name: string; email: string };
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CrmActivity {
  id: string;
  entity_type: 'lead' | 'company' | 'contact' | 'opportunity' | 'task';
  entity_id: string;
  activity_type: ActivityType;
  content: string;
  attachment_url?: string;
  created_by?: string; // uuid
  created_by_profile?: { display_name: string; email: string };
  created_at: string;
}

export interface CrmAttachment {
  id: string;
  entity_type: 'opportunity' | 'quote' | 'contract' | 'activity';
  entity_id: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  uploaded_by?: string;
  uploaded_by_profile?: { display_name: string; email: string };
  created_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CrmQuote {
  id: string;
  opportunity_id: string;
  opportunity?: CrmOpportunity;
  quote_number: string;
  version: number;
  amount: number;
  status: QuoteStatus;
  pdf_url?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CrmContract {
  id: string;
  opportunity_id: string;
  opportunity?: CrmOpportunity;
  contract_number: string;
  value: number;
  status: ContractStatus;
  pdf_url?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CrmNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read_at?: string;
  type: 'task_overdue' | 'meeting_alert' | 'lead_delay' | 'deal_closing';
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export interface CrmAuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  changed_by?: string;
  changed_by_profile?: { display_name: string; email: string };
  change_type: 'create' | 'update' | 'delete' | 'status_change';
  old_values?: any;
  new_values?: any;
  created_at: string;
}

// Old lead structure matching website submissions, routed to CRM Inbox
export interface LeadItem {
  id: string;
  type: 'calculator' | 'wizard' | 'quote' | 'contact' | 'survey';
  company: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  date: string;
  status: 'new' | 'contacted' | 'qualified' | 'rejected' | 'merged';
  details: string;
  lead_source_id?: string;
  source?: CrmLeadSource;
  converted_company_id?: string;
  converted_contact_id?: string;
  converted_opportunity_id?: string;
}
