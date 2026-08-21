import type {
  ComparableRunRecord,
  StudyCompatibilityIssue,
  StudyCompatibilityReport,
} from "./types";

function distinctNonNull(
  values:
    Array<string | null>,
): Set<string> {
  return new Set(
    values.filter(
      (
        value,
      ): value is string =>
        typeof value ===
          "string" &&
        value.trim().length >
          0,
    ),
  );
}

function runIds(
  records:
    ComparableRunRecord[],
): string[] {
  return records.map(
    (
      record,
    ) =>
      record.identity
        .runId,
  );
}

export function assessStudyCompatibility(
  records:
    ComparableRunRecord[],
): StudyCompatibilityReport {
  if (
    records.length <
    2
  ) {
    throw new Error(
      "Study compatibility requires at least two persisted runs.",
    );
  }

  const ids =
    runIds(
      records,
    );

  if (
    new Set(
      ids,
    ).size !==
    ids.length
  ) {
    throw new Error(
      "Study compatibility cannot be evaluated with duplicate simulation runs.",
    );
  }

  const projectIds =
    distinctNonNull(
      records.map(
        (
          record,
        ) =>
          record.identity
            .projectId,
      ),
    );

  const siteIds =
    distinctNonNull(
      records.map(
        (
          record,
        ) =>
          record.identity
            .siteId,
      ),
    );

  const siteTypes =
    distinctNonNull(
      records.map(
        (
          record,
        ) =>
          record.identity
            .siteType,
      ),
    );

  const engineKinds =
    distinctNonNull(
      records.map(
        (
          record,
        ) =>
          record.identity
            .engineKind,
      ),
    );

  const simulationDates =
    distinctNonNull(
      records.map(
        (
          record,
        ) =>
          record.identity
            .simulationDate,
      ),
    );

  const environmentFingerprints =
    distinctNonNull(
      records.map(
        (
          record,
        ) =>
          record.identity
            .environmentFingerprint,
      ),
    );

  const engineVersions =
    distinctNonNull(
      records.map(
        (
          record,
        ) =>
          record.identity
            .engineVersion,
      ),
    );

  const issues:
    StudyCompatibilityIssue[] =
      [];

  /*
   * Hard scientific incompatibilities
   */

  if (
    siteTypes.size >
    1
  ) {
    issues.push({
      key:
        "mixed-site-types",

      level:
        "incompatible",

      label:
        "Mixed site types",

      explanation:
        "Land agrivoltaic and rooftop PV simulations use different physical and KPI contracts and should not be ranked in the same direct MCDA study set.",

      affectedRunIds:
        ids,
    });
  }

  if (
    engineKinds.size >
    1
  ) {
    issues.push({
      key:
        "mixed-engine-kinds",

      level:
        "incompatible",

      label:
        "Mixed simulation engines",

      explanation:
        "The selected runs were produced by different engine kinds and are not directly comparable as one scientific decision matrix.",

      affectedRunIds:
        ids,
    });
  }

  const unverified =
    records.filter(
      (
        record,
      ) =>
        !record.identity
          .reproducibilityVerified,
    );

  if (
    unverified.length >
    0
  ) {
    issues.push({
      key:
        "unverified-reproducibility",

      level:
        "incompatible",

      label:
        "Unverified execution evidence",

      explanation:
        "MCDA and formal study-set analysis require persisted runs whose Phase 9C reproducibility verification passed.",

      affectedRunIds:
        runIds(
          unverified,
        ),
    });
  }

  /*
   * Scientifically valid but important warnings
   */

  if (
    projectIds.size >
    1
  ) {
    issues.push({
      key:
        "multiple-projects",

      level:
        "warning",

      label:
        "Multiple projects",

      explanation:
        "The study contains runs from different projects. This may be intentional for cross-project research, but project context should be considered when interpreting the results.",

      affectedRunIds:
        ids,
    });
  }

  if (
    siteIds.size >
    1
  ) {
    issues.push({
      key:
        "multiple-sites",

      level:
        "warning",

      label:
        "Multiple sites",

      explanation:
        "The study contains different sites. Differences may therefore reflect site geometry or location in addition to scenario policy or technical assumptions.",

      affectedRunIds:
        ids,
    });
  }

  if (
    simulationDates.size >
    1
  ) {
    issues.push({
      key:
        "different-simulation-dates",

      level:
        "warning",

      label:
        "Different simulation dates",

      explanation:
        "Runs use different simulation dates, so environmental conditions may contribute to KPI differences.",

      affectedRunIds:
        ids,
    });
  }

  if (
    environmentFingerprints
      .size >
    1
  ) {
    issues.push({
      key:
        "different-environment-datasets",

      level:
        "warning",

      label:
        "Different environmental evidence",

      explanation:
        "The selected runs were executed with different environmental datasets or requests. Technical differences should therefore not be interpreted as the only cause of KPI changes.",

      affectedRunIds:
        ids,
    });
  }

  if (
    engineVersions.size >
    1
  ) {
    issues.push({
      key:
        "different-engine-versions",

      level:
        "warning",

      label:
        "Different engine versions",

      explanation:
        "Runs were generated by different Digital Twin engine versions. Version effects may influence the comparison.",

      affectedRunIds:
        ids,
    });
  }

  const hasIncompatible =
    issues.some(
      (
        issue,
      ) =>
        issue.level ===
        "incompatible",
    );

  const hasWarning =
    issues.some(
      (
        issue,
      ) =>
        issue.level ===
        "warning",
    );

  const level =
    hasIncompatible
      ? "incompatible"
      : hasWarning
        ? "warning"
        : "compatible";

  return {
    schema:
      "agritwin-study-compatibility-v1",

    level,

    compatible:
      !hasIncompatible,

    runCount:
      records.length,

    projectCount:
      projectIds.size,

    siteCount:
      siteIds.size,

    siteTypeCount:
      siteTypes.size,

    engineKindCount:
      engineKinds.size,

    simulationDateCount:
      simulationDates.size,

    environmentFingerprintCount:
      environmentFingerprints
        .size,

    engineVersionCount:
      engineVersions.size,

    issues,
  };
}
