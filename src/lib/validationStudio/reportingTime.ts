import {
  FENI_VALIDATION_SITE,
} from "./site";

function asDate(
  timestamp:
    string,
): Date {
  const date =
    new Date(
      timestamp,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `Invalid reporting timestamp: ${timestamp}`,
    );
  }

  return date;
}

export function formatValidationLocalDate(
  timestamp:
    string,

  timezone =
    FENI_VALIDATION_SITE.timezone,
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone:
        timezone,

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    },
  ).format(
    asDate(
      timestamp,
    ),
  );
}

export function formatValidationLocalDateTime(
  timestamp:
    string,

  timezone =
    FENI_VALIDATION_SITE.timezone,
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone:
        timezone,

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hourCycle:
        "h23",
    },
  ).format(
    asDate(
      timestamp,
    ),
  );
}

export function formatValidationAxisTick(
  timestamp:
    string,

  timezone =
    FENI_VALIDATION_SITE.timezone,
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone:
        timezone,

      day:
        "2-digit",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hourCycle:
        "h23",
    },
  ).format(
    asDate(
      timestamp,
    ),
  );
}

export function formatValidationDateRange(
  startTimestamp:
    string,

  endTimestamp:
    string,

  timezone =
    FENI_VALIDATION_SITE.timezone,
): string {
  return [
    formatValidationLocalDateTime(
      startTimestamp,
      timezone,
    ),
    "–",
    formatValidationLocalDateTime(
      endTimestamp,
      timezone,
    ),
  ].join(
    " ",
  );
}
