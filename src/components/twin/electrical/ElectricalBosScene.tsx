"use client";

import {
  Html,
  Line,
} from "@react-three/drei";

import {
  useFrame,
} from "@react-three/fiber";

import {
  useRef,
} from "react";

import * as THREE from "three";

import type {
  DemonstrationElectricalTimestep,
} from "@/lib/electrical/demonstration";

type Point3 = [
  number,
  number,
  number,
];

const COLORS = {
  inverterBody:
    "#d8eee8",

  inverterAccent:
    "#0f766e",

  inverterDark:
    "#134e4a",

  distributionBody:
    "#dbe7f2",

  distributionAccent:
    "#1e3a5f",

  loadBody:
    "#f5efe3",

  loadAccent:
    "#b7791f",

  grid:
    "#4c4f69",

  dc:
    "#e39a26",

  ac:
    "#3182a8",

  gridImport:
    "#6d5cae",

  gridExport:
    "#15856d",

  inactive:
    "#94a3b8",

  concrete:
    "#cbd1d4",
};

function EquipmentPad() {
  return (
    <group>
      <mesh
        position={[
          15.5,
          0.06,
          4.5,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[
            15,
            0.12,
            10,
          ]}
        />

        <meshStandardMaterial
          color={
            COLORS.concrete
          }
          roughness={0.9}
        />
      </mesh>

      <Line
        points={[
          [
            8.2,
            0.13,
            -0.1,
          ],
          [
            22.8,
            0.13,
            -0.1,
          ],
          [
            22.8,
            0.13,
            9.1,
          ],
          [
            8.2,
            0.13,
            9.1,
          ],
          [
            8.2,
            0.13,
            -0.1,
          ],
        ]}
        color="#a4aaad"
        lineWidth={1}
      />
    </group>
  );
}

function FlowParticle({
  from,
  to,
  active,
  color,
  reverse = false,
}: {
  from:
    Point3;

  to:
    Point3;

  active:
    boolean;

  color:
    string;

  reverse?:
    boolean;
}) {
  const ref =
    useRef<THREE.Mesh>(
      null,
    );

  useFrame(() => {
    if (
      !ref.current ||
      !active
    ) {
      return;
    }

    let progress =
      (
        performance.now() /
        3000
      ) %
      1;

    if (
      reverse
    ) {
      progress =
        1 -
        progress;
    }

    ref.current.position.set(
      THREE.MathUtils.lerp(
        from[0],
        to[0],
        progress,
      ),

      THREE.MathUtils.lerp(
        from[1],
        to[1],
        progress,
      ),

      THREE.MathUtils.lerp(
        from[2],
        to[2],
        progress,
      ),
    );
  });

  if (
    !active
  ) {
    return null;
  }

  return (
    <mesh
      ref={ref}
      position={from}
    >
      <sphereGeometry
        args={[
          0.09,
          10,
          10,
        ]}
      />

      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
      />
    </mesh>
  );
}

function PowerPath({
  from,
  to,
  active,
  color,
  reverse = false,
}: {
  from:
    Point3;

  to:
    Point3;

  active:
    boolean;

  color:
    string;

  reverse?:
    boolean;
}) {
  return (
    <>
      <Line
        points={[
          from,
          to,
        ]}
        color={
          active
            ? color
            : COLORS.inactive
        }
        lineWidth={
          active
            ? 2.2
            : 1
        }
      />

      <FlowParticle
        from={from}
        to={to}
        active={active}
        color={color}
        reverse={reverse}
      />
    </>
  );
}

function EquipmentLabel({
  title,
  subtitle,
  color,
}: {
  title:
    string;

  subtitle?:
    string;

  color:
    string;
}) {
  return (
    <div
      className="electrical-3d-label"
      style={{
        borderTop:
          `3px solid ${color}`,
      }}
    >
      <strong>
        {title}
      </strong>

      {subtitle ? (
        <span>
          {subtitle}
        </span>
      ) : null}
    </div>
  );
}

function InverterCabinet({
  data,
  position,
}: {
  data:
    DemonstrationElectricalTimestep;

  position:
    Point3;
}) {
  const active =
    data.inverter
      .state !==
      "OFF" &&
    data.inverter
      .state !==
      "FAULT";

  const mpptCount =
    data.equipment
      ?.independentMpptInputs ??
    data.inverter
      .dcInput
      .mppts
      .length;

  return (
    <group
      position={position}
    >
      <mesh
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[
            2.8,
            3.3,
            1.45,
          ]}
        />

        <meshStandardMaterial
          color={
            active
              ? COLORS.inverterBody
              : "#c7ced1"
          }
          metalness={0.28}
          roughness={0.36}
        />
      </mesh>

      <mesh
        position={[
          0,
          0,
          0.74,
        ]}
      >
        <boxGeometry
          args={[
            2.35,
            2.6,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#edf7f4"
        />
      </mesh>

      <mesh
        position={[
          0,
          0.82,
          0.81,
        ]}
      >
        <boxGeometry
          args={[
            1.55,
            0.56,
            0.07,
          ]}
        />

        <meshStandardMaterial
          color={
            COLORS.inverterDark
          }
          emissive={
            active
              ? COLORS.inverterAccent
              : "#1f2937"
          }
          emissiveIntensity={
            active
              ? 0.45
              : 0.05
          }
        />
      </mesh>

      {Array.from({
        length:
          mpptCount,
      }).map(
        (
          _,
          index,
        ) => {
          const x =
            -0.75 +
            (
              index %
              3
            ) *
              0.75;

          const y =
            -0.25 -
            Math.floor(
              index /
              3,
            ) *
              0.58;

          return (
            <mesh
              key={
                `mppt-${index}`
              }
              position={[
                x,
                y,
                0.82,
              ]}
            >
              <boxGeometry
                args={[
                  0.42,
                  0.3,
                  0.06,
                ]}
              />

              <meshStandardMaterial
                color={
                  active
                    ? COLORS.inverterAccent
                    : COLORS.inactive
                }
              />
            </mesh>
          );
        },
      )}

      <mesh
        position={[
          0,
          -1.72,
          0,
        ]}
      >
        <boxGeometry
          args={[
            2.2,
            0.18,
            1.1,
          ]}
        />

        <meshStandardMaterial
          color="#64748b"
          metalness={0.5}
        />
      </mesh>

      <Html
        position={[
          0,
          2.15,
          0,
        ]}
        center
        distanceFactor={13}
      >
        <EquipmentLabel
          title="PV Inverter"
          subtitle={`${data.equipment?.ratedActivePowerKw ?? 50} kW • ${mpptCount} MPPT • ${data.inverter.state}`}
          color={
            COLORS.inverterAccent
          }
        />
      </Html>
    </group>
  );
}

function DistributionBoard({
  position,
}: {
  position:
    Point3;
}) {
  return (
    <group
      position={position}
    >
      <mesh
        castShadow
      >
        <boxGeometry
          args={[
            2.45,
            2.7,
            1.25,
          ]}
        />

        <meshStandardMaterial
          color={
            COLORS.distributionBody
          }
          metalness={0.3}
          roughness={0.38}
        />
      </mesh>

      <mesh
        position={[
          0,
          0,
          0.65,
        ]}
      >
        <boxGeometry
          args={[
            2,
            2.15,
            0.06,
          ]}
        />

        <meshStandardMaterial
          color="#eef4fa"
        />
      </mesh>

      {[
        -0.55,
        0,
        0.55,
      ].map(
        (
          x,
          index,
        ) => (
          <mesh
            key={
              `breaker-${index}`
            }
            position={[
              x,
              0,
              0.71,
            ]}
          >
            <boxGeometry
              args={[
                0.28,
                1.1,
                0.08,
              ]}
            />

            <meshStandardMaterial
              color={
                COLORS.distributionAccent
              }
            />
          </mesh>
        ),
      )}

      <Html
        position={[
          0,
          1.8,
          0,
        ]}
        center
        distanceFactor={13}
      >
        <EquipmentLabel
          title="Main AC Board"
          subtitle="3Φ • 230/400 V"
          color={
            COLORS.distributionAccent
          }
        />
      </Html>
    </group>
  );
}

function FeederCabinet({
  position,
  name,
  powerKw,
}: {
  position:
    Point3;

  name:
    string;

  powerKw:
    number;
}) {
  return (
    <group
      position={position}
    >
      <mesh
        castShadow
      >
        <boxGeometry
          args={[
            1.85,
            1.55,
            1.3,
          ]}
        />

        <meshStandardMaterial
          color={
            COLORS.loadBody
          }
          roughness={0.48}
        />
      </mesh>

      <mesh
        position={[
          0,
          0,
          0.67,
        ]}
      >
        <boxGeometry
          args={[
            1.25,
            0.58,
            0.05,
          ]}
        />

        <meshStandardMaterial
          color={
            COLORS.loadAccent
          }
        />
      </mesh>

      <Html
        position={[
          0,
          1.22,
          0,
        ]}
        center
        distanceFactor={12}
      >
        <EquipmentLabel
          title={name}
          subtitle={`${powerKw.toFixed(1)} kW`}
          color={
            COLORS.loadAccent
          }
        />
      </Html>
    </group>
  );
}

function UtilityGrid({
  position,
  importing,
  exporting,
}: {
  position:
    Point3;

  importing:
    boolean;

  exporting:
    boolean;
}) {
  const accent =
    importing
      ? COLORS.gridImport
      : exporting
        ? COLORS.gridExport
        : COLORS.grid;

  return (
    <group
      position={position}
    >
      <mesh
        castShadow
      >
        <cylinderGeometry
          args={[
            0.13,
            0.2,
            5,
            10,
          ]}
        />

        <meshStandardMaterial
          color={
            COLORS.grid
          }
          metalness={0.55}
        />
      </mesh>

      <mesh
        position={[
          0,
          1.65,
          0,
        ]}
      >
        <boxGeometry
          args={[
            3,
            0.12,
            0.16,
          ]}
        />

        <meshStandardMaterial
          color={
            accent
          }
        />
      </mesh>

      <Html
        position={[
          0,
          3.15,
          0,
        ]}
        center
        distanceFactor={13}
      >
        <EquipmentLabel
          title="Utility Grid"
          subtitle={
            importing
              ? "Import"
              : exporting
                ? "Export"
                : "Standby"
          }
          color={accent}
        />
      </Html>
    </group>
  );
}

export default function ElectricalBosScene({
  data,
  position = [0, 0, 0],
  scale = 1,
  rotationY = 0,
}: {
  data:
    DemonstrationElectricalTimestep;

  position?: Point3;

  scale?: number;

  rotationY?: number;
}) {
  const pvConnection:
    Point3 =
    [
      8,
      1,
      6,
    ];

  const inverter:
    Point3 =
    [
      11,
      1.7,
      6,
    ];

  const mainBoard:
    Point3 =
    [
      15,
      1.4,
      6,
    ];

  const feeder1:
    Point3 =
    [
      12,
      0.85,
      1.5,
    ];

  const feeder2:
    Point3 =
    [
      15,
      0.85,
      1.5,
    ];

  const feeder3:
    Point3 =
    [
      18,
      0.85,
      1.5,
    ];

  const grid:
    Point3 =
    [
      21,
      2.5,
      6,
    ];

  const dcActive =
    data.inverter
      .dcInput
      .availablePowerKw
      .value >
    0;

  const acActive =
    data.inverter
      .ac
      .activePowerKw >
    0;

  const importing =
    data.distribution
      .gridImportKw >
    0;

  const exporting =
    data.distribution
      .gridExportKw >
    0;

  const gridColor =
    importing
      ? COLORS.gridImport
      : COLORS.gridExport;

  return (
    <group
      position={position}
      scale={scale}
      rotation={[
        0,
        rotationY,
        0,
      ]}
    >
      <EquipmentPad />

      <Html
        position={[
          pvConnection[0],
          pvConnection[1] + 1.25,
          pvConnection[2],
        ]}
        center
        distanceFactor={13}
      >
        <EquipmentLabel
          title="PV Array"
          subtitle={
            data.equipment?.moduleCount != null
              ? `${data.equipment.moduleCount} modules`
              : "Module count unavailable"
          }
          color={COLORS.dc}
        />
      </Html>

      <InverterCabinet
        position={
          inverter
        }
        data={data}
      />

      <DistributionBoard
        position={
          mainBoard
        }
      />

      <FeederCabinet
        position={
          feeder1
        }
        name="Feeder 1"
        powerKw={
          data.distribution
            .feeders[0]
            ?.servedLoadKw ??
          0
        }
      />

      <FeederCabinet
        position={
          feeder2
        }
        name="Feeder 2"
        powerKw={
          data.distribution
            .feeders[1]
            ?.servedLoadKw ??
          0
        }
      />

      <FeederCabinet
        position={
          feeder3
        }
        name="Feeder 3"
        powerKw={
          data.distribution
            .feeders[2]
            ?.servedLoadKw ??
          0
        }
      />

      <UtilityGrid
        position={grid}
        importing={importing}
        exporting={exporting}
      />

      <PowerPath
        from={
          pvConnection
        }
        to={
          inverter
        }
        active={
          dcActive
        }
        color={
          COLORS.dc
        }
      />

      <PowerPath
        from={
          inverter
        }
        to={
          mainBoard
        }
        active={
          acActive
        }
        color={
          COLORS.ac
        }
      />

      <PowerPath
        from={
          mainBoard
        }
        to={
          feeder1
        }
        active={
          data.distribution
            .feeders[0]
            ?.servedLoadKw >
          0
        }
        color={
          COLORS.ac
        }
      />

      <PowerPath
        from={
          mainBoard
        }
        to={
          feeder2
        }
        active={
          data.distribution
            .feeders[1]
            ?.servedLoadKw >
          0
        }
        color={
          COLORS.ac
        }
      />

      <PowerPath
        from={
          mainBoard
        }
        to={
          feeder3
        }
        active={
          data.distribution
            .feeders[2]
            ?.servedLoadKw >
          0
        }
        color={
          COLORS.ac
        }
      />

      <PowerPath
        from={
          mainBoard
        }
        to={
          grid
        }
        active={
          importing ||
          exporting
        }
        reverse={
          importing
        }
        color={
          gridColor
        }
      />
    </group>
  );
}
