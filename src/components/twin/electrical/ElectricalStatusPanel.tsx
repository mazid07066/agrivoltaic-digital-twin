"use client";

import type {
  DemonstrationElectricalTimestep,
} from "@/lib/electrical/demonstration";

export default function ElectricalStatusPanel({
  data,
  embedded = false,
}: {
  data:
    DemonstrationElectricalTimestep;

  embedded?: boolean;
}) {
  const {
    inverter,
    distribution,
  } =
    data;

  const dcVoltage =
    inverter.dcInput
      .voltageV
      .value;

  const dcCurrent =
    inverter.dcInput
      .currentA
      .value;

  return (
    <aside
      className={
        embedded
          ? "electrical-status-panel electrical-status-panel-embedded"
          : "electrical-status-panel"
      }
    >
      <div className="electrical-status-heading">
        <div>
          <span>
            Electrical BOS
          </span>

          <strong>
            {
              inverter
                .state
            }
          </strong>
        </div>

        <small>
          Phase 9E
        </small>
      </div>

      <div className="electrical-status-grid">
        <div>
          <span>
            PV input
          </span>

          <strong>
            {
              inverter
                .dcInput
                .availablePowerKw
                .value
                .toFixed(
                  2,
                )
            }{" "}
            kW
          </strong>
        </div>

        <div>
          <span>
            Vdc
          </span>

          <strong>
            {
              dcVoltage ===
              null
                ? "—"
                : dcVoltage.toFixed(
                    0,
                  )
            }{" "}
            V
          </strong>
        </div>

        <div>
          <span>
            Idc
          </span>

          <strong>
            {
              dcCurrent ===
              null
                ? "—"
                : dcCurrent.toFixed(
                    2,
                  )
            }{" "}
            A
          </strong>
        </div>

        <div>
          <span>
            AC output
          </span>

          <strong>
            {
              inverter.ac
                .activePowerKw
                .toFixed(
                  2,
                )
            }{" "}
            kW
          </strong>
        </div>

        <div>
          <span>
            VLL
          </span>

          <strong>
            {
              inverter.ac
                .lineLineVoltageV
                .toFixed(
                  0,
                )
            }{" "}
            V
          </strong>
        </div>

        <div>
          <span>
            AC current
          </span>

          <strong>
            {
              inverter.ac
                .lineCurrentA
                .toFixed(
                  2,
                )
            }{" "}
            A
          </strong>
        </div>

        <div>
          <span>
            Local load
          </span>

          <strong>
            {
              distribution
                .totalServedLoadKw
                .toFixed(
                  1,
                )
            }{" "}
            kW
          </strong>
        </div>

        <div>
          <span>
            Grid
          </span>

          <strong>
            {
              distribution
                .gridExportKw >
              0
                ? `Export ${distribution.gridExportKw.toFixed(1)} kW`
                : `Import ${distribution.gridImportKw.toFixed(1)} kW`
            }
          </strong>
        </div>
      </div>

      <div className="electrical-mppt-strip">
        {
          inverter.dcInput
            .mppts
            .map(
              (
                mppt,
              ) => (
                <div
                  key={
                    mppt.mpptIndex
                  }
                >
                  <span>
                    M{
                      mppt.mpptIndex
                    }
                  </span>

                  <strong>
                    {
                      (
                        mppt
                          .powerKw
                          .value ??
                        0
                      ).toFixed(
                        1,
                      )
                    }
                  </strong>
                </div>
              ),
            )
        }
      </div>

      <div className="electrical-balance-row">
        <span>
          Balance
        </span>

        <strong>
          {
            distribution
              .balanceWithinTolerance
              ? "PASS"
              : "CHECK"
          }
        </strong>

        <span>
          PF{" "}
          {
            inverter.ac
              .powerFactor
              .toFixed(
                2,
              )
          }
        </span>

        <span>
          {
            inverter.ac
              .frequencyHz
          }{" "}
          Hz
        </span>
      </div>
    </aside>
  );
}
