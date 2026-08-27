#!/usr/bin/env python3
"""Deterministic streaming audit and Raw/Bronze/Silver ETL for Feni."""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import math
from collections import Counter, defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import IO, Any
from zoneinfo import ZoneInfo


VARIABLES = {
    "ghi": (
        "GHI_ThPyra1_Wm-2_avg",
        "GHI_ThPyra1_Wm-2_avg_flag",
        "W/m2",
        True,
    ),
    "dni": (
        "DNI_ThPyrh1_Wm-2_avg",
        "DNI_ThPyrh1_Wm-2_avg_flag",
        "W/m2",
        True,
    ),
    "dhi": (
        "DHI_ThPyra2_Wm-2_avg",
        "DHI_ThPyra2_Wm-2_avg_flag",
        "W/m2",
        True,
    ),
    "ambientTemperature": (
        "Temp_ThHyg1_degC_avg",
        "Temp_ThHyg1_degC_avg_flag",
        "C",
        False,
    ),
    "relativeHumidity": (
        "RH_ThHyg1_per100_avg",
        "RH_ThHyg1_per100_avg_flag",
        "%",
        False,
    ),
    "windSpeed": (
        "WindSpeed_Anemo1_ms_avg",
        "WindSpeed_Anemo1_ms_avg_flag",
        "m/s",
        False,
    ),
    "windDirection": (
        "WindDir_Wvane1_deg_avg360",
        "WindDir_Wvane1_deg_avg360_flag",
        "degree",
        False,
    ),
    "atmosphericPressure": (
        "Pres_Logger1_hPa_avg",
        "Pres_Logger1_hPa_avg_flag",
        "hPa",
        False,
    ),
    "precipitation": (
        "Precip_Pluvio1_mm_sum",
        "Precip_Pluvio1_mm_sum_flag",
        "mm",
        False,
    ),
}

QC_MAGNITUDES = (
    (10**20, "missing_value"),
    (10**18, "timeshift_error"),
    (10**16, "below_physical_limit"),
    (10**15, "above_physical_limit"),
    (10**12, "gradient_or_tracking_shading_error"),
    (10**10, "during_cleaning"),
    (10**8, "redundancy"),
    (10**7, "two_component_test_failed"),
    (10**6, "three_component_test_failed"),
    (10**5, "value_corrected"),
    (10**4, "above_clear_sky_limit"),
    (10**2, "rare_observation"),
    (1, "classified_correct"),
)

FATAL_COMPONENTS = {
    "timeshift_error",
    "below_physical_limit",
    "above_physical_limit",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def parse_number(raw: str | None) -> float | None:
    if raw is None:
        return None

    text = raw.strip()

    if text.lower() in {
        "",
        "nan",
        "null",
        "undefined",
    }:
        return None

    try:
        value = float(text)
    except ValueError:
        return None

    if not math.isfinite(value):
        return None

    return value


def decode_qc_flag(raw: str | None) -> list[str]:
    if raw is None or not raw.strip():
        return ["qc_unavailable"]

    try:
        value = int(Decimal(raw.strip()))
    except (InvalidOperation, ValueError):
        return ["qc_unparseable"]

    if value <= 0:
        return ["qc_unclassified"]

    components: list[str] = []
    remainder = value

    for magnitude, label in QC_MAGNITUDES:
        if remainder >= magnitude:
            count, remainder = divmod(remainder, magnitude)

            if count == 1:
                components.append(label)
            else:
                components.append(f"{label}:{count}")

    if remainder:
        components.append(f"unknown_remainder:{remainder}")

    return components or ["qc_unclassified"]


def classify_quality(
    value: float | None,
    raw_flag: str | None,
) -> tuple[str, list[str], str | None]:
    components = decode_qc_flag(raw_flag)

    if value is None:
        return "missing", components, "source_value_missing"

    if "missing_value" in components:
        return "missing", components, "qc_missing_value"

    if any(
        component in FATAL_COMPONENTS
        for component in components
    ):
        return "invalid", components, "qc_physical_or_time_error"

    if components == ["classified_correct"]:
        return "valid", components, None

    return "flagged", components, None


def parse_timestamp(raw: str) -> datetime:
    parsed = datetime.strptime(
        raw.strip(),
        "%Y-%m-%d %H:%M:%S",
    )

    return parsed.replace(tzinfo=UTC)


def iso_utc(value: datetime) -> str:
    return value.astimezone(UTC).isoformat().replace(
        "+00:00",
        "Z",
    )


def open_jsonl_writer(
    path: Path | None,
) -> IO[str] | None:
    if path is None:
        return None

    path.parent.mkdir(parents=True, exist_ok=True)

    if path.suffix == ".gz":
        return gzip.open(
            path,
            mode="wt",
            encoding="utf-8",
            newline="\n",
        )

    return path.open(
        "w",
        encoding="utf-8",
        newline="\n",
    )


def write_jsonl(
    output: IO[str] | None,
    value: dict[str, Any],
) -> None:
    if output is None:
        return

    output.write(
        json.dumps(
            value,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
    )
    output.write("\n")


def expected_daily_counts(
    first: datetime,
    last: datetime,
) -> dict[str, int]:
    counts: dict[str, int] = {}
    current = first.date()
    final = last.date()

    while current <= final:
        start = datetime.combine(
            current,
            datetime.min.time(),
            tzinfo=UTC,
        )
        end = start + timedelta(
            days=1,
            minutes=-1,
        )

        bounded_start = max(start, first)
        bounded_end = min(end, last)

        counts[current.isoformat()] = (
            int(
                (
                    bounded_end -
                    bounded_start
                ).total_seconds()
                // 60
            )
            + 1
        )

        current += timedelta(days=1)

    return counts


def audit_dataset(
    source_path: Path,
    manifest_path: Path,
    report_path: Path,
    bronze_path: Path | None = None,
    silver_path: Path | None = None,
) -> dict[str, Any]:
    manifest = json.loads(
        manifest_path.read_text(
            encoding="utf-8",
        )
    )

    resource = next(
        item
        for item in manifest["resources"]
        if item["role"] ==
        "quality_controlled_measurements"
    )

    actual_sha256 = sha256_file(source_path)
    expected_sha256 = resource["sha256"]

    if actual_sha256 != expected_sha256:
        raise ValueError(
            "Source checksum does not match the controlled manifest."
        )

    source_size = source_path.stat().st_size
    expected_size = resource["fileSizeBytes"]

    if source_size != expected_size:
        raise ValueError(
            "Source size does not match the controlled manifest."
        )

    bronze_output = open_jsonl_writer(
        bronze_path,
    )
    silver_output = open_jsonl_writer(
        silver_path,
    )

    total_source_rows = 0
    parsed_rows = 0
    rejected_rows = 0
    duplicate_timestamps = 0
    out_of_order_rows = 0
    missing_intervals = 0
    longest_gap_minutes = 0
    malformed_row_numbers: list[int] = []

    first_timestamp: datetime | None = None
    last_timestamp: datetime | None = None
    previous_timestamp: datetime | None = None

    seen_minutes: set[int] = set()
    daily_observed: Counter[str] = Counter()

    variable_counts: dict[
        str,
        Counter[str],
    ] = {
        variable: Counter()
        for variable in VARIABLES
    }

    qc_distributions: dict[
        str,
        Counter[str],
    ] = {
        variable: Counter()
        for variable in VARIABLES
    }

    local_timezone = ZoneInfo(
        "Asia/Dhaka",
    )

    header: list[str] | None = None
    indexes: dict[
        str,
        tuple[int, int, str, bool],
    ] = {}

    try:
        with source_path.open(
            "r",
            encoding="ascii",
            newline="",
        ) as source:
            for physical_line, line in enumerate(
                source,
                start=1,
            ):
                stripped = line.rstrip(
                    "\r\n",
                )

                if stripped == "# Variables:":
                    continue

                if (
                    stripped.startswith(
                        "# JulianTime,"
                    )
                ):
                    header = next(
                        csv.reader(
                            [stripped[2:]],
                        )
                    )

                    for (
                        variable,
                        (
                            value_column,
                            flag_column,
                            unit,
                            is_radiation,
                        ),
                    ) in VARIABLES.items():
                        indexes[variable] = (
                            header.index(
                                value_column,
                            ),
                            header.index(
                                flag_column,
                            ),
                            unit,
                            is_radiation,
                        )

                    continue

                if (
                    not stripped or
                    stripped.startswith("#")
                ):
                    continue

                total_source_rows += 1

                if header is None:
                    rejected_rows += 1
                    malformed_row_numbers.append(
                        physical_line,
                    )
                    continue

                try:
                    row = next(
                        csv.reader(
                            [stripped],
                        )
                    )
                except csv.Error:
                    rejected_rows += 1
                    malformed_row_numbers.append(
                        physical_line,
                    )
                    continue

                if len(row) != len(header):
                    rejected_rows += 1
                    malformed_row_numbers.append(
                        physical_line,
                    )
                    continue

                try:
                    timestamp = parse_timestamp(
                        row[0],
                    )
                except ValueError:
                    rejected_rows += 1
                    malformed_row_numbers.append(
                        physical_line,
                    )
                    continue

                parsed_rows += 1
                minute_key = int(
                    timestamp.timestamp()
                    // 60
                )

                if minute_key in seen_minutes:
                    duplicate_timestamps += 1
                else:
                    seen_minutes.add(
                        minute_key,
                    )
                    daily_observed[
                        timestamp.date().isoformat()
                    ] += 1

                if (
                    previous_timestamp is not None
                ):
                    delta_minutes = int(
                        (
                            timestamp -
                            previous_timestamp
                        ).total_seconds()
                        // 60
                    )

                    if delta_minutes < 0:
                        out_of_order_rows += 1
                    elif delta_minutes > 1:
                        current_missing = (
                            delta_minutes - 1
                        )
                        missing_intervals += (
                            current_missing
                        )
                        longest_gap_minutes = max(
                            longest_gap_minutes,
                            current_missing,
                        )

                previous_timestamp = timestamp

                if first_timestamp is None:
                    first_timestamp = timestamp

                if (
                    last_timestamp is None or
                    timestamp > last_timestamp
                ):
                    last_timestamp = timestamp

                original_values: dict[
                    str,
                    Any,
                ] = {}
                normalized_values: dict[
                    str,
                    Any,
                ] = {}

                for (
                    variable,
                    (
                        value_index,
                        flag_index,
                        unit,
                        _,
                    ),
                ) in indexes.items():
                    raw_value = row[
                        value_index
                    ].strip()
                    raw_flag = row[
                        flag_index
                    ].strip()

                    value = parse_number(
                        raw_value,
                    )
                    (
                        status,
                        components,
                        missing_reason,
                    ) = classify_quality(
                        value,
                        raw_flag,
                    )

                    variable_counts[
                        variable
                    ][status] += 1

                    qc_distributions[
                        variable
                    ][raw_flag or "<empty>"] += 1

                    original_values[
                        variable
                    ] = {
                        "rawValue":
                            raw_value or None,
                        "originalUnit":
                            unit,
                        "rawQcFlag":
                            raw_flag or None,
                    }

                    normalized_values[
                        variable
                    ] = {
                        "value": value,
                        "normalizedUnit": unit,
                        "qualityStatus": status,
                        "rawQcFlag":
                            raw_flag or None,
                        "qcComponents":
                            components,
                        "missingValueReason":
                            missing_reason,
                    }

                write_jsonl(
                    bronze_output,
                    {
                        "schemaVersion": 1,
                        "datasetId":
                            manifest["datasetId"],
                        "stationId":
                            manifest["station"]["id"],
                        "sourceFileSha256":
                            actual_sha256,
                        "sourceRowNumber":
                            physical_line,
                        "originalTimestamp":
                            row[0],
                        "values":
                            original_values,
                    },
                )

                write_jsonl(
                    silver_output,
                    {
                        "schemaVersion": 1,
                        "datasetId":
                            manifest["datasetId"],
                        "stationId":
                            manifest["station"]["id"],
                        "sourceFileSha256":
                            actual_sha256,
                        "sourceRowNumber":
                            physical_line,
                        "originalTimestamp":
                            row[0],
                        "timestampUtc":
                            iso_utc(timestamp),
                        "timestampLocal":
                            timestamp.astimezone(
                                local_timezone,
                            ).isoformat(),
                        "values":
                            normalized_values,
                    },
                )
    finally:
        if bronze_output is not None:
            bronze_output.close()

        if silver_output is not None:
            silver_output.close()

    if (
        first_timestamp is None or
        last_timestamp is None
    ):
        raise ValueError(
            "No valid measurement timestamps were parsed."
        )

    expected_intervals = (
        int(
            (
                last_timestamp -
                first_timestamp
            ).total_seconds()
            // 60
        )
        + 1
    )

    unique_timestamps = len(
        seen_minutes,
    )

    expected_by_day = expected_daily_counts(
        first_timestamp,
        last_timestamp,
    )

    daily_coverage = []
    monthly_observed: Counter[str] = Counter()
    monthly_expected: Counter[str] = Counter()

    for day_value, expected in sorted(
        expected_by_day.items()
    ):
        observed = daily_observed[
            day_value
        ]
        month = day_value[:7]

        monthly_observed[month] += observed
        monthly_expected[month] += expected

        daily_coverage.append(
            {
                "date": day_value,
                "observed": observed,
                "expected": expected,
                "coveragePercent": round(
                    (
                        observed /
                        expected *
                        100
                    )
                    if expected
                    else 0,
                    6,
                ),
            }
        )

    monthly_coverage = [
        {
            "month": month,
            "observed":
                monthly_observed[month],
            "expected":
                monthly_expected[month],
            "coveragePercent": round(
                (
                    monthly_observed[month] /
                    monthly_expected[month] *
                    100
                )
                if monthly_expected[month]
                else 0,
                6,
            ),
        }
        for month in sorted(
            monthly_expected
        )
    ]

    variable_report = {}

    for variable in sorted(
        VARIABLES
    ):
        counts = variable_counts[
            variable
        ]
        evaluated = sum(
            counts.values()
        )

        variable_report[
            variable
        ] = {
            "total": evaluated,
            "valid": counts["valid"],
            "flagged": counts["flagged"],
            "invalid": counts["invalid"],
            "missing": counts["missing"],
            "validSamplePercent": round(
                (
                    counts["valid"] /
                    evaluated *
                    100
                )
                if evaluated
                else 0,
                6,
            ),
            "qcFlagDistribution": dict(
                sorted(
                    qc_distributions[
                        variable
                    ].items()
                )
            ),
        }

    report = {
        "schemaVersion": 1,
        "datasetId":
            manifest["datasetId"],
        "station":
            manifest["station"],
        "source": {
            "path":
                str(source_path),
            "sizeBytes":
                source_size,
            "sha256":
                actual_sha256,
            "checksumVerified":
                True,
        },
        "coverage": {
            "startTime":
                iso_utc(first_timestamp),
            "endTime":
                iso_utc(last_timestamp),
            "expectedIntervalSeconds":
                60,
            "sourceRows":
                total_source_rows,
            "parsedRows":
                parsed_rows,
            "rejectedRows":
                rejected_rows,
            "uniqueTimestamps":
                unique_timestamps,
            "duplicateTimestamps":
                duplicate_timestamps,
            "outOfOrderRows":
                out_of_order_rows,
            "expectedIntervals":
                expected_intervals,
            "missingIntervals":
                max(
                    expected_intervals -
                    unique_timestamps,
                    0,
                ),
            "sequentialGapCount":
                missing_intervals,
            "longestGapMinutes":
                longest_gap_minutes,
            "coveragePercent": round(
                unique_timestamps /
                expected_intervals *
                100,
                6,
            ),
            "rowCountReconciled":
                (
                    parsed_rows +
                    rejected_rows ==
                    total_source_rows
                ),
            "malformedRowNumbers":
                malformed_row_numbers[:100],
        },
        "variables":
            variable_report,
        "dailyCoverage":
            daily_coverage,
        "monthlyCoverage":
            monthly_coverage,
        "units": {
            variable: settings[2]
            for variable, settings
            in sorted(
                VARIABLES.items()
            )
        },
        "layers": {
            "raw":
                "immutable source resource",
            "bronze":
                (
                    str(bronze_path)
                    if bronze_path
                    else
                    "implemented; generation not requested"
                ),
            "silver":
                (
                    str(silver_path)
                    if silver_path
                    else
                    "implemented; generation not requested"
                ),
            "gold":
                "deferred to Phase 11",
        },
        "scientificBoundaries":
            manifest[
                "scientificBoundaries"
            ],
    }

    report_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )
    report_path.write_text(
        json.dumps(
            report,
            indent=2,
            ensure_ascii=False,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )

    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Audit and normalize the World Bank/ESMAP "
            "Feni measurement dataset."
        )
    )
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
    )
    parser.add_argument(
        "--manifest",
        required=True,
        type=Path,
    )
    parser.add_argument(
        "--report",
        required=True,
        type=Path,
    )
    parser.add_argument(
        "--bronze",
        type=Path,
    )
    parser.add_argument(
        "--silver",
        type=Path,
    )

    return parser


def main() -> None:
    arguments = build_parser().parse_args()

    report = audit_dataset(
        source_path=arguments.input,
        manifest_path=arguments.manifest,
        report_path=arguments.report,
        bronze_path=arguments.bronze,
        silver_path=arguments.silver,
    )

    coverage = report["coverage"]

    print("Dataset:", report["datasetId"])
    print("Checksum verified:", True)
    print("Source rows:", coverage["sourceRows"])
    print("Parsed rows:", coverage["parsedRows"])
    print("Rejected rows:", coverage["rejectedRows"])
    print(
        "Duplicate timestamps:",
        coverage["duplicateTimestamps"],
    )
    print(
        "Missing intervals:",
        coverage["missingIntervals"],
    )
    print(
        "Longest gap (minutes):",
        coverage["longestGapMinutes"],
    )
    print(
        "Coverage (%):",
        coverage["coveragePercent"],
    )
    print("Report:", arguments.report)


if __name__ == "__main__":
    main()
