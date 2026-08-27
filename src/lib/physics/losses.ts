import { clamp } from "./math";
import type {
  EnergyBalanceResult,
  ExplicitLossConfiguration,
  LossStageDomain,
  LossStageResult,
  ParameterSourceCategory,
  SourcedParameter,
} from "./types";

export function applyLossStage(input: {
  id: string;
  label: string;
  domain: LossStageDomain;
  inputPowerW: number;
  parameter: SourcedParameter;
  note?: string;
}): LossStageResult {
  const applied = input.parameter.enabled;
  const fraction = applied ? input.parameter.value / 100 : 0;
  const outputPowerW = applied
    ? Math.max(0, input.inputPowerW * (1 - fraction))
    : input.inputPowerW;
  return {
    id: input.id,
    label: input.label,
    domain: input.domain,
    inputPowerW: input.inputPowerW,
    outputPowerW,
    lossPowerW: input.inputPowerW - outputPowerW,
    lossFraction: fraction,
    applied,
    sourceCategory: input.parameter.sourceCategory,
    note:
      input.note ??
      input.parameter.sourceReference ??
      `${input.parameter.value}${input.parameter.unit}`,
  };
}

export function applyDcLossChain(
  inputPowerW: number,
  configuration: ExplicitLossConfiguration,
): { outputPowerW: number; stages: LossStageResult[] } {
  const definitions: Array<{
    id: string;
    label: string;
    parameter: SourcedParameter;
  }> = [
    { id: "module_quality", label: "Module quality", parameter: configuration.moduleQuality },
    { id: "module_mismatch", label: "Module mismatch", parameter: configuration.moduleMismatch },
    { id: "string_mismatch", label: "String mismatch", parameter: configuration.stringMismatch },
    { id: "dc_ohmic", label: "DC ohmic", parameter: configuration.dcOhmic },
  ];
  const stages: LossStageResult[] = [];
  let powerW = Math.max(0, inputPowerW);
  definitions.forEach((definition) => {
    const stage = applyLossStage({
      ...definition,
      domain: "dc",
      inputPowerW: powerW,
    });
    stages.push(stage);
    powerW = stage.outputPowerW;
  });
  return { outputPowerW: powerW, stages };
}

export function applyAcLossChain(
  inputPowerW: number,
  configuration: ExplicitLossConfiguration,
): { outputPowerW: number; stages: LossStageResult[] } {
  const definitions: Array<{
    id: string;
    label: string;
    domain: LossStageDomain;
    parameter: SourcedParameter;
  }> = [
    { id: "ac_ohmic", label: "AC ohmic", domain: "ac", parameter: configuration.acOhmic },
    { id: "transformer", label: "Transformer", domain: "ac", parameter: configuration.transformer },
    { id: "auxiliary", label: "Auxiliary", domain: "auxiliary", parameter: configuration.auxiliary },
    { id: "availability", label: "Availability/outage", domain: "availability", parameter: configuration.availability },
    { id: "curtailment", label: "Curtailment", domain: "curtailment", parameter: configuration.curtailment },
  ];
  const stages: LossStageResult[] = [];
  let powerW = Math.max(0, inputPowerW);
  definitions.forEach((definition) => {
    const stage = applyLossStage({
      ...definition,
      inputPowerW: powerW,
    });
    stages.push(stage);
    powerW = stage.outputPowerW;
  });
  return { outputPowerW: powerW, stages };
}

export function calculateEnergyBalance(input: {
  inputPowerW: number;
  deliveredPowerW: number;
  stages: LossStageResult[];
  additionalLossPowerW?: number;
}): EnergyBalanceResult {
  const explicitLossPowerW =
    input.stages.reduce((sum, stage) => sum + stage.lossPowerW, 0) +
    (input.additionalLossPowerW ?? 0);
  const balanceResidualW =
    input.inputPowerW - input.deliveredPowerW - explicitLossPowerW;
  const toleranceW = Math.max(1, 0.001 * Math.max(Math.abs(input.inputPowerW), 1));
  return {
    inputPowerW: input.inputPowerW,
    deliveredPowerW: input.deliveredPowerW,
    explicitLossPowerW,
    balanceResidualW,
    toleranceW,
    withinTolerance: Math.abs(balanceResidualW) <= toleranceW,
  };
}

export function sourcedParameter(
  value: number,
  unit: string,
  sourceCategory: ParameterSourceCategory,
  enabled = true,
): SourcedParameter {
  return { value, unit, sourceCategory, enabled };
}

export function boundedLossFraction(percent: number): number {
  return clamp(percent / 100, -1, 1);
}
