import {
  NextResponse,
} from "next/server";

import {
  loadComparableRun,
} from "@/lib/analytics/analyticsReader.server";

import {
  analyzeMcdaSensitivity,
} from "@/lib/analytics/mcdaSensitivity";

import {
  analyzePareto,
} from "@/lib/analytics/pareto";

import type {
  AnalyticsMetricKey,
  McdaCriterionConfiguration,
  McdaCriterionDirection,
  ParetoCriterionConfiguration,
} from "@/lib/analytics/types";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

interface CriterionRequest {
  key?:
    unknown;

  label?:
    unknown;

  unit?:
    unknown;

  direction?:
    unknown;

  weight?:
    unknown;
}

interface RobustnessRequestBody {
  runIds?:
    unknown;

  criteria?:
    unknown;

  perturbationFraction?:
    unknown;
}

const METRIC_KEYS =
  new Set<
    AnalyticsMetricKey
  >([
    "installedCapacityKw",
    "dailyEnergyKwh",
    "specificYieldKwhPerKw",
    "openFieldDliMolM2",
    "cropDliMolM2",
    "estimatedCropYieldPercent",
    "landEquivalentRatio",
    "groundCoverageRatioPercent",
    "usableAreaPercent",
    "moduleCount",
  ]);

function isMetricKey(
  value:
    unknown,
): value is AnalyticsMetricKey {
  return (
    typeof value ===
      "string" &&
    METRIC_KEYS.has(
      value as AnalyticsMetricKey,
    )
  );
}

function isDirection(
  value:
    unknown,
): value is McdaCriterionDirection {
  return (
    value ===
      "benefit" ||
    value ===
      "cost"
  );
}

function parseCriterion(
  value:
    unknown,
): McdaCriterionConfiguration {
  if (
    value === null ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "Each robustness criterion must be an object.",
    );
  }

  const criterion =
    value as CriterionRequest;

  if (
    !isMetricKey(
      criterion.key,
    )
  ) {
    throw new Error(
      "Robustness criterion contains an invalid metric key.",
    );
  }

  if (
    !isDirection(
      criterion.direction,
    )
  ) {
    throw new Error(
      `Criterion ${criterion.key} requires benefit or cost direction.`,
    );
  }

  if (
    typeof criterion.weight !==
      "number" ||
    !Number.isFinite(
      criterion.weight,
    ) ||
    criterion.weight <
      0
  ) {
    throw new Error(
      `Criterion ${criterion.key} has an invalid weight.`,
    );
  }

  return {
    key:
      criterion.key,

    label:
      typeof criterion.label ===
        "string" &&
      criterion.label.trim()
        .length >
        0
        ? criterion.label.trim()
        : criterion.key,

    unit:
      typeof criterion.unit ===
        "string"
        ? criterion.unit
        : null,

    direction:
      criterion.direction,

    weight:
      criterion.weight,
  };
}

export async function POST(
  request:
    Request,
) {
  try {
    const body =
      (await request.json()) as
        RobustnessRequestBody;

    if (
      !Array.isArray(
        body.runIds,
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "runIds must be an array.",
        },
        {
          status:
            400,
        },
      );
    }

    const runIds =
      body.runIds
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
              "string" &&
            value.trim()
              .length >
              0,
        )
        .map(
          (
            value,
          ) =>
            value.trim(),
        );

    if (
      runIds.length <
      2
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Decision robustness requires at least two persisted runs.",
        },
        {
          status:
            400,
        },
      );
    }

    const uniqueRunIds =
      [
        ...new Set(
          runIds,
        ),
      ];

    if (
      uniqueRunIds.length !==
      runIds.length
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Duplicate simulation runs are not allowed.",
        },
        {
          status:
            400,
        },
      );
    }

    if (
      uniqueRunIds.length >
      50
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Decision robustness currently supports a maximum of 50 runs.",
        },
        {
          status:
            400,
        },
      );
    }

    if (
      !Array.isArray(
        body.criteria,
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "criteria must be an array.",
        },
        {
          status:
            400,
        },
      );
    }

    const criteria =
      body.criteria.map(
        parseCriterion,
      );

    if (
      criteria.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Select at least one robustness criterion.",
        },
        {
          status:
            400,
        },
      );
    }

    const perturbationFraction =
      body.perturbationFraction ===
        undefined
        ? 0.2
        : body.perturbationFraction;

    if (
      typeof perturbationFraction !==
        "number" ||
      !Number.isFinite(
        perturbationFraction,
      ) ||
      perturbationFraction <=
        0 ||
      perturbationFraction >=
        1
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "perturbationFraction must be greater than 0 and less than 1.",
        },
        {
          status:
            400,
        },
      );
    }

    const records =
      await Promise.all(
        uniqueRunIds.map(
          (
            runId,
          ) =>
            loadComparableRun(
              runId,
            ),
        ),
      );

    const paretoCriteria:
      ParetoCriterionConfiguration[] =
      criteria.map(
        (
          criterion,
        ) => ({
          key:
            criterion.key,

          label:
            criterion.label,

          unit:
            criterion.unit,

          direction:
            criterion.direction,
        }),
      );

    const pareto =
      analyzePareto(
        records,
        paretoCriteria,
      );

    const sensitivity =
      analyzeMcdaSensitivity(
        records,
        criteria,
        perturbationFraction,
      );

    return NextResponse.json({
      ok:
        true,

      pareto,

      sensitivity,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Decision robustness analysis failed.",
      },
      {
        status:
          400,
      },
    );
  }
}
