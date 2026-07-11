import { CropProfile } from "@/types/simulation";

export const CROP_PROFILES: CropProfile[] = [
  {
    id: "tomato",
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    minimumDLI: 20,
    optimumDLI: 25,
    maximumDLI: 30,
    shadeTolerance: "medium",
    color: "#52b788",
  },
  {
    id: "lettuce",
    name: "Lettuce",
    scientificName: "Lactuca sativa",
    minimumDLI: 12,
    optimumDLI: 17,
    maximumDLI: 22,
    shadeTolerance: "high",
    color: "#80b918",
  },
  {
    id: "spinach",
    name: "Spinach",
    scientificName: "Spinacia oleracea",
    minimumDLI: 10,
    optimumDLI: 15,
    maximumDLI: 20,
    shadeTolerance: "high",
    color: "#2d6a4f",
  },
  {
    id: "potato",
    name: "Potato",
    scientificName: "Solanum tuberosum",
    minimumDLI: 15,
    optimumDLI: 22,
    maximumDLI: 28,
    shadeTolerance: "medium",
    color: "#70a288",
  },
  {
    id: "rice",
    name: "Rice",
    scientificName: "Oryza sativa",
    minimumDLI: 20,
    optimumDLI: 25,
    maximumDLI: 30,
    shadeTolerance: "low",
    color: "#a7c957",
  },
  {
    id: "wheat",
    name: "Wheat",
    scientificName: "Triticum aestivum",
    minimumDLI: 18,
    optimumDLI: 24,
    maximumDLI: 30,
    shadeTolerance: "low",
    color: "#dda15e",
  },
];

export function getCropProfile(id: string): CropProfile {
  return (
    CROP_PROFILES.find((crop) => crop.id === id) ?? CROP_PROFILES[0]
  );
}