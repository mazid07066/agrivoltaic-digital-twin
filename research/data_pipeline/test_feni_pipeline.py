import csv
import gzip
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from research.data_pipeline.feni_pipeline import (
    audit_dataset,
    decode_qc_flag,
)


VARIABLE_COLUMNS = [
    (
        "GHI_ThPyra1_Wm-2_avg",
        "GHI_ThPyra1_Wm-2_avg_flag",
    ),
    (
        "DNI_ThPyrh1_Wm-2_avg",
        "DNI_ThPyrh1_Wm-2_avg_flag",
    ),
    (
        "DHI_ThPyra2_Wm-2_avg",
        "DHI_ThPyra2_Wm-2_avg_flag",
    ),
    (
        "Temp_ThHyg1_degC_avg",
        "Temp_ThHyg1_degC_avg_flag",
    ),
    (
        "RH_ThHyg1_per100_avg",
        "RH_ThHyg1_per100_avg_flag",
    ),
    (
        "WindSpeed_Anemo1_ms_avg",
        "WindSpeed_Anemo1_ms_avg_flag",
    ),
    (
        "WindDir_Wvane1_deg_avg360",
        "WindDir_Wvane1_deg_avg360_flag",
    ),
    (
        "Pres_Logger1_hPa_avg",
        "Pres_Logger1_hPa_avg_flag",
    ),
    (
        "Precip_Pluvio1_mm_sum",
        "Precip_Pluvio1_mm_sum_flag",
    ),
]


def create_fixture(
    root: Path,
    rows: list[list[str]],
    malformed: bool = False,
) -> tuple[Path, Path]:
    source = root / "fixture.csv"
    columns = ["JulianTime"]

    for value_column, flag_column in VARIABLE_COLUMNS:
        columns.extend(
            [
                value_column,
                flag_column,
            ]
        )

    with source.open(
        "w",
        encoding="ascii",
        newline="",
    ) as output:
        output.write("# Variables:\n")
        output.write(
            "# " +
            ",".join(columns) +
            "\n"
        )
        writer = csv.writer(output)
        writer.writerows(rows)

        if malformed:
            output.write(
                "malformed,row\n"
            )

    checksum = hashlib.sha256(
        source.read_bytes()
    ).hexdigest()

    manifest = {
        "datasetId": "fixture",
        "station": {
            "id": "BDFE2",
            "timezone": "UTC",
        },
        "resources": [
            {
                "role":
                    "quality_controlled_measurements",
                "sha256": checksum,
                "fileSizeBytes":
                    source.stat().st_size,
            }
        ],
        "scientificBoundaries": {
            "modelTrainingPerformed":
                False,
        },
    }

    manifest_path = root / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest),
        encoding="utf-8",
    )

    return source, manifest_path


class FeniPipelineTests(unittest.TestCase):
    def test_decodes_composite_qc_flags(self):
        self.assertEqual(
            decode_qc_flag("100001"),
            [
                "value_corrected",
                "classified_correct",
            ],
        )
        self.assertEqual(
            decode_qc_flag(
                "1.00000000001e+16"
            ),
            [
                "below_physical_limit",
                "value_corrected",
            ],
        )

    def test_audits_and_writes_bronze_silver(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rows = [
                ["2017-06-08 00:00:00"]
                + ["10", "1"] * 9,
                ["2017-06-08 00:01:00"]
                + ["NaN", "1e20"] * 9,
                ["2017-06-08 00:01:00"]
                + ["11", "1"] * 9,
                ["2017-06-08 00:03:00"]
                + ["12", "100001"] * 9,
            ]
            source, manifest = create_fixture(
                root,
                rows,
                malformed=True,
            )
            report = root / "report.json"
            bronze = root / "bronze.jsonl.gz"
            silver = root / "silver.jsonl.gz"

            result = audit_dataset(
                source,
                manifest,
                report,
                bronze,
                silver,
            )

            self.assertEqual(
                result["coverage"]["sourceRows"],
                5,
            )
            self.assertEqual(
                result["coverage"]["parsedRows"],
                4,
            )
            self.assertEqual(
                result["coverage"]["rejectedRows"],
                1,
            )
            self.assertEqual(
                result["coverage"][
                    "duplicateTimestamps"
                ],
                1,
            )
            self.assertEqual(
                result["coverage"][
                    "missingIntervals"
                ],
                1,
            )
            self.assertEqual(
                result["variables"]["ghi"]["missing"],
                1,
            )
            self.assertTrue(
                result["coverage"][
                    "rowCountReconciled"
                ]
            )

            with gzip.open(
                bronze,
                "rt",
                encoding="utf-8",
            ) as source_file:
                bronze_record = json.loads(
                    source_file.readline()
                )

            with gzip.open(
                silver,
                "rt",
                encoding="utf-8",
            ) as source_file:
                silver_record = json.loads(
                    source_file.readline()
                )

            self.assertEqual(
                bronze_record["values"]["ghi"][
                    "rawQcFlag"
                ],
                "1",
            )
            self.assertEqual(
                silver_record["timestampUtc"],
                "2017-06-08T00:00:00Z",
            )
            self.assertTrue(
                silver_record["timestampLocal"].endswith(
                    "+06:00"
                )
            )
            self.assertEqual(
                silver_record["values"]["ghi"][
                    "normalizedUnit"
                ],
                "W/m2",
            )

    def test_rejects_checksum_mismatch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rows = [
                ["2017-06-08 00:00:00"]
                + ["10", "1"] * 9,
            ]
            source, manifest = create_fixture(
                root,
                rows,
            )
            payload = json.loads(
                manifest.read_text(
                    encoding="utf-8"
                )
            )
            payload["resources"][0][
                "sha256"
            ] = "0" * 64
            manifest.write_text(
                json.dumps(payload),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(
                ValueError,
                "checksum",
            ):
                audit_dataset(
                    source,
                    manifest,
                    root / "report.json",
                )

    def test_reports_out_of_order_rows(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rows = [
                ["2017-06-08 00:01:00"]
                + ["10", "1"] * 9,
                ["2017-06-08 00:00:00"]
                + ["10", "1"] * 9,
            ]
            source, manifest = create_fixture(
                root,
                rows,
            )
            result = audit_dataset(
                source,
                manifest,
                root / "report.json",
            )

            self.assertEqual(
                result["coverage"]["outOfOrderRows"],
                1,
            )

    def test_report_is_deterministic(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rows = [
                ["2017-06-08 00:00:00"]
                + ["10", "1"] * 9,
            ]
            source, manifest = create_fixture(
                root,
                rows,
            )
            first = root / "first.json"
            second = root / "second.json"

            audit_dataset(
                source,
                manifest,
                first,
            )
            audit_dataset(
                source,
                manifest,
                second,
            )

            self.assertEqual(
                first.read_bytes(),
                second.read_bytes(),
            )


if __name__ == "__main__":
    unittest.main()
