export {
  createComparableRunRecord,
} from "./comparisonRecord";

export {
  ANALYTICS_METRICS,
  comparePersistedRunRecords,
} from "./baselineComparison";

export type {
  AnalyticsCriterionDirection,
  AnalyticsMetricKey,
  ComparableRunEconomic,
  ComparableRunIdentity,
  ComparableRunPolicy,
  ComparableRunRecord,
  MetricComparison,
  MetricDefinition,
  RunComparisonResult,
} from "./types";

export {
  evaluatePolicyConstraints,
} from "./policyEvaluator";

export type {
  PolicyConstraintEvaluation,
  PolicyEvaluationResult,
  PolicyEvaluationStatus,
} from "./types";

export {
  analyzePersistedRuns,
} from "./multiRunAnalytics";

export type {
  MultiRunAnalyticsResult,
  MultiRunMetricStatistics,
  MultiRunStudyRecord,
} from "./types";

export {
  assessStudyCompatibility,
} from "./studyCompatibility";

export type {
  StudyCompatibilityIssue,
  StudyCompatibilityLevel,
  StudyCompatibilityReport,
} from "./types";

export {
  assessMcdaCriterionEligibility,
  createDefaultMcdaCriteria,
  evaluateMcda,
} from "./mcda";

export type {
  McdaCriterionConfiguration,
  McdaCriterionDirection,
  McdaCriterionEligibility,
  McdaNormalizedCriterionValue,
  McdaRankedAlternative,
  McdaResult,
} from "./types";

export {
  analyzePareto,
  dominates,
} from "./pareto";

export {
  analyzeMcdaSensitivity,
} from "./mcdaSensitivity";

export type {
  McdaRunStability,
  McdaSensitivityResult,
  McdaSensitivityScenario,
  ParetoAlternative,
  ParetoAnalysisResult,
  ParetoCriterionConfiguration,
} from "./types";
