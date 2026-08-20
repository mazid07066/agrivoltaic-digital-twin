import "server-only";

import {
  resolve,
  sep,
} from "node:path";

const DATA_ROOT =
  resolve(
    process.cwd(),
    "data",
    "environment",
  );

export function resolveLocalDatasetPath(
  filename: string,
): string {
  if (
    !filename ||
    filename.includes("\0")
  ) {
    throw new Error(
      "Invalid local environmental dataset filename.",
    );
  }

  const resolved =
    resolve(
      DATA_ROOT,
      filename,
    );

  const allowedPrefix =
    `${DATA_ROOT}${sep}`;

  if (
    resolved !== DATA_ROOT &&
    !resolved.startsWith(
      allowedPrefix,
    )
  ) {
    throw new Error(
      "Environmental dataset path escapes the permitted data directory.",
    );
  }

  return resolved;
}
