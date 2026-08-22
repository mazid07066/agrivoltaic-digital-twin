import type {
  ElectricalTelemetryProviderKind,
} from "../../types";

import type {
  CanonicalInverterTelemetry,
  InverterTelemetryProvider,
  InverterTelemetryRequest,
} from "../types";

export class UnsupportedInverterTelemetryProvider
  implements InverterTelemetryProvider
{
  constructor(
    public readonly kind:
      ElectricalTelemetryProviderKind,

    public readonly name:
      string,
  ) {}

  async read(
    _request:
      InverterTelemetryRequest,
  ): Promise<
    CanonicalInverterTelemetry
  > {
    void _request;

    throw new Error(
      `${this.name} is defined as a Phase 9E provider boundary but is not implemented yet.`,
    );
  }
}
