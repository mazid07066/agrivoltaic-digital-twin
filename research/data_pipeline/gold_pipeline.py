"""Phase 11 deterministic Gold aggregation for Feni measurements.

This module consumes canonical Phase 10 Silver JSONL records.

Scientific boundaries:
- timestamps are synchronized and bucketed in UTC;
- no interpolation or extrapolation is performed;
- invalid/missing samples never contribute numerical values;
- flagged numerical observations may contribute but remain explicitly counted;
- incomplete coverage is retained as metadata rather than silently repaired;
- no ML model training occurs here.
"""

from __future__ import annotations

import argparse
import copy
import gzip
import hashlib
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path
from typing import Any, Iterable, TextIO


EXPECTED_SAMPLES_15_MIN = 15
EXPECTED_SAMPLES_HOURLY = 60

VARIABLE_AGGREGATION: dict[str, str] = {
    "ghi": "mean",
    "dni": "mean",
    "dhi": "mean",
    "temperature": "mean",
    "relativeHumidity": "mean",
    "windSpeed": "mean",
    "windDirection": "circular_mean",
    "pressure": "mean",
    "precipitation": "sum",
}

QUALITY_STATUSES = (
    "valid",
    "flagged",
    "invalid",
    "missing",
)


PROVIDER_SCHEMA = (
    "agritwin-phase11-provider-hourly-v1"
)

PROVIDER_MANIFEST_SCHEMA = (
    "agritwin-phase11-provider-manifest-v1"
)


FENI_LATITUDE = 22.80029
FENI_LONGITUDE = 91.35819
FENI_TIMEZONE = "Asia/Dhaka"


INTERPOLATABLE_VARIABLES = {
    "measured": {
        "temperature",
        "relativeHumidity",
        "windSpeed",
        "pressure",
    },
    "provider": {
        "temperatureC",
        "relativeHumidityPct",
        "windSpeedMs",
        "pressureHpa",
    },
}


def stable_json_bytes(
    value: Any,
) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def sha256_value(
    value: Any,
) -> str:
    return (
        "sha256:"
        + hashlib.sha256(
            stable_json_bytes(value)
        ).hexdigest()
    )


def parse_utc_timestamp(value: str) -> datetime:
    """Parse a canonical absolute timestamp and normalize it to UTC."""
    if not isinstance(value, str) or not value:
        raise ValueError("Silver record timestampUtc is missing.")

    normalized = (
        value[:-1] + "+00:00"
        if value.endswith("Z")
        else value
    )

    try:
        timestamp = datetime.fromisoformat(normalized)
    except ValueError as error:
        raise ValueError(
            f"Invalid Silver UTC timestamp: {value}"
        ) from error

    if timestamp.tzinfo is None:
        raise ValueError(
            f"Silver timestamp must be timezone-aware: {value}"
        )

    timestamp = timestamp.astimezone(
        timezone.utc
    )

    if (
        timestamp.second != 0
        or timestamp.microsecond != 0
    ):
        raise ValueError(
            "Silver timestamp must lie exactly on the "
            f"one-minute grid: {value}"
        )

    return timestamp


def iso_utc(timestamp: datetime) -> str:
    return (
        timestamp.astimezone(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def bucket_start_15_min(timestamp: datetime) -> datetime:
    minute = (timestamp.minute // 15) * 15
    return timestamp.replace(
        minute=minute,
        second=0,
        microsecond=0,
    )


def bucket_start_hour(timestamp: datetime) -> datetime:
    return timestamp.replace(
        minute=0,
        second=0,
        microsecond=0,
    )


def arithmetic_mean(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def circular_mean_degrees(
    values: list[float],
) -> float | None:
    if not values:
        return None

    sine = sum(
        math.sin(math.radians(value))
        for value in values
    )
    cosine = sum(
        math.cos(math.radians(value))
        for value in values
    )

    if (
        math.isclose(sine, 0.0, abs_tol=1e-12)
        and math.isclose(cosine, 0.0, abs_tol=1e-12)
    ):
        return None

    angle = math.degrees(
        math.atan2(sine, cosine)
    ) % 360.0

    return angle


def aggregate_values(
    values: list[float],
    method: str,
) -> float | None:
    if not values:
        return None

    if method == "mean":
        return arithmetic_mean(values)

    if method == "sum":
        return sum(values)

    if method == "circular_mean":
        return circular_mean_degrees(values)

    raise ValueError(
        f"Unsupported aggregation method: {method}"
    )


def open_text(
    path: Path,
) -> TextIO:
    if path.suffix == ".gz":
        return gzip.open(
            path,
            "rt",
            encoding="utf-8",
        )

    return path.open(
        "r",
        encoding="utf-8",
    )


def read_jsonl(
    path: Path,
) -> Iterable[dict[str, Any]]:
    with open_text(path) as source:
        for line_number, line in enumerate(
            source,
            start=1,
        ):
            stripped = line.strip()

            if not stripped:
                continue

            try:
                payload = json.loads(stripped)
            except json.JSONDecodeError as error:
                raise ValueError(
                    f"Invalid JSONL at line {line_number}."
                ) from error

            if not isinstance(payload, dict):
                raise ValueError(
                    f"Silver JSONL line {line_number} is not an object."
                )

            yield payload



def aggregate_silver_records_hourly(
    records: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Aggregate canonical one-minute Silver records directly to hourly Gold."""
    buckets: dict[
        datetime,
        list[tuple[datetime, dict[str, Any]]],
    ] = defaultdict(list)

    seen_timestamps: set[datetime] = set()

    dataset_id: str | None = None
    station_id: str | None = None
    source_sha256: str | None = None

    for record in records:
        timestamp = parse_utc_timestamp(
            record.get("timestampUtc")
        )

        if timestamp in seen_timestamps:
            raise ValueError(
                "Duplicate Silver timestamp encountered: "
                f"{iso_utc(timestamp)}"
            )

        seen_timestamps.add(timestamp)

        current_dataset = record.get("datasetId")
        current_station = record.get("stationId")
        current_sha256 = record.get(
            "sourceFileSha256"
        )

        if dataset_id is None:
            dataset_id = current_dataset
        elif current_dataset != dataset_id:
            raise ValueError(
                "Silver input contains multiple datasetId values."
            )

        if station_id is None:
            station_id = current_station
        elif current_station != station_id:
            raise ValueError(
                "Silver input contains multiple stationId values."
            )

        if source_sha256 is None:
            source_sha256 = current_sha256
        elif current_sha256 != source_sha256:
            raise ValueError(
                "Silver input contains multiple sourceFileSha256 values."
            )

        buckets[
            bucket_start_hour(timestamp)
        ].append(
            (timestamp, record)
        )

    output: list[dict[str, Any]] = []

    for bucket_start in sorted(buckets):
        rows = sorted(
            buckets[bucket_start],
            key=lambda item: item[0],
        )

        variable_outputs: dict[
            str,
            dict[str, Any],
        ] = {}

        for variable, method in (
            VARIABLE_AGGREGATION.items()
        ):
            counts = {
                status: 0
                for status in QUALITY_STATUSES
            }

            usable_values: list[float] = []

            for _, record in rows:
                measurement = (
                    record.get("values", {})
                    .get(variable)
                )

                if not isinstance(
                    measurement,
                    dict,
                ):
                    counts["missing"] += 1
                    continue

                status = measurement.get(
                    "qualityStatus"
                )

                if status not in counts:
                    raise ValueError(
                        "Unsupported qualityStatus "
                        f"for {variable}: {status}"
                    )

                counts[status] += 1

                value = measurement.get("value")

                if (
                    status in ("valid", "flagged")
                    and isinstance(value, (int, float))
                    and math.isfinite(float(value))
                ):
                    usable_values.append(
                        float(value)
                    )

            aggregate = aggregate_values(
                usable_values,
                method,
            )

            observed_samples = len(rows)
            usable_samples = len(usable_values)

            variable_outputs[variable] = {
                "value": aggregate,
                "aggregation": method,
                "expectedSamples":
                    EXPECTED_SAMPLES_HOURLY,
                "observedSamples":
                    observed_samples,
                "usableSamples":
                    usable_samples,
                "coverageRatio":
                    observed_samples
                    / EXPECTED_SAMPLES_HOURLY,
                "usableRatio":
                    usable_samples
                    / EXPECTED_SAMPLES_HOURLY,
                "qualityCounts": counts,
                "interpolatedSamples": 0,
            }

        output.append(
            {
                "schemaVersion": 1,
                "layer":
                    "gold_measurement_hourly",
                "datasetId":
                    dataset_id,
                "stationId":
                    station_id,
                "sourceFileSha256":
                    source_sha256,
                "timestampUtc":
                    iso_utc(bucket_start),
                "intervalSeconds": 3600,
                "expectedSamples":
                    EXPECTED_SAMPLES_HOURLY,
                "observedSamples":
                    len(rows),
                "coverageRatio":
                    len(rows)
                    / EXPECTED_SAMPLES_HOURLY,
                "values":
                    variable_outputs,
            }
        )

    return output


def parse_provider_hour_timestamp(
    value: str,
) -> datetime:
    timestamp = parse_utc_timestamp(value)

    if timestamp.minute != 0:
        raise ValueError(
            "Provider timestamp must lie exactly on the "
            f"hourly UTC grid: {value}"
        )

    return timestamp



def normalize_provider_hourly_records(
    records: Iterable[dict[str, Any]],
    *,
    provider: str,
    provider_model: str | None,
    requested_latitude: float,
    requested_longitude: float,
    resolved_latitude: float | None = None,
    resolved_longitude: float | None = None,
    elevation_m: float | None = None,
) -> dict[str, Any]:
    """Validate and normalize a reproducible hourly provider artifact."""
    if not provider:
        raise ValueError(
            "Provider identity is required."
        )

    normalized_records: list[
        dict[str, Any]
    ] = []

    seen: set[datetime] = set()

    for index, record in enumerate(
        records
    ):
        if not isinstance(record, dict):
            raise ValueError(
                "Provider record must be an object."
            )

        timestamp = (
            parse_provider_hour_timestamp(
                record.get("timestampUtc")
            )
        )

        if timestamp in seen:
            raise ValueError(
                "Duplicate provider hourly timestamp encountered: "
                f"{iso_utc(timestamp)}"
            )

        seen.add(timestamp)

        values = record.get("values")

        if not isinstance(values, dict):
            raise ValueError(
                "Provider record values must be an object "
                f"at index {index}."
            )

        normalized_values: dict[
            str,
            float | None,
        ] = {}

        for key in sorted(values):
            value = values[key]

            if value is None:
                normalized_values[key] = None
                continue

            if (
                not isinstance(
                    value,
                    (int, float),
                )
                or not math.isfinite(
                    float(value)
                )
            ):
                raise ValueError(
                    "Provider value must be finite numeric "
                    f"or null for {key} at "
                    f"{iso_utc(timestamp)}."
                )

            normalized_values[key] = float(value)

        normalized_records.append(
            {
                "schema":
                    PROVIDER_SCHEMA,
                "timestampUtc":
                    iso_utc(timestamp),
                "values":
                    normalized_values,
            }
        )

    normalized_records.sort(
        key=lambda item:
            item["timestampUtc"]
    )

    start_time = (
        normalized_records[0][
            "timestampUtc"
        ]
        if normalized_records
        else None
    )

    end_time = (
        normalized_records[-1][
            "timestampUtc"
        ]
        if normalized_records
        else None
    )

    artifact = {
        "schema":
            PROVIDER_SCHEMA,
        "provider":
            provider,
        "providerModel":
            provider_model,
        "timezone":
            "UTC",
        "requestedCoordinate": {
            "latitude":
                requested_latitude,
            "longitude":
                requested_longitude,
        },
        "resolvedCoordinate": (
            {
                "latitude":
                    resolved_latitude,
                "longitude":
                    resolved_longitude,
            }
            if (
                resolved_latitude
                is not None
                and resolved_longitude
                is not None
            )
            else None
        ),
        "elevationM":
            elevation_m,
        "intervalSeconds":
            3600,
        "startTime":
            start_time,
        "endTime":
            end_time,
        "recordCount":
            len(normalized_records),
        "records":
            normalized_records,
    }

    artifact["fingerprint"] = (
        sha256_value(artifact)
    )

    return artifact


def build_provider_manifest(
    artifact: dict[str, Any],
    *,
    request: dict[str, Any],
    source_identity: dict[str, Any],
) -> dict[str, Any]:
    """Build deterministic provider provenance metadata."""
    if artifact.get("schema") != (
        PROVIDER_SCHEMA
    ):
        raise ValueError(
            "Unsupported provider artifact schema."
        )

    fingerprint = artifact.get(
        "fingerprint"
    )

    if not isinstance(
        fingerprint,
        str,
    ) or not fingerprint.startswith(
        "sha256:"
    ):
        raise ValueError(
            "Provider artifact fingerprint is missing."
        )

    manifest = {
        "schema":
            PROVIDER_MANIFEST_SCHEMA,
        "provider":
            artifact.get("provider"),
        "providerModel":
            artifact.get("providerModel"),
        "timezone":
            "UTC",
        "intervalSeconds":
            artifact.get(
                "intervalSeconds"
            ),
        "requestedCoordinate":
            artifact.get(
                "requestedCoordinate"
            ),
        "resolvedCoordinate":
            artifact.get(
                "resolvedCoordinate"
            ),
        "elevationM":
            artifact.get(
                "elevationM"
            ),
        "startTime":
            artifact.get("startTime"),
        "endTime":
            artifact.get("endTime"),
        "recordCount":
            artifact.get(
                "recordCount"
            ),
        "request":
            request,
        "requestFingerprint":
            sha256_value(request),
        "sourceIdentity":
            source_identity,
        "sourceIdentityFingerprint":
            sha256_value(
                source_identity
            ),
        "artifactFingerprint":
            fingerprint,
        "scientificPolicy": {
            "canonicalTimezone":
                "UTC",
            "intervalSeconds":
                3600,
            "timestampMatching":
                "exact",
            "interpolationPerformed":
                False,
            "extrapolationPerformed":
                False,
            "nearestNeighbourMatching":
                False,
            "timestampRounding":
                False,
            "modelTrainingPerformed":
                False,
        },
    }

    manifest["manifestFingerprint"] = (
        sha256_value(manifest)
    )

    return manifest



def build_synchronized_gold_rows(
    synchronization: dict[str, Any],
) -> list[dict[str, Any]]:
    """Build canonical Phase 11 synchronized Gold rows.

    No interpolation, extrapolation, timestamp shifting, rounding,
    nearest-neighbour matching or resampling occurs here.
    """
    if synchronization.get(
        "policy"
    ) != "exact_utc_timestamp_intersection":
        raise ValueError(
            "Unsupported synchronization policy."
        )

    output: list[dict[str, Any]] = []

    previous_timestamp: datetime | None = None

    for index, item in enumerate(
        synchronization.get(
            "records",
            []
        )
    ):
        if not isinstance(item, dict):
            raise ValueError(
                "Synchronized record must be an object."
            )

        timestamp = parse_provider_hour_timestamp(
            item.get("timestampUtc")
        )

        if (
            previous_timestamp is not None
            and timestamp <= previous_timestamp
        ):
            raise ValueError(
                "Synchronized Gold records must be "
                "strictly chronological."
            )

        previous_timestamp = timestamp

        measured = item.get("measured")
        provider = item.get("provider")

        if not isinstance(
            measured,
            dict,
        ):
            raise ValueError(
                f"Measured record missing at synchronized index {index}."
            )

        if not isinstance(
            provider,
            dict,
        ):
            raise ValueError(
                f"Provider record missing at synchronized index {index}."
            )

        measured_values = measured.get(
            "values"
        )

        provider_values = provider.get(
            "values"
        )

        if not isinstance(
            measured_values,
            dict,
        ):
            raise ValueError(
                "Measured synchronized values must be an object."
            )

        if not isinstance(
            provider_values,
            dict,
        ):
            raise ValueError(
                "Provider synchronized values must be an object."
            )

        measured_output: dict[
            str,
            dict[str, Any],
        ] = {}

        for variable in sorted(
            measured_values
        ):
            source = measured_values[
                variable
            ]

            if not isinstance(
                source,
                dict,
            ):
                raise ValueError(
                    "Measured Gold variable must be an object: "
                    f"{variable}"
                )

            value = source.get("value")

            if value is not None:
                if (
                    not isinstance(
                        value,
                        (int, float),
                    )
                    or not math.isfinite(
                        float(value)
                    )
                ):
                    raise ValueError(
                        "Measured Gold value must be finite "
                        f"or null for {variable}."
                    )

                value = float(value)

            measured_output[
                variable
            ] = {
                "value": value,
                "state": (
                    "observed"
                    if value is not None
                    else "unavailable"
                ),
                "aggregation":
                    source.get(
                        "aggregation"
                    ),
                "expectedSamples":
                    source.get(
                        "expectedSamples"
                    ),
                "observedSamples":
                    source.get(
                        "observedSamples"
                    ),
                "usableSamples":
                    source.get(
                        "usableSamples"
                    ),
                "coverageRatio":
                    source.get(
                        "coverageRatio"
                    ),
                "usableRatio":
                    source.get(
                        "usableRatio"
                    ),
                "qualityCounts":
                    source.get(
                        "qualityCounts"
                    ),
                "interpolated":
                    False,
                "interpolationMethod":
                    None,
            }

        provider_output: dict[
            str,
            dict[str, Any],
        ] = {}

        for variable in sorted(
            provider_values
        ):
            value = provider_values[
                variable
            ]

            if value is not None:
                if (
                    not isinstance(
                        value,
                        (int, float),
                    )
                    or not math.isfinite(
                        float(value)
                    )
                ):
                    raise ValueError(
                        "Provider Gold value must be finite "
                        f"or null for {variable}."
                    )

                value = float(value)

            provider_output[
                variable
            ] = {
                "value": value,
                "state": (
                    "observed"
                    if value is not None
                    else "unavailable"
                ),
                "interpolated":
                    False,
                "interpolationMethod":
                    None,
            }

        output.append(
            {
                "schema":
                    "agritwin-phase11-synchronized-gold-row-v1",
                "timestampUtc":
                    iso_utc(timestamp),
                "intervalSeconds":
                    3600,
                "measured":
                    measured_output,
                "provider":
                    provider_output,
                "cleaning": {
                    "interpolationPerformed":
                        False,
                    "extrapolationPerformed":
                        False,
                    "timestampShiftPerformed":
                        False,
                    "timestampRoundingPerformed":
                        False,
                    "nearestNeighbourMatchingPerformed":
                        False,
                },
            }
        )

    return output



def apply_bounded_linear_interpolation(
    rows: Iterable[dict[str, Any]],
    *,
    side: str,
    variable: str,
    enabled: bool = False,
    max_gap_hours: int = 1,
) -> dict[str, Any]:
    """Apply explicit bounded internal interpolation.

    Scientific policy:
    - disabled unless explicitly requested;
    - linear interpolation only;
    - internal gaps only;
    - no extrapolation;
    - no interpolation across non-hourly timestamp gaps;
    - no chaining from previously interpolated boundary values;
    - only explicitly approved continuous variables are eligible.
    """
    if side not in (
        "measured",
        "provider",
    ):
        raise ValueError(
            "Interpolation side must be measured or provider."
        )

    if (
        not isinstance(max_gap_hours, int)
        or isinstance(max_gap_hours, bool)
        or max_gap_hours < 1
    ):
        raise ValueError(
            "max_gap_hours must be a positive integer."
        )

    allowed = INTERPOLATABLE_VARIABLES[
        side
    ]

    if variable not in allowed:
        raise ValueError(
            "Variable is not approved for bounded "
            f"linear interpolation: {side}.{variable}"
        )

    output = copy.deepcopy(
        list(rows)
    )

    timestamps: list[datetime] = []

    previous: datetime | None = None

    for index, row in enumerate(
        output
    ):
        if not isinstance(row, dict):
            raise ValueError(
                "Gold cleaning row must be an object."
            )

        timestamp = (
            parse_provider_hour_timestamp(
                row.get("timestampUtc")
            )
        )

        if (
            previous is not None
            and timestamp <= previous
        ):
            raise ValueError(
                "Gold cleaning rows must be "
                "strictly chronological."
            )

        previous = timestamp
        timestamps.append(timestamp)

        side_values = row.get(side)

        if not isinstance(
            side_values,
            dict,
        ):
            raise ValueError(
                f"Gold row {side} values must be an object "
                f"at index {index}."
            )

        variable_state = side_values.get(
            variable
        )

        if not isinstance(
            variable_state,
            dict,
        ):
            raise ValueError(
                "Gold interpolation variable is missing: "
                f"{side}.{variable}"
            )

    policy = {
        "enabled":
            enabled,
        "method":
            "linear_internal_hourly",
        "side":
            side,
        "variable":
            variable,
        "maxGapHours":
            max_gap_hours,
        "extrapolationAllowed":
            False,
        "timestampRoundingAllowed":
            False,
        "nearestNeighbourAllowed":
            False,
        "crossTimestampGapInterpolationAllowed":
            False,
    }

    if not enabled:
        return {
            "schema":
                "agritwin-phase11-cleaning-result-v1",
            "policy":
                policy,
            "interpolatedValues":
                0,
            "rows":
                output,
        }

    interpolated_count = 0

    index = 0

    while index < len(output):
        state = output[index][side][
            variable
        ]

        if (
            state.get("value") is not None
            and state.get("state")
            == "observed"
        ):
            index += 1
            continue

        gap_start = index

        while index < len(output):
            candidate = output[index][
                side
            ][variable]

            if (
                candidate.get("value")
                is not None
                and candidate.get("state")
                == "observed"
            ):
                break

            index += 1

        gap_end = index
        gap_length = (
            gap_end - gap_start
        )

        left_index = gap_start - 1
        right_index = gap_end

        if (
            left_index < 0
            or right_index >= len(output)
        ):
            continue

        if gap_length > max_gap_hours:
            continue

        contiguous = True

        for position in range(
            left_index,
            right_index,
        ):
            delta_seconds = (
                timestamps[position + 1]
                - timestamps[position]
            ).total_seconds()

            if delta_seconds != 3600:
                contiguous = False
                break

        if not contiguous:
            continue

        left = output[left_index][
            side
        ][variable]

        right = output[right_index][
            side
        ][variable]

        if (
            left.get("state")
            != "observed"
            or right.get("state")
            != "observed"
        ):
            continue

        left_value = left.get("value")
        right_value = right.get("value")

        if not (
            isinstance(
                left_value,
                (int, float),
            )
            and math.isfinite(
                float(left_value)
            )
            and isinstance(
                right_value,
                (int, float),
            )
            and math.isfinite(
                float(right_value)
            )
        ):
            continue

        left_value = float(
            left_value
        )
        right_value = float(
            right_value
        )

        denominator = (
            gap_length + 1
        )

        for offset in range(
            1,
            gap_length + 1,
        ):
            fraction = (
                offset
                / denominator
            )

            interpolated = (
                left_value
                + (
                    right_value
                    - left_value
                )
                * fraction
            )

            target_index = (
                left_index + offset
            )

            target = output[
                target_index
            ][side][variable]

            target["value"] = (
                interpolated
            )
            target["state"] = (
                "interpolated"
            )
            target["interpolated"] = (
                True
            )
            target[
                "interpolationMethod"
            ] = (
                "linear_internal_hourly"
            )
            target[
                "interpolationGapHours"
            ] = gap_length

            cleaning = output[
                target_index
            ].setdefault(
                "cleaning",
                {},
            )

            cleaning[
                "interpolationPerformed"
            ] = True

            events = cleaning.setdefault(
                "interpolationEvents",
                [],
            )

            events.append(
                {
                    "side":
                        side,
                    "variable":
                        variable,
                    "method":
                        "linear_internal_hourly",
                    "gapHours":
                        gap_length,
                    "leftBoundaryUtc":
                        iso_utc(
                            timestamps[
                                left_index
                            ]
                        ),
                    "rightBoundaryUtc":
                        iso_utc(
                            timestamps[
                                right_index
                            ]
                        ),
                }
            )

            interpolated_count += 1

    return {
        "schema":
            "agritwin-phase11-cleaning-result-v1",
        "policy":
            policy,
        "interpolatedValues":
            interpolated_count,
        "rows":
            output,
    }



def _solar_position_features(
    timestamp_utc: datetime,
    *,
    latitude_deg: float,
    longitude_deg: float,
) -> dict[str, float]:
    """Return deterministic approximate solar-position features.

    Uses standard solar declination/equation-of-time relationships
    suitable for reproducible feature engineering. These are model
    features, not measured solar observations.
    """
    timestamp = timestamp_utc.astimezone(
        timezone.utc
    )

    day_of_year = timestamp.timetuple().tm_yday

    fractional_hour = (
        timestamp.hour
        + timestamp.minute / 60.0
        + timestamp.second / 3600.0
    )

    gamma = (
        2.0
        * math.pi
        / 365.0
        * (
            day_of_year
            - 1
            + (
                fractional_hour
                - 12.0
            )
            / 24.0
        )
    )

    equation_of_time_minutes = 229.18 * (
        0.000075
        + 0.001868 * math.cos(gamma)
        - 0.032077 * math.sin(gamma)
        - 0.014615 * math.cos(2.0 * gamma)
        - 0.040849 * math.sin(2.0 * gamma)
    )

    declination_rad = (
        0.006918
        - 0.399912 * math.cos(gamma)
        + 0.070257 * math.sin(gamma)
        - 0.006758 * math.cos(2.0 * gamma)
        + 0.000907 * math.sin(2.0 * gamma)
        - 0.002697 * math.cos(3.0 * gamma)
        + 0.00148 * math.sin(3.0 * gamma)
    )

    true_solar_time_minutes = (
        fractional_hour * 60.0
        + equation_of_time_minutes
        + 4.0 * longitude_deg
    ) % 1440.0

    hour_angle_deg = (
        true_solar_time_minutes
        / 4.0
        - 180.0
    )

    latitude_rad = math.radians(
        latitude_deg
    )

    hour_angle_rad = math.radians(
        hour_angle_deg
    )

    cos_zenith = (
        math.sin(latitude_rad)
        * math.sin(declination_rad)
        + math.cos(latitude_rad)
        * math.cos(declination_rad)
        * math.cos(hour_angle_rad)
    )

    cos_zenith = max(
        -1.0,
        min(
            1.0,
            cos_zenith,
        ),
    )

    zenith_deg = math.degrees(
        math.acos(cos_zenith)
    )

    elevation_deg = (
        90.0 - zenith_deg
    )

    return {
        "solarDeclinationDeg":
            math.degrees(
                declination_rad
            ),
        "solarHourAngleDeg":
            hour_angle_deg,
        "solarZenithDeg":
            zenith_deg,
        "solarElevationDeg":
            elevation_deg,
        "equationOfTimeMinutes":
            equation_of_time_minutes,
    }


def _extract_feature_value(
    row: dict[str, Any],
    side: str,
    variable: str,
) -> float | None:
    side_values = row.get(side)

    if not isinstance(
        side_values,
        dict,
    ):
        return None

    state = side_values.get(
        variable
    )

    if not isinstance(
        state,
        dict,
    ):
        return None

    value = state.get("value")

    if (
        isinstance(
            value,
            (int, float),
        )
        and math.isfinite(
            float(value)
        )
    ):
        return float(value)

    return None


def _population_std(
    values: list[float],
) -> float:
    if not values:
        raise ValueError(
            "Cannot calculate standard deviation "
            "for an empty sequence."
        )

    mean = sum(values) / len(values)

    variance = sum(
        (value - mean) ** 2
        for value in values
    ) / len(values)

    return math.sqrt(
        variance
    )


def build_causal_features(
    rows: Iterable[dict[str, Any]],
    *,
    source_side: str = "measured",
    source_variable: str = "temperature",
    lag_hours: tuple[int, ...] = (
        1,
        3,
        6,
        24,
    ),
    rolling_hours: tuple[int, ...] = (
        3,
        6,
        24,
    ),
    latitude_deg: float = FENI_LATITUDE,
    longitude_deg: float = FENI_LONGITUDE,
    local_timezone: str = FENI_TIMEZONE,
) -> list[dict[str, Any]]:
    """Add deterministic leakage-free features.

    All lag features reference strictly earlier rows.
    Rolling windows are trailing and include the current
    observation plus earlier observations only.
    """
    if source_side not in (
        "measured",
        "provider",
    ):
        raise ValueError(
            "Feature source_side must be measured or provider."
        )

    if any(
        not isinstance(value, int)
        or isinstance(value, bool)
        or value <= 0
        for value in lag_hours
    ):
        raise ValueError(
            "All lag hours must be positive integers."
        )

    if any(
        not isinstance(value, int)
        or isinstance(value, bool)
        or value <= 0
        for value in rolling_hours
    ):
        raise ValueError(
            "All rolling hours must be positive integers."
        )

    timezone_local = ZoneInfo(
        local_timezone
    )

    output = copy.deepcopy(
        list(rows)
    )

    timestamps: list[datetime] = []

    values: list[
        float | None
    ] = []

    previous_timestamp: (
        datetime | None
    ) = None

    for index, row in enumerate(
        output
    ):
        timestamp = (
            parse_provider_hour_timestamp(
                row.get("timestampUtc")
            )
        )

        if (
            previous_timestamp is not None
            and (
                timestamp
                - previous_timestamp
            ).total_seconds()
            != 3600
        ):
            raise ValueError(
                "Causal feature rows must be "
                "strictly contiguous hourly records."
            )

        previous_timestamp = timestamp
        timestamps.append(timestamp)

        values.append(
            _extract_feature_value(
                row,
                source_side,
                source_variable,
            )
        )

        local = timestamp.astimezone(
            timezone_local
        )

        hour_angle = (
            2.0
            * math.pi
            * local.hour
            / 24.0
        )

        day_angle = (
            2.0
            * math.pi
            * (
                local.timetuple().tm_yday
                - 1
            )
            / 365.0
        )

        solar = (
            _solar_position_features(
                timestamp,
                latitude_deg=
                    latitude_deg,
                longitude_deg=
                    longitude_deg,
            )
        )

        features: dict[
            str,
            Any,
        ] = {
            "schema":
                "agritwin-phase11-features-v1",
            "sourceSide":
                source_side,
            "sourceVariable":
                source_variable,
            "utcHour":
                timestamp.hour,
            "localHour":
                local.hour,
            "localDayOfYear":
                local.timetuple().tm_yday,
            "hourSin":
                math.sin(hour_angle),
            "hourCos":
                math.cos(hour_angle),
            "dayOfYearSin":
                math.sin(day_angle),
            "dayOfYearCos":
                math.cos(day_angle),
            **solar,
            "lagFeatures": {},
            "rollingFeatures": {},
            "causalPolicy": {
                "futureRowsUsed":
                    False,
                "centeredWindowsUsed":
                    False,
                "rollingDirection":
                    "trailing",
                "timestampOrder":
                    "strict_hourly_utc",
            },
        }

        for lag in lag_hours:
            source_index = (
                index - lag
            )

            lag_value = (
                values[source_index]
                if source_index >= 0
                else None
            )

            features[
                "lagFeatures"
            ][f"lag{lag}h"] = (
                lag_value
            )

        for window in (
            rolling_hours
        ):
            start = max(
                0,
                index - window + 1,
            )

            candidates = [
                value
                for value
                in values[
                    start:index + 1
                ]
                if value is not None
            ]

            if not candidates:
                summary = {
                    "count": 0,
                    "mean": None,
                    "min": None,
                    "max": None,
                    "std": None,
                }
            else:
                summary = {
                    "count":
                        len(candidates),
                    "mean":
                        sum(candidates)
                        / len(candidates),
                    "min":
                        min(candidates),
                    "max":
                        max(candidates),
                    "std":
                        _population_std(
                            candidates
                        ),
                }

            features[
                "rollingFeatures"
            ][f"trailing{window}h"] = (
                summary
            )

        row["features"] = (
            features
        )

    return output



def assign_chronological_splits(
    rows: Iterable[dict[str, Any]],
    *,
    train_fraction: float = 0.70,
    validation_fraction: float = 0.15,
    test_fraction: float = 0.15,
) -> dict[str, Any]:
    """Assign deterministic chronological train/validation/test labels.

    Rows are never shuffled. Split boundaries are contiguous and
    strictly ordered in UTC. This function performs no model training.
    """
    fractions = (
        train_fraction,
        validation_fraction,
        test_fraction,
    )

    if any(
        not isinstance(
            value,
            (int, float),
        )
        or isinstance(value, bool)
        or not math.isfinite(
            float(value)
        )
        or value <= 0
        for value in fractions
    ):
        raise ValueError(
            "Split fractions must be positive finite numbers."
        )

    total_fraction = sum(
        float(value)
        for value in fractions
    )

    if not math.isclose(
        total_fraction,
        1.0,
        rel_tol=0.0,
        abs_tol=1e-12,
    ):
        raise ValueError(
            "Train/validation/test fractions must sum to 1."
        )

    output = copy.deepcopy(
        list(rows)
    )

    timestamps: list[
        datetime
    ] = []

    previous_timestamp: (
        datetime | None
    ) = None

    for row in output:
        if not isinstance(
            row,
            dict,
        ):
            raise ValueError(
                "Split row must be an object."
            )

        timestamp = (
            parse_provider_hour_timestamp(
                row.get("timestampUtc")
            )
        )

        if (
            previous_timestamp is not None
            and timestamp
            <= previous_timestamp
        ):
            raise ValueError(
                "Rows must be strictly chronological "
                "before split assignment."
            )

        previous_timestamp = timestamp
        timestamps.append(timestamp)

    count = len(output)

    if count < 3:
        raise ValueError(
            "At least three chronological rows are "
            "required for train/validation/test splits."
        )

    raw_train = (
        count * train_fraction
    )

    raw_validation = (
        count * validation_fraction
    )

    train_count = max(
        1,
        int(
            math.floor(
                raw_train
            )
        ),
    )

    validation_count = max(
        1,
        int(
            math.floor(
                raw_validation
            )
        ),
    )

    if (
        train_count
        + validation_count
        >= count
    ):
        validation_count = 1
        train_count = (
            count - 2
        )

    test_count = (
        count
        - train_count
        - validation_count
    )

    if test_count < 1:
        raise ValueError(
            "Split allocation produced an empty test set."
        )

    train_end = train_count
    validation_end = (
        train_count
        + validation_count
    )

    for index, row in enumerate(
        output
    ):
        if index < train_end:
            split = "train"
        elif index < validation_end:
            split = "validation"
        else:
            split = "test"

        row["split"] = {
            "schema":
                "agritwin-phase11-chronological-split-v1",
            "label":
                split,
            "rowIndex":
                index,
            "chronological":
                True,
            "randomized":
                False,
            "futureLeakageAllowed":
                False,
        }

    boundaries = {
        "train": {
            "count":
                train_count,
            "startTime":
                iso_utc(
                    timestamps[0]
                ),
            "endTime":
                iso_utc(
                    timestamps[
                        train_end - 1
                    ]
                ),
        },
        "validation": {
            "count":
                validation_count,
            "startTime":
                iso_utc(
                    timestamps[
                        train_end
                    ]
                ),
            "endTime":
                iso_utc(
                    timestamps[
                        validation_end - 1
                    ]
                ),
        },
        "test": {
            "count":
                test_count,
            "startTime":
                iso_utc(
                    timestamps[
                        validation_end
                    ]
                ),
            "endTime":
                iso_utc(
                    timestamps[-1]
                ),
        },
    }

    return {
        "schema":
            "agritwin-phase11-chronological-splits-v1",
        "policy": {
            "method":
                "contiguous_chronological",
            "randomShuffle":
                False,
            "futureLeakageAllowed":
                False,
            "trainFraction":
                train_fraction,
            "validationFraction":
                validation_fraction,
            "testFraction":
                test_fraction,
            "modelTrainingPerformed":
                False,
        },
        "rowCount":
            count,
        "boundaries":
            boundaries,
        "rows":
            output,
    }



def build_gold_manifest(
    rows: Iterable[dict[str, Any]],
    *,
    measurement_source: dict[str, Any],
    provider_manifest: dict[str, Any],
    synchronization_policy: dict[str, Any],
    cleaning_policy: dict[str, Any],
    feature_policy: dict[str, Any],
    split_policy: dict[str, Any],
) -> dict[str, Any]:
    """Build deterministic Phase 11 Gold provenance and fingerprint."""
    normalized_rows = copy.deepcopy(
        list(rows)
    )

    previous_timestamp: (
        datetime | None
    ) = None

    for row in normalized_rows:
        if not isinstance(
            row,
            dict,
        ):
            raise ValueError(
                "Gold manifest rows must be objects."
            )

        timestamp = (
            parse_provider_hour_timestamp(
                row.get("timestampUtc")
            )
        )

        if (
            previous_timestamp is not None
            and timestamp
            <= previous_timestamp
        ):
            raise ValueError(
                "Gold manifest rows must be strictly chronological."
            )

        previous_timestamp = timestamp

    row_count = len(
        normalized_rows
    )

    start_time = (
        normalized_rows[0][
            "timestampUtc"
        ]
        if row_count
        else None
    )

    end_time = (
        normalized_rows[-1][
            "timestampUtc"
        ]
        if row_count
        else None
    )

    rows_fingerprint = (
        sha256_value(
            normalized_rows
        )
    )

    manifest = {
        "schema":
            "agritwin-phase11-gold-manifest-v1",
        "phase":
            11,
        "datasetType":
            "synchronized_gold_environmental_foundation",
        "canonicalTimezone":
            "UTC",
        "site": {
            "name":
                "Feni, Bangladesh",
            "stationId":
                "BDFE2",
            "latitude":
                FENI_LATITUDE,
            "longitude":
                FENI_LONGITUDE,
            "displayTimezone":
                FENI_TIMEZONE,
        },
        "coverage": {
            "rowCount":
                row_count,
            "startTime":
                start_time,
            "endTime":
                end_time,
            "intervalSeconds":
                3600,
        },
        "measurementSource":
            measurement_source,
        "measurementSourceFingerprint":
            sha256_value(
                measurement_source
            ),
        "providerManifest":
            provider_manifest,
        "providerManifestFingerprint":
            sha256_value(
                provider_manifest
            ),
        "synchronizationPolicy":
            synchronization_policy,
        "synchronizationPolicyFingerprint":
            sha256_value(
                synchronization_policy
            ),
        "cleaningPolicy":
            cleaning_policy,
        "cleaningPolicyFingerprint":
            sha256_value(
                cleaning_policy
            ),
        "featurePolicy":
            feature_policy,
        "featurePolicyFingerprint":
            sha256_value(
                feature_policy
            ),
        "splitPolicy":
            split_policy,
        "splitPolicyFingerprint":
            sha256_value(
                split_policy
            ),
        "rowsFingerprint":
            rows_fingerprint,
        "scientificBoundaries": {
            "interpolationMustBeExplicit":
                True,
            "extrapolationAllowed":
                False,
            "nearestNeighbourTimestampMatching":
                False,
            "timestampRounding":
                False,
            "silentResampling":
                False,
            "randomTemporalSplits":
                False,
            "futureFeatureLeakageAllowed":
                False,
            "modelTrainingPerformed":
                False,
            "empiricalPlantValidationPerformed":
                False,
        },
    }

    manifest[
        "goldFingerprint"
    ] = sha256_value(
        manifest
    )

    return manifest


def synchronize_hourly_records(
    measured_records: Iterable[dict[str, Any]],
    provider_records: Iterable[dict[str, Any]],
) -> dict[str, Any]:
    """Synchronize measured/provider hourly records by exact UTC intersection."""
    measured_by_time: dict[
        datetime,
        dict[str, Any],
    ] = {}

    provider_by_time: dict[
        datetime,
        dict[str, Any],
    ] = {}

    for record in measured_records:
        timestamp = parse_provider_hour_timestamp(
            record.get("timestampUtc")
        )

        if timestamp in measured_by_time:
            raise ValueError(
                "Duplicate measured hourly timestamp encountered: "
                f"{iso_utc(timestamp)}"
            )

        measured_by_time[timestamp] = record

    for record in provider_records:
        timestamp = parse_provider_hour_timestamp(
            record.get("timestampUtc")
        )

        if timestamp in provider_by_time:
            raise ValueError(
                "Duplicate provider hourly timestamp encountered: "
                f"{iso_utc(timestamp)}"
            )

        provider_by_time[timestamp] = record

    common = sorted(
        set(measured_by_time)
        & set(provider_by_time)
    )

    synchronized = [
        {
            "timestampUtc": iso_utc(timestamp),
            "measured":
                measured_by_time[timestamp],
            "provider":
                provider_by_time[timestamp],
        }
        for timestamp in common
    ]

    return {
        "schemaVersion": 1,
        "policy":
            "exact_utc_timestamp_intersection",
        "measuredCount":
            len(measured_by_time),
        "providerCount":
            len(provider_by_time),
        "commonCount":
            len(common),
        "measuredOnlyCount":
            len(measured_by_time)
            - len(common),
        "providerOnlyCount":
            len(provider_by_time)
            - len(common),
        "startTime":
            (
                iso_utc(common[0])
                if common
                else None
            ),
        "endTime":
            (
                iso_utc(common[-1])
                if common
                else None
            ),
        "records":
            synchronized,
    }


def aggregate_silver_records_15_min(
    records: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Aggregate canonical one-minute Silver records into 15-minute Gold."""
    buckets: dict[
        datetime,
        list[tuple[datetime, dict[str, Any]]],
    ] = defaultdict(list)

    seen_timestamps: set[datetime] = set()

    dataset_id: str | None = None
    station_id: str | None = None
    source_sha256: str | None = None

    for record in records:
        timestamp = parse_utc_timestamp(
            record.get("timestampUtc")
        )

        if timestamp in seen_timestamps:
            raise ValueError(
                "Duplicate Silver timestamp encountered: "
                f"{iso_utc(timestamp)}"
            )

        seen_timestamps.add(timestamp)

        current_dataset = record.get("datasetId")
        current_station = record.get("stationId")
        current_sha256 = record.get(
            "sourceFileSha256"
        )

        if dataset_id is None:
            dataset_id = current_dataset
        elif current_dataset != dataset_id:
            raise ValueError(
                "Silver input contains multiple datasetId values."
            )

        if station_id is None:
            station_id = current_station
        elif current_station != station_id:
            raise ValueError(
                "Silver input contains multiple stationId values."
            )

        if source_sha256 is None:
            source_sha256 = current_sha256
        elif current_sha256 != source_sha256:
            raise ValueError(
                "Silver input contains multiple sourceFileSha256 values."
            )

        buckets[
            bucket_start_15_min(timestamp)
        ].append(
            (timestamp, record)
        )

    output: list[dict[str, Any]] = []

    for bucket_start in sorted(buckets):
        rows = sorted(
            buckets[bucket_start],
            key=lambda item: item[0],
        )

        variable_outputs: dict[
            str,
            dict[str, Any],
        ] = {}

        for variable, method in (
            VARIABLE_AGGREGATION.items()
        ):
            counts = {
                status: 0
                for status in QUALITY_STATUSES
            }

            usable_values: list[float] = []

            for _, record in rows:
                measurement = (
                    record.get("values", {})
                    .get(variable)
                )

                if not isinstance(
                    measurement,
                    dict,
                ):
                    counts["missing"] += 1
                    continue

                status = measurement.get(
                    "qualityStatus"
                )

                if status not in counts:
                    raise ValueError(
                        "Unsupported qualityStatus "
                        f"for {variable}: {status}"
                    )

                counts[status] += 1

                value = measurement.get("value")

                if (
                    status in ("valid", "flagged")
                    and isinstance(value, (int, float))
                    and math.isfinite(float(value))
                ):
                    usable_values.append(
                        float(value)
                    )

            aggregate = aggregate_values(
                usable_values,
                method,
            )

            observed_samples = len(rows)
            usable_samples = len(usable_values)

            variable_outputs[variable] = {
                "value": aggregate,
                "aggregation": method,
                "expectedSamples":
                    EXPECTED_SAMPLES_15_MIN,
                "observedSamples":
                    observed_samples,
                "usableSamples":
                    usable_samples,
                "coverageRatio":
                    observed_samples
                    / EXPECTED_SAMPLES_15_MIN,
                "usableRatio":
                    usable_samples
                    / EXPECTED_SAMPLES_15_MIN,
                "qualityCounts": counts,
                "interpolatedSamples": 0,
            }

        output.append(
            {
                "schemaVersion": 1,
                "layer":
                    "gold_measurement_15_min",
                "datasetId":
                    dataset_id,
                "stationId":
                    station_id,
                "sourceFileSha256":
                    source_sha256,
                "timestampUtc":
                    iso_utc(bucket_start),
                "intervalSeconds": 900,
                "expectedSamples":
                    EXPECTED_SAMPLES_15_MIN,
                "observedSamples":
                    len(rows),
                "coverageRatio":
                    len(rows)
                    / EXPECTED_SAMPLES_15_MIN,
                "values":
                    variable_outputs,
            }
        )

    return output


def write_jsonl(
    path: Path,
    records: Iterable[dict[str, Any]],
) -> None:
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    opener = (
        gzip.open
        if path.suffix == ".gz"
        else open
    )

    with opener(
        path,
        "wt",
        encoding="utf-8",
    ) as output:
        for record in records:
            output.write(
                json.dumps(
                    record,
                    sort_keys=True,
                    separators=(",", ":"),
                )
                + "\n"
            )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Aggregate AgriTwin Phase 10 Silver Feni "
            "measurements into deterministic 15-minute Gold records."
        )
    )

    parser.add_argument(
        "--silver",
        required=True,
        type=Path,
    )

    parser.add_argument(
        "--output",
        required=True,
        type=Path,
    )

    return parser


def main() -> None:
    arguments = build_parser().parse_args()

    gold = aggregate_silver_records_15_min(
        read_jsonl(arguments.silver)
    )

    write_jsonl(
        arguments.output,
        gold,
    )


if __name__ == "__main__":
    main()
