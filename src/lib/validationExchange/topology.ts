import type {
  ValidationElectricalTopologyRow,
} from "./types";

export interface ValidationMpptAssignment {
  inverterIndex: number;
  mpptIndex: number;
  stringCount: number;
  modulesPerString: number;
}

export interface BuildElectricalTopologyInput {
  inverterProfileId: string;
  moduleProfileId: string;
  assignments: readonly ValidationMpptAssignment[];
}

function requirePositiveInteger(
  value: number,
  label: string,
): number {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${label} must be a positive integer.`,
    );
  }

  return value;
}

function requireNonNegativeInteger(
  value: number,
  label: string,
): number {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative integer.`,
    );
  }

  return value;
}

function requireIdentifier(
  value: string,
  label: string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length === 0
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return normalized;
}

export function buildElectricalTopologyRows({
  inverterProfileId,
  moduleProfileId,
  assignments,
}: BuildElectricalTopologyInput):
  ValidationElectricalTopologyRow[] {
  const normalizedInverterId =
    requireIdentifier(
      inverterProfileId,
      "Inverter profile ID",
    );

  const normalizedModuleId =
    requireIdentifier(
      moduleProfileId,
      "Module profile ID",
    );

  const occupiedChannels =
    new Set<string>();

  return assignments.flatMap(
    (
      assignment,
    ): ValidationElectricalTopologyRow[] => {
      const inverterIndex =
        requirePositiveInteger(
          assignment.inverterIndex,
          "Inverter index",
        );

      const mpptIndex =
        requirePositiveInteger(
          assignment.mpptIndex,
          "MPPT index",
        );

      const stringCount =
        requireNonNegativeInteger(
          assignment.stringCount,
          "String count",
        );

      const modulesPerString =
        requirePositiveInteger(
          assignment.modulesPerString,
          "Modules per string",
        );

      const channelKey =
        `${inverterIndex}:${mpptIndex}`;

      if (
        occupiedChannels.has(
          channelKey,
        )
      ) {
        throw new Error(
          `Duplicate topology assignment for inverter ${inverterIndex}, MPPT ${mpptIndex}.`,
        );
      }

      occupiedChannels.add(
        channelKey,
      );

      if (
        stringCount === 0
      ) {
        return [
          {
            inverterIndex,
            inverterProfileId:
              normalizedInverterId,
            mpptIndex,
            stringIndex: 0,
            modulesPerString,
            stringModuleCount: 0,
            moduleProfileId:
              normalizedModuleId,
            allocationStatus:
              "inactive" as const,
          },
        ];
      }

      return Array.from(
        {
          length:
            stringCount,
        },

        (
          _,
          index,
        ) => ({
          inverterIndex,
          inverterProfileId:
            normalizedInverterId,
          mpptIndex,
          stringIndex:
            index + 1,
          modulesPerString,
          stringModuleCount:
            modulesPerString,
          moduleProfileId:
            normalizedModuleId,
          allocationStatus:
            "assigned" as const,
        }),
      );
    },
  );
}
