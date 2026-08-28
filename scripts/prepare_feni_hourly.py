#!/usr/bin/env python3
"""Create AgriTwin's canonical hourly Feni weather derivative.

The source logger timestamps are UTC. Output timestamps are converted to
Asia/Dhaka (UTC+06:00) before grouping so a simulation day means a local
Bangladesh civil day. The raw source is never modified.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable


EXPECTED_SHA256 = "39a7697322612ff98e4e7a3454e3e8bd4eb206e53417973b73845394ec07d3c1"
BST = timezone(timedelta(hours=6), name="Asia/Dhaka")
MISSING = {"", "nan", "1e+20", "-999", "-9999"}

SOURCE_COLUMNS = {
    "timestamp": "JulianTime",
    "dhi": "DHI_ThPyra2_Wm-2_avg",
    "dni": "DNI_ThPyrh1_Wm-2_avg",
    "ghi": "GHI_ThPyra1_Wm-2_avg",
    "precipitation": "Precip_Pluvio1_mm_sum",
    "pressure": "Pres_Logger1_hPa_avg",
    "humidity": "RH_ThHyg1_per100_avg",
    "temperature": "Temp_ThHyg1_degC_avg",
    "wind_direction": "WindDir_Wvane1_deg_avg360",
    "wind_speed": "WindSpeed_Anemo1_ms_avg",
    "data_filled": "data-filled",
}

MEAN_FIELDS = (
    "ghi",
    "dni",
    "dhi",
    "temperature",
    "humidity",
    "wind_speed",
    "pressure",
)


def numeric(value: str) -> float | None:
    text = value.strip().lower()
    if text in MISSING:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


@dataclass
class Hour:
    timestamp_local: datetime
    timestamp_utc: datetime
    sums: dict[str, float] = field(default_factory=lambda: {name: 0.0 for name in MEAN_FIELDS})
    counts: dict[str, int] = field(default_factory=lambda: {name: 0 for name in MEAN_FIELDS})
    precipitation_sum: float = 0.0
    precipitation_count: int = 0
    wind_sin: float = 0.0
    wind_cos: float = 0.0
    wind_direction_count: int = 0
    data_filled_count: int = 0
    source_rows: int = 0

    def add(self, row: dict[str, str]) -> None:
        self.source_rows += 1
        for name in MEAN_FIELDS:
            value = numeric(row[SOURCE_COLUMNS[name]])
            if value is not None:
                self.sums[name] += value
                self.counts[name] += 1

        precipitation = numeric(row[SOURCE_COLUMNS["precipitation"]])
        if precipitation is not None:
            self.precipitation_sum += precipitation
            self.precipitation_count += 1

        direction = numeric(row[SOURCE_COLUMNS["wind_direction"]])
        if direction is not None:
            radians = math.radians(direction)
            self.wind_sin += math.sin(radians)
            self.wind_cos += math.cos(radians)
            self.wind_direction_count += 1

        filled = numeric(row[SOURCE_COLUMNS["data_filled"]])
        if filled is not None and filled > 0:
            self.data_filled_count += 1

    def mean(self, name: str) -> str:
        count = self.counts[name]
        return "" if count == 0 else f"{self.sums[name] / count:.6f}"

    def wind_direction(self) -> str:
        if self.wind_direction_count == 0:
            return ""
        value = math.degrees(math.atan2(self.wind_sin, self.wind_cos)) % 360
        return f"{value:.6f}"

    def quality(self) -> tuple[str, str]:
        required_counts = [self.counts[name] for name in MEAN_FIELDS]
        if self.counts["dni"] == 0 or self.counts["dhi"] == 0:
            return "invalid", "DNI and/or DHI has no valid source minute"
        if self.source_rows != 60 or min(required_counts) < 60 or self.precipitation_count < 60:
            return "partial", "one or more variables has fewer than 60 valid source minutes"
        return "complete", ""

    def output(self) -> dict[str, object]:
        quality, note = self.quality()
        return {
            "timestamp_local": self.timestamp_local.strftime("%Y-%m-%dT%H:00:00+06:00"),
            "timestamp_utc": self.timestamp_utc.strftime("%Y-%m-%dT%H:00:00Z"),
            "ghi_wm2": self.mean("ghi"),
            "dni_wm2": self.mean("dni"),
            "dhi_wm2": self.mean("dhi"),
            "temperature_c": self.mean("temperature"),
            "relative_humidity_pct": self.mean("humidity"),
            "cloud_cover_pct": "",
            "wind_speed_ms": self.mean("wind_speed"),
            "wind_direction_deg": self.wind_direction(),
            "precipitation_mm": f"{self.precipitation_sum:.6f}" if self.precipitation_count else "",
            "pressure_hpa": self.mean("pressure"),
            "source_rows": self.source_rows,
            "ghi_valid_minutes": self.counts["ghi"],
            "dni_valid_minutes": self.counts["dni"],
            "dhi_valid_minutes": self.counts["dhi"],
            "temperature_valid_minutes": self.counts["temperature"],
            "humidity_valid_minutes": self.counts["humidity"],
            "wind_valid_minutes": self.counts["wind_speed"],
            "precipitation_valid_minutes": self.precipitation_count,
            "pressure_valid_minutes": self.counts["pressure"],
            "data_filled_minutes": self.data_filled_count,
            "quality_status": quality,
            "quality_notes": note,
        }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def data_lines(path: Path) -> Iterable[str]:
    with path.open("r", encoding="utf-8-sig", newline="") as source:
        for line in source:
            if line.startswith("# JulianTime,"):
                yield line.removeprefix("# ")
                break
        yield from source


def prepare(source_path: Path, output_path: Path, manifest_path: Path) -> None:
    source_hash = sha256(source_path)
    if source_hash != EXPECTED_SHA256:
        raise SystemExit(f"Unexpected source SHA-256: {source_hash}")

    hours: dict[str, Hour] = {}
    source_rows = 0
    first_utc: datetime | None = None
    last_utc: datetime | None = None

    reader = csv.DictReader(data_lines(source_path))
    missing_columns = sorted(set(SOURCE_COLUMNS.values()) - set(reader.fieldnames or []))
    if missing_columns:
        raise SystemExit(f"Missing required source columns: {', '.join(missing_columns)}")

    for row in reader:
        source_rows += 1
        utc = datetime.strptime(row[SOURCE_COLUMNS["timestamp"]], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        local = utc.astimezone(BST)
        local_hour = local.replace(minute=0, second=0, microsecond=0)
        utc_hour = utc.replace(minute=0, second=0, microsecond=0)
        key = local_hour.isoformat()
        accumulator = hours.setdefault(key, Hour(local_hour, utc_hour))
        accumulator.add(row)
        first_utc = first_utc or utc
        last_utc = utc

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(next(iter(hours.values())).output().keys())
    status_counts = {"complete": 0, "partial": 0, "invalid": 0}
    with output_path.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for accumulator in sorted(hours.values(), key=lambda item: item.timestamp_local):
            row = accumulator.output()
            status_counts[str(row["quality_status"])] += 1
            writer.writerow(row)

    output_hash = sha256(output_path)
    manifest = {
        "schema": "agritwin-feni-hourly-manifest-v1",
        "datasetId": "world-bank-esmap-feni-bdfe2-hourly-bst-v1",
        "station": {"id": "BDFE2", "name": "BDFE2 (Feni)", "latitude": 22.80029, "longitude": 91.35819, "elevationM": 5},
        "publisher": "World Bank Group / ESMAP",
        "license": "CC BY 4.0",
        "sourceTimezone": "UTC",
        "applicationTimezone": "Asia/Dhaka",
        "sourceResolution": "1 minute",
        "normalizedResolution": "1 hour",
        "aggregation": {"irradianceTemperatureHumidityWindPressure": "arithmetic mean of valid source minutes", "precipitation": "sum of valid source minutes", "windDirection": "circular mean", "cloudCover": "not measured; retained as null"},
        "sourceRows": source_rows,
        "hourlyRows": len(hours),
        "sourceStartUtc": first_utc.isoformat().replace("+00:00", "Z") if first_utc else None,
        "sourceEndUtc": last_utc.isoformat().replace("+00:00", "Z") if last_utc else None,
        "localStart": min(hours) if hours else None,
        "localEnd": max(hours) if hours else None,
        "completeLocalDayStart": "2017-06-09",
        "completeLocalDayEnd": "2019-09-30",
        "invalidLocalDates": ["2017-07-07", "2017-07-08"],
        "qualityStatusCounts": status_counts,
        "sourceSha256": source_hash,
        "derivativeSha256": output_hash,
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/weather/feni-bdfe2-hourly-bst-v1.csv"))
    parser.add_argument("--manifest", type=Path, default=Path("data/weather/feni-bdfe2-hourly-bst-v1.manifest.json"))
    args = parser.parse_args()
    prepare(args.source, args.output, args.manifest)


if __name__ == "__main__":
    main()
