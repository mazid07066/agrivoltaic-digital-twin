import {
  createHash,
} from "node:crypto";

function stableNormalize(
  value: unknown,
): unknown {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const entries =
      Object.entries(
        value as Record<
          string,
          unknown
        >,
      ).sort(
        ([first], [second]) =>
          first.localeCompare(
            second,
          ),
      );

    return Object.fromEntries(
      entries.map(
        ([
          key,
          entryValue,
        ]) => [
          key,
          stableNormalize(
            entryValue,
          ),
        ],
      ),
    );
  }

  return value;
}

export function createExecutionFingerprint(
  value: unknown,
): string {
  const serialized =
    JSON.stringify(
      stableNormalize(
        value,
      ),
    );

  const digest =
    createHash(
      "sha256",
    )
      .update(
        serialized,
        "utf8",
      )
      .digest(
        "hex",
      );

  return `sha256:${digest}`;
}
