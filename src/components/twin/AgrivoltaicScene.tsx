"use client";

import {
  Environment,
  Grid,
  Line,
  OrbitControls,
  Sky,
} from "@react-three/drei";

import {
  Canvas,
} from "@react-three/fiber";

import {
  Sun,
} from "lucide-react";

import {
  Suspense,
  useMemo,
} from "react";

import * as THREE from "three";

import ElectricalBosScene from "./electrical/ElectricalBosScene";
import ElectricalStatusPanel from "./electrical/ElectricalStatusPanel";

import {
  calculateLandArrayFootprint,
} from "@/lib/geometry/landArrayFootprint";

import type {
  LandArrayFootprint,
} from "@/lib/geometry/landArrayFootprint";

import type {
  DemonstrationElectricalTimestep,
} from "@/lib/electrical/demonstration";

import {
  getSolarPosition,
  getSurfaceOrientation,
} from "@/lib/simulation/solarPosition";

import {
  useSimulationStore,
} from "@/store/useSimulationStore";

function rectanglePoints(
  length: number,
  width: number,
  y: number,
): Array<[number, number, number]> {
  const halfLength =
    length / 2;

  const halfWidth =
    width / 2;

  return [
    [
      -halfLength,
      y,
      -halfWidth,
    ],
    [
      halfLength,
      y,
      -halfWidth,
    ],
    [
      halfLength,
      y,
      halfWidth,
    ],
    [
      -halfLength,
      y,
      halfWidth,
    ],
    [
      -halfLength,
      y,
      -halfWidth,
    ],
  ];
}

function PanelRow({
  rowIndex,
  rowPosition,
  trackerAngle,
}: {
  rowIndex: number;
  rowPosition: number;
  trackerAngle: number;
}) {
  const configuration =
    useSimulationStore(
      (state) =>
        state.configuration,
    );

  const {
    pv,
  } = configuration;

  const rowLength =
    pv.modulesPerRow *
    pv.moduleWidth;

  const visualTilt =
    pv.trackingMode === "fixed"
      ? pv.tilt
      : trackerAngle;

  const tiltRadians =
    THREE.MathUtils.degToRad(
      visualTilt,
    );

  const supportPositions =
    rowLength > 8
      ? [
          -rowLength * 0.34,
          0,
          rowLength * 0.34,
        ]
      : [
          -rowLength * 0.3,
          rowLength * 0.3,
        ];

  return (
    <group
      position={[
        0,
        0,
        rowPosition,
      ]}
    >
      {supportPositions.map(
        (
          x,
          index,
        ) => (
          <group
            key={`support-${rowIndex}-${index}`}
          >
            <mesh
              position={[
                x,
                pv.panelHeight / 2,
                0,
              ]}
              castShadow
            >
              <cylinderGeometry
                args={[
                  0.07,
                  0.1,
                  pv.panelHeight,
                  10,
                ]}
              />

              <meshStandardMaterial
                color="#687782"
                metalness={0.55}
                roughness={0.4}
              />
            </mesh>

            <mesh
              position={[
                x,
                0.06,
                0,
              ]}
              receiveShadow
            >
              <cylinderGeometry
                args={[
                  0.18,
                  0.22,
                  0.12,
                  12,
                ]}
              />

              <meshStandardMaterial
                color="#b7bec3"
                roughness={0.85}
              />
            </mesh>
          </group>
        ),
      )}

      <group
        position={[
          0,
          pv.panelHeight,
          0,
        ]}
        rotation={[
          tiltRadians,
          0,
          0,
        ]}
      >
        <mesh
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[
              rowLength,
              0.11,
              pv.moduleLength,
            ]}
          />

          <meshStandardMaterial
            color="#123f63"
            metalness={0.42}
            roughness={0.28}
          />
        </mesh>

        {Array.from({
          length:
            pv.modulesPerRow + 1,
        }).map(
          (
            _,
            index,
          ) => {
            const x =
              -rowLength / 2 +
              (
                index /
                pv.modulesPerRow
              ) *
                rowLength;

            return (
              <mesh
                key={`divider-${rowIndex}-${index}`}
                position={[
                  x,
                  0.061,
                  0,
                ]}
              >
                <boxGeometry
                  args={[
                    0.025,
                    0.014,
                    pv.moduleLength,
                  ]}
                />

                <meshStandardMaterial
                  color="#afc0cc"
                  metalness={0.55}
                />
              </mesh>
            );
          },
        )}

        <mesh
          position={[
            0,
            0.062,
            0,
          ]}
        >
          <boxGeometry
            args={[
              rowLength,
              0.012,
              0.02,
            ]}
          />

          <meshStandardMaterial
            color="#9db0bd"
          />
        </mesh>
      </group>
    </group>
  );
}

function CropRows({
  fieldLength,
  fieldWidth,
}: {
  fieldLength: number;
  fieldWidth: number;
}) {
  const cropId =
    useSimulationStore(
      (state) =>
        state.configuration.cropId,
    );

  const cropRows =
    useMemo(
      () => {
        const spacing = 1.7;

        const columnCount =
          Math.max(
            2,
            Math.min(
              28,
              Math.floor(
                (
                  fieldLength -
                  2
                ) /
                  spacing,
              ),
            ),
          );

        const rowCount =
          Math.max(
            2,
            Math.min(
              24,
              Math.floor(
                (
                  fieldWidth -
                  2
                ) /
                  spacing,
              ),
            ),
          );

        const positions:
          Array<{
            x: number;
            z: number;
          }> = [];

        for (
          let column = 0;
          column < columnCount;
          column += 1
        ) {
          for (
            let row = 0;
            row < rowCount;
            row += 1
          ) {
            positions.push({
              x:
                (
                  column -
                  (
                    columnCount -
                    1
                  ) /
                    2
                ) *
                spacing,

              z:
                (
                  row -
                  (
                    rowCount -
                    1
                  ) /
                    2
                ) *
                spacing,
            });
          }
        }

        return positions;
      },
      [
        fieldLength,
        fieldWidth,
      ],
    );

  const cropColors:
    Record<string, string> = {
      tomato: "#2f9e44",
      lettuce: "#74b816",
      spinach: "#2b8a3e",
      potato: "#5c940d",
      rice: "#94d82d",
      wheat: "#e9b949",
    };

  return (
    <group>
      {cropRows.map(
        (
          position,
          index,
        ) => (
          <group
            key={`crop-${index}`}
            position={[
              position.x,
              0.18,
              position.z,
            ]}
          >
            <mesh
              castShadow
            >
              <cylinderGeometry
                args={[
                  0.03,
                  0.05,
                  0.35,
                  6,
                ]}
              />

              <meshStandardMaterial
                color="#3f6212"
              />
            </mesh>

            <mesh
              position={[
                0,
                0.2,
                0,
              ]}
              castShadow
            >
              <sphereGeometry
                args={[
                  0.13,
                  7,
                  7,
                ]}
              />

              <meshStandardMaterial
                color={
                  cropColors[
                    cropId
                  ] ??
                  "#4d7c0f"
                }
              />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}

function Farm({
  trackerAngleOverride,
  layout,
}: {
  trackerAngleOverride?: number;
  layout: LandArrayFootprint;
}) {
  const configuration =
    useSimulationStore(
      (state) =>
        state.configuration,
    );

  const selectedHour =
    useSimulationStore(
      (state) =>
        state.selectedHour,
    );

  const {
    pv,
    site,
    simulationDate,
  } = configuration;

  const rowPositions =
    useMemo(
      () => {
        const totalWidth =
          Math.max(
            pv.numberOfRows -
              1,
            0,
          ) *
          pv.rowSpacing;

        return Array.from(
          {
            length:
              pv.numberOfRows,
          },
          (
            _,
            index,
          ) =>
            -totalWidth /
              2 +
            index *
              pv.rowSpacing,
        );
      },
      [
        pv.numberOfRows,
        pv.rowSpacing,
      ],
    );

  const solar =
    useMemo(
      () =>
        getSolarPosition(
          simulationDate,
          selectedHour,
          site.latitude,
          site.longitude,
          site.timezone,
        ),
      [
        simulationDate,
        selectedHour,
        site.latitude,
        site.longitude,
        site.timezone,
      ],
    );

  const surface =
    getSurfaceOrientation(
      pv.trackingMode,
      solar,
      pv.tilt,
      pv.azimuth,
      pv.maximumTrackerAngle,
    );

  const displayedTrackerAngle =
    trackerAngleOverride ??
    surface.trackerAngle;

  return (
    <>
      <ambientLight
        intensity={
          solar.isAboveHorizon
            ? 0.58
            : 0.1
        }
      />

      {solar.isAboveHorizon ? (
        <directionalLight
          position={
            solar.threePosition
          }
          intensity={
            Math.max(
              0.65,
              Math.sin(
                solar.altitudeRadians,
              ) *
                3.2,
            )
          }
          castShadow
          shadow-mapSize-width={
            2048
          }
          shadow-mapSize-height={
            2048
          }
          shadow-camera-left={
            -layout.sceneLengthM /
            2
          }
          shadow-camera-right={
            layout.sceneLengthM /
            2
          }
          shadow-camera-top={
            layout.sceneWidthM /
            2
          }
          shadow-camera-bottom={
            -layout.sceneWidthM /
            2
          }
        />
      ) : null}

      <Sky
        sunPosition={
          solar.threePosition
        }
        turbidity={6}
        rayleigh={1.5}
      />

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        receiveShadow
        position={[
          0,
          -0.05,
          0,
        ]}
      >
        <planeGeometry
          args={[
            layout.sceneLengthM,
            layout.sceneWidthM,
          ]}
        />

        <meshStandardMaterial
          color="#d8dfd2"
          roughness={1}
        />
      </mesh>

      {!layout.fitsField ? (
        <>
          <mesh
            rotation={[
              -Math.PI / 2,
              0,
              0,
            ]}
            receiveShadow
            position={[
              0,
              -0.035,
              0,
            ]}
          >
            <planeGeometry
              args={[
                layout.requiredLengthM,
                layout.requiredWidthM,
              ]}
            />

            <meshStandardMaterial
              color="#d9b96e"
              transparent
              opacity={0.34}
              roughness={1}
            />
          </mesh>

          <Line
            points={rectanglePoints(
              layout.requiredLengthM,
              layout.requiredWidthM,
              0.035,
            )}
            color="#b7791f"
            lineWidth={1.5}
          />
        </>
      ) : null}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        receiveShadow
        position={[
          0,
          -0.02,
          0,
        ]}
      >
        <planeGeometry
          args={[
            layout.fieldLengthM,
            layout.fieldWidthM,
          ]}
        />

        <meshStandardMaterial
          color="#89ad68"
          roughness={0.96}
        />
      </mesh>

      <Line
        points={rectanglePoints(
          layout.fieldLengthM,
          layout.fieldWidthM,
          0.04,
        )}
        color="#315b39"
        lineWidth={2}
      />

      <CropRows
        fieldLength={
          layout.fieldLengthM
        }
        fieldWidth={
          layout.fieldWidthM
        }
      />

      {rowPositions.map(
        (
          rowPosition,
          index,
        ) => (
          <PanelRow
            key={`panel-row-${index}`}
            rowIndex={index}
            rowPosition={
              rowPosition
            }
            trackerAngle={
              displayedTrackerAngle
            }
          />
        ),
      )}

      <Grid
        position={[
          0,
          0.015,
          0,
        ]}
        args={[
          layout.fieldLengthM,
          layout.fieldWidthM,
        ]}
        cellSize={1}
        cellThickness={0.35}
        cellColor="#58784f"
        sectionSize={4}
        sectionThickness={0.75}
        sectionColor="#355e3b"
        fadeDistance={
          Math.max(
            layout.fieldLengthM,
            layout.fieldWidthM,
          ) *
          1.4
        }
        fadeStrength={1}
        infiniteGrid={false}
      />

      {solar.isAboveHorizon ? (
        <Environment
          preset="sunset"
        />
      ) : null}
    </>
  );
}

export default function AgrivoltaicScene({
  trackerAngle,
  electrical,
}: {
  trackerAngle?: number;
  electrical?: DemonstrationElectricalTimestep;
}) {
  const configuration =
    useSimulationStore(
      (state) =>
        state.configuration,
    );

  const selectedHour =
    useSimulationStore(
      (state) =>
        state.selectedHour,
    );

  const layout =
    useMemo(
      () =>
        calculateLandArrayFootprint({
          fieldLengthM:
            configuration.site
              .fieldLength,

          fieldWidthM:
            configuration.site
              .fieldWidth,

          numberOfRows:
            configuration.pv
              .numberOfRows,

          modulesPerRow:
            configuration.pv
              .modulesPerRow,

          rowSpacingM:
            configuration.pv
              .rowSpacing,

          moduleWidthM:
            configuration.pv
              .moduleWidth,

          moduleLengthM:
            configuration.pv
              .moduleLength,
        }),
      [
        configuration.site
          .fieldLength,

        configuration.site
          .fieldWidth,

        configuration.pv
          .numberOfRows,

        configuration.pv
          .modulesPerRow,

        configuration.pv
          .rowSpacing,

        configuration.pv
          .moduleWidth,

        configuration.pv
          .moduleLength,
      ],
    );

  const solar =
    useMemo(
      () =>
        getSolarPosition(
          configuration.simulationDate,
          selectedHour,
          configuration.site
            .latitude,
          configuration.site
            .longitude,
          configuration.site
            .timezone,
        ),
      [
        configuration,
        selectedHour,
      ],
    );

  const bosOffsetZ =
    -Math.max(
      layout.fieldWidthM,
      layout.requiredWidthM,
    ) /
      2 -
    15;

  const cameraDistance =
    Math.max(
      34,
      Math.max(
        layout.sceneLengthM,
        layout.sceneWidthM,
      ) *
        1.05,
    );

  return (
    <div className="land-scene-stack">
      <div className="scene-container">
        <Canvas
          shadows
          camera={{
            position: [
              cameraDistance * 0.62,
              cameraDistance * 0.48,
              cameraDistance * 0.72,
            ],
            fov: 43,
            near: 0.1,
            far:
              Math.max(
                300,
                cameraDistance * 6,
              ),
          }}
        >
          <Suspense
            fallback={null}
          >
            <Farm
              trackerAngleOverride={
                trackerAngle
              }
              layout={layout}
            />

            {electrical ? (
              <group
                position={[
                  0,
                  0,
                  bosOffsetZ,
                ]}
              >
                <ElectricalBosScene
                  data={electrical}
                />
              </group>
            ) : null}

            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.08}
              minDistance={10}
              maxDistance={
                Math.max(
                  layout.sceneLengthM,
                  layout.sceneWidthM,
                ) *
                2.2
              }
              maxPolarAngle={
                Math.PI / 2.05
              }
              target={[
                0,
                1,
                0,
              ]}
            />
          </Suspense>
        </Canvas>

        <div className="scene-help">
          Drag to rotate • Scroll to zoom • Right-drag to move
        </div>

        <div className="solar-position-badge">
          <Sun size={15} />

          <div>
            <strong>
              Altitude:{" "}
              {solar.altitudeDegrees.toFixed(
                1,
              )}
              °
            </strong>

            <span>
              Azimuth:{" "}
              {solar.azimuthDegrees.toFixed(
                1,
              )}
              ° •{" "}
              {solar.isAboveHorizon
                ? "Above horizon"
                : "Below horizon"}
            </span>
          </div>
        </div>

        {!layout.fitsField ? (
          <div
            className="scene-geometry-warning"
            role="status"
          >
            <strong>
              Array exceeds the registered field
            </strong>

            <span>
              Field{" "}
              {layout.fieldLengthM.toFixed(
                1,
              )}
              {" × "}
              {layout.fieldWidthM.toFixed(
                1,
              )}
              {" m; array footprint "}
              {layout.requiredLengthM.toFixed(
                1,
              )}
              {" × "}
              {layout.requiredWidthM.toFixed(
                1,
              )}
              {" m. Recommended field: "}
              {
                layout.recommendedFieldLengthM
              }
              {" × "}
              {
                layout.recommendedFieldWidthM
              }
              {" m or larger."}
            </span>
          </div>
        ) : null}
      </div>

      {electrical ? (
        <ElectricalStatusPanel
          data={electrical}
          embedded
        />
      ) : null}
    </div>
  );
}
