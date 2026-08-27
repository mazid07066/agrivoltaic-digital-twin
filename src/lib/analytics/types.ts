import type {
  CanonicalSimulationSummary,
  SimulationEngineKind,
} from "@/lib/execution/types";

export type AnalyticsMetricKey =
  | "installedCapacityKw"
  | "dailyEnergyKwh"
  | "specificYieldKwhPerKw"
  | "openFieldDliMolM2"
  | "cropDliMolM2"
  | "estimatedCropYieldPercent"
  | "landEquivalentRatio"
  | "groundCoverageRatioPercent"
  | "usableAreaPercent"
  | "moduleCount";

export type AnalyticsCriterionDirection =
  | "benefit"
  | "cost"
  | "neutral";

export interface ComparableRunIdentity {
  runId: string;

  scenarioId: string | null;
  scenarioVersion: number;
  scenarioName: string;
  scenarioType: string;
  isBaseline: boolean;

  projectId: string;

  siteId: string;
  siteVersionId: string;
  siteVersionNumber: number;
  siteType: string;
  siteName: string;

  simulationDate: string;

  engineKind: SimulationEngineKind;
  engineVersion: string;
  controllerVersion: string | null;
  weatherAdapterVersion: string | null;

  modelMode?:
    | "legacy_parity"
    | "physics_research"
    | "reference_validation";

  executionFingerprint: string | null;
  environmentFingerprint: string | null;

  reproducibilityVerified: boolean;
}

export interface ComparableRunPolicy {
  minimumCropRetention: number | null;
  maximumGcr: number | null;
  minimumLer: number | null;
  minimumPanelHeightM: number | null;
  maximumDliReduction: number | null;
  minimumRenewableEnergyKwh: number | null;
  policyPreset: string | null;
}

export interface ComparableRunEconomic {
  currency: string | null;
  capex: number | null;
  annualOpex: number | null;
  electricityTariffPerKwh: number | null;
  cropPrice: number | null;
  discountRate: number | null;
  projectLifetimeYears: number | null;
}

export interface ComparableRunRecord {
  schema: "agritwin-comparable-run-v1";

  identity: ComparableRunIdentity;

  summary: CanonicalSimulationSummary;

  policy: ComparableRunPolicy;

  economic: ComparableRunEconomic;
}

export interface MetricDefinition {
  key: AnalyticsMetricKey;
  label: string;
  unit: string | null;
  direction: AnalyticsCriterionDirection;
}

export interface MetricComparison {
  key: AnalyticsMetricKey;

  label: string;

  unit: string | null;

  direction: AnalyticsCriterionDirection;

  referenceValue: number | null;

  alternativeValue: number | null;

  absoluteDelta: number | null;

  relativeChangePercent: number | null;

  available: boolean;
}

export interface RunComparisonResult {
  schema: "agritwin-run-comparison-v1";

  reference: ComparableRunRecord;

  alternative: ComparableRunRecord;

  metrics: MetricComparison[];

  comparableMetricCount: number;

  unavailableMetricCount: number;
}

export type PolicyEvaluationStatus =
  | "pass"
  | "fail"
  | "not_applicable"
  | "not_configured";

export interface PolicyConstraintEvaluation {
  key:
    | "minimumCropRetention"
    | "maximumGcr"
    | "minimumLer"
    | "minimumPanelHeightM"
    | "maximumDliReduction"
    | "minimumRenewableEnergyKwh";

  label: string;

  status:
    PolicyEvaluationStatus;

  actualValue:
    number | null;

  thresholdValue:
    number | null;

  unit:
    string | null;

  margin:
    number | null;

  explanation:
    string;
}

export interface PolicyEvaluationResult {
  schema:
    "agritwin-policy-evaluation-v1";

  runId:
    string;

  scenarioId:
    string | null;

  policyPreset:
    string | null;

  overallStatus:
    "pass"
    | "fail"
    | "not_evaluable";

  configuredConstraintCount:
    number;

  passedConstraintCount:
    number;

  failedConstraintCount:
    number;

  constraints:
    PolicyConstraintEvaluation[];
}

export interface MultiRunMetricStatistics {
  key:
    AnalyticsMetricKey;

  label:
    string;

  unit:
    string | null;

  direction:
    AnalyticsCriterionDirection;

  availableCount:
    number;

  unavailableCount:
    number;

  minimum:
    number | null;

  maximum:
    number | null;

  mean:
    number | null;

  bestRunId:
    string | null;

  bestValue:
    number | null;
}

export interface MultiRunStudyRecord {
  run:
    ComparableRunRecord;

  policyEvaluation:
    PolicyEvaluationResult;
}

export interface MultiRunAnalyticsResult {
  schema:
    "agritwin-multi-run-analytics-v1";

  generatedAt:
    string;

  runCount:
    number;

  compatibility:
    StudyCompatibilityReport;

  records:
    MultiRunStudyRecord[];

  metricStatistics:
    MultiRunMetricStatistics[];
}

export type StudyCompatibilityLevel =
  | "compatible"
  | "warning"
  | "incompatible";

export interface StudyCompatibilityIssue {
  key:
    string;

  level:
    Exclude<
      StudyCompatibilityLevel,
      "compatible"
    >;

  label:
    string;

  explanation:
    string;

  affectedRunIds:
    string[];
}

export interface StudyCompatibilityReport {
  schema:
    "agritwin-study-compatibility-v1";

  level:
    StudyCompatibilityLevel;

  compatible:
    boolean;

  runCount:
    number;

  projectCount:
    number;

  siteCount:
    number;

  siteTypeCount:
    number;

  engineKindCount:
    number;

  simulationDateCount:
    number;

  environmentFingerprintCount:
    number;

  engineVersionCount:
    number;

  issues:
    StudyCompatibilityIssue[];
}

export type McdaCriterionDirection =
  | "benefit"
  | "cost";

export interface McdaCriterionConfiguration {
  key:
    AnalyticsMetricKey;

  label:
    string;

  unit:
    string | null;

  direction:
    McdaCriterionDirection;

  weight:
    number;
}

export interface McdaCriterionEligibility {
  key:
    AnalyticsMetricKey;

  label:
    string;

  unit:
    string | null;

  sourceDirection:
    AnalyticsCriterionDirection;

  eligible:
    boolean;

  availableCount:
    number;

  missingCount:
    number;

  reason:
    string | null;
}

export interface McdaNormalizedCriterionValue {
  key:
    AnalyticsMetricKey;

  rawValue:
    number;

  normalizedValue:
    number;

  weightedValue:
    number;
}

export interface McdaRankedAlternative {
  runId:
    string;

  scenarioId:
    string | null;

  scenarioName:
    string;

  scenarioType:
    string;

  isBaseline:
    boolean;

  siteName:
    string;

  simulationDate:
    string;

  score:
    number;

  rank:
    number;

  criteria:
    McdaNormalizedCriterionValue[];
}

export interface McdaResult {
  schema:
    "agritwin-mcda-v1";

  method:
    "weighted-sum-min-max";

  generatedAt:
    string;

  runCount:
    number;

  criterionCount:
    number;

  compatibility:
    StudyCompatibilityReport;

  criteria:
    McdaCriterionConfiguration[];

  eligibility:
    McdaCriterionEligibility[];

  alternatives:
    McdaRankedAlternative[];

  warnings:
    string[];
}

export interface ParetoCriterionConfiguration {
  key:
    AnalyticsMetricKey;

  label:
    string;

  unit:
    string | null;

  direction:
    McdaCriterionDirection;
}

export interface ParetoAlternative {
  runId:
    string;

  scenarioId:
    string | null;

  scenarioName:
    string;

  siteName:
    string;

  simulationDate:
    string;

  dominated:
    boolean;

  dominatedByRunIds:
    string[];

  dominatesRunIds:
    string[];

  frontier:
    boolean;
}

export interface ParetoAnalysisResult {
  schema:
    "agritwin-pareto-v1";

  generatedAt:
    string;

  runCount:
    number;

  criterionCount:
    number;

  compatibility:
    StudyCompatibilityReport;

  criteria:
    ParetoCriterionConfiguration[];

  alternatives:
    ParetoAlternative[];

  frontierRunIds:
    string[];

  dominatedRunIds:
    string[];

  warnings:
    string[];
}

export interface McdaSensitivityScenario {
  criterionKey:
    AnalyticsMetricKey;

  criterionLabel:
    string;

  baseWeight:
    number;

  testedWeight:
    number;

  direction:
    "increase"
    | "decrease";

  ranking:
    {
      runId:
        string;

      rank:
        number;

      score:
        number;
    }[];

  topRunId:
    string | null;

  topChanged:
    boolean;
}

export interface McdaRunStability {
  runId:
    string;

  scenarioName:
    string;

  baseRank:
    number;

  bestObservedRank:
    number;

  worstObservedRank:
    number;

  rankRange:
    number;

  topRankCount:
    number;

  scenarioCount:
    number;

  topRankFrequency:
    number;
}

export interface McdaSensitivityResult {
  schema:
    "agritwin-mcda-sensitivity-v1";

  generatedAt:
    string;

  perturbationFraction:
    number;

  baseResult:
    McdaResult;

  scenarios:
    McdaSensitivityScenario[];

  stability:
    McdaRunStability[];

  topAlternativeStable:
    boolean;

  rankReversalDetected:
    boolean;

  distinctTopRunIds:
    string[];

  warnings:
    string[];
}
