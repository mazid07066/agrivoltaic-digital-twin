"use client";

import {
  useRef,
  useState,
} from "react";

import {
  autoImportValidationDataset,
} from "@/lib/validationStudio";

import type {
  ValidationStudioDataset,
  ValidationStudioSourceType,
} from "@/lib/validationStudio";

import styles from "./ValidationDatasetUpload.module.css";

interface Props {
  sourceType:
    ValidationStudioSourceType;

  onDatasetAdded:
    (
      dataset:
        ValidationStudioDataset,
    ) => void;
}

function label(
  source:
    ValidationStudioSourceType,
): string {
  switch (
    source
  ) {
    case "agritwin":
      return "AgriTwin";

    case "pvlib":
      return "PVlib";

    case "simulink":
      return "Simulink";

    case "measured":
      return "Measured";

    case "pvsyst":
      return "PVsyst";

    case "sam":
      return "SAM";

    default:
      return "External";
  }
}

export default function AutoValidationDatasetUpload({
  sourceType,
  onDatasetAdded,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    result,
    setResult,
  ] =
    useState<
      ValidationStudioDataset | null
    >(
      null,
    );

  async function importFile() {
    if (
      !file
    ) {
      setError(
        "Choose a file first.",
      );

      return;
    }

    setLoading(
      true,
    );

    setError(
      null,
    );

    try {
      const dataset =
        await autoImportValidationDataset(
          file,
          sourceType,
        );

      setResult(
        dataset,
      );

      onDatasetAdded(
        dataset,
      );
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Import failed.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <section
      className={
        styles.container
      }
    >
      <div
        className={
          styles.controls
        }
      >
        <div
          className={
            styles.field
          }
        >
          <span>
            Data source
          </span>

          <strong>
            {
              label(
                sourceType,
              )
            }
          </strong>
        </div>

        <div
          className={
            styles.fileArea
          }
        >
          <input
            ref={
              inputRef
            }
            type="file"
            accept=".csv,.xlsx"
            className={
              styles.hiddenInput
            }
            onChange={(
              event,
            ) => {
              setFile(
                event.target
                  .files?.[0] ??
                null,
              );

              setResult(
                null,
              );

              setError(
                null,
              );
            }}
          />

          <button
            type="button"
            className={
              styles.uploadButton
            }
            onClick={() =>
              inputRef
                .current
                ?.click()
            }
          >
            Choose file
          </button>

          <span
            className={
              styles.fileName
            }
          >
            {file?.name ??
              "No file selected"}
          </span>
        </div>

        <button
          type="button"
          className={
            styles.inspectButton
          }
          disabled={
            !file ||
            loading
          }
          onClick={() =>
            void importFile()
          }
        >
          {loading
            ? "Importing..."
            : "Import & Add"}
        </button>
      </div>

      {error && (
        <div
          className={
            styles.error
          }
        >
          {error}
        </div>
      )}

      {result && (
        <div
          className={
            styles.result
          }
        >
          <strong>
            Dataset added
          </strong>

          <div
            className={
              styles.summary
            }
          >
            <div>
              <span>
                Rows
              </span>

              <strong>
                {
                  result
                    .observations
                    .length
                }
              </strong>
            </div>

            <div>
              <span>
                Timezone
              </span>

              <strong>
                {
                  result.timezone
                }
              </strong>
            </div>

            <div>
              <span>
                Interval
              </span>

              <strong>
                {
                  result
                    .intervalMinutes
                }
                {" "}
                min
              </strong>
            </div>

            <div>
              <span>
                Variables
              </span>

              <strong>
                {
                  result.variables
                    .join(
                      ", ",
                    )
                }
              </strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
