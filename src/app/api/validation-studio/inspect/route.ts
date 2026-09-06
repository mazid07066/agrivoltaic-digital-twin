import {
  NextResponse,
} from "next/server";

import {
  inspectValidationCsvText,
} from "@/lib/validationStudio/csvImport.server";

import {
  inspectValidationXlsx,
} from "@/lib/validationStudio/xlsxImport.server";

import type {
  ValidationStudioSourceType,
} from "@/lib/validationStudio";

const allowedSources =
  new Set<ValidationStudioSourceType>([
    "agritwin",
    "pvlib",
    "simulink",
    "measured",
    "pvsyst",
    "sam",
    "external",
  ]);

export const runtime =
  "nodejs";

export async function POST(
  request:
    Request,
) {
  try {
    const url =
      new URL(
        request.url,
      );

    const sourceTypeValue =
      url.searchParams.get(
        "sourceType",
      );

    const fileName =
      url.searchParams.get(
        "fileName",
      );

    const sheetValue =
      url.searchParams.get(
        "sheet",
      );

    if (
      !sourceTypeValue ||
      !allowedSources.has(
        sourceTypeValue as
          ValidationStudioSourceType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid validation source type is required.",
        },
        {
          status:
            400,
        },
      );
    }

    if (
      !fileName
    ) {
      return NextResponse.json(
        {
          error:
            "A file name is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const sourceType =
      sourceTypeValue as
        ValidationStudioSourceType;

    const lowerName =
      fileName.toLowerCase();

    const body =
      await request.arrayBuffer();

    if (
      body.byteLength ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Uploaded file is empty.",
        },
        {
          status:
            400,
        },
      );
    }

    if (
      lowerName.endsWith(
        ".csv",
      )
    ) {
      const text =
        new TextDecoder(
          "utf-8",
        ).decode(
          body,
        );

      const inspection =
        await inspectValidationCsvText({
          text,

          fileName,

          sourceType,
        });

      return NextResponse.json({
        format:
          "csv",

        inspection,
      });
    }

    if (
      lowerName.endsWith(
        ".xlsx",
      )
    ) {
      let sheet:
        string | number | null =
        null;

      if (
        sheetValue &&
        sheetValue.trim() !==
          ""
      ) {
        const trimmed =
          sheetValue.trim();

        const numeric =
          Number(
            trimmed,
          );

        sheet =
          Number.isInteger(
            numeric,
          ) &&
          String(
            numeric,
          ) ===
            trimmed
            ? numeric
            : trimmed;
      }

      const workbook =
        Buffer.from(
          body,
        );

      const inspection =
        await inspectValidationXlsx({
          workbook,

          fileName,

          sourceType,

          sheet,
        });

      return NextResponse.json({
        format:
          "xlsx",

        inspection,
      });
    }

    return NextResponse.json(
      {
        error:
          "Unsupported file type. Upload a .csv or .xlsx file.",
      },
      {
        status:
          415,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Validation Studio inspection failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Validation file inspection failed.",
      },
      {
        status:
          400,
      },
    );
  }
}
