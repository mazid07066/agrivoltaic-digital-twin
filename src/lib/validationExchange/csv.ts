export type CsvScalar =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface CsvColumn<Row> {
  header: string;
  value: (
    row: Row,
  ) => CsvScalar;
}

function scalarText(
  value: CsvScalar,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value.toString()
      : "";
  }

  return String(value);
}

export function escapeCsvCell(
  value: CsvScalar,
): string {
  const text =
    scalarText(value);

  if (
    !/[",\r\n]/.test(text)
  ) {
    return text;
  }

  return `"${text.replaceAll(
    '"',
    '""',
  )}"`;
}

export function serializeCsv<Row>(
  rows: readonly Row[],
  columns: readonly CsvColumn<Row>[],
): string {
  if (
    columns.length === 0
  ) {
    throw new Error(
      "CSV serialization requires at least one column.",
    );
  }

  const header =
    columns
      .map(
        (column) =>
          escapeCsvCell(
            column.header,
          ),
      )
      .join(",");

  const body =
    rows.map(
      (row) =>
        columns
          .map(
            (column) =>
              escapeCsvCell(
                column.value(
                  row,
                ),
              ),
          )
          .join(","),
    );

  return [
    header,
    ...body,
  ].join("\n") + "\n";
}
