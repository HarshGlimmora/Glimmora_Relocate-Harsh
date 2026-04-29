/**
 * Backend AnalysisEnvelope contract (mirrors `app/schemas/envelope.py`).
 *
 * The FastAPI backend returns an envelope of this shape for every
 * analysis module. Keep this file in sync with the Pydantic schema.
 */

export type AnalysisStatus = "generating" | "ready" | "failed";

export type AnalysisKind =
  | "country_comparison"
  | "jobfit"
  | "visa"
  | "family"
  | "finance"
  | "documents"
  | "workflow"
  | "culture"
  | "timeline"
  | "synthesis";

export type RiskSeverity = "low" | "medium" | "high";

export interface Risk {
  severity: RiskSeverity;
  label: string;
  detail: string;
}

export interface NextAction {
  label: string;
  urgency: string;
  why: string;
}

export type AssumptionSource = "inferred" | "default" | "user" | "model";

export interface Assumption {
  label: string;
  detail?: string | null;
  source: AssumptionSource;
  confidence: number;
}

export interface EnvelopeMetadata {
  generated_at: string;
  model?: string | null;
  prompt_version?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  latency_ms?: number | null;
  [k: string]: unknown;
}

export interface AnalysisEnvelope<TDetail> {
  status: AnalysisStatus;
  score: number | null;
  summary: string;
  reasoning: string;
  risks: Risk[];
  next_actions: NextAction[];
  confidence: number;
  metadata: EnvelopeMetadata;
  detail: TDetail;
  analysis_version: number;
  stale: boolean;
  recompute_required: boolean;
  stale_reason: string | null;
  input_hash: string;
  assumptions: Assumption[];
}

export interface FailedEnvelope {
  status: "failed";
  kind: AnalysisKind;
  error_code: string;
  user_message: string;
  metadata: Record<string, unknown>;
}

/** Wrapper returned by every `/run`, `/<>` (latest), and history item. */
export interface ModuleResponse<TDetail> {
  id: string;
  case_id: string;
  kind: AnalysisKind;
  status: AnalysisStatus;
  envelope: AnalysisEnvelope<TDetail> | FailedEnvelope;
  analysis_version: number;
  stale: boolean;
  recompute_required: boolean;
  stale_reason: string | null;
  cached?: boolean;
  model?: string | null;
  prompt_version?: string | null;
  input_hash?: string;
  tokens_in?: number | null;
  tokens_out?: number | null;
  latency_ms?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ---- per-module Detail shapes ----

export interface PairedScore {
  origin: number;
  destination: number;
  delta: number;
  note: string;
}

export interface AccessPointScores {
  job_market_access: PairedScore;
  visa_access: PairedScore;
  housing_pressure: PairedScore;
  healthcare_access: PairedScore;
  schooling_access: PairedScore;
  cultural_fit: PairedScore;
  language_fit: PairedScore;
}

export interface StrengthOrBlocker {
  title: string;
  detail: string;
  side: "origin" | "destination" | "both";
}

export interface CountryComparisonDetail {
  origin: { country?: string; city?: string };
  destination: { country?: string; city?: string };
  overall_comparison_score: number;
  destination_suitability_score: number;
  origin_pressure_score: number;
  access_points: AccessPointScores;
  strengths: StrengthOrBlocker[];
  blockers: StrengthOrBlocker[];
  comparison_summary: string;
  alternatives_considered: { country: string; headline: string; fit_score: number }[];
}

export interface SalaryRange {
  min: number;
  p50: number;
  max: number;
  currency: string;
}

export interface RoleMatchDetail {
  score: number;
  target_role_inferred: string;
  confidence: number;
  rationale: string;
}

export interface SalaryRealismDetail {
  score: number;
  user_expectation: SalaryRange;
  market_estimate: SalaryRange;
  gap_pct: number;
  note: string;
}

export interface VisaEmployabilityDetail {
  score: number;
  sponsor_friendly_employer_density: string;
  typical_sponsor_titles: string[];
  note: string;
}

export interface JobFitDetail {
  overall_job_fit_score: number;
  role_match: RoleMatchDetail;
  salary_realism: SalaryRealismDetail;
  visa_employability: VisaEmployabilityDetail;
  aligned_skills: { name: string; why: string }[];
  missing_skills: { name: string; why: string }[];
  transferable_skills: { name: string; transfers_to: string; note: string }[];
  alternate_roles: { role: string; fit_score: number; why: string }[];
  job_pathways: {
    name: string;
    steps: string[];
    time_to_offer_weeks: number;
    confidence: number;
  }[];
  key_gaps: { label: string; severity: string }[];
}

export interface VisaPrimaryRoute {
  name: string;
  code?: string;
  difficulty: string;
  typical_processing_weeks_min: number;
  typical_processing_weeks_max: number;
  sponsor_required: boolean;
  family_friendly: boolean;
  requirements: { label: string; user_meets?: boolean | null }[];
  rationale: string;
}

export interface VisaDirectionDetail {
  primary_route: VisaPrimaryRoute;
  route_difficulty: string;
  typical_processing_time_label: string;
  alternative_routes: {
    name: string;
    code?: string;
    difficulty?: string;
    note: string;
  }[];
  blockers: {
    label: string;
    fixable: boolean;
    window?: string;
    detail?: string;
  }[];
  fixable_blockers?: unknown[];
  dependencies: { label: string; status: string; detail?: string }[];
  legal_disclaimer: string;
}

export interface FamilyImpactDetail {
  mode: "solo" | "with_family";
  household_complexity_score: number;
  spouse_outlook?: {
    work_authorisation: string;
    career_continuity: string;
    note: string;
  } | null;
  child_outlooks?: {
    age: number;
    schooling_recommendation: string;
    adaptation_note: string;
  }[];
  parents_outlook?: {
    healthcare_sensitivity: string;
    visa_path: string;
    note: string;
  } | null;
  housing_fit?: { fit: string; note: string } | null;
  family_warnings: { label: string; affects: string; detail: string }[];
  family_suggestions: { label: string; urgency: string; detail: string }[];
  headline_finding?: string;
}

export interface CostLine {
  amount: number;
  currency: string;
  note?: string;
}

export interface MonthlyNet {
  gross_monthly: number;
  estimated_tax_monthly: number;
  effective_tax_rate_pct: number;
  take_home_monthly: number;
  currency: string;
}

export interface MonthlyCost {
  housing: CostLine;
  utilities: CostLine;
  food: CostLine;
  transport: CostLine;
  healthcare: CostLine;
  childcare?: CostLine;
  discretionary: CostLine;
  total_monthly: number;
  currency: string;
}

export interface FinanceDetail {
  monthly_net: MonthlyNet;
  monthly_cost: MonthlyCost;
  surplus_or_deficit_monthly: number;
  affordability_score: number;
  salary_to_expense_ratio: number;
  savings_runway_months: number;
  fx_notes: { from: string; to: string; direction: string; note: string }[];
  risk_flags: { severity: string; label: string; detail: string }[];
  headline_finding: string;
}

export interface ChecklistItem {
  kind: string;
  label: string;
  status: "have" | "need" | "expiring" | "unknown";
  urgency: "now" | "30d" | "90d" | "6m" | "later";
  required_for: string[];
  expires_at?: string | null;
  notes?: string | null;
}

export interface DocumentChecklistDetail {
  items: ChecklistItem[];
  readiness_percentage: number;
  have_count: number;
  need_count: number;
  expiring_count: number;
  total_count: number;
  missing_items: ChecklistItem[];
  expiring_items: ChecklistItem[];
  required_for_summary: Record<string, string[]>;
  next_to_handle: { kind: string; label: string; why: string };
  headline_finding: string;
}

export interface WorkflowNode {
  id: string;
  label: string;
  category: string;
  status: "not_started" | "in_progress" | "done" | "blocked" | "skipped";
  estimated_duration_days_min: number;
  estimated_duration_days_max: number;
  owner: string;
  description?: string;
  blocked_reason?: string;
}

export interface WorkflowEdge {
  from_node: string;
  to_node: string;
  reason: string;
  hard: boolean;
}

export interface WorkflowDetail {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  current_stage_node_id: string;
  critical_path: string[];
  blocked_node_ids: string[];
  total_estimated_days_min: number;
  total_estimated_days_max: number;
  headline_finding: string;
}

export interface BasicPhrase {
  phrase: string;
  translation: string;
  usage?: string;
}

export interface CultureDetail {
  workplace_norms: {
    communication_style: string;
    hierarchy_note: string;
    meeting_etiquette: string;
    dress_code?: string;
    punctuality?: string;
    feedback_culture?: string;
  };
  daily_life: { topic: string; note: string }[];
  language: {
    primary_language: string;
    english_usability_score: number;
    proficiency_target: "none" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    rationale: string;
    basic_phrases: BasicPhrase[];
  };
  first_week_kit: {
    label: string;
    why: string;
    priority: "must" | "should" | "nice";
    effort_hours: number;
  }[];
  dos_and_donts: { do: string; dont: string }[];
  family_adaptation_notes: string[];
  headline_finding: string;
}

export interface TimelinePhase {
  id: string;
  label: string;
  start_week: number;
  end_week: number;
  description: string;
  category: string;
}

export interface TimelineMilestone {
  id: string;
  label: string;
  target_week: number;
  phase_id: string;
  depends_on: string[];
  why: string;
}

export interface TimelineBlocker {
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  blocks_phase_id?: string | null;
  estimated_unblock_weeks: number;
}

export interface TimelineDetail {
  start_anchor: "today" | "earliest_realistic_start";
  earliest_realistic_start_date: string;
  phases: TimelinePhase[];
  milestones: TimelineMilestone[];
  blockers: TimelineBlocker[];
  estimated_total_weeks_min: number;
  estimated_total_weeks_max: number;
  critical_milestones: string[];
  headline_finding: string;
}

export interface ModuleScore {
  kind: string;
  label: string;
  score: number;
  confidence: number;
  summary: string;
  available: boolean;
}

export interface SynthesisDetail {
  feasibility_score: number;
  verdict: "go" | "go_with_conditions" | "wait" | "reconsider" | "blocked";
  one_line_reasoning: string;
  recommended_destination: {
    country: string;
    city?: string;
    confidence: number;
    rationale: string;
  };
  recommended_job_path: {
    title: string;
    industry?: string;
    confidence: number;
    rationale: string;
  };
  module_scores: ModuleScore[];
  module_summaries: Record<string, string>;
  top_blockers: {
    label: string;
    detail: string;
    severity: RiskSeverity;
    source_module: string;
  }[];
  next_best_actions: {
    label: string;
    why: string;
    urgency: string;
    effort_hours: number;
  }[];
  explanation: string;
  headline_finding: string;
}

// ---- Profile / Case shapes ----

export interface BackendProfile {
  full_name?: string | null;
  current_role?: string | null;
  industry?: string | null;
  seniority?: string | null;
  years_experience?: number | null;
  skills?: { name: string }[];
  education?: unknown[];
  companies?: string[];

  current_country?: string | null;
  current_city?: string | null;
  target_country?: string | null;
  target_city?: string | null;
  nationality?: string | null;
  current_visa_status?: string | null;

  current_salary?: number | null;
  expected_salary?: number | null;
  salary_currency?: string | null;
  move_urgency?: "asap" | "6m" | "12m" | "exploring" | null;
  work_preference?: "onsite" | "hybrid" | "remote" | null;
  relocation_budget?: number | null;
  needs_visa_sponsorship?: boolean | null;
  priority_ranking?: string[];
  current_document_status?: Record<string, { has?: boolean; expires_at?: string; notes?: string }>;

  field_sources?: Record<string, string>;
  completion_percentage?: number;
}

export interface CaseSummary {
  id: string;
  user_id: string;
  state: string;
  state_changed_at: string;
  inputs_revision: number;
  inputs_snapshot: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}
