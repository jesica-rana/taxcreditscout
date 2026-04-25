export type Jurisdiction = "Federal" | "State" | "City" | "Private";

export type CreditType =
  | "per_employee"
  | "percent_of_expense"
  | "flat"
  | "percent_of_revenue";

export type RevenueBand =
  | "under_500k"
  | "500k_2m"
  | "2m_10m"
  | "10m_50m"
  | "over_50m";

export interface Credit {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  state: string | null;
  city: string | null;
  credit_amount_min: number;
  credit_amount_max: number;
  credit_type: CreditType;
  industries: string[];
  company_size_min_employees: number;
  company_size_max_employees: number | null;
  revenue_min: number | null;
  revenue_max: number | null;
  form: string;
  filing_deadline: string;
  deadline_critical: boolean;
  deadline_date: string | null;
  eligibility_text: string;
  documentation_required: string[];
  url: string;
  estimated_avg_finding: number;
  source_authority?: string;
}

export interface RawIntake {
  business_description: string;
  state: string;
  city: string | null;
  employee_count: number;
  revenue_band: RevenueBand;
  activities: string[];
  free_text: string | null;
  email: string | null;
}

export interface UserProfile {
  business_description: string;
  state: string;
  city: string | null;
  employee_count: number;
  revenue_band: RevenueBand;
  activities: string[];
  free_text: string | null;
  industries: string[];
  derived_queries: string[];
}

export interface VerifiedCredit {
  credit: Credit;
  qualifies: "yes" | "likely" | "no";
  confidence: number;
  estimated_credit_low: number;
  estimated_credit_high: number;
  reasoning: string;
  what_to_verify: string[];
}

export interface ReportSection {
  credit_id: string;
  name: string;
  jurisdiction: Jurisdiction;
  estimated_low: number;
  estimated_high: number;
  why_you_qualify: string;
  action_steps: string[];
  form: string;
  deadline: string;
  deadline_critical: boolean;
  documentation: string[];
  source_url: string;
}

export interface Report {
  session_id: string;
  generated_at: string;
  business_summary: string;
  total_estimated_low: number;
  total_estimated_high: number;
  critical_deadlines: ReportSection[];
  federal: ReportSection[];
  state: ReportSection[];
  local: ReportSection[];
  action_plan_this_week: string[];
  action_plan_this_month: string[];
  action_plan_this_quarter: string[];
  cpa_handoff_summary: string;
  disclaimer: string;
}

export interface Session {
  id: string;
  email: string | null;
  raw: RawIntake;
  profile: UserProfile;
  report: Report;
  paid: boolean;
  stripe_session_id: string | null;
  created_at: string;
  unlocked_at: string | null;
}
