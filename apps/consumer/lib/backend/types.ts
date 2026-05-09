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

// ---- Country shortlist (visual decision board) ----

export interface ShortlistWeights {
  career: number;
  cost: number;
  family: number;
  lifestyle: number;
  speed: number;
}

export interface ShortlistRequest {
  countries: string[];
  weights: ShortlistWeights;
}

/** Hard cap on simultaneous shortlist size — mirrors `SHORTLIST_MAX` in
 *  the backend's `shortlist_schemas.py`. */
export const SHORTLIST_MAX = 3;

/** Minimum number of countries the backend requires to score a board. */
export const SHORTLIST_MIN = 2;

/**
 * ISO-2 codes the backend's curated shortlist dataset can score. Mirrors
 * the keys of `COUNTRY_METRICS` in
 * `backend/app/modules/country_comparison/shortlist_data.py`. The backend
 * now returns 400 when an unsupported code is sent — keep this list in
 * sync so the picker can't submit codes the engine will reject.
 */
export const SUPPORTED_SHORTLIST_CODES: readonly string[] = [
  "DE", "NL", "IE", "GB", "FR", "ES", "PT", "IT", "SE", "CH", "EE",
  "CA", "US", "AU", "NZ", "AE", "QA", "SA", "IL", "SG", "JP", "KR",
  "HK", "MY", "IN", "PK", "BR", "ZA", "NG", "TR", "EG", "PH",
];

export function isSupportedShortlistCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return SUPPORTED_SHORTLIST_CODES.includes(code.toUpperCase());
}

export interface ShortlistScoreBreakdown {
  job_market: number;
  salary_power: number;
  employer_sponsor_density: number;
  visa_friction: number;
  speed_to_land: number;
  cost_of_living: number;
  housing_pressure: number;
  quality_of_life: number;
  family_fit: number;
  language_fit: number;
}

export interface ShortlistLeverScores {
  career: number;
  cost: number;
  family: number;
  lifestyle: number;
  speed: number;
  visa: number;
}

export interface ShortlistSensitivityPoint {
  weight: number;
  score: number;
  rank: number;
}

export interface ShortlistSensitivityCurve {
  lever: "career" | "cost" | "family" | "lifestyle" | "speed";
  points: ShortlistSensitivityPoint[];
  crossover_weight: number | null;
}

export interface ShortlistTransitionCurvePoint {
  metric: string;
  origin: number;
  destination: number;
}

export interface ShortlistScoreComponent {
  lever: "career" | "cost" | "family" | "lifestyle" | "speed";
  raw_score: number;
  weight: number;
  contribution: number;
}

export interface ShortlistLeverThreshold {
  lever: "career" | "cost" | "family" | "lifestyle" | "speed";
  direction: "increase" | "decrease";
  threshold_pct: number;
  flips_to_rank: number;
  one_line: string;
}

export interface ShortlistCountryDrilldown {
  code: string;
  summary_one_line: string;
  biggest_advantage: string;
  biggest_risk: string;
  lever_scores: ShortlistLeverScores;
  breakdown: ShortlistScoreBreakdown;
  sensitivity_curves: ShortlistSensitivityCurve[];
  transition_curve: ShortlistTransitionCurvePoint[];
  rank_change_thresholds: ShortlistLeverThreshold[];
  score_components: ShortlistScoreComponent[];
}

export interface ShortlistRankedCountry {
  code: string;
  name: string;
  region: string;
  rank: number;
  weighted_score: number;
  breakdown: ShortlistScoreBreakdown;
  lever_scores: ShortlistLeverScores;
  top_strength: string;
  top_risk: string;
  confidence: number;
  drilldown: ShortlistCountryDrilldown;
}

export interface ShortlistDimensionScore {
  code: string;
  name: string;
  score: number;
}

export interface ShortlistDimensionContributingMetric {
  metric_key: string;
  metric_label: string;
  weight: number;
  series: ShortlistDimensionScore[];
}

export interface ShortlistDimensionWinner {
  dimension: "career" | "cost" | "family" | "lifestyle" | "speed" | "visa";
  label: string;
  winner_code: string;
  winner_name: string;
  winning_score: number;
  runner_up_code: string | null;
  runner_up_name: string | null;
  margin: number;
  series: ShortlistDimensionScore[];
  contributing_metrics: ShortlistDimensionContributingMetric[];
  reason_one_line: string;
}

export interface ShortlistComparisonSeries {
  code: string;
  name: string;
  values: number[];
}

export interface ShortlistSwitchabilityRow {
  challenger_code: string;
  challenger_name: string;
  over_code: string;
  over_name: string;
  lever: "career" | "cost" | "family" | "lifestyle" | "speed";
  direction: "increase" | "decrease";
  threshold_pct: number | null;
  one_line: string;
}

export interface ShortlistTransitionDelta {
  metric: string;
  origin_score: number;
  destination_score: number;
  delta: number;
  direction: "gain" | "loss" | "same";
  note: string;
}

export interface ShortlistTransitionStrip {
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  deltas: ShortlistTransitionDelta[];
  headline_gain: string;
  headline_loss: string;
}

export interface ShortlistCounterfactual {
  challenger_code: string;
  challenger_name: string;
  over_code: string;
  over_name: string;
  lever: "career" | "cost" | "family" | "lifestyle" | "speed";
  direction: "increase" | "decrease";
  threshold_pct: number;
  one_line: string;
}

export type DecisionFingerprintStyle =
  | "career_first"
  | "cost_sensitive"
  | "family_heavy"
  | "speed_driven"
  | "visa_risk_averse"
  | "lifestyle_focused"
  | "balanced";

export interface ShortlistDecisionFingerprint {
  style: DecisionFingerprintStyle;
  label: string;
  one_line: string;
  weight_distribution: Record<string, number>;
}

export interface ShortlistFinalRecommendation {
  winner_code: string;
  winner_name: string;
  why_one_line: string;
  next_action_label: string;
  next_action_href: string;
  margin_over_runner_up: number;
}

export interface ShortlistDataSourceMeta {
  source: string;
  last_updated: string;
  confidence: number;
  availability: "live" | "cached" | "inferred";
}

export interface ShortlistResponse {
  countries: ShortlistRankedCountry[];
  dimension_labels: string[];
  comparison_series: ShortlistComparisonSeries[];
  dimension_winners: ShortlistDimensionWinner[];
  transitions: ShortlistTransitionStrip[];
  counterfactuals: ShortlistCounterfactual[];
  switchability: ShortlistSwitchabilityRow[];
  fingerprint: ShortlistDecisionFingerprint;
  final: ShortlistFinalRecommendation;
  source: ShortlistDataSourceMeta;
  assumptions: string[];
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

export interface MarketDemandDetail {
  score: number;
  level: "low" | "medium" | "high";
  note: string;
  demand_signals: string[];
}

export interface CareerAngleRecommendation {
  title: string;
  detail: string;
  impact: "low" | "medium" | "high";
  category: string;
}

export interface SupportingSignal {
  title: string;
  detail: string;
  confidence: number;
  category: string;
}

export interface JobFitDetail {
  overall_job_fit_score: number;
  role_match: RoleMatchDetail;
  salary_realism: SalaryRealismDetail;
  visa_employability: VisaEmployabilityDetail;
  market_demand?: MarketDemandDetail;
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
  career_angle_recommendations?: CareerAngleRecommendation[];
  supporting_signals?: SupportingSignal[];
}

export type VisaDifficulty = "low" | "medium" | "high" | "very_high";
export type VisaUserMeets = "yes" | "partial" | "no" | "unknown";
export type VisaDependencyStatus = "have" | "need" | "in_progress" | "unknown";

export interface VisaRouteRequirement {
  label: string;
  detail: string;
  user_meets: VisaUserMeets;
}

export interface VisaPrimaryRoute {
  name: string;
  code?: string | null;
  difficulty: VisaDifficulty;
  typical_processing_weeks_min: number;
  typical_processing_weeks_max: number;
  sponsor_required: boolean;
  family_friendly: boolean;
  requirements: VisaRouteRequirement[];
  rationale: string;
}

export interface VisaAlternativeRoute {
  name: string;
  difficulty: VisaDifficulty;
  why_consider: string;
}

export interface VisaBlocker {
  label: string;
  severity: "low" | "medium" | "high";
  detail: string;
  fixable: boolean;
  fixable_in_weeks?: number | null;
}

export interface VisaDependency {
  requirement: string;
  depends_on: string;
  status: VisaDependencyStatus;
  note?: string | null;
}

export interface VisaDirectionDetail {
  primary_route: VisaPrimaryRoute;
  route_difficulty: VisaDifficulty;
  typical_processing_time_label: string;
  alternative_routes: VisaAlternativeRoute[];
  blockers: VisaBlocker[];
  fixable_blockers?: VisaBlocker[];
  dependencies: VisaDependency[];
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

export type RelocationGoal =
  | "compare_countries"
  | "relocate_with_offer"
  | "find_job_abroad"
  | "visa_feasibility"
  | "family_relocation"
  | "stress_test_affordability"
  | "documents_timeline"
  | "move_fast";

export type FamilyStatus =
  | "single"
  | "partnered"
  | "married"
  | "separated"
  | "widowed";

export type CostSensitivity = "low" | "medium" | "high";
export type FamilyBudgetImpact = "low" | "medium" | "high";
export type ReadinessLevel = "low" | "medium" | "high";
export type LanguageConfidence =
  | "none"
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";
export type SchoolRequirement =
  | "none"
  | "preschool"
  | "primary"
  | "secondary"
  | "high"
  | "tertiary"
  | "special_needs";

export interface BackendProfile {
  // identity
  full_name?: string | null;
  phone?: string | null;
  current_role?: string | null;
  target_role?: string | null;
  current_employer?: string | null;
  industry?: string | null;
  seniority?: string | null;
  years_experience?: number | null;
  skills?: { name: string }[];
  education?: unknown[];
  companies?: string[];
  certifications?: string[];
  languages_known?: string[];
  destination_language_confidence?: LanguageConfidence | null;

  // relocation
  current_country?: string | null;
  current_city?: string | null;
  target_country?: string | null;
  target_city?: string | null;
  nationality?: string | null;
  current_visa_status?: string | null;
  open_to_alternatives?: boolean | null;
  alternatives?: string[];
  relocation_goal?: RelocationGoal | null;
  reason_for_moving?: string | null;

  // finance
  current_salary?: number | null;
  expected_salary?: number | null;
  salary_currency?: string | null;
  monthly_budget?: number | null;
  savings?: number | null;
  rent_expectation?: number | null;
  cost_sensitivity?: CostSensitivity | null;

  // intent
  move_urgency?: "asap" | "6m" | "12m" | "exploring" | null;
  work_preference?: "onsite" | "hybrid" | "remote" | null;
  relocation_budget?: number | null;
  needs_visa_sponsorship?: boolean | null;
  priority_ranking?: string[];

  // household
  family_status?: FamilyStatus | null;
  moving_with_family?: boolean | null;
  children_count?: number | null;
  parents_moving?: boolean | null;
  family_budget_impact?: FamilyBudgetImpact | null;
  housing_requirement?: string | null;
  school_requirement?: SchoolRequirement | null;

  // readiness
  readiness_level?: ReadinessLevel | null;
  move_clarity_score?: number | null;

  // documents
  current_document_status?: Record<string, { has?: boolean; expires_at?: string; notes?: string }>;

  // meta
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
