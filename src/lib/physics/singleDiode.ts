import type {
  ModuleElectricalModel,
  ModuleOperatingPoint,
} from "./types";

const REFERENCE_IRRADIANCE_WM2 =
  1000;

const REFERENCE_TEMPERATURE_C =
  25;

const REFERENCE_TEMPERATURE_K =
  298.15;

const BOLTZMANN_EV_PER_K =
  8.617333262145e-5;

const SILICON_BANDGAP_REFERENCE_EV =
  1.121;

const SILICON_BANDGAP_TEMP_COEFF_EV_PER_K =
  -0.0002677;

const MIN_POSITIVE =
  1e-14;

const MAX_EXPONENT =
  80;

export interface ModuleDatasheetInput {
  pmaxW: number;
  vmppV: number;
  imppA: number;
  vocV: number;
  iscA: number;

  tempCoeffPmaxPercentPerC:
    number;

  tempCoeffVocPercentPerC:
    number;

  tempCoeffIscPercentPerC:
    number;

  /**
   * Optional effective electrical series-cell count.
   *
   * This field is retained for backward compatibility and
   * interpretability only. Phase 9N single-diode physics does
   * not require it because the fitted modified diode factor
   * a_ref is used directly.
   */
  cellsInSeries?: number;

  /**
   * Optional user/manufacturer-supplied ideality factor.
   *
   * Phase 9N does not invent this value. When absent, the
   * calibrated modified diode factor a_ref remains authoritative.
   */
  diodeIdealityFactor?: number;

  /**
   * Optional explicit parameters are retained for compatibility,
   * but Phase 9N calibration is authoritative when operating in
   * single-diode mode.
   */
  seriesResistanceOhm?: number;
  shuntResistanceOhm?: number;
}

export interface ModuleOperatingInput {
  model:
    ModuleElectricalModel;

  datasheet:
    ModuleDatasheetInput;

  effectiveIrradianceWm2:
    number;

  cellTemperatureC:
    number;

  includeCurve?:
    boolean;
}

export interface SingleDiodeReferenceParameters {
  photoCurrentRefA:
    number;

  saturationCurrentRefA:
    number;

  seriesResistanceOhm:
    number;

  shuntResistanceRefOhm:
    number;

  modifiedDiodeFactorRefV:
    number;
}

export interface SingleDiodeFitResiduals {
  pmpRelative:
    number;

  vmpRelative:
    number;

  impRelative:
    number;

  vocRelative:
    number;

  iscRelative:
    number;

  gammaPmaxAbsolutePercentPerC:
    number;

  betaVocAbsolutePercentPerC:
    number;
}

export interface SingleDiodeFitResult {
  status:
    | "PASS"
    | "WARNING"
    | "FAIL";

  converged:
    boolean;

  iterations:
    number;

  parameters:
    SingleDiodeReferenceParameters;

  residuals:
    SingleDiodeFitResiduals;

  warnings:
    string[];

  modelVersion:
    "phase9n-datasheet-calibrated-desoto-v1";

  parameterSourceCategory:
    "calibrated";

  cellsInSeries:
    number | null;

  diodeIdealityFactor:
    number | null;
}

interface SingleDiodeTranslatedParameters {
  photoCurrentA:
    number;

  saturationCurrentA:
    number;

  seriesResistanceOhm:
    number;

  shuntResistanceOhm:
    number;

  modifiedDiodeFactorV:
    number;
}

interface MppSolution {
  voltageV:
    number;

  currentA:
    number;

  powerW:
    number;

  vocV:
    number;

  iterations:
    number;

  converged:
    boolean;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(
      value,
      minimum,
    ),
    maximum,
  );
}

function safeExp(
  value: number,
): number {
  return Math.exp(
    clamp(
      value,
      -MAX_EXPONENT,
      MAX_EXPONENT,
    ),
  );
}

function relativeError(
  actual: number,
  expected: number,
): number {
  if (
    Math.abs(
      expected,
    ) <= MIN_POSITIVE
  ) {
    return Math.abs(
      actual -
        expected,
    );
  }

  return (
    Math.abs(
      actual -
        expected,
    ) /
    Math.abs(
      expected,
    )
  );
}

function validateDatasheet(
  datasheet:
    ModuleDatasheetInput,
): void {
  const positiveFields: Array<
    [
      string,
      number,
    ]
  > = [
    [
      "pmaxW",
      datasheet.pmaxW,
    ],
    [
      "vmppV",
      datasheet.vmppV,
    ],
    [
      "imppA",
      datasheet.imppA,
    ],
    [
      "vocV",
      datasheet.vocV,
    ],
    [
      "iscA",
      datasheet.iscA,
    ],
  ];

  for (
    const [
      field,
      value,
    ] of positiveFields
  ) {
    if (
      !Number.isFinite(
        value,
      ) ||
      value <= 0
    ) {
      throw new Error(
        `Single-diode datasheet field ${field} must be finite and positive.`,
      );
    }
  }

  if (
    datasheet.vocV <=
    datasheet.vmppV
  ) {
    throw new Error(
      "Single-diode datasheet requires Voc > Vmpp.",
    );
  }

  if (
    datasheet.iscA <
    datasheet.imppA
  ) {
    throw new Error(
      "Single-diode datasheet requires Isc >= Impp.",
    );
  }

  const coefficientFields: Array<
    [
      string,
      number,
    ]
  > = [
    [
      "tempCoeffPmaxPercentPerC",
      datasheet
        .tempCoeffPmaxPercentPerC,
    ],
    [
      "tempCoeffVocPercentPerC",
      datasheet
        .tempCoeffVocPercentPerC,
    ],
    [
      "tempCoeffIscPercentPerC",
      datasheet
        .tempCoeffIscPercentPerC,
    ],
  ];

  for (
    const [
      field,
      value,
    ] of coefficientFields
  ) {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      throw new Error(
        `Single-diode datasheet field ${field} must be finite.`,
      );
    }
  }
}

function currentResidual(
  currentA: number,
  voltageV: number,
  parameters:
    SingleDiodeTranslatedParameters,
): number {
  const diodeVoltageV =
    voltageV +
    currentA *
      parameters
        .seriesResistanceOhm;

  return (
    parameters
      .photoCurrentA -
    parameters
      .saturationCurrentA *
      (
        safeExp(
          diodeVoltageV /
            parameters
              .modifiedDiodeFactorV,
        ) -
        1
      ) -
    diodeVoltageV /
      parameters
        .shuntResistanceOhm -
    currentA
  );
}

function solveCurrentAtVoltage(
  voltageV: number,
  parameters:
    SingleDiodeTranslatedParameters,
): number {
  if (
    parameters
      .photoCurrentA <= 0
  ) {
    return 0;
  }

  let lower =
    0;

  let upper =
    Math.max(
      parameters
        .photoCurrentA *
        1.25,
      1,
    );

  for (
    let expansion = 0;
    expansion < 20;
    expansion += 1
  ) {
    const residual =
      currentResidual(
        upper,
        voltageV,
        parameters,
      );

    if (
      residual <= 0
    ) {
      break;
    }

    upper *=
      2;
  }

  for (
    let iteration = 0;
    iteration < 100;
    iteration += 1
  ) {
    const currentA =
      (
        lower +
        upper
      ) /
      2;

    const residual =
      currentResidual(
        currentA,
        voltageV,
        parameters,
      );

    if (
      residual > 0
    ) {
      lower =
        currentA;
    } else {
      upper =
        currentA;
    }
  }

  return Math.max(
    0,
    (
      lower +
      upper
    ) /
      2,
  );
}

function solveOpenCircuitVoltage(
  parameters:
    SingleDiodeTranslatedParameters,
): number {
  if (
    parameters
      .photoCurrentA <= 0
  ) {
    return 0;
  }

  let lower =
    0;

  let upper =
    100;

  while (
    currentResidual(
      0,
      upper,
      parameters,
    ) > 0 &&
    upper < 1000
  ) {
    upper *=
      1.5;
  }

  for (
    let iteration = 0;
    iteration < 100;
    iteration += 1
  ) {
    const voltageV =
      (
        lower +
        upper
      ) /
      2;

    const residual =
      currentResidual(
        0,
        voltageV,
        parameters,
      );

    if (
      residual > 0
    ) {
      lower =
        voltageV;
    } else {
      upper =
        voltageV;
    }
  }

  return Math.max(
    0,
    (
      lower +
      upper
    ) /
      2,
  );
}

function solveMaximumPowerPoint(
  parameters:
    SingleDiodeTranslatedParameters,
): MppSolution {
  const vocV =
    solveOpenCircuitVoltage(
      parameters,
    );

  if (
    vocV <= 0
  ) {
    return {
      voltageV:
        0,

      currentA:
        0,

      powerW:
        0,

      vocV:
        0,

      iterations:
        0,

      converged:
        true,
    };
  }

  const powerAt =
    (
      voltageV:
        number,
    ) => {
      const currentA =
        solveCurrentAtVoltage(
          voltageV,
          parameters,
        );

      return {
        voltageV,

        currentA,

        powerW:
          voltageV *
          currentA,
      };
    };

  const goldenRatio =
    (
      Math.sqrt(
        5,
      ) -
      1
    ) /
    2;

  let left =
    0;

  let right =
    vocV;

  let x1 =
    right -
    goldenRatio *
      (
        right -
        left
      );

  let x2 =
    left +
    goldenRatio *
      (
        right -
        left
      );

  let point1 =
    powerAt(
      x1,
    );

  let point2 =
    powerAt(
      x2,
    );

  let iterations =
    0;

  for (
    ;
    iterations < 120;
    iterations += 1
  ) {
    if (
      Math.abs(
        right -
          left,
      ) <
      1e-8
    ) {
      break;
    }

    if (
      point1.powerW <
      point2.powerW
    ) {
      left =
        x1;

      x1 =
        x2;

      point1 =
        point2;

      x2 =
        left +
        goldenRatio *
          (
            right -
            left
          );

      point2 =
        powerAt(
          x2,
        );
    } else {
      right =
        x2;

      x2 =
        x1;

      point2 =
        point1;

      x1 =
        right -
        goldenRatio *
          (
            right -
            left
          );

      point1 =
        powerAt(
          x1,
        );
    }
  }

  const best =
    point1.powerW >
    point2.powerW
      ? point1
      : point2;

  return {
    ...best,

    vocV,

    iterations,

    converged:
      Math.abs(
        right -
          left,
      ) <
      1e-6,
  };
}

function bandgapAtTemperature(
  temperatureK:
    number,
): number {
  return (
    SILICON_BANDGAP_REFERENCE_EV +
    SILICON_BANDGAP_TEMP_COEFF_EV_PER_K *
      (
        temperatureK -
        REFERENCE_TEMPERATURE_K
      )
  );
}

function translateReferenceParameters(
  reference:
    SingleDiodeReferenceParameters,
  datasheet:
    ModuleDatasheetInput,
  irradianceWm2:
    number,
  cellTemperatureC:
    number,
): SingleDiodeTranslatedParameters {
  const irradiance =
    Math.max(
      irradianceWm2,
      0,
    );

  const temperatureK =
    cellTemperatureC +
    273.15;

  if (
    irradiance <=
    MIN_POSITIVE
  ) {
    return {
      photoCurrentA:
        0,

      saturationCurrentA:
        reference
          .saturationCurrentRefA,

      seriesResistanceOhm:
        reference
          .seriesResistanceOhm,

      shuntResistanceOhm:
        1e12,

      modifiedDiodeFactorV:
        reference
          .modifiedDiodeFactorRefV *
        temperatureK /
        REFERENCE_TEMPERATURE_K,
    };
  }

  const alphaIscAperC =
    datasheet.iscA *
    datasheet
      .tempCoeffIscPercentPerC /
    100;

  const photoCurrentA =
    (
      irradiance /
      REFERENCE_IRRADIANCE_WM2
    ) *
    (
      reference
        .photoCurrentRefA +
      alphaIscAperC *
        (
          cellTemperatureC -
          REFERENCE_TEMPERATURE_C
        )
    );

  const modifiedDiodeFactorV =
    reference
      .modifiedDiodeFactorRefV *
    temperatureK /
    REFERENCE_TEMPERATURE_K;

  const bandgapEv =
    bandgapAtTemperature(
      temperatureK,
    );

  const saturationCurrentA =
    reference
      .saturationCurrentRefA *
    (
      temperatureK /
      REFERENCE_TEMPERATURE_K
    ) **
      3 *
    Math.exp(
      SILICON_BANDGAP_REFERENCE_EV /
        (
          BOLTZMANN_EV_PER_K *
          REFERENCE_TEMPERATURE_K
        ) -
        bandgapEv /
          (
            BOLTZMANN_EV_PER_K *
            temperatureK
          ),
    );

  const shuntResistanceOhm =
    reference
      .shuntResistanceRefOhm *
    REFERENCE_IRRADIANCE_WM2 /
    irradiance;

  return {
    photoCurrentA,

    saturationCurrentA,

    seriesResistanceOhm:
      reference
        .seriesResistanceOhm,

    shuntResistanceOhm,

    modifiedDiodeFactorV,
  };
}

interface FitCandidate {
  photoCurrentRefA:
    number;

  saturationCurrentRefA:
    number;

  seriesResistanceOhm:
    number;

  shuntResistanceRefOhm:
    number;

  modifiedDiodeFactorRefV:
    number;
}

interface CandidateEvaluation {
  candidate:
    FitCandidate;

  loss:
    number;
}

function normalizeCandidate(
  candidate:
    FitCandidate,
  datasheet:
    ModuleDatasheetInput,
): FitCandidate {
  const vocScale =
    Math.max(
      datasheet.vocV,
      1,
    );

  return {
    photoCurrentRefA:
      clamp(
        candidate
          .photoCurrentRefA,
        datasheet.iscA *
          0.95,
        datasheet.iscA *
          1.10,
      ),

    saturationCurrentRefA:
      clamp(
        candidate
          .saturationCurrentRefA,
        1e-15,
        1e-4,
      ),

    seriesResistanceOhm:
      clamp(
        candidate
          .seriesResistanceOhm,
        0.0001,
        5,
      ),

    shuntResistanceRefOhm:
      clamp(
        candidate
          .shuntResistanceRefOhm,
        20,
        1_000_000,
      ),

    modifiedDiodeFactorRefV:
      clamp(
        candidate
          .modifiedDiodeFactorRefV,
        Math.max(
          0.25,
          vocScale *
            0.01,
        ),
        Math.max(
          1,
          vocScale *
            0.12,
        ),
      ),
  };
}

function referenceOperatingPoint(
  candidate:
    FitCandidate,
): {
  iscA:
    number;

  vocV:
    number;

  mpp:
    MppSolution;
} {
  const parameters:
    SingleDiodeTranslatedParameters =
    {
      photoCurrentA:
        candidate
          .photoCurrentRefA,

      saturationCurrentA:
        candidate
          .saturationCurrentRefA,

      seriesResistanceOhm:
        candidate
          .seriesResistanceOhm,

      shuntResistanceOhm:
        candidate
          .shuntResistanceRefOhm,

      modifiedDiodeFactorV:
        candidate
          .modifiedDiodeFactorRefV,
    };

  return {
    iscA:
      solveCurrentAtVoltage(
        0,
        parameters,
      ),

    vocV:
      solveOpenCircuitVoltage(
        parameters,
      ),

    mpp:
      solveMaximumPowerPoint(
        parameters,
      ),
  };
}

function candidateLoss(
  candidate:
    FitCandidate,
  datasheet:
    ModuleDatasheetInput,
): number {
  const reference =
    referenceOperatingPoint(
      candidate,
    );

  const stcParameters:
    SingleDiodeTranslatedParameters =
    {
      photoCurrentA:
        candidate
          .photoCurrentRefA,

      saturationCurrentA:
        candidate
          .saturationCurrentRefA,

      seriesResistanceOhm:
        candidate
          .seriesResistanceOhm,

      shuntResistanceOhm:
        candidate
          .shuntResistanceRefOhm,

      modifiedDiodeFactorV:
        candidate
          .modifiedDiodeFactorRefV,
    };

  const currentAtVmpp =
    solveCurrentAtVoltage(
      datasheet.vmppV,
      stcParameters,
    );

  /*
   * The manufacturer cardinal values are commonly rounded
   * independently. Vmpp × Impp therefore need not equal the
   * printed Pmax exactly.
   *
   * Preserve both constraints:
   * - Vmpp / Impp define the cardinal MPP location.
   * - Pmax remains a separate scientific validation gate.
   */
  const cardinalPowerW =
    datasheet.vmppV *
    datasheet.imppA;

  const referenceParameters:
    SingleDiodeReferenceParameters =
    {
      photoCurrentRefA:
        candidate
          .photoCurrentRefA,

      saturationCurrentRefA:
        candidate
          .saturationCurrentRefA,

      seriesResistanceOhm:
        candidate
          .seriesResistanceOhm,

      shuntResistanceRefOhm:
        candidate
          .shuntResistanceRefOhm,

      modifiedDiodeFactorRefV:
        candidate
          .modifiedDiodeFactorRefV,
    };

  /*
   * Phase 9N temperature calibration.
   *
   * STC cardinal-point fitting alone is underconstrained:
   * materially different five-parameter sets may reproduce
   * Isc/Voc/Imp/Vmp while having incorrect temperature
   * behavior.
   *
   * Manufacturer gamma_Pmax and beta_Voc are therefore
   * explicit fitting constraints.
   */
  const temperature =
    evaluateTemperatureCoefficients(
      referenceParameters,
      datasheet,
    );

  const modeledGammaPmaxPercentPerC =
    temperature
      .gammaPmaxPercentPerC;

  const modeledBetaVocPercentPerC =
    temperature
      .betaVocPercentPerC;

  const normalizedResiduals = [
    /*
     * STC cardinal constraints.
     */
    (
      reference.iscA -
      datasheet.iscA
    ) /
      Math.max(
        datasheet.iscA *
          0.002,
        0.005,
      ),

    (
      reference.vocV -
      datasheet.vocV
    ) /
      Math.max(
        datasheet.vocV *
          0.001,
        0.02,
      ),

    (
      currentAtVmpp -
      datasheet.imppA
    ) /
      Math.max(
        datasheet.imppA *
          0.001,
        0.005,
      ),

    (
      reference.mpp.voltageV -
      datasheet.vmppV
    ) /
      Math.max(
        datasheet.vmppV *
          0.001,
        0.02,
      ),

    (
      reference.mpp.powerW -
      cardinalPowerW
    ) /
      Math.max(
        datasheet.pmaxW *
          0.002,
        0.25,
      ),

    /*
     * Manufacturer temperature-coefficient constraints.
     *
     * 0.025 percentage point/°C is used as the optimizer
     * normalization scale. The final scientific validation
     * remains the explicit 0.05 pp/°C gate below; this tighter
     * optimization scale does not weaken or redefine the gate.
     */
    (
      modeledGammaPmaxPercentPerC -
      datasheet
        .tempCoeffPmaxPercentPerC
    ) /
      0.025,

    (
      modeledBetaVocPercentPerC -
      datasheet
        .tempCoeffVocPercentPerC
    ) /
      0.025,
  ];

  return normalizedResiduals.reduce(
    (
      total,
      residual,
    ) =>
      total +
      residual *
        residual,
    0,
  );
}

function candidateMeetsScientificFitGates(
  candidate:
    FitCandidate,
  datasheet:
    ModuleDatasheetInput,
): boolean {
  const reference =
    referenceOperatingPoint(
      candidate,
    );

  if (
    !reference.mpp.converged
  ) {
    return false;
  }

  const stcPmpError =
    relativeError(
      reference.mpp.powerW,
      datasheet.pmaxW,
    );

  const stcVmpError =
    relativeError(
      reference.mpp.voltageV,
      datasheet.vmppV,
    );

  const stcImpError =
    relativeError(
      reference.mpp.currentA,
      datasheet.imppA,
    );

  const stcVocError =
    relativeError(
      reference.vocV,
      datasheet.vocV,
    );

  const stcIscError =
    relativeError(
      reference.iscA,
      datasheet.iscA,
    );

  if (
    stcPmpError > 0.02 ||
    stcVmpError > 0.02 ||
    stcImpError > 0.02 ||
    stcVocError > 0.01 ||
    stcIscError > 0.01
  ) {
    return false;
  }

  const referenceParameters:
    SingleDiodeReferenceParameters =
    {
      photoCurrentRefA:
        candidate
          .photoCurrentRefA,

      saturationCurrentRefA:
        candidate
          .saturationCurrentRefA,

      seriesResistanceOhm:
        candidate
          .seriesResistanceOhm,

      shuntResistanceRefOhm:
        candidate
          .shuntResistanceRefOhm,

      modifiedDiodeFactorRefV:
        candidate
          .modifiedDiodeFactorRefV,
    };

  const temperature =
    evaluateTemperatureCoefficients(
      referenceParameters,
      datasheet,
    );

  const gammaError =
    Math.abs(
      temperature
        .gammaPmaxPercentPerC -
        datasheet
          .tempCoeffPmaxPercentPerC,
    );

  const betaError =
    Math.abs(
      temperature
        .betaVocPercentPerC -
        datasheet
          .tempCoeffVocPercentPerC,
    );

  return (
    gammaError <= 0.05 &&
    betaError <= 0.05
  );
}

function fitReferenceParameters(
  datasheet:
    ModuleDatasheetInput,
): {
  candidate:
    FitCandidate;

  loss:
    number;

  iterations:
    number;
} {
  validateDatasheet(
    datasheet,
  );

  const initialSeriesResistance =
    clamp(
      (
        datasheet.vocV -
        datasheet.vmppV
      ) /
        Math.max(
          datasheet.imppA,
          0.01,
        ) *
        0.3,
      0.05,
      1,
    );

  /*
   * Physics-informed deterministic initial estimate.
   *
   * This is not a manufacturer parameter set. It is only an
   * optimizer starting point derived from the supplied cardinal
   * datasheet values.
   *
   * The final fitted parameters remain subject to the Phase 9N
   * STC and temperature-coefficient validation gates.
   */
  const informedPhotoCurrentRefA =
    datasheet.iscA *
    1.0004;

  const informedModifiedDiodeFactorRefV =
    clamp(
      datasheet.vocV *
        0.0364,
      Math.max(
        0.25,
        datasheet.vocV *
          0.01,
      ),
      Math.max(
        1,
        datasheet.vocV *
          0.12,
      ),
    );

  const informedSeriesResistanceOhm =
    clamp(
      (
        datasheet.vocV -
        datasheet.vmppV
      ) /
        Math.max(
          datasheet.imppA,
          0.01,
        ) *
        0.314,
      0.0001,
      5,
    );

  const informedShuntResistanceRefOhm =
    1_000_000;

  const informedSaturationCurrentRefA =
    clamp(
      (
        informedPhotoCurrentRefA -
        datasheet.vocV /
          informedShuntResistanceRefOhm
      ) /
        Math.max(
          safeExp(
            datasheet.vocV /
              informedModifiedDiodeFactorRefV,
          ) -
            1,
          MIN_POSITIVE,
        ),
      1e-15,
      1e-4,
    );

  const starts:
    FitCandidate[] = [
    {
      photoCurrentRefA:
        informedPhotoCurrentRefA,

      saturationCurrentRefA:
        informedSaturationCurrentRefA,

      seriesResistanceOhm:
        informedSeriesResistanceOhm,

      shuntResistanceRefOhm:
        informedShuntResistanceRefOhm,

      modifiedDiodeFactorRefV:
        informedModifiedDiodeFactorRefV,
    },

    {
      photoCurrentRefA:
        datasheet.iscA *
        1.0005,

      saturationCurrentRefA:
        1e-11,

      seriesResistanceOhm:
        initialSeriesResistance,

      shuntResistanceRefOhm:
        1000,

      modifiedDiodeFactorRefV:
        datasheet.vocV *
        0.036,
    },

    {
      photoCurrentRefA:
        datasheet.iscA *
        1.001,

      saturationCurrentRefA:
        1e-10,

      seriesResistanceOhm:
        initialSeriesResistance *
        0.8,

      shuntResistanceRefOhm:
        5000,

      modifiedDiodeFactorRefV:
        datasheet.vocV *
        0.04,
    },

    {
      photoCurrentRefA:
        datasheet.iscA *
        1.0001,

      saturationCurrentRefA:
        1e-12,

      seriesResistanceOhm:
        initialSeriesResistance *
        1.2,

      shuntResistanceRefOhm:
        50_000,

      modifiedDiodeFactorRefV:
        datasheet.vocV *
        0.032,
    },
  ];

  let globalBest:
    CandidateEvaluation | null =
    null;

  let totalIterations =
    0;

  for (
    const start of starts
  ) {
    let current =
      normalizeCandidate(
        start,
        datasheet,
      );

    let currentLoss =
      candidateLoss(
        current,
        datasheet,
      );

    /*
     * Do not spend hundreds of iterations improving a candidate
     * that already satisfies every Phase 9N scientific gate.
     */
    if (
      candidateMeetsScientificFitGates(
        current,
        datasheet,
      )
    ) {
      return {
        candidate:
          current,

        loss:
          currentLoss,

        iterations:
          totalIterations,
      };
    }

    const steps = {
      photoCurrentRefA:
        Math.max(
          datasheet.iscA *
            0.002,
          0.005,
        ),

      logSaturationCurrent:
        0.7,

      seriesResistanceOhm:
        0.05,

      logShuntResistance:
        0.8,

      modifiedDiodeFactorRefV:
        Math.max(
          datasheet.vocV *
            0.0015,
          0.02,
        ),
    };

    let iterations =
      0;

    for (
      ;
      iterations < 400;
      iterations += 1
    ) {
      let improved =
        false;

      const keys = [
        "photoCurrentRefA",
        "logSaturationCurrent",
        "seriesResistanceOhm",
        "logShuntResistance",
        "modifiedDiodeFactorRefV",
      ] as const;

      for (
        const key of keys
      ) {
        for (
          const direction of [
            -1,
            1,
          ] as const
        ) {
          const trial: FitCandidate =
            {
              ...current,
            };

          if (
            key ===
            "logSaturationCurrent"
          ) {
            trial.saturationCurrentRefA =
              current
                .saturationCurrentRefA *
              Math.exp(
                direction *
                  steps
                    .logSaturationCurrent,
              );
          } else if (
            key ===
            "logShuntResistance"
          ) {
            trial.shuntResistanceRefOhm =
              current
                .shuntResistanceRefOhm *
              Math.exp(
                direction *
                  steps
                    .logShuntResistance,
              );
          } else {
            trial[key] =
              current[key] +
              direction *
                steps[key];
          }

          const normalized =
            normalizeCandidate(
              trial,
              datasheet,
            );

          const loss =
            candidateLoss(
              normalized,
              datasheet,
            );

          if (
            loss <
            currentLoss
          ) {
            current =
              normalized;

            currentLoss =
              loss;

            improved =
              true;
          }
        }
      }

      /*
       * Re-evaluate the authoritative scientific acceptance
       * gates periodically rather than driving the numerical
       * objective toward an unnecessary mathematical minimum.
       */
      if (
        iterations > 0 &&
        iterations % 20 === 0 &&
        candidateMeetsScientificFitGates(
          current,
          datasheet,
        )
      ) {
        break;
      }

      if (
        !improved
      ) {
        steps.photoCurrentRefA *=
          0.7;

        steps.logSaturationCurrent *=
          0.7;

        steps.seriesResistanceOhm *=
          0.7;

        steps.logShuntResistance *=
          0.7;

        steps.modifiedDiodeFactorRefV *=
          0.7;
      }

      if (
        steps
          .photoCurrentRefA <
          1e-7 &&
        steps
          .seriesResistanceOhm <
          1e-7 &&
        steps
          .modifiedDiodeFactorRefV <
          1e-7
      ) {
        break;
      }
    }

    totalIterations +=
      iterations;

    const evaluated: CandidateEvaluation =
      {
        candidate:
          current,

        loss:
          currentLoss,
      };

    if (
      globalBest === null ||
      evaluated.loss <
        globalBest.loss
    ) {
      globalBest =
        evaluated;
    }
  }

  if (
    globalBest === null
  ) {
    throw new Error(
      "Single-diode parameter calibration failed to produce a candidate.",
    );
  }

  return {
    candidate:
      globalBest
        .candidate,

    loss:
      globalBest
        .loss,

    iterations:
      totalIterations,
  };
}

function evaluateTemperatureCoefficients(
  reference:
    SingleDiodeReferenceParameters,
  datasheet:
    ModuleDatasheetInput,
): {
  gammaPmaxPercentPerC:
    number;

  betaVocPercentPerC:
    number;
} {
  /*
   * Manufacturer temperature coefficients are local
   * coefficients referenced to STC.
   *
   * Evaluate the modeled response using a symmetric finite
   * difference around the 25 C reference temperature.
   */
  const deltaC =
    1;

  const coolTemperatureC =
    REFERENCE_TEMPERATURE_C -
    deltaC;

  const hotTemperatureC =
    REFERENCE_TEMPERATURE_C +
    deltaC;

  const referenceParameters =
    translateReferenceParameters(
      reference,
      datasheet,
      REFERENCE_IRRADIANCE_WM2,
      REFERENCE_TEMPERATURE_C,
    );

  const coolParameters =
    translateReferenceParameters(
      reference,
      datasheet,
      REFERENCE_IRRADIANCE_WM2,
      coolTemperatureC,
    );

  const hotParameters =
    translateReferenceParameters(
      reference,
      datasheet,
      REFERENCE_IRRADIANCE_WM2,
      hotTemperatureC,
    );

  const stc =
    solveMaximumPowerPoint(
      referenceParameters,
    );

  const cool =
    solveMaximumPowerPoint(
      coolParameters,
    );

  const hot =
    solveMaximumPowerPoint(
      hotParameters,
    );

  const totalDeltaC =
    hotTemperatureC -
    coolTemperatureC;

  const gammaPmaxPercentPerC =
    stc.powerW > 0
      ? (
          (
            hot.powerW -
            cool.powerW
          ) /
          totalDeltaC
        ) /
        stc.powerW *
        100
      : 0;

  const betaVocPercentPerC =
    stc.vocV > 0
      ? (
          (
            hot.vocV -
            cool.vocV
          ) /
          totalDeltaC
        ) /
        stc.vocV *
        100
      : 0;

  return {
    gammaPmaxPercentPerC,

    betaVocPercentPerC,
  };
}

function calibrateSingleDiodeParametersUncached(
  datasheet:
    ModuleDatasheetInput,
): SingleDiodeFitResult {
  const fit =
    fitReferenceParameters(
      datasheet,
    );

  const reference:
    SingleDiodeReferenceParameters =
    {
      photoCurrentRefA:
        fit.candidate
          .photoCurrentRefA,

      saturationCurrentRefA:
        fit.candidate
          .saturationCurrentRefA,

      seriesResistanceOhm:
        fit.candidate
          .seriesResistanceOhm,

      shuntResistanceRefOhm:
        fit.candidate
          .shuntResistanceRefOhm,

      modifiedDiodeFactorRefV:
        fit.candidate
          .modifiedDiodeFactorRefV,
    };

  const referenceParameters =
    translateReferenceParameters(
      reference,
      datasheet,
      REFERENCE_IRRADIANCE_WM2,
      REFERENCE_TEMPERATURE_C,
    );

  const stc =
    solveMaximumPowerPoint(
      referenceParameters,
    );

  const iscA =
    solveCurrentAtVoltage(
      0,
      referenceParameters,
    );

  const temperature =
    evaluateTemperatureCoefficients(
      reference,
      datasheet,
    );

  const residuals:
    SingleDiodeFitResiduals =
    {
      pmpRelative:
        relativeError(
          stc.powerW,
          datasheet.pmaxW,
        ),

      vmpRelative:
        relativeError(
          stc.voltageV,
          datasheet.vmppV,
        ),

      impRelative:
        relativeError(
          stc.currentA,
          datasheet.imppA,
        ),

      vocRelative:
        relativeError(
          stc.vocV,
          datasheet.vocV,
        ),

      iscRelative:
        relativeError(
          iscA,
          datasheet.iscA,
        ),

      gammaPmaxAbsolutePercentPerC:
        Math.abs(
          temperature
            .gammaPmaxPercentPerC -
            datasheet
              .tempCoeffPmaxPercentPerC,
        ),

      betaVocAbsolutePercentPerC:
        Math.abs(
          temperature
            .betaVocPercentPerC -
            datasheet
              .tempCoeffVocPercentPerC,
        ),
    };

  const warnings:
    string[] =
    [];

  if (
    reference
      .shuntResistanceRefOhm >=
    900_000
  ) {
    warnings.push(
      "Rsh_ref approached the configured fitting upper bound; shunt resistance is weakly identifiable from the available datasheet cardinal points.",
    );
  }

  if (
    datasheet.cellsInSeries ===
    undefined
  ) {
    warnings.push(
      "Effective electrical series-cell count is not available; a_ref is used directly and diode ideality factor is not inferred.",
    );
  }

  const stcPass =
    residuals.pmpRelative <=
      0.02 &&
    residuals.vmpRelative <=
      0.02 &&
    residuals.impRelative <=
      0.02 &&
    residuals.vocRelative <=
      0.01 &&
    residuals.iscRelative <=
      0.01;

  const temperaturePass =
    residuals
      .gammaPmaxAbsolutePercentPerC <=
      0.05 &&
    residuals
      .betaVocAbsolutePercentPerC <=
      0.05;

  const converged =
    stc.converged &&
    Number.isFinite(
      fit.loss,
    );

  const status:
    SingleDiodeFitResult["status"] =
    !converged ||
    !stcPass ||
    !temperaturePass
      ? "FAIL"
      : warnings.length >
          0
        ? "WARNING"
        : "PASS";

  const diodeIdealityFactor =
    datasheet.cellsInSeries !==
      undefined &&
    datasheet.cellsInSeries >
      0
      ? reference
          .modifiedDiodeFactorRefV /
        (
          datasheet
            .cellsInSeries *
          BOLTZMANN_EV_PER_K *
          REFERENCE_TEMPERATURE_K
        )
      : null;

  return {
    status,

    converged,

    iterations:
      fit.iterations,

    parameters:
      reference,

    residuals,

    warnings,

    modelVersion:
      "phase9n-datasheet-calibrated-desoto-v1",

    parameterSourceCategory:
      "calibrated",

    cellsInSeries:
      datasheet.cellsInSeries ??
      null,

    diodeIdealityFactor:
      Number.isFinite(
        diodeIdealityFactor,
      )
        ? diodeIdealityFactor
        : null,
  };
}


const singleDiodeFitCache =
  new Map<
    string,
    SingleDiodeFitResult
  >();

function createSingleDiodeFitCacheKey(
  datasheet:
    ModuleDatasheetInput,
): string {
  return [
    datasheet.pmaxW,
    datasheet.vmppV,
    datasheet.imppA,
    datasheet.vocV,
    datasheet.iscA,
    datasheet.tempCoeffPmaxPercentPerC,
    datasheet.tempCoeffVocPercentPerC,
    datasheet.tempCoeffIscPercentPerC,
    datasheet.cellsInSeries ?? "null",
    datasheet.diodeIdealityFactor ?? "null",
    datasheet.seriesResistanceOhm ?? "null",
    datasheet.shuntResistanceOhm ?? "null",
  ].join("|");
}

export function calibrateSingleDiodeParameters(
  datasheet:
    ModuleDatasheetInput,
): SingleDiodeFitResult {
  const key =
    createSingleDiodeFitCacheKey(
      datasheet,
    );

  const cached =
    singleDiodeFitCache.get(
      key,
    );

  if (
    cached
  ) {
    return cached;
  }

  const calibrated =
    calibrateSingleDiodeParametersUncached(
      datasheet,
    );

  singleDiodeFitCache.set(
    key,
    calibrated,
  );

  return calibrated;
}

export function clearSingleDiodeCalibrationCache(): void {
  singleDiodeFitCache.clear();
}

function createCurve(
  parameters:
    SingleDiodeTranslatedParameters,
  vocV:
    number,
): Array<{
  voltageV:
    number;

  currentA:
    number;

  powerW:
    number;
}> {
  const samples =
    161;

  return Array.from(
    {
      length:
        samples,
    },
    (
      _,
      index,
    ) => {
      const voltageV =
        vocV *
        index /
        (
          samples -
          1
        );

      const currentA =
        solveCurrentAtVoltage(
          voltageV,
          parameters,
        );

      return {
        voltageV,

        currentA,

        powerW:
          voltageV *
          currentA,
      };
    },
  );
}

function singleDiodeOperatingPoint(
  input:
    ModuleOperatingInput,
): ModuleOperatingPoint {
  const irradiance =
    Math.max(
      0,
      input
        .effectiveIrradianceWm2,
    );

  if (
    irradiance <= 0
  ) {
    return {
      model:
        "single_diode",

      irradianceWm2:
        irradiance,

      cellTemperatureC:
        input
          .cellTemperatureC,

      iscA:
        0,

      vocV:
        0,

      impA:
        0,

      vmpV:
        0,

      pmpW:
        0,

      ...(input.includeCurve
        ? {
            ivCurve:
              [],
          }
        : {}),
    };
  }

  const fit =
    calibrateSingleDiodeParameters(
      input.datasheet,
    );

  if (
    fit.status ===
    "FAIL"
  ) {
    throw new Error(
      [
        "Single-diode datasheet calibration failed scientific validation.",
        `Pmp error ${(fit.residuals.pmpRelative * 100).toFixed(3)}%.`,
        `Vmp error ${(fit.residuals.vmpRelative * 100).toFixed(3)}%.`,
        `Imp error ${(fit.residuals.impRelative * 100).toFixed(3)}%.`,
        `Voc error ${(fit.residuals.vocRelative * 100).toFixed(3)}%.`,
        `Isc error ${(fit.residuals.iscRelative * 100).toFixed(3)}%.`,
        `gamma_Pmax error ${fit.residuals.gammaPmaxAbsolutePercentPerC.toFixed(4)} pp/C.`,
        `beta_Voc error ${fit.residuals.betaVocAbsolutePercentPerC.toFixed(4)} pp/C.`,
      ].join(
        " ",
      ),
    );
  }

  const translated =
    translateReferenceParameters(
      fit.parameters,
      input.datasheet,
      irradiance,
      input.cellTemperatureC,
    );

  const mpp =
    solveMaximumPowerPoint(
      translated,
    );

  const iscA =
    solveCurrentAtVoltage(
      0,
      translated,
    );

  return {
    model:
      "single_diode",

    irradianceWm2:
      irradiance,

    cellTemperatureC:
      input
        .cellTemperatureC,

    iscA,

    vocV:
      mpp.vocV,

    impA:
      mpp.currentA,

    vmpV:
      mpp.voltageV,

    pmpW:
      mpp.powerW,

    singleDiodeValidation: {
      status:
        fit.status,

      converged:
        fit.converged,

      optimizerIterationsTotal:
        fit.iterations,

      modelVersion:
        fit.modelVersion,

      parameterSourceCategory:
        fit.parameterSourceCategory,

      parameters: {
        ...fit.parameters,
      },

      residuals: {
        ...fit.residuals,
      },

      cellsInSeries:
        fit.cellsInSeries,

      diodeIdealityFactor:
        fit.diodeIdealityFactor,

      warnings: [
        ...fit.warnings,
      ],
    },

    ...(input.includeCurve
      ? {
          ivCurve:
            createCurve(
              translated,
              mpp.vocV,
            ),
        }
      : {}),
  };
}

function simplePowerOperatingPoint(
  input:
    ModuleOperatingInput,
): ModuleOperatingPoint {
  const datasheet =
    input.datasheet;

  const irradiance =
    Math.max(
      0,
      input
        .effectiveIrradianceWm2,
    );

  const irradianceRatio =
    irradiance /
    REFERENCE_IRRADIANCE_WM2;

  const deltaTemperature =
    input
      .cellTemperatureC -
    REFERENCE_TEMPERATURE_C;

  const temperaturePowerFactor =
    Math.max(
      0,
      1 +
        datasheet
          .tempCoeffPmaxPercentPerC /
          100 *
          deltaTemperature,
    );

  const voltageFactor =
    Math.max(
      0,
      1 +
        datasheet
          .tempCoeffVocPercentPerC /
          100 *
          deltaTemperature,
    );

  const currentFactor =
    Math.max(
      0,
      1 +
        datasheet
          .tempCoeffIscPercentPerC /
          100 *
          deltaTemperature,
    );

  return {
    model:
      "simple_power",

    irradianceWm2:
      irradiance,

    cellTemperatureC:
      input
        .cellTemperatureC,

    iscA:
      datasheet.iscA *
      irradianceRatio *
      currentFactor,

    vocV:
      irradiance > 0
        ? datasheet.vocV *
          voltageFactor
        : 0,

    impA:
      datasheet.imppA *
      irradianceRatio *
      currentFactor,

    vmpV:
      irradiance > 0
        ? datasheet.vmppV *
          voltageFactor
        : 0,

    pmpW:
      datasheet.pmaxW *
      irradianceRatio *
      temperaturePowerFactor,
  };
}

export function calculateModuleOperatingPoint(
  input:
    ModuleOperatingInput,
): ModuleOperatingPoint {
  return input.model ===
    "single_diode"
    ? singleDiodeOperatingPoint(
        input,
      )
    : simplePowerOperatingPoint(
        input,
      );
}

export function calculateColdVoc(
  vocStcV:
    number,
  modulesPerString:
    number,
  betaVocPercentPerC:
    number,
  minimumCellTemperatureC:
    number,
): {
  moduleVocV:
    number;

  stringVocV:
    number;

  criticalTemperatureC:
    number;
} {
  const coefficient =
    betaVocPercentPerC /
    100;

  const moduleVocV =
    vocStcV *
    (
      1 +
      coefficient *
        (
          minimumCellTemperatureC -
          25
        )
    );

  const stringVocV =
    moduleVocV *
    modulesPerString;

  const criticalTemperatureC =
    coefficient === 0
      ? Number.NEGATIVE_INFINITY
      : 25 +
        (
          1000 /
            (
              vocStcV *
              modulesPerString
            ) -
          1
        ) /
          coefficient;

  return {
    moduleVocV,
    stringVocV,
    criticalTemperatureC,
  };
}
