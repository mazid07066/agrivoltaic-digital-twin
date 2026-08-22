import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "./catalogue";

/**
 * Backward-compatible Phase 9E export.
 *
 * Phase 9E originally used one hard-coded demonstration
 * inverter. The specification now comes from the inverter
 * catalogue while preserving the original export name.
 */
export const PHASE_9E_DEMONSTRATION_INVERTER =
  getInverterProfile(
    DEFAULT_INVERTER_PROFILE_ID,
  );
