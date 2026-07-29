// src/data/terminologies.ts

export type TerminologyCategory =
  | "Core Project"
  | "Solar PV"
  | "Solar Radiation"
  | "Agriculture"
  | "Weather"
  | "Energy Performance"
  | "Digital Twin"
  | "IoT and Sensors"
  | "Software"
  | "Artificial Intelligence"
  | "Control and Optimization"
  | "Sustainability"
  | "Standards"
  | "Units";

export interface Terminology {
  abbreviation: string;
  fullMeaning: string;
  category: TerminologyCategory;
  description?: string;
  aliases?: string[];
  contextNote?: string;
}

export const terminologyCategories: TerminologyCategory[] = [
  "Core Project",
  "Solar PV",
  "Solar Radiation",
  "Agriculture",
  "Weather",
  "Energy Performance",
  "Digital Twin",
  "IoT and Sensors",
  "Software",
  "Artificial Intelligence",
  "Control and Optimization",
  "Sustainability",
  "Standards",
  "Units",
];

export const terminologies: Terminology[] = [
  // ============================================================
  // CORE PROJECT
  // ============================================================
  {
    abbreviation: "AV",
    fullMeaning: "Agrivoltaics",
    category: "Core Project",
    description:
      "The simultaneous use of land for agricultural production and photovoltaic electricity generation.",
  },
  {
    abbreviation: "APV",
    fullMeaning: "Agrivoltaic Photovoltaics",
    category: "Core Project",
    aliases: ["Agri-PV"],
    description:
      "A photovoltaic installation designed to coexist with crops, livestock, or another agricultural activity.",
  },
  {
    abbreviation: "Agri-PV",
    fullMeaning: "Agricultural Photovoltaics",
    category: "Core Project",
    aliases: ["APV"],
    description:
      "A commonly used term for photovoltaic systems integrated with agricultural land use.",
  },
  {
    abbreviation: "DT",
    fullMeaning: "Digital Twin",
    category: "Core Project",
    description:
      "A continuously updated virtual representation of a physical system, process, or asset.",
    contextNote:
      "DT can also mean Decision Tree in machine-learning discussions.",
  },
  {
    abbreviation: "AV-DT",
    fullMeaning: "Agrivoltaic Digital Twin",
    category: "Core Project",
    description:
      "A digital twin that represents the solar, crop, weather, structural, and operational behaviour of an agrivoltaic installation.",
  },
  {
    abbreviation: "PV",
    fullMeaning: "Photovoltaic",
    category: "Core Project",
    description:
      "The direct conversion of sunlight into electrical energy using semiconductor materials.",
  },
  {
    abbreviation: "PV-DT",
    fullMeaning: "Photovoltaic Digital Twin",
    category: "Core Project",
    description:
      "A virtual model of a photovoltaic system that reflects its electrical, thermal, and operational performance.",
  },
  {
    abbreviation: "CPS",
    fullMeaning: "Cyber-Physical System",
    category: "Core Project",
    description:
      "A system in which physical equipment, sensors, software, communication, and control processes operate together.",
  },
  {
    abbreviation: "RES",
    fullMeaning: "Renewable Energy System",
    category: "Core Project",
  },
  {
    abbreviation: "RE",
    fullMeaning: "Renewable Energy",
    category: "Core Project",
  },
  {
    abbreviation: "DER",
    fullMeaning: "Distributed Energy Resource",
    category: "Core Project",
    description:
      "A small or medium-scale energy resource connected near the point of energy consumption.",
  },
  {
    abbreviation: "DG",
    fullMeaning: "Distributed Generation",
    category: "Core Project",
  },
  {
    abbreviation: "BIPV",
    fullMeaning: "Building-Integrated Photovoltaics",
    category: "Core Project",
  },
  {
    abbreviation: "FPV",
    fullMeaning: "Floating Photovoltaics",
    category: "Core Project",
  },
  {
    abbreviation: "CAPEX",
    fullMeaning: "Capital Expenditure",
    category: "Core Project",
    description:
      "The initial investment required to purchase, construct, and install the system.",
  },
  {
    abbreviation: "OPEX",
    fullMeaning: "Operating Expenditure",
    category: "Core Project",
    description:
      "The recurring cost of operating and maintaining the system.",
  },
  {
    abbreviation: "ROI",
    fullMeaning: "Return on Investment",
    category: "Core Project",
    contextNote:
      "ROI may also mean Region of Interest in image processing and remote sensing.",
  },
  {
    abbreviation: "LCOE",
    fullMeaning: "Levelized Cost of Energy",
    category: "Core Project",
    description:
      "The average lifetime cost of producing one unit of electrical energy.",
  },

  // ============================================================
  // SOLAR PV
  // ============================================================
  {
    abbreviation: "STC",
    fullMeaning: "Standard Test Conditions",
    category: "Solar PV",
    description:
      "PV rating conditions of 1000 W/m² irradiance, 25 °C cell temperature, and AM1.5 solar spectrum.",
  },
  {
    abbreviation: "NOCT",
    fullMeaning: "Nominal Operating Cell Temperature",
    category: "Solar PV",
    description:
      "A reference indicator used to estimate photovoltaic cell temperature under outdoor operating conditions.",
  },
  {
    abbreviation: "NMOT",
    fullMeaning: "Nominal Module Operating Temperature",
    category: "Solar PV",
  },
  {
    abbreviation: "Pmax",
    fullMeaning: "Maximum Power",
    category: "Solar PV",
    aliases: ["Pmpp"],
    description:
      "The greatest electrical power that a module can produce at a specified operating condition.",
  },
  {
    abbreviation: "Pmpp",
    fullMeaning: "Power at Maximum Power Point",
    category: "Solar PV",
    aliases: ["Pmax"],
  },
  {
    abbreviation: "MPP",
    fullMeaning: "Maximum Power Point",
    category: "Solar PV",
    description:
      "The operating point on a PV current-voltage curve where power output is greatest.",
  },
  {
    abbreviation: "MPPT",
    fullMeaning: "Maximum Power Point Tracking",
    category: "Solar PV",
    description:
      "A control technique that keeps a photovoltaic array operating near its maximum-power point.",
  },
  {
    abbreviation: "Voc",
    fullMeaning: "Open-Circuit Voltage",
    category: "Solar PV",
    description:
      "The terminal voltage of a photovoltaic device when no current is flowing.",
  },
  {
    abbreviation: "Isc",
    fullMeaning: "Short-Circuit Current",
    category: "Solar PV",
    description:
      "The current produced by a photovoltaic device when its terminals are short-circuited.",
  },
  {
    abbreviation: "Vmp",
    fullMeaning: "Voltage at Maximum Power Point",
    category: "Solar PV",
    aliases: ["Vmpp"],
  },
  {
    abbreviation: "Vmpp",
    fullMeaning: "Voltage at Maximum Power Point",
    category: "Solar PV",
    aliases: ["Vmp"],
  },
  {
    abbreviation: "Imp",
    fullMeaning: "Current at Maximum Power Point",
    category: "Solar PV",
    aliases: ["Impp"],
  },
  {
    abbreviation: "Impp",
    fullMeaning: "Current at Maximum Power Point",
    category: "Solar PV",
    aliases: ["Imp"],
  },
  {
    abbreviation: "FF",
    fullMeaning: "Fill Factor",
    category: "Solar PV",
    description:
      "The ratio of maximum PV power to the product of open-circuit voltage and short-circuit current.",
  },
  {
    abbreviation: "PCE",
    fullMeaning: "Power Conversion Efficiency",
    category: "Solar PV",
  },
  {
    abbreviation: "I–V",
    fullMeaning: "Current–Voltage",
    category: "Solar PV",
    description:
      "The characteristic relationship between photovoltaic current and terminal voltage.",
  },
  {
    abbreviation: "P–V",
    fullMeaning: "Power–Voltage",
    category: "Solar PV",
    description:
      "The relationship between photovoltaic power and terminal voltage.",
  },
  {
    abbreviation: "Tcell",
    fullMeaning: "Solar Cell Temperature",
    category: "Solar PV",
  },
  {
    abbreviation: "Tmod",
    fullMeaning: "Solar Module Temperature",
    category: "Solar PV",
  },
  {
    abbreviation: "Tamb",
    fullMeaning: "Ambient Temperature",
    category: "Solar PV",
  },
  {
    abbreviation: "αIsc",
    fullMeaning: "Temperature Coefficient of Short-Circuit Current",
    category: "Solar PV",
  },
  {
    abbreviation: "βVoc",
    fullMeaning: "Temperature Coefficient of Open-Circuit Voltage",
    category: "Solar PV",
  },
  {
    abbreviation: "γPmax",
    fullMeaning: "Temperature Coefficient of Maximum Power",
    category: "Solar PV",
  },
  {
    abbreviation: "Rs",
    fullMeaning: "Series Resistance",
    category: "Solar PV",
  },
  {
    abbreviation: "Rsh",
    fullMeaning: "Shunt Resistance",
    category: "Solar PV",
  },
  {
    abbreviation: "Iph",
    fullMeaning: "Photocurrent",
    category: "Solar PV",
  },
  {
    abbreviation: "Io",
    fullMeaning: "Diode Saturation Current",
    category: "Solar PV",
  },
  {
    abbreviation: "Ns",
    fullMeaning: "Number of Series-Connected Cells",
    category: "Solar PV",
  },
  {
    abbreviation: "Np",
    fullMeaning: "Number of Parallel-Connected Strings",
    category: "Solar PV",
  },
  {
    abbreviation: "SDM",
    fullMeaning: "Single-Diode Model",
    category: "Solar PV",
    description:
      "An equivalent-circuit model commonly used to simulate photovoltaic device behaviour.",
  },
  {
    abbreviation: "DDM",
    fullMeaning: "Double-Diode Model",
    category: "Solar PV",
  },
  {
    abbreviation: "SAPM",
    fullMeaning: "Sandia Array Performance Model",
    category: "Solar PV",
  },
  {
    abbreviation: "IAM",
    fullMeaning: "Incidence Angle Modifier",
    category: "Solar PV",
    contextNote:
      "IAM can also mean Identity and Access Management in cybersecurity.",
  },
  {
    abbreviation: "AOI",
    fullMeaning: "Angle of Incidence",
    category: "Solar PV",
    contextNote:
      "AOI can also mean Area of Interest in geographic applications.",
  },
  {
    abbreviation: "BOS",
    fullMeaning: "Balance of System",
    category: "Solar PV",
    description:
      "All photovoltaic-system components other than the solar modules.",
  },
  {
    abbreviation: "PID",
    fullMeaning: "Potential-Induced Degradation",
    category: "Solar PV",
    contextNote:
      "PID also means Proportional–Integral–Derivative controller in control engineering.",
  },
  {
    abbreviation: "LID",
    fullMeaning: "Light-Induced Degradation",
    category: "Solar PV",
  },
  {
    abbreviation: "LeTID",
    fullMeaning: "Light- and Elevated-Temperature-Induced Degradation",
    category: "Solar PV",
  },
  {
    abbreviation: "c-Si",
    fullMeaning: "Crystalline Silicon",
    category: "Solar PV",
  },
  {
    abbreviation: "mono-Si",
    fullMeaning: "Monocrystalline Silicon",
    category: "Solar PV",
  },
  {
    abbreviation: "poly-Si",
    fullMeaning: "Polycrystalline Silicon",
    category: "Solar PV",
  },
  {
    abbreviation: "a-Si",
    fullMeaning: "Amorphous Silicon",
    category: "Solar PV",
  },
  {
    abbreviation: "PERC",
    fullMeaning: "Passivated Emitter and Rear Cell",
    category: "Solar PV",
  },
  {
    abbreviation: "TOPCon",
    fullMeaning: "Tunnel Oxide Passivated Contact",
    category: "Solar PV",
  },
  {
    abbreviation: "HJT",
    fullMeaning: "Heterojunction Technology",
    category: "Solar PV",
  },
  {
    abbreviation: "HIT",
    fullMeaning: "Heterojunction with Intrinsic Thin Layer",
    category: "Solar PV",
  },
  {
    abbreviation: "IBC",
    fullMeaning: "Interdigitated Back Contact",
    category: "Solar PV",
  },
  {
    abbreviation: "BSF",
    fullMeaning: "Back Surface Field",
    category: "Solar PV",
  },
  {
    abbreviation: "CdTe",
    fullMeaning: "Cadmium Telluride",
    category: "Solar PV",
  },
  {
    abbreviation: "CIGS",
    fullMeaning: "Copper Indium Gallium Selenide",
    category: "Solar PV",
  },
  {
    abbreviation: "GaAs",
    fullMeaning: "Gallium Arsenide",
    category: "Solar PV",
  },
  {
    abbreviation: "PSC",
    fullMeaning: "Perovskite Solar Cell",
    category: "Solar PV",
  },
  {
    abbreviation: "OPV",
    fullMeaning: "Organic Photovoltaic",
    category: "Solar PV",
  },
  {
    abbreviation: "EVA",
    fullMeaning: "Ethylene Vinyl Acetate",
    category: "Solar PV",
  },
  {
    abbreviation: "POE",
    fullMeaning: "Polyolefin Elastomer",
    category: "Solar PV",
  },

  // ============================================================
  // SOLAR RADIATION
  // ============================================================
  {
    abbreviation: "GHI",
    fullMeaning: "Global Horizontal Irradiance",
    category: "Solar Radiation",
    description:
      "The total solar irradiance received by a horizontal surface.",
  },
  {
    abbreviation: "DNI",
    fullMeaning: "Direct Normal Irradiance",
    category: "Solar Radiation",
    description:
      "Direct solar irradiance received by a surface normal to the sun's rays.",
  },
  {
    abbreviation: "DHI",
    fullMeaning: "Diffuse Horizontal Irradiance",
    category: "Solar Radiation",
  },
  {
    abbreviation: "GTI",
    fullMeaning: "Global Tilted Irradiance",
    category: "Solar Radiation",
  },
  {
    abbreviation: "POA",
    fullMeaning: "Plane-of-Array Irradiance",
    category: "Solar Radiation",
  },
  {
    abbreviation: "GPOA",
    fullMeaning: "Global Plane-of-Array Irradiance",
    category: "Solar Radiation",
  },
  {
    abbreviation: "PAR",
    fullMeaning: "Photosynthetically Active Radiation",
    category: "Solar Radiation",
    description:
      "Solar radiation in the wavelength range used by plants for photosynthesis.",
  },
  {
    abbreviation: "PPFD",
    fullMeaning: "Photosynthetic Photon Flux Density",
    category: "Solar Radiation",
  },
  {
    abbreviation: "DLI",
    fullMeaning: "Daily Light Integral",
    category: "Solar Radiation",
    description:
      "The cumulative quantity of photosynthetically active photons received per square metre each day.",
  },
  {
    abbreviation: "AM",
    fullMeaning: "Air Mass",
    category: "Solar Radiation",
  },
  {
    abbreviation: "AM1.5",
    fullMeaning: "Air Mass 1.5 Solar Spectrum",
    category: "Solar Radiation",
  },
  {
    abbreviation: "SZA",
    fullMeaning: "Solar Zenith Angle",
    category: "Solar Radiation",
  },
  {
    abbreviation: "SEA",
    fullMeaning: "Solar Elevation Angle",
    category: "Solar Radiation",
  },
  {
    abbreviation: "SAA",
    fullMeaning: "Solar Azimuth Angle",
    category: "Solar Radiation",
  },
  {
    abbreviation: "LST",
    fullMeaning: "Local Solar Time",
    category: "Solar Radiation",
  },
  {
    abbreviation: "EOT",
    fullMeaning: "Equation of Time",
    category: "Solar Radiation",
  },
  {
    abbreviation: "SPA",
    fullMeaning: "Solar Position Algorithm",
    category: "Solar Radiation",
  },
  {
    abbreviation: "CSI",
    fullMeaning: "Clear-Sky Index",
    category: "Solar Radiation",
    contextNote:
      "CSI can also mean Current Source Inverter in power-electronics applications.",
  },
  {
    abbreviation: "Kt",
    fullMeaning: "Clearness Index",
    category: "Solar Radiation",
  },

  // ============================================================
  // AGRICULTURE
  // ============================================================
  {
    abbreviation: "LER",
    fullMeaning: "Land Equivalent Ratio",
    category: "Agriculture",
    description:
      "A measure comparing combined agrivoltaic land productivity with separate agricultural and photovoltaic land uses.",
  },
  {
    abbreviation: "WUE",
    fullMeaning: "Water Use Efficiency",
    category: "Agriculture",
  },
  {
    abbreviation: "IWUE",
    fullMeaning: "Irrigation Water Use Efficiency",
    category: "Agriculture",
  },
  {
    abbreviation: "RUE",
    fullMeaning: "Radiation Use Efficiency",
    category: "Agriculture",
  },
  {
    abbreviation: "LUE",
    fullMeaning: "Light Use Efficiency",
    category: "Agriculture",
  },
  {
    abbreviation: "NUE",
    fullMeaning: "Nutrient Use Efficiency",
    category: "Agriculture",
  },
  {
    abbreviation: "ET",
    fullMeaning: "Evapotranspiration",
    category: "Agriculture",
  },
  {
    abbreviation: "ET₀",
    fullMeaning: "Reference Evapotranspiration",
    category: "Agriculture",
    aliases: ["ETo"],
  },
  {
    abbreviation: "ETc",
    fullMeaning: "Crop Evapotranspiration",
    category: "Agriculture",
  },
  {
    abbreviation: "Kc",
    fullMeaning: "Crop Coefficient",
    category: "Agriculture",
  },
  {
    abbreviation: "LAI",
    fullMeaning: "Leaf Area Index",
    category: "Agriculture",
  },
  {
    abbreviation: "NDVI",
    fullMeaning: "Normalized Difference Vegetation Index",
    category: "Agriculture",
  },
  {
    abbreviation: "EVI",
    fullMeaning: "Enhanced Vegetation Index",
    category: "Agriculture",
  },
  {
    abbreviation: "SAVI",
    fullMeaning: "Soil-Adjusted Vegetation Index",
    category: "Agriculture",
  },
  {
    abbreviation: "GNDVI",
    fullMeaning: "Green Normalized Difference Vegetation Index",
    category: "Agriculture",
  },
  {
    abbreviation: "NDRE",
    fullMeaning: "Normalized Difference Red Edge Index",
    category: "Agriculture",
  },
  {
    abbreviation: "NDWI",
    fullMeaning: "Normalized Difference Water Index",
    category: "Agriculture",
  },
  {
    abbreviation: "CWSI",
    fullMeaning: "Crop Water Stress Index",
    category: "Agriculture",
  },
  {
    abbreviation: "VPD",
    fullMeaning: "Vapour Pressure Deficit",
    category: "Agriculture",
  },
  {
    abbreviation: "SM",
    fullMeaning: "Soil Moisture",
    category: "Agriculture",
  },
  {
    abbreviation: "VWC",
    fullMeaning: "Volumetric Water Content",
    category: "Agriculture",
  },
  {
    abbreviation: "SWC",
    fullMeaning: "Soil Water Content",
    category: "Agriculture",
  },
  {
    abbreviation: "FC",
    fullMeaning: "Field Capacity",
    category: "Agriculture",
  },
  {
    abbreviation: "PWP",
    fullMeaning: "Permanent Wilting Point",
    category: "Agriculture",
  },
  {
    abbreviation: "AWC",
    fullMeaning: "Available Water Capacity",
    category: "Agriculture",
  },
  {
    abbreviation: "EC",
    fullMeaning: "Electrical Conductivity",
    category: "Agriculture",
  },
  {
    abbreviation: "pH",
    fullMeaning: "Potential of Hydrogen",
    category: "Agriculture",
  },
  {
    abbreviation: "NPK",
    fullMeaning: "Nitrogen, Phosphorus, and Potassium",
    category: "Agriculture",
  },
  {
    abbreviation: "SOC",
    fullMeaning: "Soil Organic Carbon",
    category: "Agriculture",
    contextNote:
      "SoC may mean State of Charge or System on Chip in other project sections.",
  },
  {
    abbreviation: "SOM",
    fullMeaning: "Soil Organic Matter",
    category: "Agriculture",
  },
  {
    abbreviation: "GDD",
    fullMeaning: "Growing Degree Days",
    category: "Agriculture",
  },
  {
    abbreviation: "HI",
    fullMeaning: "Harvest Index",
    category: "Agriculture",
  },
  {
    abbreviation: "APAR",
    fullMeaning: "Absorbed Photosynthetically Active Radiation",
    category: "Agriculture",
  },
  {
    abbreviation: "fPAR",
    fullMeaning: "Fraction of Absorbed Photosynthetically Active Radiation",
    category: "Agriculture",
  },

  // ============================================================
  // WEATHER
  // ============================================================
  {
    abbreviation: "RH",
    fullMeaning: "Relative Humidity",
    category: "Weather",
  },
  {
    abbreviation: "WS",
    fullMeaning: "Wind Speed",
    category: "Weather",
  },
  {
    abbreviation: "WD",
    fullMeaning: "Wind Direction",
    category: "Weather",
  },
  {
    abbreviation: "WG",
    fullMeaning: "Wind Gust",
    category: "Weather",
  },
  {
    abbreviation: "DP",
    fullMeaning: "Dew Point",
    category: "Weather",
  },
  {
    abbreviation: "RF",
    fullMeaning: "Rainfall",
    category: "Weather",
    contextNote:
      "RF can also mean Random Forest or Radio Frequency.",
  },
  {
    abbreviation: "AWS",
    fullMeaning: "Automatic Weather Station",
    category: "Weather",
  },
  {
    abbreviation: "NWP",
    fullMeaning: "Numerical Weather Prediction",
    category: "Weather",
  },
  {
    abbreviation: "UTC",
    fullMeaning: "Coordinated Universal Time",
    category: "Weather",
  },
  {
    abbreviation: "BST",
    fullMeaning: "Bangladesh Standard Time",
    category: "Weather",
    contextNote:
      "In this project, BST refers to Bangladesh Standard Time.",
  },
  {
    abbreviation: "AQI",
    fullMeaning: "Air Quality Index",
    category: "Weather",
  },
  {
    abbreviation: "PM2.5",
    fullMeaning: "Particulate Matter up to 2.5 Micrometres",
    category: "Weather",
  },
  {
    abbreviation: "PM10",
    fullMeaning: "Particulate Matter up to 10 Micrometres",
    category: "Weather",
  },
  {
    abbreviation: "CO₂",
    fullMeaning: "Carbon Dioxide",
    category: "Weather",
  },
  {
    abbreviation: "VOC",
    fullMeaning: "Volatile Organic Compound",
    category: "Weather",
  },
  {
    abbreviation: "TVOC",
    fullMeaning: "Total Volatile Organic Compounds",
    category: "Weather",
  },

  // ============================================================
  // ENERGY PERFORMANCE
  // ============================================================
  {
    abbreviation: "PR",
    fullMeaning: "Performance Ratio",
    category: "Energy Performance",
    description:
      "A normalized indicator of actual photovoltaic-system performance relative to expected performance.",
    contextNote:
      "PR can also mean precipitation in weather datasets.",
  },
  {
    abbreviation: "CUF",
    fullMeaning: "Capacity Utilization Factor",
    category: "Energy Performance",
  },
  {
    abbreviation: "CF",
    fullMeaning: "Capacity Factor",
    category: "Energy Performance",
  },
  {
    abbreviation: "Yf",
    fullMeaning: "Final Energy Yield",
    category: "Energy Performance",
  },
  {
    abbreviation: "Yr",
    fullMeaning: "Reference Yield",
    category: "Energy Performance",
  },
  {
    abbreviation: "Ya",
    fullMeaning: "Array Yield",
    category: "Energy Performance",
  },
  {
    abbreviation: "EAC",
    fullMeaning: "Alternating-Current Energy",
    category: "Energy Performance",
  },
  {
    abbreviation: "EDC",
    fullMeaning: "Direct-Current Energy",
    category: "Energy Performance",
  },
  {
    abbreviation: "BESS",
    fullMeaning: "Battery Energy Storage System",
    category: "Energy Performance",
  },
  {
    abbreviation: "ESS",
    fullMeaning: "Energy Storage System",
    category: "Energy Performance",
  },
  {
    abbreviation: "SoC",
    fullMeaning: "State of Charge",
    category: "Energy Performance",
    contextNote:
      "SoC can also mean System on Chip, while SOC can mean Soil Organic Carbon.",
  },
  {
    abbreviation: "SoH",
    fullMeaning: "State of Health",
    category: "Energy Performance",
  },
  {
    abbreviation: "DoD",
    fullMeaning: "Depth of Discharge",
    category: "Energy Performance",
  },
  {
    abbreviation: "RTE",
    fullMeaning: "Round-Trip Efficiency",
    category: "Energy Performance",
  },
  {
    abbreviation: "EMS",
    fullMeaning: "Energy Management System",
    category: "Energy Performance",
  },
  {
    abbreviation: "PCC",
    fullMeaning: "Point of Common Coupling",
    category: "Energy Performance",
  },
  {
    abbreviation: "THD",
    fullMeaning: "Total Harmonic Distortion",
    category: "Energy Performance",
  },
  {
    abbreviation: "PF",
    fullMeaning: "Power Factor",
    category: "Energy Performance",
  },

  // ============================================================
  // DIGITAL TWIN
  // ============================================================
  {
    abbreviation: "PT",
    fullMeaning: "Physical Twin",
    category: "Digital Twin",
  },
  {
    abbreviation: "VT",
    fullMeaning: "Virtual Twin",
    category: "Digital Twin",
  },
  {
    abbreviation: "PE",
    fullMeaning: "Physical Entity",
    category: "Digital Twin",
  },
  {
    abbreviation: "VE",
    fullMeaning: "Virtual Entity",
    category: "Digital Twin",
  },
  {
    abbreviation: "DTI",
    fullMeaning: "Digital Twin Instance",
    category: "Digital Twin",
  },
  {
    abbreviation: "DTA",
    fullMeaning: "Digital Twin Aggregate",
    category: "Digital Twin",
  },
  {
    abbreviation: "DTP",
    fullMeaning: "Digital Twin Prototype",
    category: "Digital Twin",
  },
  {
    abbreviation: "DTS",
    fullMeaning: "Digital Twin System",
    category: "Digital Twin",
  },
  {
    abbreviation: "DTaaS",
    fullMeaning: "Digital Twin as a Service",
    category: "Digital Twin",
  },
  {
    abbreviation: "TSDB",
    fullMeaning: "Time-Series Database",
    category: "Digital Twin",
  },
  {
    abbreviation: "KPI",
    fullMeaning: "Key Performance Indicator",
    category: "Digital Twin",
  },
  {
    abbreviation: "ETL",
    fullMeaning: "Extract, Transform, and Load",
    category: "Digital Twin",
  },
  {
    abbreviation: "DBMS",
    fullMeaning: "Database Management System",
    category: "Digital Twin",
  },
  {
    abbreviation: "RDBMS",
    fullMeaning: "Relational Database Management System",
    category: "Digital Twin",
  },
  {
    abbreviation: "SQL",
    fullMeaning: "Structured Query Language",
    category: "Digital Twin",
  },
  {
    abbreviation: "NoSQL",
    fullMeaning: "Not Only Structured Query Language",
    category: "Digital Twin",
  },
  {
    abbreviation: "CRUD",
    fullMeaning: "Create, Read, Update, and Delete",
    category: "Digital Twin",
  },
  {
    abbreviation: "UUID",
    fullMeaning: "Universally Unique Identifier",
    category: "Digital Twin",
  },
  {
    abbreviation: "SaaS",
    fullMeaning: "Software as a Service",
    category: "Digital Twin",
  },
  {
    abbreviation: "PaaS",
    fullMeaning: "Platform as a Service",
    category: "Digital Twin",
  },
  {
    abbreviation: "IaaS",
    fullMeaning: "Infrastructure as a Service",
    category: "Digital Twin",
  },

  // ============================================================
  // IOT AND SENSORS
  // ============================================================
  {
    abbreviation: "IoT",
    fullMeaning: "Internet of Things",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "IIoT",
    fullMeaning: "Industrial Internet of Things",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "WSN",
    fullMeaning: "Wireless Sensor Network",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "M2M",
    fullMeaning: "Machine-to-Machine Communication",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "MCU",
    fullMeaning: "Microcontroller Unit",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "SBC",
    fullMeaning: "Single-Board Computer",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "ADC",
    fullMeaning: "Analog-to-Digital Converter",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "DAC",
    fullMeaning: "Digital-to-Analog Converter",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "GPIO",
    fullMeaning: "General-Purpose Input/Output",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "PWM",
    fullMeaning: "Pulse-Width Modulation",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "I²C",
    fullMeaning: "Inter-Integrated Circuit",
    category: "IoT and Sensors",
    aliases: ["I2C"],
  },
  {
    abbreviation: "SPI",
    fullMeaning: "Serial Peripheral Interface",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "UART",
    fullMeaning: "Universal Asynchronous Receiver-Transmitter",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "USB",
    fullMeaning: "Universal Serial Bus",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "BLE",
    fullMeaning: "Bluetooth Low Energy",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "RFID",
    fullMeaning: "Radio-Frequency Identification",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "LoRa",
    fullMeaning: "Long Range",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "LoRaWAN",
    fullMeaning: "Long Range Wide Area Network",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "NB-IoT",
    fullMeaning: "Narrowband Internet of Things",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "MQTT",
    fullMeaning: "Message Queuing Telemetry Transport",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "HTTP",
    fullMeaning: "Hypertext Transfer Protocol",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "HTTPS",
    fullMeaning: "Hypertext Transfer Protocol Secure",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "TCP",
    fullMeaning: "Transmission Control Protocol",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "UDP",
    fullMeaning: "User Datagram Protocol",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "REST",
    fullMeaning: "Representational State Transfer",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "API",
    fullMeaning: "Application Programming Interface",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "JSON",
    fullMeaning: "JavaScript Object Notation",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "CSV",
    fullMeaning: "Comma-Separated Values",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "RTC",
    fullMeaning: "Real-Time Clock",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "GPS",
    fullMeaning: "Global Positioning System",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "GNSS",
    fullMeaning: "Global Navigation Satellite System",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "RSSI",
    fullMeaning: "Received Signal Strength Indicator",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "OTA",
    fullMeaning: "Over-the-Air",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "HMI",
    fullMeaning: "Human–Machine Interface",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "SCADA",
    fullMeaning: "Supervisory Control and Data Acquisition",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "PLC",
    fullMeaning: "Programmable Logic Controller",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "DAQ",
    fullMeaning: "Data Acquisition",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "LDR",
    fullMeaning: "Light-Dependent Resistor",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "PIR",
    fullMeaning: "Passive Infrared Sensor",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "RTD",
    fullMeaning: "Resistance Temperature Detector",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "MEMS",
    fullMeaning: "Microelectromechanical System",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "IMU",
    fullMeaning: "Inertial Measurement Unit",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "LiDAR",
    fullMeaning: "Light Detection and Ranging",
    category: "IoT and Sensors",
  },
  {
    abbreviation: "ToF",
    fullMeaning: "Time of Flight",
    category: "IoT and Sensors",
  },

  // ============================================================
  // SOFTWARE
  // ============================================================
  {
    abbreviation: "UI",
    fullMeaning: "User Interface",
    category: "Software",
  },
  {
    abbreviation: "UX",
    fullMeaning: "User Experience",
    category: "Software",
  },
  {
    abbreviation: "GUI",
    fullMeaning: "Graphical User Interface",
    category: "Software",
  },
  {
    abbreviation: "CLI",
    fullMeaning: "Command-Line Interface",
    category: "Software",
  },
  {
    abbreviation: "IDE",
    fullMeaning: "Integrated Development Environment",
    category: "Software",
  },
  {
    abbreviation: "HTML",
    fullMeaning: "Hypertext Markup Language",
    category: "Software",
  },
  {
    abbreviation: "CSS",
    fullMeaning: "Cascading Style Sheets",
    category: "Software",
  },
  {
    abbreviation: "JS",
    fullMeaning: "JavaScript",
    category: "Software",
  },
  {
    abbreviation: "TS",
    fullMeaning: "TypeScript",
    category: "Software",
  },
  {
    abbreviation: "JSX",
    fullMeaning: "JavaScript XML",
    category: "Software",
  },
  {
    abbreviation: "TSX",
    fullMeaning: "TypeScript XML",
    category: "Software",
  },
  {
    abbreviation: "DOM",
    fullMeaning: "Document Object Model",
    category: "Software",
  },
  {
    abbreviation: "SPA",
    fullMeaning: "Single-Page Application",
    category: "Software",
  },
  {
    abbreviation: "SSR",
    fullMeaning: "Server-Side Rendering",
    category: "Software",
  },
  {
    abbreviation: "SSG",
    fullMeaning: "Static Site Generation",
    category: "Software",
  },
  {
    abbreviation: "ISR",
    fullMeaning: "Incremental Static Regeneration",
    category: "Software",
  },
  {
    abbreviation: "CSR",
    fullMeaning: "Client-Side Rendering",
    category: "Software",
    contextNote:
      "CSR may also mean Corporate Social Responsibility in sustainability discussions.",
  },
  {
    abbreviation: "PWA",
    fullMeaning: "Progressive Web Application",
    category: "Software",
  },
  {
    abbreviation: "SDK",
    fullMeaning: "Software Development Kit",
    category: "Software",
  },
  {
    abbreviation: "NPM",
    fullMeaning: "Node Package Manager",
    category: "Software",
  },
  {
    abbreviation: "R3F",
    fullMeaning: "React Three Fiber",
    category: "Software",
  },
  {
    abbreviation: "GLSL",
    fullMeaning: "OpenGL Shading Language",
    category: "Software",
  },
  {
    abbreviation: "WebGL",
    fullMeaning: "Web Graphics Library",
    category: "Software",
  },
  {
    abbreviation: "SVG",
    fullMeaning: "Scalable Vector Graphics",
    category: "Software",
  },
  {
    abbreviation: "PNG",
    fullMeaning: "Portable Network Graphics",
    category: "Software",
  },
  {
    abbreviation: "JPEG",
    fullMeaning: "Joint Photographic Experts Group",
    category: "Software",
  },
  {
    abbreviation: "glTF",
    fullMeaning: "Graphics Language Transmission Format",
    category: "Software",
  },
  {
    abbreviation: "GLB",
    fullMeaning: "Binary glTF File",
    category: "Software",
  },
  {
    abbreviation: "CAD",
    fullMeaning: "Computer-Aided Design",
    category: "Software",
  },
  {
    abbreviation: "BIM",
    fullMeaning: "Building Information Modelling",
    category: "Software",
  },
  {
    abbreviation: "CI/CD",
    fullMeaning: "Continuous Integration and Continuous Delivery or Deployment",
    category: "Software",
  },
  {
    abbreviation: "PR",
    fullMeaning: "Pull Request",
    category: "Software",
    contextNote:
      "PR can also mean Performance Ratio in photovoltaic-system analysis.",
  },
  {
    abbreviation: "MD",
    fullMeaning: "Markdown",
    category: "Software",
  },
  {
    abbreviation: "ENV",
    fullMeaning: "Environment Configuration",
    category: "Software",
  },
  {
    abbreviation: "YAML",
    fullMeaning: "YAML Ain't Markup Language",
    category: "Software",
  },

  // ============================================================
  // ARTIFICIAL INTELLIGENCE
  // ============================================================
  {
    abbreviation: "AI",
    fullMeaning: "Artificial Intelligence",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "ML",
    fullMeaning: "Machine Learning",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "DL",
    fullMeaning: "Deep Learning",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "ANN",
    fullMeaning: "Artificial Neural Network",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "DNN",
    fullMeaning: "Deep Neural Network",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "CNN",
    fullMeaning: "Convolutional Neural Network",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "RNN",
    fullMeaning: "Recurrent Neural Network",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "LSTM",
    fullMeaning: "Long Short-Term Memory",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "GRU",
    fullMeaning: "Gated Recurrent Unit",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "MLP",
    fullMeaning: "Multilayer Perceptron",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "RF",
    fullMeaning: "Random Forest",
    category: "Artificial Intelligence",
    contextNote:
      "RF may also mean Radio Frequency or Rainfall depending on context.",
  },
  {
    abbreviation: "SVM",
    fullMeaning: "Support Vector Machine",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "SVR",
    fullMeaning: "Support Vector Regression",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "KNN",
    fullMeaning: "K-Nearest Neighbours",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "XGBoost",
    fullMeaning: "Extreme Gradient Boosting",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "PCA",
    fullMeaning: "Principal Component Analysis",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "RL",
    fullMeaning: "Reinforcement Learning",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "DRL",
    fullMeaning: "Deep Reinforcement Learning",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "CV",
    fullMeaning: "Computer Vision",
    category: "Artificial Intelligence",
    contextNote:
      "CV can also mean Cross-Validation in model evaluation.",
  },
  {
    abbreviation: "PINN",
    fullMeaning: "Physics-Informed Neural Network",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "GNN",
    fullMeaning: "Graph Neural Network",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "ANFIS",
    fullMeaning: "Adaptive Neuro-Fuzzy Inference System",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "AutoML",
    fullMeaning: "Automated Machine Learning",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "MLOps",
    fullMeaning: "Machine Learning Operations",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "XAI",
    fullMeaning: "Explainable Artificial Intelligence",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "SHAP",
    fullMeaning: "SHapley Additive exPlanations",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "MAE",
    fullMeaning: "Mean Absolute Error",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "MSE",
    fullMeaning: "Mean Squared Error",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "RMSE",
    fullMeaning: "Root Mean Squared Error",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "MAPE",
    fullMeaning: "Mean Absolute Percentage Error",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "R²",
    fullMeaning: "Coefficient of Determination",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "ROC",
    fullMeaning: "Receiver Operating Characteristic",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "AUC",
    fullMeaning: "Area Under the Curve",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "ARIMA",
    fullMeaning: "Autoregressive Integrated Moving Average",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "SARIMA",
    fullMeaning: "Seasonal Autoregressive Integrated Moving Average",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "ACF",
    fullMeaning: "Autocorrelation Function",
    category: "Artificial Intelligence",
  },
  {
    abbreviation: "PACF",
    fullMeaning: "Partial Autocorrelation Function",
    category: "Artificial Intelligence",
  },

  // ============================================================
  // CONTROL AND OPTIMIZATION
  // ============================================================
  {
    abbreviation: "PID",
    fullMeaning: "Proportional–Integral–Derivative",
    category: "Control and Optimization",
    contextNote:
      "PID also means Potential-Induced Degradation in photovoltaic systems.",
  },
  {
    abbreviation: "PI",
    fullMeaning: "Proportional–Integral",
    category: "Control and Optimization",
  },
  {
    abbreviation: "PD",
    fullMeaning: "Proportional–Derivative",
    category: "Control and Optimization",
  },
  {
    abbreviation: "MPC",
    fullMeaning: "Model Predictive Control",
    category: "Control and Optimization",
  },
  {
    abbreviation: "FLC",
    fullMeaning: "Fuzzy Logic Controller",
    category: "Control and Optimization",
  },
  {
    abbreviation: "P&O",
    fullMeaning: "Perturb and Observe",
    category: "Control and Optimization",
  },
  {
    abbreviation: "INC",
    fullMeaning: "Incremental Conductance",
    category: "Control and Optimization",
  },
  {
    abbreviation: "PLL",
    fullMeaning: "Phase-Locked Loop",
    category: "Control and Optimization",
  },
  {
    abbreviation: "SPWM",
    fullMeaning: "Sinusoidal Pulse-Width Modulation",
    category: "Control and Optimization",
  },
  {
    abbreviation: "SVPWM",
    fullMeaning: "Space-Vector Pulse-Width Modulation",
    category: "Control and Optimization",
  },
  {
    abbreviation: "LQR",
    fullMeaning: "Linear Quadratic Regulator",
    category: "Control and Optimization",
  },
  {
    abbreviation: "GA",
    fullMeaning: "Genetic Algorithm",
    category: "Control and Optimization",
  },
  {
    abbreviation: "PSO",
    fullMeaning: "Particle Swarm Optimization",
    category: "Control and Optimization",
  },
  {
    abbreviation: "MILP",
    fullMeaning: "Mixed-Integer Linear Programming",
    category: "Control and Optimization",
  },
  {
    abbreviation: "MINLP",
    fullMeaning: "Mixed-Integer Nonlinear Programming",
    category: "Control and Optimization",
  },
  {
    abbreviation: "OPF",
    fullMeaning: "Optimal Power Flow",
    category: "Control and Optimization",
  },

  // ============================================================
  // SUSTAINABILITY
  // ============================================================
  {
    abbreviation: "SDG",
    fullMeaning: "Sustainable Development Goal",
    category: "Sustainability",
  },
  {
    abbreviation: "GHG",
    fullMeaning: "Greenhouse Gas",
    category: "Sustainability",
  },
  {
    abbreviation: "CO₂e",
    fullMeaning: "Carbon Dioxide Equivalent",
    category: "Sustainability",
  },
  {
    abbreviation: "LCA",
    fullMeaning: "Life-Cycle Assessment",
    category: "Sustainability",
  },
  {
    abbreviation: "LCIA",
    fullMeaning: "Life-Cycle Impact Assessment",
    category: "Sustainability",
  },
  {
    abbreviation: "EPBT",
    fullMeaning: "Energy Payback Time",
    category: "Sustainability",
  },
  {
    abbreviation: "EROI",
    fullMeaning: "Energy Return on Investment",
    category: "Sustainability",
  },
  {
    abbreviation: "EIA",
    fullMeaning: "Environmental Impact Assessment",
    category: "Sustainability",
  },
  {
    abbreviation: "ESG",
    fullMeaning: "Environmental, Social, and Governance",
    category: "Sustainability",
  },
  {
    abbreviation: "NDC",
    fullMeaning: "Nationally Determined Contribution",
    category: "Sustainability",
  },
  {
    abbreviation: "NZE",
    fullMeaning: "Net-Zero Emissions",
    category: "Sustainability",
  },
  {
    abbreviation: "GWP",
    fullMeaning: "Global Warming Potential",
    category: "Sustainability",
  },

  // ============================================================
  // STANDARDS
  // ============================================================
  {
    abbreviation: "IEC",
    fullMeaning: "International Electrotechnical Commission",
    category: "Standards",
  },
  {
    abbreviation: "IEEE",
    fullMeaning: "Institute of Electrical and Electronics Engineers",
    category: "Standards",
  },
  {
    abbreviation: "ISO",
    fullMeaning: "International Organization for Standardization",
    category: "Standards",
  },
  {
    abbreviation: "ASTM",
    fullMeaning: "ASTM International",
    category: "Standards",
  },
  {
    abbreviation: "WMO",
    fullMeaning: "World Meteorological Organization",
    category: "Standards",
  },
  {
    abbreviation: "FAO",
    fullMeaning: "Food and Agriculture Organization of the United Nations",
    category: "Standards",
  },
  {
    abbreviation: "IRENA",
    fullMeaning: "International Renewable Energy Agency",
    category: "Standards",
  },
  {
    abbreviation: "IEA",
    fullMeaning: "International Energy Agency",
    category: "Standards",
  },
  {
    abbreviation: "NREL",
    fullMeaning: "National Renewable Energy Laboratory",
    category: "Standards",
  },
  {
    abbreviation: "BSTI",
    fullMeaning: "Bangladesh Standards and Testing Institution",
    category: "Standards",
  },
  {
    abbreviation: "SREDA",
    fullMeaning: "Sustainable and Renewable Energy Development Authority",
    category: "Standards",
  },
  {
    abbreviation: "BPDB",
    fullMeaning: "Bangladesh Power Development Board",
    category: "Standards",
  },
  {
    abbreviation: "IEC 61215",
    fullMeaning:
      "Terrestrial Photovoltaic Module Design Qualification and Type Approval",
    category: "Standards",
  },
  {
    abbreviation: "IEC 61724",
    fullMeaning: "Photovoltaic System Performance Monitoring Standard",
    category: "Standards",
  },
  {
    abbreviation: "IEC 61730",
    fullMeaning: "Photovoltaic Module Safety Qualification Standard",
    category: "Standards",
  },
  {
    abbreviation: "IEC 61853",
    fullMeaning: "Photovoltaic Module Performance Testing and Energy Rating",
    category: "Standards",
  },
  {
    abbreviation: "ISO 23247",
    fullMeaning: "Digital Twin Framework for Manufacturing",
    category: "Standards",
  },

  // ============================================================
  // UNITS
  // ============================================================
  {
    abbreviation: "V",
    fullMeaning: "Volt",
    category: "Units",
  },
  {
    abbreviation: "A",
    fullMeaning: "Ampere",
    category: "Units",
  },
  {
    abbreviation: "W",
    fullMeaning: "Watt",
    category: "Units",
  },
  {
    abbreviation: "kW",
    fullMeaning: "Kilowatt",
    category: "Units",
  },
  {
    abbreviation: "MW",
    fullMeaning: "Megawatt",
    category: "Units",
  },
  {
    abbreviation: "Wp",
    fullMeaning: "Watt-Peak",
    category: "Units",
  },
  {
    abbreviation: "kWp",
    fullMeaning: "Kilowatt-Peak",
    category: "Units",
  },
  {
    abbreviation: "Wh",
    fullMeaning: "Watt-Hour",
    category: "Units",
  },
  {
    abbreviation: "kWh",
    fullMeaning: "Kilowatt-Hour",
    category: "Units",
  },
  {
    abbreviation: "W/m²",
    fullMeaning: "Watts per Square Metre",
    category: "Units",
  },
  {
    abbreviation: "kWh/m²/day",
    fullMeaning: "Kilowatt-Hours per Square Metre per Day",
    category: "Units",
  },
  {
    abbreviation: "°C",
    fullMeaning: "Degree Celsius",
    category: "Units",
  },
  {
    abbreviation: "K",
    fullMeaning: "Kelvin",
    category: "Units",
  },
  {
    abbreviation: "m/s",
    fullMeaning: "Metres per Second",
    category: "Units",
  },
  {
    abbreviation: "mm",
    fullMeaning: "Millimetre",
    category: "Units",
  },
  {
    abbreviation: "m²",
    fullMeaning: "Square Metre",
    category: "Units",
  },
  {
    abbreviation: "ha",
    fullMeaning: "Hectare",
    category: "Units",
  },
  {
    abbreviation: "ppm",
    fullMeaning: "Parts per Million",
    category: "Units",
  },
  {
    abbreviation: "µmol/m²/s",
    fullMeaning: "Micromoles per Square Metre per Second",
    category: "Units",
  },
  {
    abbreviation: "Hz",
    fullMeaning: "Hertz",
    category: "Units",
  },
  {
    abbreviation: "dB",
    fullMeaning: "Decibel",
    category: "Units",
  },
];