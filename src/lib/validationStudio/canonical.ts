import type {
  ValidationStudioDataset,
  ValidationStudioObservation,
  ValidationStudioVariable,
} from "./types";

const OFFSET_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

const LOCAL_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

export function requireAbsoluteTimestamp(
  value:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !OFFSET_TIMESTAMP.test(
      normalized,
    )
  ) {
    throw new Error(
      `Validation timestamp must include Z or an explicit UTC offset: ${value}`,
    );
  }

  const date =
    new Date(
      normalized,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `Invalid validation timestamp: ${value}`,
    );
  }

  return date.toISOString();
}

function timezoneOffsetMinutes(
  timestampMs:
    number,

  timezone:
    string,
): number {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          timezone,

        timeZoneName:
          "longOffset",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(
        timestampMs,
      ),
    );

  const zonePart =
    parts.find(
      (part) =>
        part.type ===
        "timeZoneName",
    )?.value;

  if (
    !zonePart
  ) {
    throw new Error(
      `Unable to resolve timezone offset for "${timezone}".`,
    );
  }

  if (
    zonePart ===
    "GMT" ||
    zonePart ===
    "UTC"
  ) {
    return 0;
  }

  const match =
    zonePart.match(
      /GMT([+-])(\d{2}):?(\d{2})/,
    );

  if (
    !match
  ) {
    throw new Error(
      `Unable to parse timezone offset "${zonePart}" for "${timezone}".`,
    );
  }

  const sign =
    match[1] === "+"
      ? 1
      : -1;

  const hours =
    Number(
      match[2],
    );

  const minutes =
    Number(
      match[3],
    );

  return sign *
    (
      hours * 60 +
      minutes
    );
}

function localParts(
  value:
    string,
) {
  const match =
    value
      .trim()
      .match(
        LOCAL_TIMESTAMP,
      );

  if (
    !match
  ) {
    throw new Error(
      `Local validation timestamp must use YYYY-MM-DDTHH:mm[:ss] or YYYY-MM-DD HH:mm[:ss]: ${value}`,
    );
  }

  return {
    year:
      Number(
        match[1],
      ),

    month:
      Number(
        match[2],
      ),

    day:
      Number(
        match[3],
      ),

    hour:
      Number(
        match[4],
      ),

    minute:
      Number(
        match[5],
      ),

    second:
      Number(
        match[6] ??
        "0",
      ),

    millisecond:
      Number(
        (
          match[7] ??
          "0"
        ).padEnd(
          3,
          "0",
        ),
      ),
  };
}

export function localTimestampInZoneToAbsolute(
  value:
    string,

  timezone:
    string,
): string {
  const local =
    localParts(
      value,
    );

  const wallClockAsUtc =
    Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
      local.millisecond,
    );

  let candidate =
    wallClockAsUtc;

  for (
    let iteration =
      0;
    iteration <
    3;
    iteration +=
      1
  ) {
    const offsetMinutes =
      timezoneOffsetMinutes(
        candidate,
        timezone,
      );

    candidate =
      wallClockAsUtc -
      offsetMinutes *
        60_000;
  }

  const date =
    new Date(
      candidate,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `Unable to resolve local timestamp "${value}" in timezone "${timezone}".`,
    );
  }

  return date.toISOString();
}

export function timestampKey(
  timestamp:
    string,
): string {
  return requireAbsoluteTimestamp(
    timestamp,
  );
}

export function detectDuplicateTimestamps(
  observations:
    ValidationStudioObservation[],
): string[] {
  const seen =
    new Set<string>();

  const duplicates =
    new Set<string>();

  for (
    const observation of
    observations
  ) {
    const key =
      timestampKey(
        observation.timestamp,
      );

    if (
      seen.has(
        key,
      )
    ) {
      duplicates.add(
        key,
      );
    }

    seen.add(
      key,
    );
  }

  return [
    ...duplicates,
  ].sort();
}

export function datasetTimestampSet(
  dataset:
    ValidationStudioDataset,
): Set<string> {
  return new Set(
    dataset.observations.map(
      (observation) =>
        timestampKey(
          observation.timestamp,
        ),
    ),
  );
}

export function deriveDatasetVariables(
  observations:
    ValidationStudioObservation[],
): ValidationStudioVariable[] {
  const variables =
    new Set<
      ValidationStudioVariable
    >();

  for (
    const observation of
    observations
  ) {
    for (
      const [
        key,
        value,
      ] of Object.entries(
        observation.values,
      )
    ) {
      if (
        value !==
          null &&
        value !==
          undefined
      ) {
        variables.add(
          key as
            ValidationStudioVariable,
        );
      }
    }
  }

  return [
    ...variables,
  ].sort();
}

export function validateDatasetBounds(
  dataset:
    ValidationStudioDataset,
): void {
  if (
    dataset.intervalMinutes <=
    0
  ) {
    throw new Error(
      `Dataset "${dataset.name}" must declare a positive interval.`,
    );
  }

  const start =
    timestampKey(
      dataset.startTimestamp,
    );

  const end =
    timestampKey(
      dataset.endTimestamp,
    );

  if (
    start >
    end
  ) {
    throw new Error(
      `Dataset "${dataset.name}" has an invalid date range.`,
    );
  }

  for (
    const observation of
    dataset.observations
  ) {
    const timestamp =
      timestampKey(
        observation.timestamp,
      );

    if (
      timestamp <
        start ||
      timestamp >
        end
    ) {
      throw new Error(
        `Observation ${timestamp} is outside the declared dataset date range.`,
      );
    }
  }
}
