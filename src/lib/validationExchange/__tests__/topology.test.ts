import {
  describe,
  expect,
  it,
} from "vitest";

import {
  serializeElectricalTopologyCsv,
} from "../serializers";

import {
  buildElectricalTopologyRows,
} from "../topology";

describe(
  "validation electrical topology export",
  () => {
    it(
      "expands MPPT assignments into physical strings",
      () => {
        const rows =
          buildElectricalTopologyRows({
            inverterProfileId:
              "sma-core1",
            moduleProfileId:
              "pv-module",
            assignments: [
              {
                inverterIndex: 1,
                mpptIndex: 1,
                stringCount: 2,
                modulesPerString: 17,
              },
              {
                inverterIndex: 1,
                mpptIndex: 2,
                stringCount: 0,
                modulesPerString: 17,
              },
            ],
          });

        expect(rows).toHaveLength(
          3,
        );

        expect(
          rows[0],
        ).toMatchObject({
          inverterIndex: 1,
          mpptIndex: 1,
          stringIndex: 1,
          stringModuleCount: 17,
          allocationStatus:
            "assigned",
        });

        expect(
          rows[1].stringIndex,
        ).toBe(2);

        expect(
          rows[2],
        ).toMatchObject({
          mpptIndex: 2,
          stringIndex: 0,
          stringModuleCount: 0,
          allocationStatus:
            "inactive",
        });

        const csv =
          serializeElectricalTopologyCsv(
            rows,
          );

        expect(csv).toContain(
          "inverter_index,inverter_profile_id,mppt_index",
        );

        expect(csv).toContain(
          "1,sma-core1,1,1,17,17,pv-module,assigned",
        );
      },
    );

    it(
      "rejects duplicate inverter and MPPT assignments",
      () => {
        expect(
          () =>
            buildElectricalTopologyRows({
              inverterProfileId:
                "inverter",
              moduleProfileId:
                "module",
              assignments: [
                {
                  inverterIndex: 1,
                  mpptIndex: 1,
                  stringCount: 1,
                  modulesPerString: 17,
                },
                {
                  inverterIndex: 1,
                  mpptIndex: 1,
                  stringCount: 1,
                  modulesPerString: 17,
                },
              ],
            }),
        ).toThrow(
          "Duplicate topology assignment",
        );
      },
    );
  },
);
