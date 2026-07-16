import catalogue from "../../../module-catalogue.json";

export interface PVModuleProfile {
  id: string;
  manufacturer: string;
  series: string;
  model: string;
  cellTechnology: string;
  cellType: string;
  moduleType: string;
  numberOfCells: number | null;
  pmaxW: number;
  efficiencyPercent: number | null;
  vocV: number | null;
  vmppV: number | null;
  iscA: number | null;
  imppA: number | null;
  noctC: number;
  tempCoeffPmaxPercentPerC: number;
  tempCoeffVocPercentPerC: number | null;
  tempCoeffIscPercentPerC: number | null;
  lengthM: number;
  widthM: number;
  thicknessMm: number | null;
  weightKg: number | null;
  maxSystemVoltage: string;
  fuseA: number | null;
  productWarranty: string;
  linearWarranty: string;
  source: string;
  sourceFile: string;
}

export const PV_MODULE_PROFILES = catalogue.modules as PVModuleProfile[];

export function getPVModuleProfile(id: string): PVModuleProfile {
  return PV_MODULE_PROFILES.find((profile) => profile.id === id) ?? PV_MODULE_PROFILES[0];
}

export const PV_MODULE_MANUFACTURERS = [...new Set(
  PV_MODULE_PROFILES.map((profile) => profile.manufacturer),
)].sort();
