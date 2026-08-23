import {
  dispatchElectricalPower,
} from "./distribution/dispatch";

import type {
  ElectricalDispatchResult,
  ElectricalFeederDefinition,
} from "./distribution/types";

import {
  simulateInverterTimestep,
} from "./inverter/inverterModel";

import {
  createDemonstrationDcInput,
  createDesignedDcInput,
} from "./inverter/mppt";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "./inverter/catalogue";

import type {
  InverterSpecification,
  InverterTimestepResult,
} from "./inverter/types";

import {
  getPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

export interface DemonstrationElectricalTimestep {
  inverter:
    InverterTimestepResult;

  distribution:
    ElectricalDispatchResult;

  equipment?: {
    moduleCount: number | null;
    inverterSpecificationId: string;
    inverterName: string;
    ratedActivePowerKw: number;
    independentMpptInputs: number;
    stringsPerMppt: number;
    inverterCount: number;
    topologyMode:
      | "designed"
      | "demonstration";
    modulesPerString: number | null;
    totalStringCount: number | null;
    assignedModuleCount: number | null;
    activeMpptCount: number;
    moduleTemperatureC: number | null;
  };
}

function createPlantEquivalentSpecification(
  specification: InverterSpecification,
  inverterCount: number,
): InverterSpecification {
  if (inverterCount === 1) {
    return specification;
  }

  return {
    ...specification,

    id:
      `${specification.id}::plant-${inverterCount}`,

    name:
      `${inverterCount} × ${specification.name}`,

    dc: {
      ...specification.dc,

      maxGeneratorPowerW:
        specification.dc.maxGeneratorPowerW *
        inverterCount,

      maxOperatingInputCurrentA:
        specification.dc.maxOperatingInputCurrentA *
        inverterCount,

      independentMpptInputs:
        specification.dc.independentMpptInputs *
        inverterCount,
    },

    ac: {
      ...specification.ac,

      ratedActivePowerW:
        specification.ac.ratedActivePowerW *
        inverterCount,

      maxApparentPowerVa:
        specification.ac.maxApparentPowerVa *
        inverterCount,

      maxOutputCurrentA:
        specification.ac.maxOutputCurrentA *
        inverterCount,

      ratedOutputCurrentA:
        specification.ac.ratedOutputCurrentA *
        inverterCount,
    },
  };
}

function demonstrationFeeders(
  timestamp:
    string,
): ElectricalFeederDefinition[] {
  return [
    {
      id: "demo-feeder-1",
      name: "Feeder 1",
      nominalVoltageV: 400,
      phases: 3,
      connectedLoadKw: 10,
      powerFactor: 1,
      priority: 1,
      enabled: true,
      loadProfile: [
        {
          timestamp,
          activePowerKw: 10,
          powerFactor: 1,
        },
      ],
    },
    {
      id: "demo-feeder-2",
      name: "Feeder 2",
      nominalVoltageV: 400,
      phases: 3,
      connectedLoadKw: 8,
      powerFactor: 1,
      priority: 2,
      enabled: true,
      loadProfile: [
        {
          timestamp,
          activePowerKw: 8,
          powerFactor: 1,
        },
      ],
    },
    {
      id: "demo-feeder-3",
      name: "Feeder 3",
      nominalVoltageV: 400,
      phases: 3,
      connectedLoadKw: 6,
      powerFactor: 1,
      priority: 3,
      enabled: true,
      loadProfile: [
        {
          timestamp,
          activePowerKw: 6,
          powerFactor: 1,
        },
      ],
    },
  ];
}

export function simulateDemonstrationElectricalTimestep({
  timestamp,
  pvPowerKw,
  inverterProfileId,
  moduleProfileId,
  moduleCount,
  modulesPerString,
  stringsPerMppt,
  inverterCount,
  moduleTemperatureC,
}: {
  timestamp: string;
  pvPowerKw: number;
  inverterProfileId?: string;
  moduleProfileId?: string;
  moduleCount?: number | null;
  modulesPerString?: number | null;
  stringsPerMppt?: number | null;
  inverterCount?: number | null;
  moduleTemperatureC?: number | null;
}): DemonstrationElectricalTimestep {
  const specification =
    getInverterProfile(
      inverterProfileId ??
        DEFAULT_INVERTER_PROFILE_ID,
    );

  const availablePowerKw =
    Number.isFinite(pvPowerKw)
      ? Math.max(0, pvPowerKw)
      : 0;

  const configuredInverterCount =
    inverterCount !== null &&
    inverterCount !== undefined &&
    Number.isInteger(inverterCount) &&
    inverterCount > 0
      ? inverterCount
      : 1;

  const plantSpecification =
    createPlantEquivalentSpecification(
      specification,
      configuredInverterCount,
    );

  const moduleProfile =
    moduleProfileId
      ? getPVModuleProfile(
          moduleProfileId,
        )
      : null;

  const validModuleCount =
    moduleCount !== null &&
    moduleCount !== undefined &&
    Number.isInteger(moduleCount) &&
    moduleCount > 0;

  const validModulesPerString =
    modulesPerString !== null &&
    modulesPerString !== undefined &&
    Number.isInteger(modulesPerString) &&
    modulesPerString > 0;

  const validStringsPerMppt =
    stringsPerMppt !== null &&
    stringsPerMppt !== undefined &&
    Number.isInteger(stringsPerMppt) &&
    stringsPerMppt > 0 &&
    stringsPerMppt <=
      specification.dc.stringsPerMppt;

  const totalStringCount =
    validModuleCount &&
    validModulesPerString
      ? Math.floor(
          moduleCount /
          modulesPerString,
        )
      : null;

  const topologyCapacity =
    configuredInverterCount *
    specification.dc.independentMpptInputs *
    (
      validStringsPerMppt
        ? stringsPerMppt
        : 0
    );

  const useDesignedTopology =
    validModuleCount &&
    validModulesPerString &&
    validStringsPerMppt &&
    totalStringCount !== null &&
    totalStringCount > 0 &&
    totalStringCount <= topologyCapacity &&
    moduleTemperatureC !== null &&
    moduleTemperatureC !== undefined &&
    Number.isFinite(moduleTemperatureC) &&
    moduleProfile?.vmppV !== null &&
    moduleProfile?.vmppV !== undefined &&
    moduleProfile
      .tempCoeffVocPercentPerC !== null;

  const dcInput =
    useDesignedTopology
      ? createDesignedDcInput(
          {
            availablePowerKw,
            moduleCount,
            modulesPerString,
            stringsPerMppt,
            inverterCount:
              configuredInverterCount,
            moduleVmppV:
              moduleProfile!.vmppV!,
            moduleTemperatureC,
            voltageTemperatureCoefficientPercentPerC:
              moduleProfile!
                .tempCoeffVocPercentPerC!,
          },
          specification,
        )
      : createDemonstrationDcInput(
          {
            availablePowerKw,
          },
          plantSpecification,
        );

  const inverter =
    simulateInverterTimestep({
      timestamp,

      dcInput,

      specification:
        plantSpecification,

      efficiencyMode:
        "legacy_power_passthrough",

      lineNeutralVoltageV:
        230,

      lineLineVoltageV:
        400,

      frequencyHz:
        50,

      powerFactor:
        1,

      gridAvailable:
        true,

      timestepHours:
        1,
    });

  const distribution =
    dispatchElectricalPower({
      timestamp,

      operatingMode:
        "grid_connected",

      pvAcAvailableKw:
        inverter.ac
          .activePowerKw,

      feeders:
        demonstrationFeeders(
          timestamp,
        ),

      distributionLossKw:
        0,
    });

  return {
    inverter,
    distribution,

    equipment: {
      moduleCount:
        moduleCount ?? null,

      inverterSpecificationId:
        specification.id,

      inverterName:
        specification.name,

      ratedActivePowerKw:
        plantSpecification.ac.ratedActivePowerW / 1000,

      independentMpptInputs:
        plantSpecification.dc.independentMpptInputs,

      stringsPerMppt:
        specification.dc.stringsPerMppt,

      inverterCount:
        configuredInverterCount,

      topologyMode:
        useDesignedTopology
          ? "designed"
          : "demonstration",

      modulesPerString:
        useDesignedTopology
          ? modulesPerString
          : null,

      totalStringCount:
        useDesignedTopology
          ? totalStringCount
          : null,

      assignedModuleCount:
        useDesignedTopology &&
        totalStringCount !== null
          ? totalStringCount *
            modulesPerString
          : null,

      activeMpptCount:
        dcInput.mppts.filter(
          (mppt) =>
            mppt.strings.length > 0,
        ).length,

      moduleTemperatureC:
        useDesignedTopology
          ? moduleTemperatureC
          : null,
    },
  };
}
