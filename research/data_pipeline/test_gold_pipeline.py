import unittest

from research.data_pipeline.gold_pipeline import (
    aggregate_silver_records_15_min,
    aggregate_silver_records_hourly,
    apply_bounded_linear_interpolation,
    assign_chronological_splits,
    build_causal_features,
    build_gold_manifest,
    build_provider_manifest,
    build_synchronized_gold_rows,
    normalize_provider_hourly_records,
    synchronize_hourly_records,
)


VARIABLES = (
    "ghi",
    "dni",
    "dhi",
    "temperature",
    "relativeHumidity",
    "windSpeed",
    "windDirection",
    "pressure",
    "precipitation",
)


def silver_record(
    timestamp: str,
    value: float = 10.0,
    status: str = "valid",
):
    values = {}

    for variable in VARIABLES:
        values[variable] = {
            "value": value,
            "normalizedUnit": "test",
            "qualityStatus": status,
            "rawQcFlag": "1",
            "qcComponents": [],
            "missingValueReason": None,
        }

    return {
        "schemaVersion": 1,
        "datasetId": "fixture",
        "stationId": "BDFE2",
        "sourceFileSha256": "abc123",
        "sourceRowNumber": 1,
        "originalTimestamp": timestamp,
        "timestampUtc": timestamp,
        "timestampLocal": timestamp,
        "values": values,
    }


class GoldAggregationTests(unittest.TestCase):
    def test_aggregates_complete_fifteen_minute_bucket(self):
        records = [
            silver_record(
                f"2017-06-08T00:{minute:02d}:00Z",
                float(minute),
            )
            for minute in range(15)
        ]

        result = aggregate_silver_records_15_min(
            records
        )

        self.assertEqual(len(result), 1)

        bucket = result[0]

        self.assertEqual(
            bucket["timestampUtc"],
            "2017-06-08T00:00:00Z",
        )
        self.assertEqual(
            bucket["intervalSeconds"],
            900,
        )
        self.assertEqual(
            bucket["observedSamples"],
            15,
        )
        self.assertEqual(
            bucket["coverageRatio"],
            1.0,
        )

        self.assertEqual(
            bucket["values"]["ghi"]["value"],
            7.0,
        )

        self.assertEqual(
            bucket["values"]["precipitation"]["value"],
            sum(range(15)),
        )

    def test_preserves_qc_and_partial_coverage(self):
        records = [
            silver_record(
                "2017-06-08T00:00:00Z",
                10.0,
                "valid",
            ),
            silver_record(
                "2017-06-08T00:01:00Z",
                20.0,
                "flagged",
            ),
            silver_record(
                "2017-06-08T00:02:00Z",
                999.0,
                "invalid",
            ),
            silver_record(
                "2017-06-08T00:03:00Z",
                999.0,
                "missing",
            ),
        ]

        result = aggregate_silver_records_15_min(
            records
        )

        ghi = result[0]["values"]["ghi"]

        self.assertEqual(
            result[0]["observedSamples"],
            4,
        )
        self.assertEqual(
            ghi["usableSamples"],
            2,
        )
        self.assertEqual(
            ghi["value"],
            15.0,
        )
        self.assertEqual(
            ghi["qualityCounts"],
            {
                "valid": 1,
                "flagged": 1,
                "invalid": 1,
                "missing": 1,
            },
        )
        self.assertEqual(
            ghi["interpolatedSamples"],
            0,
        )

    def test_uses_circular_mean_for_wind_direction(self):
        first = silver_record(
            "2017-06-08T00:00:00Z",
            1.0,
        )
        second = silver_record(
            "2017-06-08T00:01:00Z",
            1.0,
        )

        first["values"]["windDirection"]["value"] = 350.0
        second["values"]["windDirection"]["value"] = 10.0

        result = aggregate_silver_records_15_min(
            [first, second]
        )

        direction = result[0]["values"][
            "windDirection"
        ]["value"]

        self.assertTrue(
            direction < 1e-9
            or abs(direction - 360.0) < 1e-9
        )

    def test_aligns_buckets_to_absolute_utc_quarter_hours(self):
        records = [
            silver_record(
                "2017-06-08T00:14:00Z"
            ),
            silver_record(
                "2017-06-08T00:15:00Z"
            ),
        ]

        result = aggregate_silver_records_15_min(
            records
        )

        self.assertEqual(
            [
                item["timestampUtc"]
                for item in result
            ],
            [
                "2017-06-08T00:00:00Z",
                "2017-06-08T00:15:00Z",
            ],
        )

    def test_rejects_duplicate_absolute_timestamps(self):
        records = [
            silver_record(
                "2017-06-08T00:00:00Z"
            ),
            silver_record(
                "2017-06-08T00:00:00+00:00"
            ),
        ]

        with self.assertRaisesRegex(
            ValueError,
            "Duplicate Silver timestamp",
        ):
            aggregate_silver_records_15_min(
                records
            )

    def test_rejects_naive_timestamps(self):
        with self.assertRaisesRegex(
            ValueError,
            "timezone-aware",
        ):
            aggregate_silver_records_15_min(
                [
                    silver_record(
                        "2017-06-08T00:00:00"
                    )
                ]
            )

    def test_rejects_non_minute_grid_timestamp(self):
        with self.assertRaisesRegex(
            ValueError,
            "one-minute grid",
        ):
            aggregate_silver_records_15_min(
                [
                    silver_record(
                        "2017-06-08T00:00:30Z"
                    )
                ]
            )

    def test_output_is_deterministic_and_chronological(self):
        later = silver_record(
            "2017-06-08T00:16:00Z",
            20.0,
        )
        earlier = silver_record(
            "2017-06-08T00:01:00Z",
            10.0,
        )

        first = aggregate_silver_records_15_min(
            [later, earlier]
        )
        second = aggregate_silver_records_15_min(
            [earlier, later]
        )

        self.assertEqual(first, second)

        self.assertEqual(
            [
                item["timestampUtc"]
                for item in first
            ],
            [
                "2017-06-08T00:00:00Z",
                "2017-06-08T00:15:00Z",
            ],
        )


class GoldHourlySynchronizationTests(unittest.TestCase):
    def test_aggregates_silver_directly_to_hourly(self):
        records = [
            silver_record(
                f"2017-06-08T00:{minute:02d}:00Z",
                float(minute),
            )
            for minute in range(60)
        ]

        result = aggregate_silver_records_hourly(
            records
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0]["timestampUtc"],
            "2017-06-08T00:00:00Z",
        )
        self.assertEqual(
            result[0]["observedSamples"],
            60,
        )
        self.assertEqual(
            result[0]["coverageRatio"],
            1.0,
        )
        self.assertEqual(
            result[0]["values"]["ghi"]["value"],
            29.5,
        )

    def test_hourly_qc_remains_explicit(self):
        records = [
            silver_record(
                "2017-06-08T00:00:00Z",
                10.0,
                "valid",
            ),
            silver_record(
                "2017-06-08T00:01:00Z",
                20.0,
                "flagged",
            ),
            silver_record(
                "2017-06-08T00:02:00Z",
                999.0,
                "invalid",
            ),
        ]

        result = aggregate_silver_records_hourly(
            records
        )

        ghi = result[0]["values"]["ghi"]

        self.assertEqual(
            ghi["value"],
            15.0,
        )
        self.assertEqual(
            ghi["qualityCounts"]["valid"],
            1,
        )
        self.assertEqual(
            ghi["qualityCounts"]["flagged"],
            1,
        )
        self.assertEqual(
            ghi["qualityCounts"]["invalid"],
            1,
        )
        self.assertEqual(
            ghi["interpolatedSamples"],
            0,
        )

    def test_synchronizes_exact_hourly_intersection(self):
        measured = [
            {
                "timestampUtc":
                    "2017-06-08T00:00:00Z",
                "source": "measured-0",
            },
            {
                "timestampUtc":
                    "2017-06-08T01:00:00Z",
                "source": "measured-1",
            },
            {
                "timestampUtc":
                    "2017-06-08T02:00:00Z",
                "source": "measured-2",
            },
        ]

        provider = [
            {
                "timestampUtc":
                    "2017-06-08T01:00:00Z",
                "source": "provider-1",
            },
            {
                "timestampUtc":
                    "2017-06-08T02:00:00Z",
                "source": "provider-2",
            },
            {
                "timestampUtc":
                    "2017-06-08T03:00:00Z",
                "source": "provider-3",
            },
        ]

        result = synchronize_hourly_records(
            measured,
            provider,
        )

        self.assertEqual(
            result["policy"],
            "exact_utc_timestamp_intersection",
        )
        self.assertEqual(
            result["commonCount"],
            2,
        )
        self.assertEqual(
            result["measuredOnlyCount"],
            1,
        )
        self.assertEqual(
            result["providerOnlyCount"],
            1,
        )
        self.assertEqual(
            result["startTime"],
            "2017-06-08T01:00:00Z",
        )
        self.assertEqual(
            result["endTime"],
            "2017-06-08T02:00:00Z",
        )
        self.assertEqual(
            [
                row["timestampUtc"]
                for row in result["records"]
            ],
            [
                "2017-06-08T01:00:00Z",
                "2017-06-08T02:00:00Z",
            ],
        )

    def test_rejects_provider_non_hour_timestamp(self):
        with self.assertRaisesRegex(
            ValueError,
            "hourly UTC grid",
        ):
            synchronize_hourly_records(
                [
                    {
                        "timestampUtc":
                            "2017-06-08T00:00:00Z"
                    }
                ],
                [
                    {
                        "timestampUtc":
                            "2017-06-08T00:30:00Z"
                    }
                ],
            )

    def test_rejects_duplicate_provider_timestamp(self):
        with self.assertRaisesRegex(
            ValueError,
            "Duplicate provider hourly timestamp",
        ):
            synchronize_hourly_records(
                [],
                [
                    {
                        "timestampUtc":
                            "2017-06-08T00:00:00Z"
                    },
                    {
                        "timestampUtc":
                            "2017-06-08T00:00:00+00:00"
                    },
                ],
            )

    def test_zero_overlap_is_explicit(self):
        result = synchronize_hourly_records(
            [
                {
                    "timestampUtc":
                        "2017-06-08T00:00:00Z"
                }
            ],
            [
                {
                    "timestampUtc":
                        "2017-06-08T01:00:00Z"
                }
            ],
        )

        self.assertEqual(
            result["commonCount"],
            0,
        )
        self.assertIsNone(
            result["startTime"]
        )
        self.assertIsNone(
            result["endTime"]
        )
        self.assertEqual(
            result["records"],
            [],
        )




class ProviderArtifactTests(unittest.TestCase):
    def provider_records(self):
        return [
            {
                "timestampUtc":
                    "2017-06-08T01:00:00Z",
                "values": {
                    "ghiWm2": 120.0,
                    "temperatureC": 28.0,
                },
            },
            {
                "timestampUtc":
                    "2017-06-08T00:00:00Z",
                "values": {
                    "ghiWm2": 0.0,
                    "temperatureC": 27.0,
                },
            },
        ]

    def test_normalizes_provider_artifact_deterministically(self):
        first = normalize_provider_hourly_records(
            self.provider_records(),
            provider="Open-Meteo",
            provider_model=None,
            requested_latitude=22.80029,
            requested_longitude=91.35819,
            resolved_latitude=22.8,
            resolved_longitude=91.36,
            elevation_m=5.0,
        )

        second = normalize_provider_hourly_records(
            list(
                reversed(
                    self.provider_records()
                )
            ),
            provider="Open-Meteo",
            provider_model=None,
            requested_latitude=22.80029,
            requested_longitude=91.35819,
            resolved_latitude=22.8,
            resolved_longitude=91.36,
            elevation_m=5.0,
        )

        self.assertEqual(
            first,
            second,
        )
        self.assertEqual(
            first["recordCount"],
            2,
        )
        self.assertEqual(
            first["startTime"],
            "2017-06-08T00:00:00Z",
        )
        self.assertEqual(
            first["endTime"],
            "2017-06-08T01:00:00Z",
        )
        self.assertTrue(
            first["fingerprint"].startswith(
                "sha256:"
            )
        )

    def test_provider_artifact_rejects_duplicate_timestamp(self):
        records = [
            {
                "timestampUtc":
                    "2017-06-08T00:00:00Z",
                "values": {},
            },
            {
                "timestampUtc":
                    "2017-06-08T00:00:00+00:00",
                "values": {},
            },
        ]

        with self.assertRaisesRegex(
            ValueError,
            "Duplicate provider hourly timestamp",
        ):
            normalize_provider_hourly_records(
                records,
                provider="Open-Meteo",
                provider_model=None,
                requested_latitude=22.80029,
                requested_longitude=91.35819,
            )

    def test_provider_artifact_rejects_non_finite_values(self):
        with self.assertRaisesRegex(
            ValueError,
            "finite numeric",
        ):
            normalize_provider_hourly_records(
                [
                    {
                        "timestampUtc":
                            "2017-06-08T00:00:00Z",
                        "values": {
                            "ghiWm2":
                                float("nan"),
                        },
                    }
                ],
                provider="Open-Meteo",
                provider_model=None,
                requested_latitude=22.80029,
                requested_longitude=91.35819,
            )

    def test_builds_reproducible_provider_manifest(self):
        artifact = normalize_provider_hourly_records(
            self.provider_records(),
            provider="Open-Meteo",
            provider_model=None,
            requested_latitude=22.80029,
            requested_longitude=91.35819,
        )

        request = {
            "source": "open_meteo",
            "mode": "historical",
            "latitude": 22.80029,
            "longitude": 91.35819,
            "startDate": "2017-06-08",
            "endDate": "2017-06-09",
            "timezone": "UTC",
        }

        source_identity = {
            "provider": "Open-Meteo",
            "endpointClass":
                "historical_archive",
        }

        first = build_provider_manifest(
            artifact,
            request=request,
            source_identity=
                source_identity,
        )

        second = build_provider_manifest(
            artifact,
            request=request,
            source_identity=
                source_identity,
        )

        self.assertEqual(
            first,
            second,
        )
        self.assertEqual(
            first["scientificPolicy"][
                "timestampMatching"
            ],
            "exact",
        )
        self.assertFalse(
            first["scientificPolicy"][
                "interpolationPerformed"
            ]
        )
        self.assertFalse(
            first["scientificPolicy"][
                "modelTrainingPerformed"
            ]
        )
        self.assertTrue(
            first["manifestFingerprint"].startswith(
                "sha256:"
            )
        )




class SynchronizedGoldSchemaTests(unittest.TestCase):
    def measured_hour(self, timestamp, value=10.0):
        silver = [
            silver_record(
                timestamp,
                value,
            )
        ]

        return aggregate_silver_records_hourly(
            silver
        )[0]

    def provider_hour(self, timestamp, value=20.0):
        artifact = normalize_provider_hourly_records(
            [
                {
                    "timestampUtc":
                        timestamp,
                    "values": {
                        "ghiWm2":
                            value,
                        "temperatureC":
                            28.0,
                    },
                }
            ],
            provider="Open-Meteo",
            provider_model=None,
            requested_latitude=22.80029,
            requested_longitude=91.35819,
        )

        return artifact["records"][0]

    def test_builds_canonical_synchronized_gold_row(self):
        measured = self.measured_hour(
            "2017-06-08T00:00:00Z",
            10.0,
        )

        provider = self.provider_hour(
            "2017-06-08T00:00:00Z",
            20.0,
        )

        synchronized = synchronize_hourly_records(
            [measured],
            [provider],
        )

        rows = build_synchronized_gold_rows(
            synchronized
        )

        self.assertEqual(
            len(rows),
            1,
        )

        row = rows[0]

        self.assertEqual(
            row["timestampUtc"],
            "2017-06-08T00:00:00Z",
        )

        self.assertEqual(
            row["schema"],
            "agritwin-phase11-synchronized-gold-row-v1",
        )

        self.assertEqual(
            row["measured"]["ghi"]["value"],
            10.0,
        )

        self.assertEqual(
            row["provider"]["ghiWm2"]["value"],
            20.0,
        )

        self.assertEqual(
            row["measured"]["ghi"]["state"],
            "observed",
        )

        self.assertFalse(
            row["cleaning"][
                "interpolationPerformed"
            ]
        )

    def test_preserves_measured_qc_and_coverage(self):
        measured = self.measured_hour(
            "2017-06-08T00:00:00Z",
            10.0,
        )

        provider = self.provider_hour(
            "2017-06-08T00:00:00Z",
            20.0,
        )

        rows = build_synchronized_gold_rows(
            synchronize_hourly_records(
                [measured],
                [provider],
            )
        )

        ghi = rows[0]["measured"]["ghi"]

        self.assertEqual(
            ghi["expectedSamples"],
            60,
        )

        self.assertEqual(
            ghi["observedSamples"],
            1,
        )

        self.assertEqual(
            ghi["usableSamples"],
            1,
        )

        self.assertEqual(
            ghi["qualityCounts"]["valid"],
            1,
        )

        self.assertFalse(
            ghi["interpolated"]
        )

    def test_null_values_are_explicitly_unavailable(self):
        measured = self.measured_hour(
            "2017-06-08T00:00:00Z",
            10.0,
        )

        measured["values"]["ghi"]["value"] = None

        provider = self.provider_hour(
            "2017-06-08T00:00:00Z",
            20.0,
        )

        rows = build_synchronized_gold_rows(
            synchronize_hourly_records(
                [measured],
                [provider],
            )
        )

        self.assertEqual(
            rows[0]["measured"]["ghi"]["state"],
            "unavailable",
        )

        self.assertIsNone(
            rows[0]["measured"]["ghi"]["value"]
        )

    def test_rejects_non_chronological_synchronized_rows(self):
        measured_0 = self.measured_hour(
            "2017-06-08T00:00:00Z"
        )
        measured_1 = self.measured_hour(
            "2017-06-08T01:00:00Z"
        )

        provider_0 = self.provider_hour(
            "2017-06-08T00:00:00Z"
        )
        provider_1 = self.provider_hour(
            "2017-06-08T01:00:00Z"
        )

        malformed = {
            "policy":
                "exact_utc_timestamp_intersection",
            "records": [
                {
                    "timestampUtc":
                        "2017-06-08T01:00:00Z",
                    "measured":
                        measured_1,
                    "provider":
                        provider_1,
                },
                {
                    "timestampUtc":
                        "2017-06-08T00:00:00Z",
                    "measured":
                        measured_0,
                    "provider":
                        provider_0,
                },
            ],
        }

        with self.assertRaisesRegex(
            ValueError,
            "strictly chronological",
        ):
            build_synchronized_gold_rows(
                malformed
            )

    def test_rejects_wrong_synchronization_policy(self):
        with self.assertRaisesRegex(
            ValueError,
            "Unsupported synchronization policy",
        ):
            build_synchronized_gold_rows(
                {
                    "policy":
                        "nearest_neighbor",
                    "records": [],
                }
            )




class BoundedInterpolationTests(unittest.TestCase):
    def row(
        self,
        timestamp,
        temperature,
        state="observed",
    ):
        return {
            "schema":
                "agritwin-phase11-synchronized-gold-row-v1",
            "timestampUtc":
                timestamp,
            "intervalSeconds":
                3600,
            "measured": {
                "temperature": {
                    "value":
                        temperature,
                    "state":
                        state,
                    "interpolated":
                        False,
                    "interpolationMethod":
                        None,
                }
            },
            "provider": {},
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

    def test_interpolation_is_disabled_by_default(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                20.0,
            ),
            self.row(
                "2017-06-08T01:00:00Z",
                None,
                "unavailable",
            ),
            self.row(
                "2017-06-08T02:00:00Z",
                24.0,
            ),
        ]

        result = (
            apply_bounded_linear_interpolation(
                rows,
                side="measured",
                variable="temperature",
            )
        )

        self.assertEqual(
            result["interpolatedValues"],
            0,
        )

        self.assertIsNone(
            result["rows"][1][
                "measured"
            ]["temperature"]["value"]
        )

    def test_interpolates_one_internal_hour_when_enabled(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                20.0,
            ),
            self.row(
                "2017-06-08T01:00:00Z",
                None,
                "unavailable",
            ),
            self.row(
                "2017-06-08T02:00:00Z",
                24.0,
            ),
        ]

        result = (
            apply_bounded_linear_interpolation(
                rows,
                side="measured",
                variable="temperature",
                enabled=True,
                max_gap_hours=1,
            )
        )

        target = result["rows"][1][
            "measured"
        ]["temperature"]

        self.assertEqual(
            target["value"],
            22.0,
        )

        self.assertEqual(
            target["state"],
            "interpolated",
        )

        self.assertTrue(
            target["interpolated"]
        )

        self.assertEqual(
            result["interpolatedValues"],
            1,
        )

        self.assertTrue(
            result["rows"][1][
                "cleaning"
            ]["interpolationPerformed"]
        )

    def test_does_not_extrapolate_edge_gap(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                None,
                "unavailable",
            ),
            self.row(
                "2017-06-08T01:00:00Z",
                22.0,
            ),
        ]

        result = (
            apply_bounded_linear_interpolation(
                rows,
                side="measured",
                variable="temperature",
                enabled=True,
            )
        )

        self.assertEqual(
            result["interpolatedValues"],
            0,
        )

        self.assertIsNone(
            result["rows"][0][
                "measured"
            ]["temperature"]["value"]
        )

    def test_does_not_fill_gap_above_bound(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                20.0,
            ),
            self.row(
                "2017-06-08T01:00:00Z",
                None,
                "unavailable",
            ),
            self.row(
                "2017-06-08T02:00:00Z",
                None,
                "unavailable",
            ),
            self.row(
                "2017-06-08T03:00:00Z",
                26.0,
            ),
        ]

        result = (
            apply_bounded_linear_interpolation(
                rows,
                side="measured",
                variable="temperature",
                enabled=True,
                max_gap_hours=1,
            )
        )

        self.assertEqual(
            result["interpolatedValues"],
            0,
        )

    def test_does_not_interpolate_across_timestamp_gap(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                20.0,
            ),
            self.row(
                "2017-06-08T02:00:00Z",
                None,
                "unavailable",
            ),
            self.row(
                "2017-06-08T03:00:00Z",
                24.0,
            ),
        ]

        result = (
            apply_bounded_linear_interpolation(
                rows,
                side="measured",
                variable="temperature",
                enabled=True,
                max_gap_hours=1,
            )
        )

        self.assertEqual(
            result["interpolatedValues"],
            0,
        )

    def test_forbids_unapproved_variable(self):
        with self.assertRaisesRegex(
            ValueError,
            "not approved",
        ):
            apply_bounded_linear_interpolation(
                [],
                side="measured",
                variable="precipitation",
                enabled=True,
            )

    def test_does_not_mutate_source_rows(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                20.0,
            ),
            self.row(
                "2017-06-08T01:00:00Z",
                None,
                "unavailable",
            ),
            self.row(
                "2017-06-08T02:00:00Z",
                24.0,
            ),
        ]

        result = (
            apply_bounded_linear_interpolation(
                rows,
                side="measured",
                variable="temperature",
                enabled=True,
            )
        )

        self.assertEqual(
            result["rows"][1][
                "measured"
            ]["temperature"]["value"],
            22.0,
        )

        self.assertIsNone(
            rows[1][
                "measured"
            ]["temperature"]["value"]
        )




class CausalFeatureTests(unittest.TestCase):
    def row(
        self,
        timestamp,
        value,
    ):
        return {
            "schema":
                "agritwin-phase11-synchronized-gold-row-v1",
            "timestampUtc":
                timestamp,
            "intervalSeconds":
                3600,
            "measured": {
                "temperature": {
                    "value":
                        value,
                    "state":
                        "observed"
                        if value is not None
                        else "unavailable",
                    "interpolated":
                        False,
                    "interpolationMethod":
                        None,
                }
            },
            "provider": {},
            "cleaning": {
                "interpolationPerformed":
                    False,
            },
        }

    def test_lags_use_only_past_rows(self):
        rows = [
            self.row(
                f"2017-06-08T{hour:02d}:00:00Z",
                float(hour),
            )
            for hour in range(8)
        ]

        featured = build_causal_features(
            rows,
            lag_hours=(1, 3),
            rolling_hours=(3,),
        )

        self.assertIsNone(
            featured[0]["features"][
                "lagFeatures"
            ]["lag1h"]
        )

        self.assertEqual(
            featured[4]["features"][
                "lagFeatures"
            ]["lag1h"],
            3.0,
        )

        self.assertEqual(
            featured[4]["features"][
                "lagFeatures"
            ]["lag3h"],
            1.0,
        )

    def test_rolling_features_are_trailing_only(self):
        rows = [
            self.row(
                f"2017-06-08T{hour:02d}:00:00Z",
                value,
            )
            for hour, value in enumerate(
                [
                    10.0,
                    20.0,
                    30.0,
                    1000.0,
                ]
            )
        ]

        featured = build_causal_features(
            rows,
            lag_hours=(1,),
            rolling_hours=(3,),
        )

        at_two = featured[2][
            "features"
        ]["rollingFeatures"][
            "trailing3h"
        ]

        self.assertEqual(
            at_two["mean"],
            20.0,
        )

        self.assertEqual(
            at_two["min"],
            10.0,
        )

        self.assertEqual(
            at_two["max"],
            30.0,
        )

        # Future value at index 3 must not affect index 2.
        self.assertNotEqual(
            at_two["mean"],
            350.0,
        )

    def test_missing_values_do_not_create_future_leakage(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                10.0,
            ),
            self.row(
                "2017-06-08T01:00:00Z",
                None,
            ),
            self.row(
                "2017-06-08T02:00:00Z",
                30.0,
            ),
        ]

        featured = build_causal_features(
            rows,
            lag_hours=(1,),
            rolling_hours=(3,),
        )

        self.assertIsNone(
            featured[2]["features"][
                "lagFeatures"
            ]["lag1h"]
        )

        rolling = featured[2][
            "features"
        ]["rollingFeatures"][
            "trailing3h"
        ]

        self.assertEqual(
            rolling["count"],
            2,
        )

        self.assertEqual(
            rolling["mean"],
            20.0,
        )

    def test_generates_cyclical_and_solar_features(self):
        featured = build_causal_features(
            [
                self.row(
                    "2017-06-08T06:00:00Z",
                    25.0,
                )
            ],
            lag_hours=(1,),
            rolling_hours=(1,),
        )

        features = featured[0][
            "features"
        ]

        self.assertEqual(
            features["localHour"],
            12,
        )

        self.assertTrue(
            -1.0
            <= features["hourSin"]
            <= 1.0
        )

        self.assertTrue(
            -90.0
            <= features[
                "solarElevationDeg"
            ]
            <= 90.0
        )

        self.assertFalse(
            features["causalPolicy"][
                "futureRowsUsed"
            ]
        )

        self.assertFalse(
            features["causalPolicy"][
                "centeredWindowsUsed"
            ]
        )

    def test_rejects_non_contiguous_hourly_rows(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                20.0,
            ),
            self.row(
                "2017-06-08T02:00:00Z",
                22.0,
            ),
        ]

        with self.assertRaisesRegex(
            ValueError,
            "contiguous hourly",
        ):
            build_causal_features(
                rows
            )

    def test_feature_generation_does_not_mutate_input(self):
        rows = [
            self.row(
                "2017-06-08T00:00:00Z",
                20.0,
            )
        ]

        featured = build_causal_features(
            rows,
            lag_hours=(1,),
            rolling_hours=(1,),
        )

        self.assertIn(
            "features",
            featured[0],
        )

        self.assertNotIn(
            "features",
            rows[0],
        )




class ChronologicalSplitTests(unittest.TestCase):
    def rows(self, count):
        return [
            {
                "timestampUtc":
                    (
                        "2017-06-08T"
                        f"{hour:02d}:00:00Z"
                    ),
                "features": {},
            }
            for hour in range(count)
        ]

    def test_assigns_contiguous_chronological_splits(self):
        result = assign_chronological_splits(
            self.rows(20),
            train_fraction=0.70,
            validation_fraction=0.15,
            test_fraction=0.15,
        )

        labels = [
            row["split"]["label"]
            for row in result["rows"]
        ]

        self.assertEqual(
            labels[:14],
            ["train"] * 14,
        )

        self.assertEqual(
            labels[14:17],
            ["validation"] * 3,
        )

        self.assertEqual(
            labels[17:],
            ["test"] * 3,
        )

        self.assertEqual(
            result["boundaries"]["train"][
                "endTime"
            ],
            "2017-06-08T13:00:00Z",
        )

        self.assertEqual(
            result["boundaries"]["validation"][
                "startTime"
            ],
            "2017-06-08T14:00:00Z",
        )

        self.assertEqual(
            result["boundaries"]["test"][
                "startTime"
            ],
            "2017-06-08T17:00:00Z",
        )

    def test_split_policy_has_no_randomization_or_training(self):
        result = assign_chronological_splits(
            self.rows(10),
            train_fraction=0.6,
            validation_fraction=0.2,
            test_fraction=0.2,
        )

        policy = result["policy"]

        self.assertFalse(
            policy["randomShuffle"]
        )

        self.assertFalse(
            policy["futureLeakageAllowed"]
        )

        self.assertFalse(
            policy["modelTrainingPerformed"]
        )

    def test_rejects_fraction_sum_mismatch(self):
        with self.assertRaisesRegex(
            ValueError,
            "sum to 1",
        ):
            assign_chronological_splits(
                self.rows(10),
                train_fraction=0.7,
                validation_fraction=0.2,
                test_fraction=0.2,
            )

    def test_rejects_non_chronological_rows(self):
        rows = self.rows(4)

        rows[1], rows[2] = (
            rows[2],
            rows[1],
        )

        with self.assertRaisesRegex(
            ValueError,
            "strictly chronological",
        ):
            assign_chronological_splits(
                rows
            )

    def test_rejects_too_few_rows(self):
        with self.assertRaisesRegex(
            ValueError,
            "At least three",
        ):
            assign_chronological_splits(
                self.rows(2)
            )

    def test_small_dataset_retains_all_three_splits(self):
        result = assign_chronological_splits(
            self.rows(3)
        )

        labels = [
            row["split"]["label"]
            for row in result["rows"]
        ]

        self.assertEqual(
            labels,
            [
                "train",
                "validation",
                "test",
            ],
        )

    def test_does_not_mutate_source_rows(self):
        rows = self.rows(10)

        result = assign_chronological_splits(
            rows
        )

        self.assertIn(
            "split",
            result["rows"][0],
        )

        self.assertNotIn(
            "split",
            rows[0],
        )




class GoldManifestTests(unittest.TestCase):
    def rows(self):
        return [
            {
                "timestampUtc":
                    "2017-06-08T00:00:00Z",
                "measured": {},
                "provider": {},
                "features": {},
                "split": {
                    "label": "train",
                },
            },
            {
                "timestampUtc":
                    "2017-06-08T01:00:00Z",
                "measured": {},
                "provider": {},
                "features": {},
                "split": {
                    "label": "validation",
                },
            },
            {
                "timestampUtc":
                    "2017-06-08T02:00:00Z",
                "measured": {},
                "provider": {},
                "features": {},
                "split": {
                    "label": "test",
                },
            },
        ]

    def manifest(self, rows=None):
        if rows is None:
            rows = self.rows()

        return build_gold_manifest(
            rows,
            measurement_source={
                "datasetId":
                    "world-bank-esmap-feni-qc-v1",
                "sourceSha256":
                    "abc123",
                "stationId":
                    "BDFE2",
            },
            provider_manifest={
                "schema":
                    "agritwin-phase11-provider-manifest-v1",
                "provider":
                    "Open-Meteo",
                "artifactFingerprint":
                    "sha256:provider",
            },
            synchronization_policy={
                "method":
                    "exact_utc_timestamp_intersection",
                "interpolationPerformed":
                    False,
            },
            cleaning_policy={
                "defaultInterpolationEnabled":
                    False,
                "maxGapHours":
                    1,
            },
            feature_policy={
                "lags":
                    [1, 3, 6, 24],
                "rolling":
                    [3, 6, 24],
                "futureRowsUsed":
                    False,
            },
            split_policy={
                "method":
                    "contiguous_chronological",
                "train":
                    0.70,
                "validation":
                    0.15,
                "test":
                    0.15,
            },
        )

    def test_builds_deterministic_gold_manifest(self):
        first = self.manifest()
        second = self.manifest()

        self.assertEqual(
            first,
            second,
        )

        self.assertTrue(
            first["goldFingerprint"].startswith(
                "sha256:"
            )
        )

        self.assertTrue(
            first["rowsFingerprint"].startswith(
                "sha256:"
            )
        )

    def test_manifest_records_phase11_scientific_boundaries(self):
        manifest = self.manifest()

        boundaries = manifest[
            "scientificBoundaries"
        ]

        self.assertFalse(
            boundaries[
                "modelTrainingPerformed"
            ]
        )

        self.assertFalse(
            boundaries[
                "extrapolationAllowed"
            ]
        )

        self.assertFalse(
            boundaries[
                "nearestNeighbourTimestampMatching"
            ]
        )

        self.assertFalse(
            boundaries[
                "futureFeatureLeakageAllowed"
            ]
        )

    def test_manifest_records_coverage(self):
        manifest = self.manifest()

        self.assertEqual(
            manifest["coverage"]["rowCount"],
            3,
        )

        self.assertEqual(
            manifest["coverage"]["startTime"],
            "2017-06-08T00:00:00Z",
        )

        self.assertEqual(
            manifest["coverage"]["endTime"],
            "2017-06-08T02:00:00Z",
        )

    def test_gold_fingerprint_changes_when_rows_change(self):
        first = self.manifest()

        rows = self.rows()
        rows[1]["measured"] = {
            "temperature": {
                "value": 25.0,
            }
        }

        second = self.manifest(
            rows
        )

        self.assertNotEqual(
            first["goldFingerprint"],
            second["goldFingerprint"],
        )

        self.assertNotEqual(
            first["rowsFingerprint"],
            second["rowsFingerprint"],
        )

    def test_gold_fingerprint_changes_when_policy_changes(self):
        first = self.manifest()

        second = build_gold_manifest(
            self.rows(),
            measurement_source={
                "datasetId":
                    "world-bank-esmap-feni-qc-v1",
                "sourceSha256":
                    "abc123",
                "stationId":
                    "BDFE2",
            },
            provider_manifest={
                "schema":
                    "agritwin-phase11-provider-manifest-v1",
                "provider":
                    "Open-Meteo",
                "artifactFingerprint":
                    "sha256:provider",
            },
            synchronization_policy={
                "method":
                    "exact_utc_timestamp_intersection",
                "interpolationPerformed":
                    False,
            },
            cleaning_policy={
                "defaultInterpolationEnabled":
                    False,
                "maxGapHours":
                    2,
            },
            feature_policy={
                "lags":
                    [1, 3, 6, 24],
                "rolling":
                    [3, 6, 24],
                "futureRowsUsed":
                    False,
            },
            split_policy={
                "method":
                    "contiguous_chronological",
                "train":
                    0.70,
                "validation":
                    0.15,
                "test":
                    0.15,
            },
        )

        self.assertNotEqual(
            first["goldFingerprint"],
            second["goldFingerprint"],
        )

    def test_rejects_non_chronological_manifest_rows(self):
        rows = self.rows()

        rows[0], rows[1] = (
            rows[1],
            rows[0],
        )

        with self.assertRaisesRegex(
            ValueError,
            "strictly chronological",
        ):
            self.manifest(
                rows
            )




if __name__ == "__main__":
    unittest.main()
