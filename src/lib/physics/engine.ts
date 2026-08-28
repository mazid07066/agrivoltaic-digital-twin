import { calculateIam } from "./iam";
import { calculateFittedInverterConversion } from "./inverter";
import { calculatePlaneOfArrayIrradiance } from "./irradiance";
import {
  applyAcLossChain,
  applyDcLossChain,
  applyLossStage,
  calculateEnergyBalance,
} from "./losses";
import { clamp } from "./math";
import { calculateGeometricRowShading } from "./shading";
import {
  calculateColdVoc,
  calculateModuleOperatingPoint,
} from "./singleDiode";
import {
  createStringOperatingPoints,
  evaluateDynamicMppts,
} from "./stringMppt";
import { calculateSpaEquivalentSolarPosition } from "./solar";
import { calculateCellTemperature } from "./thermal";
import { calculateSingleAxisTracker } from "./tracker";
import type {
  LossStageResult,
  PhysicsModelConfiguration,
  PhysicsTimestepResult,
} from "./types";

export interface PhysicsTimestepInput {
  timestamp: Date | string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationM?: number;
  ghiWm2: number;
  dniWm2: number;
  dhiWm2: number;
  ambientTemperatureC: number;
  windSpeedMs: number;
  relativeHumidityPercent?: number;
  rainMm?: number;
  rowCount: number;
  rowPitchM: number;
  collectorWidthM: number;
  clearanceM: number;
  fixedTiltDeg: number;
  fixedAzimuthDeg: number;
  maximumTrackerAngleDeg: number;
  groundCoverageRatio: number;
  groundAlbedo: number;
  moduleCount: number;
  modulesPerString: number;
  stringsPerInverter: number;
  inverterCount: number;
  mpptCountPerInverter: number;
  maxStringsPerMppt: number;
  mpptStringAllocation?: number[] | null;
  mppVoltageMinV: number;
  mppVoltageMaxV: number;
  maxInputVoltageV: number;
  maxOperatingCurrentPerMpptA: number;
  maxShortCircuitCurrentPerMpptA: number;
  ratedAcPowerPerInverterW: number;
  module: {
    pmaxW: number;
    vmppV: number;
    imppA: number;
    vocV: number;
    iscA: number;
    tempCoeffPmaxPercentPerC: number;
    tempCoeffVocPercentPerC: number;
    tempCoeffIscPercentPerC: number;
    noctC: number;
    efficiencyFraction: number;
    cellsInSeries?: number;
  };
  configuration: PhysicsModelConfiguration;
  inverterAvailability?: boolean[];
  gridAvailable?: boolean;
}

function dayOfYear(timestamp: Date): number {
  const start = Date.UTC(timestamp.getUTCFullYear(), 0, 0);
  return Math.floor((timestamp.getTime() - start) / 86_400_000);
}

function opticalLossStage(input: {
  unsoiledPowerW: number;
  soiledPowerW: number;
  configuration: PhysicsModelConfiguration;
}): LossStageResult {
  const lossPowerW = input.unsoiledPowerW - input.soiledPowerW;
  return {
    id: "soiling",
    label: "Soiling",
    domain: "optical",
    inputPowerW: input.unsoiledPowerW,
    outputPowerW: input.soiledPowerW,
    lossPowerW,
    lossFraction:
      input.unsoiledPowerW > 0 ? lossPowerW / input.unsoiledPowerW : 0,
    applied: input.configuration.losses.soiling.enabled,
    sourceCategory: input.configuration.losses.soiling.sourceCategory,
    note: `${input.configuration.losses.soiling.value}% irradiance-domain assumption`,
  };
}

function mpptLossStage(inputPowerW: number, outputPowerW: number): LossStageResult {
  return {
    id: "mppt_constraints",
    label: "MPPT operating constraints",
    domain: "mppt",
    inputPowerW,
    outputPowerW,
    lossPowerW: inputPowerW - outputPowerW,
    lossFraction: inputPowerW > 0 ? (inputPowerW - outputPowerW) / inputPowerW : 0,
    applied: true,
    sourceCategory: "manufacturer",
    note: "Dynamic voltage/current operating-window enforcement",
  };
}

function fixedLossStage(input: {
  id: string;
  label: string;
  domain: LossStageResult["domain"];
  inputPowerW: number;
  outputPowerW: number;
  sourceCategory: LossStageResult["sourceCategory"];
  note: string;
}): LossStageResult {
  return {
    ...input,
    lossPowerW: input.inputPowerW - input.outputPowerW,
    lossFraction:
      input.inputPowerW > 0
        ? (input.inputPowerW - input.outputPowerW) / input.inputPowerW
        : 0,
    applied: true,
  };
}

export function simulatePhysicsTimestep(
  input: PhysicsTimestepInput,
): PhysicsTimestepResult {
  const timestamp =
    input.timestamp instanceof Date ? input.timestamp : new Date(input.timestamp);
  const solar = calculateSpaEquivalentSolarPosition({
    timestamp,
    latitudeDeg: input.latitudeDeg,
    longitudeDeg: input.longitudeDeg,
    elevationM: input.elevationM,
    ambientTemperatureC: input.ambientTemperatureC,
  });
  const tracker = calculateSingleAxisTracker({
    solar,
    mode: input.configuration.trackingModel,
    fixedTiltDeg: input.fixedTiltDeg,
    fixedAzimuthDeg: input.fixedAzimuthDeg,
    axisTiltDeg: input.configuration.axisTiltDeg,
    axisAzimuthDeg: input.configuration.axisAzimuthDeg,
    maximumRotationDeg: input.maximumTrackerAngleDeg,
    groundCoverageRatio: input.groundCoverageRatio,
    backtrackingEnabled: input.configuration.backtrackingEnabled,
    crossAxisSlopeDeg: input.configuration.crossAxisSlopeDeg,
    stowAngleDeg: input.configuration.stowAngleDeg,
    measuredAngleDeg: input.configuration.measuredTrackerAngleDeg,
  });
  const irradiance = calculatePlaneOfArrayIrradiance({
    model: input.configuration.irradianceModel,
    solar,
    surfaceTiltDeg: tracker.surfaceTiltDeg,
    surfaceAzimuthDeg: tracker.surfaceAzimuthDeg,
    ghiWm2: input.ghiWm2,
    dniWm2: input.dniWm2,
    dhiWm2: input.dhiWm2,
    groundAlbedo: input.groundAlbedo,
    dayOfYear: dayOfYear(timestamp),
    elevationM: input.elevationM,
  });
  const iam = calculateIam(
    input.configuration.iamModel,
    irradiance,
    input.configuration.martinRuizAr,
  );
  const shading = calculateGeometricRowShading({
    rowCount: input.rowCount,
    rowPitchM: input.rowPitchM,
    collectorWidthM: input.collectorWidthM,
    clearanceM: input.clearanceM,
    surfaceTiltDeg: tracker.surfaceTiltDeg,
    surfaceAzimuthDeg: tracker.surfaceAzimuthDeg,
    solarElevationDeg: solar.apparentElevationDeg,
    solarAzimuthDeg: solar.azimuthDeg,
    directWm2: irradiance.poaDirectWm2 * iam.direct,
    diffuseWm2: irradiance.poaSkyDiffuseWm2 * iam.skyDiffuse,
    groundReflectedWm2:
      irradiance.poaGroundDiffuseWm2 * iam.groundDiffuse,
  });
  const soilingFraction = input.configuration.losses.soiling.enabled
    ? clamp(input.configuration.losses.soiling.value / 100, -1, 1)
    : 0;
  const unsoiledEffectiveWm2 = iam.effectiveIrradianceWm2;
  const effectiveIrradianceWm2 = Math.max(
    0,
    unsoiledEffectiveWm2 * (1 - soilingFraction),
  );
  const thermal = calculateCellTemperature({
    model: input.configuration.thermalModel,
    irradianceWm2: effectiveIrradianceWm2,
    ambientTemperatureC: input.ambientTemperatureC,
    windSpeedMs: input.windSpeedMs,
    noctC: input.module.noctC,
    moduleEfficiency: input.module.efficiencyFraction,
    moduleAbsorption: input.configuration.moduleAbsorption,
    faimanU0: input.configuration.faimanU0,
    faimanU1: input.configuration.faimanU1,
    pvsystUc: input.configuration.pvsystUc,
    pvsystUv: input.configuration.pvsystUv,
  });
  const moduleDatasheet = {
    pmaxW: input.module.pmaxW,
    vmppV: input.module.vmppV,
    imppA: input.module.imppA,
    vocV: input.module.vocV,
    iscA: input.module.iscA,
    tempCoeffPmaxPercentPerC: input.module.tempCoeffPmaxPercentPerC,
    tempCoeffVocPercentPerC: input.module.tempCoeffVocPercentPerC,
    tempCoeffIscPercentPerC: input.module.tempCoeffIscPercentPerC,
    cellsInSeries: input.module.cellsInSeries,
  };
  const unsoiledModule = calculateModuleOperatingPoint({
    model: input.configuration.moduleElectricalModel,
    datasheet: moduleDatasheet,
    effectiveIrradianceWm2: unsoiledEffectiveWm2,
    cellTemperatureC: thermal.cellTemperatureC,
  });
  const modulePoint = calculateModuleOperatingPoint({
    model: input.configuration.moduleElectricalModel,
    datasheet: moduleDatasheet,
    effectiveIrradianceWm2,
    cellTemperatureC: thermal.cellTemperatureC,
  });
  const topologyModuleCount =
    input.modulesPerString * input.stringsPerInverter * input.inverterCount;
  const modeledModuleCount = Math.min(input.moduleCount, topologyModuleCount);
  const stringCount = Math.max(0, Math.floor(modeledModuleCount / input.modulesPerString));
  const stringFactors = Array.from({ length: stringCount }, (_, index) =>
    shading.rowFactors[index % shading.rowFactors.length] ?? shading.meanPvFactor,
  );
  const strings = createStringOperatingPoints({
    module: modulePoint,
    stringCount,
    modulesPerString: input.modulesPerString,
    irradianceFactors: stringFactors,
  });
  const rawDcPowerW = strings.reduce((sum, string) => sum + string.pmpW, 0);
  const unsoiledRawDcPowerW =
    rawDcPowerW *
    (modulePoint.pmpW > 0 ? unsoiledModule.pmpW / modulePoint.pmpW : 1);
  const opticalStage = opticalLossStage({
    unsoiledPowerW: unsoiledRawDcPowerW,
    soiledPowerW: rawDcPowerW,
    configuration: input.configuration,
  });
  const commissioningInstant = input.configuration.commissioningDate
    ? new Date(input.configuration.commissioningDate)
    : null;
  const moduleAgeYears =
    commissioningInstant && Number.isFinite(commissioningInstant.getTime())
      ? Math.max(
          0,
          (timestamp.getTime() - commissioningInstant.getTime()) /
            (365.25 * 86_400_000),
        )
      : 0;
  const degradationParameter = {
    ...input.configuration.losses.degradationAnnual,
    value:
      input.configuration.losses.degradationAnnual.value * moduleAgeYears,
    enabled:
      input.configuration.losses.degradationAnnual.enabled &&
      commissioningInstant !== null,
    unit: "% cumulative",
  };
  const degradationStage = applyLossStage({
    id: "degradation",
    label: "Age-related degradation",
    domain: "dc",
    inputPowerW: rawDcPowerW,
    parameter: degradationParameter,
    note: `${moduleAgeYears.toFixed(3)} years × ${input.configuration.losses.degradationAnnual.value}%/year`,
  });
  const dcChain = applyDcLossChain(
    degradationStage.outputPowerW,
    input.configuration.losses,
  );

  const mppts = Array.from({ length: input.inverterCount }, (_, inverterIndex) => {
    const start = inverterIndex * input.stringsPerInverter;
    const inverterStrings = strings.slice(start, start + input.stringsPerInverter);
    return evaluateDynamicMppts({
      strings: inverterStrings,
      mpptCount: input.mpptCountPerInverter,
      mppVoltageMinV: input.mppVoltageMinV,
      mppVoltageMaxV: input.mppVoltageMaxV,
      maxInputVoltageV: input.maxInputVoltageV,
      maxOperatingCurrentPerMpptA: input.maxOperatingCurrentPerMpptA,
      maxShortCircuitCurrentPerMpptA: input.maxShortCircuitCurrentPerMpptA,
      maxStringsPerMppt: input.maxStringsPerMppt,
      stringAllocation:
        input.mpptStringAllocation,
    }).map((point) => ({
      ...point,
      mpptIndex: inverterIndex * input.mpptCountPerInverter + point.mpptIndex,
    }));
  }).flat();
  const unconstrainedMpptPowerW = mppts.reduce(
    (sum, point) => sum + point.unconstrainedPowerW,
    0,
  );
  const acceptedMpptPowerW = mppts.reduce(
    (sum, point) => sum + point.acceptedPowerW,
    0,
  );
  const mpptAcceptance =
    unconstrainedMpptPowerW > 0
      ? acceptedMpptPowerW / unconstrainedMpptPowerW
      : 1;
  const dcAtInverterW = dcChain.outputPowerW * mpptAcceptance;
  const mpptStage = mpptLossStage(dcChain.outputPowerW, dcAtInverterW);

  const acceptedByInverter = Array.from(
    { length: input.inverterCount },
    (_, inverterIndex) =>
      mppts
        .slice(
          inverterIndex * input.mpptCountPerInverter,
          (inverterIndex + 1) * input.mpptCountPerInverter,
        )
        .reduce((sum, point) => sum + point.acceptedPowerW, 0) *
      (rawDcPowerW > 0 ? dcChain.outputPowerW / rawDcPowerW : 1),
  );
  const inverterResults = acceptedByInverter.map((dcInputPowerW, index) =>
    calculateFittedInverterConversion({
      dcInputPowerW,
      ratedAcPowerW: input.ratedAcPowerPerInverterW,
      available: input.inverterAvailability?.[index] ?? true,
      gridAvailable: input.gridAvailable ?? true,
      nightSelfConsumptionW: 4.8,
    }),
  );
  const availableDcForConversionW = acceptedByInverter.reduce(
    (sum, value, index) =>
      sum + ((input.inverterAvailability?.[index] ?? true) ? value : 0),
    0,
  );
  const inverterAvailabilityStage = fixedLossStage({
    id: "inverter_availability",
    label: "Per-inverter availability",
    domain: "availability",
    inputPowerW: dcAtInverterW,
    outputPowerW: availableDcForConversionW,
    sourceCategory: input.inverterAvailability ? "measured" : "user_assumption",
    note: input.inverterAvailability
      ? "Per-inverter availability state"
      : "All configured inverters assumed available",
  });
  const inverter = {
    dcInputPowerW: availableDcForConversionW,
    acUnclippedPowerW: inverterResults.reduce((sum, value) => sum + value.acUnclippedPowerW, 0),
    acOutputPowerW: inverterResults.reduce((sum, value) => sum + value.acOutputPowerW, 0),
    conversionLossW: inverterResults.reduce((sum, value) => sum + value.conversionLossW, 0),
    clippingLossW: inverterResults.reduce((sum, value) => sum + value.clippingLossW, 0),
    standbyConsumptionW: inverterResults.reduce(
      (sum, value) => sum + value.standbyConsumptionW,
      0,
    ),
    efficiency:
      availableDcForConversionW > 0
        ? inverterResults.reduce((sum, value) => sum + value.acUnclippedPowerW, 0) /
          availableDcForConversionW
        : 0,
  };
  const inverterConversionStage = fixedLossStage({
    id: "inverter_conversion",
    label: "Inverter conversion",
    domain: "inverter",
    inputPowerW: availableDcForConversionW,
    outputPowerW: inverter.acUnclippedPowerW,
    sourceCategory: "calibrated",
    note: "SMA STP 50-40 fitted loss curve v1",
  });
  const clippingStage = fixedLossStage({
    id: "inverter_clipping",
    label: "Inverter clipping",
    domain: "inverter",
    inputPowerW: inverter.acUnclippedPowerW,
    outputPowerW: inverter.acOutputPowerW,
    sourceCategory: "manufacturer",
    note: `${input.ratedAcPowerPerInverterW} W hard AC ceiling per inverter`,
  });
  const acChain = applyAcLossChain(
    inverter.acOutputPowerW,
    input.configuration.losses,
  );
  const allBalanceStages = [
    degradationStage,
    ...dcChain.stages,
    mpptStage,
    inverterAvailabilityStage,
    inverterConversionStage,
    clippingStage,
    ...acChain.stages,
  ];
  const energyBalance = calculateEnergyBalance({
    inputPowerW: rawDcPowerW,
    deliveredPowerW: acChain.outputPowerW,
    stages: allBalanceStages,
  });
  const warnings = [
    ...mppts.flatMap((point) => point.warnings),
    ...(Math.abs(energyBalance.balanceResidualW) > energyBalance.toleranceW
      ? ["Physics energy-balance residual exceeds tolerance."]
      : []),
    ...(modeledModuleCount !== input.moduleCount
      ? [
          `Electrical topology accounts for ${modeledModuleCount} of ${input.moduleCount} configured modules.`,
        ]
      : []),
  ];
  const coldVoc = calculateColdVoc(
    input.module.vocV,
    input.modulesPerString,
    input.module.tempCoeffVocPercentPerC,
    input.configuration.minimumDesignCellTemperatureC,
  );
  const coldVocMarginV = input.maxInputVoltageV - coldVoc.stringVocV;
  if (coldVoc.stringVocV >= input.maxInputVoltageV) {
    warnings.push(
      `Cold-condition string Voc ${coldVoc.stringVocV.toFixed(2)} V reaches/exceeds inverter maximum ${input.maxInputVoltageV.toFixed(2)} V.`,
    );
  } else if (coldVocMarginV <= 20) {
    warnings.push(
      `Cold-condition string Voc margin is only ${coldVocMarginV.toFixed(2)} V at ${input.configuration.minimumDesignCellTemperatureC.toFixed(1)} °C.`,
    );
  }
  if (
    input.configuration.measuredTrackerAngleDeg !== null &&
    Math.abs(
      input.configuration.measuredTrackerAngleDeg -
        tracker.backtrackedAngleDeg,
    ) > 2
  ) {
    warnings.push(
      "Measured tracker angle differs from the commanded angle by more than 2°.",
    );
  }

  return {
    modelMode: input.configuration.mode,
    solar,
    tracker,
    irradiance,
    iam,
    rowShadingFactors: shading.rowFactors,
    cropGroundIrradianceWm2: shading.cropGroundIrradianceWm2,
    thermal,
    module: modulePoint,
    strings,
    mppts,
    rawDcPowerW,
    dcAtInverterW,
    inverter,
    netAcPowerW: acChain.outputPowerW,
    losses: [opticalStage, ...allBalanceStages],
    energyBalance,
    warnings,
  };
}
