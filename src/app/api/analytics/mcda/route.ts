import {
  NextResponse,
} from "next/server";

import {
  loadComparableRun,
} from "@/lib/analytics/analyticsReader.server";

import {
  evaluateMcda,
} from "@/lib/analytics/mcda";

import type {
  AnalyticsMetricKey,
  McdaCriterionConfiguration,
  McdaCriterionDirection,
} from "@/lib/analytics/types";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

interface McdaCriterionRequest {
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

interface McdaRequestBody {
  runIds?:
    unknown;

  criteria?:
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
      value as
        AnalyticsMetricKey,
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
      "Each MCDA criterion must be an object.",
    );
  }

  const criterion =
    value as
      McdaCriterionRequest;

  if (
    !isMetricKey(
      criterion.key,
    )
  ) {
    throw new Error(
      "MCDA criterion contains an invalid metric key.",
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
        McdaRequestBody;

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
            "MCDA requires at least two persisted runs.",
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
            "MCDA currently supports a maximum of 50 persisted runs.",
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
            "Select at least one MCDA criterion.",
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

    const result =
      evaluateMcda(
        records,
        criteria,
      );

    return NextResponse.json({
      ok:
        true,

      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "MCDA evaluation failed.",
      },
      {
        status:
          400,
      },
    );
  }
}
