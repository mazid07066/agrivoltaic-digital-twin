import type {
  ExplicitLossConfiguration,
  PhysicsModelConfiguration,
  SourcedParameter,
} from "./types";

function assumption(
  value: number,
  unit = "%",
  enabled = true,
): SourcedParameter {
  return {
    value,
    unit,
    sourceCategory: "user_assumption",
    enabled,
  };
}

export function createDefaultExplicitLossConfiguration(): ExplicitLossConfiguration {
  return {
    schemaVersion: "agritwin-explicit-loss-v1",
    soiling: assumption(3),
    moduleQuality: {
      ...assumption(-0.6),
      sourceReference: "PVsyst-style baseline assumption; negative loss represents gain",
    },
    moduleMismatch: assumption(1),
    stringMismatch: assumption(0.1),
    dcOhmic: assumption(1),
    acOhmic: assumption(0.5),
    transformer: {
      ...assumption(0, "%", false),
      sourceReference: "Disabled until transformer data are supplied",
    },
    auxiliary: assumption(0.2),
    availability: assumption(0, "%", false),
    degradationAnnual: assumption(0, "%/year", false),
    curtailment: assumption(0, "%", false),
  };
}

export function createDefaultPhysicsModelConfiguration(
  mode: PhysicsModelConfiguration["mode"] = "legacy_parity",
): PhysicsModelConfiguration {
  return {
    schemaVersion: "agritwin-physics-model-v1",
    mode,
    solarPositionModel:
      mode === "legacy_parity"
        ? "legacy_suncalc"
        : "spa_equivalent",
    trackingModel: "standard_backtracking",
    axisTiltDeg: 0,
    axisAzimuthDeg: 0,
    crossAxisSlopeDeg: 0,
    backtrackingEnabled: true,
    stowAngleDeg: 0,
    irradianceModel:
      mode === "legacy_parity"
        ? "isotropic"
        : "perez",
    iamModel:
      mode === "legacy_parity"
        ? "none"
        : "martin_ruiz",
    martinRuizAr: 0.16,
    thermalModel:
      mode === "legacy_parity"
        ? "simple_noct"
        : "pvsyst",
    faimanU0: 25,
    faimanU1: 6.84,
    pvsystUc: 29,
    pvsystUv: 0,
    moduleAbsorption: 0.9,
    moduleElectricalModel:
      mode === "legacy_parity"
        ? "simple_power"
        : "single_diode",
    minimumDesignCellTemperatureC: 0,
    commissioningDate: null,
    measuredTrackerAngleDeg: null,
    losses: createDefaultExplicitLossConfiguration(),
  };
}

export function resolvePhysicsConfiguration(
  value: PhysicsModelConfiguration | null | undefined,
): PhysicsModelConfiguration {
  if (!value) {
    return createDefaultPhysicsModelConfiguration("legacy_parity");
  }

  const defaults = createDefaultPhysicsModelConfiguration(value.mode);

  return {
    ...defaults,
    ...value,
    losses: {
      ...defaults.losses,
      ...value.losses,
    },
  };
}
