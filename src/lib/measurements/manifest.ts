import type {
  MeasurementDatasetManifest,
} from "./contracts";

type UnknownRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function requiredString(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `Measurement manifest is missing ${field}.`,
    );
  }

  return value;
}

function sha256OrNull(
  value: unknown,
  field: string,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const fingerprint =
    requiredString(value, field);

  if (
    !/^[a-f0-9]{64}$/i.test(
      fingerprint,
    )
  ) {
    throw new Error(
      `${field} must be a SHA-256 hexadecimal digest.`,
    );
  }

  return fingerprint.toLowerCase();
}

export function parseMeasurementManifest(
  value: unknown,
): MeasurementDatasetManifest {
  if (!isRecord(value)) {
    throw new Error(
      "Measurement manifest must be an object.",
    );
  }

  if (value.schemaVersion !== 1) {
    throw new Error(
      "Unsupported measurement manifest schema.",
    );
  }

  requiredString(
    value.datasetId,
    "datasetId",
  );
  requiredString(
    value.title,
    "title",
  );
  requiredString(
    value.publisher,
    "publisher",
  );
  requiredString(
    value.officialDatasetId,
    "officialDatasetId",
  );
  requiredString(
    value.officialSourceUrl,
    "officialSourceUrl",
  );
  requiredString(
    value.retrievedAt,
    "retrievedAt",
  );

  if (!isRecord(value.station)) {
    throw new Error(
      "Measurement manifest is missing station.",
    );
  }

  requiredString(
    value.station.id,
    "station.id",
  );
  requiredString(
    value.station.timezone,
    "station.timezone",
  );

  if (
    typeof value.station.latitude !==
      "number" ||
    typeof value.station.longitude !==
      "number"
  ) {
    throw new Error(
      "Measurement station coordinates must be numeric.",
    );
  }

  if (!Array.isArray(value.sensors)) {
    throw new Error(
      "Measurement manifest sensors must be an array.",
    );
  }

  for (
    const [
      index,
      sensor,
    ] of value.sensors.entries()
  ) {
    if (!isRecord(sensor)) {
      throw new Error(
        `sensors[${index}] must be an object.`,
      );
    }

    requiredString(
      sensor.variable,
      `sensors[${index}].variable`,
    );
  }

  if (!Array.isArray(value.resources)) {
    throw new Error(
      "Measurement manifest resources must be an array.",
    );
  }

  for (
    const [
      index,
      resource,
    ] of value.resources.entries()
  ) {
    if (!isRecord(resource)) {
      throw new Error(
        `resources[${index}] must be an object.`,
      );
    }

    requiredString(
      resource.id,
      `resources[${index}].id`,
    );
    requiredString(
      resource.url,
      `resources[${index}].url`,
    );

    const checksum =
      sha256OrNull(
        resource.sha256,
        `resources[${index}].sha256`,
      );

    if (
      resource.acquired === true &&
      checksum === null
    ) {
      throw new Error(
        `Acquired resource ${index} requires a checksum.`,
      );
    }
  }

  return value as unknown as
    MeasurementDatasetManifest;
}
