import type {
  ComparableRunRecord,
  PolicyConstraintEvaluation,
  PolicyEvaluationResult,
} from "./types";

function finite(
  value:
    number | null | undefined,
): number | null {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : null;
}

function minimumConstraint(
  input: {
    key:
      PolicyConstraintEvaluation["key"];

    label:
      string;

    actual:
      number | null;

    threshold:
      number | null;

    unit:
      string | null;

    applicable:
      boolean;

    explanation:
      string;
  },
): PolicyConstraintEvaluation {
  if (!input.applicable) {
    return {
      key:
        input.key,

      label:
        input.label,

      status:
        "not_applicable",

      actualValue:
        input.actual,

      thresholdValue:
        input.threshold,

      unit:
        input.unit,

      margin:
        null,

      explanation:
        input.explanation,
    };
  }

  if (input.threshold === null) {
    return {
      key:
        input.key,

      label:
        input.label,

      status:
        "not_configured",

      actualValue:
        input.actual,

      thresholdValue:
        null,

      unit:
        input.unit,

      margin:
        null,

      explanation:
        "No threshold was configured for this scenario.",
    };
  }

  if (input.actual === null) {
    return {
      key:
        input.key,

      label:
        input.label,

      status:
        "not_applicable",

      actualValue:
        null,

      thresholdValue:
        input.threshold,

      unit:
        input.unit,

      margin:
        null,

      explanation:
        "The persisted run does not contain the metric required for this constraint.",
    };
  }

  const margin =
    input.actual -
    input.threshold;

  return {
    key:
      input.key,

    label:
      input.label,

    status:
      margin >= 0
        ? "pass"
        : "fail",

    actualValue:
      input.actual,

    thresholdValue:
      input.threshold,

    unit:
      input.unit,

    margin,

    explanation:
      margin >= 0
        ? "The persisted result meets or exceeds the configured minimum."
        : "The persisted result is below the configured minimum.",
  };
}

function maximumConstraint(
  input: {
    key:
      PolicyConstraintEvaluation["key"];

    label:
      string;

    actual:
      number | null;

    threshold:
      number | null;

    unit:
      string | null;

    applicable:
      boolean;

    explanation:
      string;
  },
): PolicyConstraintEvaluation {
  if (!input.applicable) {
    return {
      key:
        input.key,

      label:
        input.label,

      status:
        "not_applicable",

      actualValue:
        input.actual,

      thresholdValue:
        input.threshold,

      unit:
        input.unit,

      margin:
        null,

      explanation:
        input.explanation,
    };
  }

  if (input.threshold === null) {
    return {
      key:
        input.key,

      label:
        input.label,

      status:
        "not_configured",

      actualValue:
        input.actual,

      thresholdValue:
        null,

      unit:
        input.unit,

      margin:
        null,

      explanation:
        "No threshold was configured for this scenario.",
    };
  }

  if (input.actual === null) {
    return {
      key:
        input.key,

      label:
        input.label,

      status:
        "not_applicable",

      actualValue:
        null,

      thresholdValue:
        input.threshold,

      unit:
        input.unit,

      margin:
        null,

      explanation:
        "The persisted run does not contain the metric required for this constraint.",
    };
  }

  const margin =
    input.threshold -
    input.actual;

  return {
    key:
      input.key,

    label:
      input.label,

    status:
      margin >= 0
        ? "pass"
        : "fail",

    actualValue:
      input.actual,

    thresholdValue:
      input.threshold,

    unit:
      input.unit,

    margin,

    explanation:
      margin >= 0
        ? "The persisted result remains within the configured maximum."
        : "The persisted result exceeds the configured maximum.",
  };
}


function normalizedPercentageThreshold(
  value:
    number | null,
): number | null {
  if (
    value === null
  ) {
    return null;
  }

  /*
   * Scenario policy values such as 0.8 and 0.4
   * are stored as normalized fractions.
   *
   * Canonical simulation crop-retention and GCR
   * results are percentage-valued, e.g. 88.2
   * and 17.6.
   *
   * Convert normalized fractions in [0, 1] to
   * percentage units before comparison.
   */
  if (
    value >= 0 &&
    value <= 1
  ) {
    return (
      value *
      100
    );
  }

  return value;
}

function panelHeight(
  record:
    ComparableRunRecord,
): number | null {
  const technical =
    record.identity.siteType ===
      "land_agrivoltaic"
      ? null
      : null;

  void technical;

  return null;
}

export function evaluatePolicyConstraints(
  record:
    ComparableRunRecord,
): PolicyEvaluationResult {
  const summary =
    record.summary;

  const policy =
    record.policy;

  const isAgrivoltaic =
    record.identity.siteType ===
      "land_agrivoltaic";

  const cropRetention =
    finite(
      summary.estimatedCropYieldPercent,
    );

  const gcr =
    finite(
      summary.groundCoverageRatioPercent,
    );

  const ler =
    finite(
      summary.landEquivalentRatio,
    );

  const energy =
    finite(
      summary.dailyEnergyKwh,
    );

  const openFieldDli =
    finite(
      summary.openFieldDliMolM2,
    );

  const cropDli =
    finite(
      summary.cropDliMolM2,
    );

  const dliReduction =
    (
      openFieldDli !== null &&
      cropDli !== null &&
      openFieldDli > 0
    )
      ? (
          1 -
          cropDli /
            openFieldDli
        ) * 100
      : null;

  const constraints:
    PolicyConstraintEvaluation[] = [
      minimumConstraint({
        key:
          "minimumCropRetention",

        label:
          "Minimum crop retention",

        actual:
          cropRetention,

        threshold:
  normalizedPercentageThreshold(
    finite(
      policy.minimumCropRetention,
    ),
  ),

        unit:
          "%",

        applicable:
          isAgrivoltaic,

        explanation:
          "Crop-retention constraints apply to land agrivoltaic simulations.",
      }),

      maximumConstraint({
        key:
          "maximumGcr",

        label:
          "Maximum ground coverage ratio",

        actual:
          gcr,

        threshold:
  normalizedPercentageThreshold(
    finite(
      policy.maximumGcr,
    ),
  ),

        unit:
          "%",

        applicable:
          isAgrivoltaic,

        explanation:
          "Ground-coverage policy constraints apply to land agrivoltaic systems.",
      }),

      minimumConstraint({
        key:
          "minimumLer",

        label:
          "Minimum Land Equivalent Ratio",

        actual:
          ler,

        threshold:
          finite(
            policy.minimumLer,
          ),

        unit:
          null,

        applicable:
          isAgrivoltaic,

        explanation:
          "LER applies to integrated land agrivoltaic performance.",
      }),

      minimumConstraint({
        key:
          "minimumPanelHeightM",

        label:
          "Minimum panel height",

        actual:
          panelHeight(
            record,
          ),

        threshold:
          finite(
            policy.minimumPanelHeightM,
          ),

        unit:
          "m",

        applicable:
          isAgrivoltaic,

        explanation:
          "Panel-height evaluation will become active when the persisted comparable record exposes panel height.",
      }),

      maximumConstraint({
        key:
          "maximumDliReduction",

        label:
          "Maximum DLI reduction",

        actual:
          dliReduction,

        threshold:
          finite(
            policy.maximumDliReduction,
          ),

        unit:
          "%",

        applicable:
          isAgrivoltaic,

        explanation:
          "DLI reduction is calculated from persisted open-field and crop DLI values.",
      }),

      minimumConstraint({
        key:
          "minimumRenewableEnergyKwh",

        label:
          "Minimum renewable energy",

        actual:
          energy,

        threshold:
          finite(
            policy.minimumRenewableEnergyKwh,
          ),

        unit:
          "kWh/day",

        applicable:
          true,

        explanation:
          "Energy threshold is evaluated from the persisted daily-energy result.",
      }),
    ];

  const configured =
    constraints.filter(
      (
        constraint,
      ) =>
        constraint.status ===
          "pass" ||
        constraint.status ===
          "fail",
    );

  const passed =
    configured.filter(
      (
        constraint,
      ) =>
        constraint.status ===
        "pass",
    );

  const failed =
    configured.filter(
      (
        constraint,
      ) =>
        constraint.status ===
        "fail",
    );

  const overallStatus =
    configured.length === 0
      ? "not_evaluable"
      : failed.length > 0
        ? "fail"
        : "pass";

  return {
    schema:
      "agritwin-policy-evaluation-v1",

    runId:
      record.identity.runId,

    scenarioId:
      record.identity.scenarioId,

    policyPreset:
      record.policy.policyPreset,

    overallStatus,

    configuredConstraintCount:
      configured.length,

    passedConstraintCount:
      passed.length,

    failedConstraintCount:
      failed.length,

    constraints,
  };
}
