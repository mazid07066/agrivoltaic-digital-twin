const baseUrl =
  process.env.PHASE9F_BASE_URL ??
  "http://127.0.0.1:3100";

const latitude =
  "23.8103";

const longitude =
  "90.4125";

function shiftDate(
  days,
) {
  const date =
    new Date();

  date.setUTCHours(
    0,
    0,
    0,
    0,
  );

  date.setUTCDate(
    date.getUTCDate() +
      days,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function inclusiveDays(
  startDate,
  endDate,
) {
  return (
    Math.round(
      (
        new Date(
          `${endDate}T00:00:00Z`,
        ).getTime() -
        new Date(
          `${startDate}T00:00:00Z`,
        ).getTime()
      ) /
      86_400_000,
    ) +
    1
  );
}

async function requestRange({
  label,
  startDate,
  endDate,
  expectedSource,
}) {
  const url =
    new URL(
      "/api/weather-range",
      baseUrl,
    );

  url.searchParams.set(
    "latitude",
    latitude,
  );

  url.searchParams.set(
    "longitude",
    longitude,
  );

  url.searchParams.set(
    "startDate",
    startDate,
  );

  url.searchParams.set(
    "endDate",
    endDate,
  );

  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
            "application/json",
        },
      },
    );

  const body =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `${label}: HTTP ${response.status} ${JSON.stringify(body)}`,
    );
  }

  if (
    body.schema !==
    "agritwin-weather-range-v1"
  ) {
    throw new Error(
      `${label}: invalid response schema`,
    );
  }

  const expectedDays =
    inclusiveDays(
      startDate,
      endDate,
    );

  if (
    body.days.length !==
    expectedDays
  ) {
    throw new Error(
      `${label}: expected ${expectedDays} days but received ${body.days.length}`,
    );
  }

  if (
    body.plan.source !==
    expectedSource
  ) {
    throw new Error(
      `${label}: expected ${expectedSource} source but received ${body.plan.source}`,
    );
  }

  if (
    body.days.some(
      (day) =>
        day.weather.hourly.length !==
        24,
    )
  ) {
    throw new Error(
      `${label}: one or more days do not contain 24 normalized hours`,
    );
  }

  console.log(
    `PASS: ${label} (${body.days.length} day(s), ${body.plan.source})`,
  );
}

const today =
  shiftDate(
    0,
  );

await requestRange({
  label:
    "Current-date hourly source",

  startDate:
    today,

  endDate:
    today,

  expectedSource:
    "forecast",
});

await requestRange({
  label:
    "Configured-date source",

  startDate:
    shiftDate(
      -1,
    ),

  endDate:
    shiftDate(
      -1,
    ),

  expectedSource:
    "forecast",
});

await requestRange({
  label:
    "Older historical single date",

  startDate:
    shiftDate(
      -30,
    ),

  endDate:
    shiftDate(
      -30,
    ),

  expectedSource:
    "historical",
});

await requestRange({
  label:
    "Past-date to past-date range",

  startDate:
    shiftDate(
      -60,
    ),

  endDate:
    shiftDate(
      -55,
    ),

  expectedSource:
    "historical",
});

await requestRange({
  label:
    "Historical date to current date",

  startDate:
    shiftDate(
      -10,
    ),

  endDate:
    today,

  expectedSource:
    "mixed",
});

await requestRange({
  label:
    "Recent date to future forecast",

  startDate:
    shiftDate(
      -2,
    ),

  endDate:
    shiftDate(
      3,
    ),

  expectedSource:
    "forecast",
});

await requestRange({
  label:
    "Historical-to-future mixed range",

  startDate:
    shiftDate(
      -10,
    ),

  endDate:
    shiftDate(
      3,
    ),

  expectedSource:
    "mixed",
});

await requestRange({
  label:
    "More-than-31-day range",

  startDate:
    shiftDate(
      -40,
    ),

  endDate:
    today,

  expectedSource:
    "mixed",
});

const invalidUrl =
  new URL(
    "/api/weather-range",
    baseUrl,
  );

invalidUrl.searchParams.set(
  "latitude",
  latitude,
);

invalidUrl.searchParams.set(
  "longitude",
  longitude,
);

invalidUrl.searchParams.set(
  "startDate",
  today,
);

invalidUrl.searchParams.set(
  "endDate",
  shiftDate(
    16,
  ),
);

const invalidResponse =
  await fetch(
    invalidUrl,
  );

const invalidBody =
  await invalidResponse.json();

if (
  invalidResponse.status !== 400 ||
  !String(
    invalidBody.error,
  ).includes(
    "currently available only through",
  )
) {
  throw new Error(
    `Unavailable-future validation failed: HTTP ${invalidResponse.status} ${JSON.stringify(invalidBody)}`,
  );
}

console.log(
  "PASS: unavailable future date validation",
);

console.log(
  "PHASE 9F LIVE ACCEPTANCE: PASS",
);
