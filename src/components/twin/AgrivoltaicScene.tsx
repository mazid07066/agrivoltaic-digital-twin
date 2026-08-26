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
  Camera,
  Eye,
  EyeOff,
  Maximize2,
  RotateCcw,
  Sun,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  Suspense,
  useMemo,
  useRef,
  useState,
} from "react";

import * as THREE from "three";

import ElectricalBosScene from "./electrical/ElectricalBosScene";
import ElectricalStatusPanel from "./electrical/ElectricalStatusPanel";

import {
  calculateLandArrayFootprint,
} from "@/lib/geometry/landArrayFootprint";

import {
  getResearchCameraPosition,
  researchSnapshotBasename,
} from "@/lib/geometry/sceneResearch";

import type {
  ResearchCameraView,
} from "@/lib/geometry/sceneResearch";

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

  const sceneHostRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const sceneCanvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    );

  const [
    cameraView,
    setCameraView,
  ] =
    useState<ResearchCameraView>(
      "perspective",
    );

  const [
    cameraScale,
    setCameraScale,
  ] =
    useState(
      1,
    );

  const [
    cleanScene,
    setCleanScene,
  ] =
    useState(
      false,
    );

  const [
    snapshotStatus,
    setSnapshotStatus,
  ] =
    useState(
      "",
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

  const scaledCameraDistance =
    cameraDistance *
    cameraScale;

  const cameraPosition =
    getResearchCameraPosition(
      scaledCameraDistance,
      cameraView,
    );

  function resetCamera() {
    setCameraView(
      "perspective",
    );

    setCameraScale(
      1,
    );
  }

  async function toggleFullscreen() {
    const host =
      sceneHostRef.current;

    if (!host) {
      return;
    }

    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();
      } else {
        await host.requestFullscreen();
      }
    } catch {
      setSnapshotStatus(
        "Fullscreen is unavailable in this browser.",
      );
    }
  }

  function downloadBlob(
    blob: Blob,
    filename: string,
  ) {
    const url =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        "a",
      );

    anchor.href =
      url;

    anchor.download =
      filename;

    anchor.click();

    window.setTimeout(
      () =>
        URL.revokeObjectURL(
          url,
        ),
      1000,
    );
  }

  function exportResearchSnapshot() {
    const source =
      sceneCanvasRef.current;

    if (
      !source ||
      source.width < 1 ||
      source.height < 1
    ) {
      setSnapshotStatus(
        "The 3D renderer is not ready.",
      );

      return;
    }

    try {
      const output =
        document.createElement(
          "canvas",
        );

      /*
       * UHD/4K landscape output. The lower caption band
       * remains within the 3840 × 2160 publication image.
       */
      output.width =
        3840;

      output.height =
        2160;

      const context =
        output.getContext(
          "2d",
        );

      if (!context) {
        throw new Error(
          "Canvas export context is unavailable.",
        );
      }

      const captionHeight =
        210;

      const figureHeight =
        output.height -
        captionHeight;

      context.fillStyle =
        "#f8fafc";

      context.fillRect(
        0,
        0,
        output.width,
        output.height,
      );

      const scale =
        Math.min(
          output.width /
            source.width,
          figureHeight /
            source.height,
        );

      const renderedWidth =
        source.width *
        scale;

      const renderedHeight =
        source.height *
        scale;

      const offsetX =
        (
          output.width -
          renderedWidth
        ) /
        2;

      const offsetY =
        (
          figureHeight -
          renderedHeight
        ) /
        2;

      context.drawImage(
        source,
        offsetX,
        offsetY,
        renderedWidth,
        renderedHeight,
      );

      context.fillStyle =
        "#0f172a";

      context.fillRect(
        0,
        figureHeight,
        output.width,
        captionHeight,
      );

      context.fillStyle =
        "#f8fafc";

      context.font =
        "600 42px Arial, sans-serif";

      context.fillText(
        configuration.site.name,
        70,
        figureHeight + 68,
      );

      context.fillStyle =
        "#cbd5e1";

      context.font =
        "28px Arial, sans-serif";

      context.fillText(
        [
          `Digital-twin model • ${configuration.simulationDate}`,
          `${String(selectedHour).padStart(2, "0")}:00 ${configuration.site.timezone}`,
          `${configuration.pv.numberOfRows} rows × ${configuration.pv.modulesPerRow} modules`,
          `${(
            configuration.pv.numberOfRows *
            configuration.pv.modulesPerRow *
            configuration.pv.modulePower /
            1000
          ).toFixed(2)} kWp`,
          `${cameraView} view`,
        ].join(
          "   |   ",
        ),
        70,
        figureHeight + 128,
      );

      context.fillStyle =
        "#94a3b8";

      context.font =
        "24px Arial, sans-serif";

      context.fillText(
        "Modeled visualization — not measured imagery. Generated by AgriTwin.",
        70,
        figureHeight + 174,
      );

      const basename =
        researchSnapshotBasename({
          siteName:
            configuration.site.name,

          simulationDate:
            configuration.simulationDate,

          hour:
            selectedHour,

          view:
            cameraView,
        });

      output.toBlob(
        (
          blob,
        ) => {
          if (!blob) {
            setSnapshotStatus(
              "PNG export failed.",
            );

            return;
          }

          downloadBlob(
            blob,
            `${basename}.png`,
          );

          const metadata = {
            schemaVersion:
              1,

            generatedAt:
              new Date().toISOString(),

            artifactType:
              "agritwin-research-scene",

            disclaimer:
              "Modeled visualization; not measured imagery.",

            site: {
              name:
                configuration.site.name,

              latitude:
                configuration.site.latitude,

              longitude:
                configuration.site.longitude,

              timezone:
                configuration.site.timezone,

              fieldLengthM:
                configuration.site.fieldLength,

              fieldWidthM:
                configuration.site.fieldWidth,
            },

            simulation: {
              date:
                configuration.simulationDate,

              hour:
                selectedHour,

              cameraView,

              cleanScene,
            },

            pvArray: {
              moduleProfileId:
                configuration.pv.moduleProfileId,

              numberOfRows:
                configuration.pv.numberOfRows,

              modulesPerRow:
                configuration.pv.modulesPerRow,

              modulePowerW:
                configuration.pv.modulePower,

              installedCapacityKw:
                configuration.pv.numberOfRows *
                configuration.pv.modulesPerRow *
                configuration.pv.modulePower /
                1000,

              rowSpacingM:
                configuration.pv.rowSpacing,

              panelHeightM:
                configuration.pv.panelHeight,

              tiltDeg:
                configuration.pv.tilt,

              azimuthDeg:
                configuration.pv.azimuth,

              trackingMode:
                configuration.pv.trackingMode,
            },

            solarPosition: {
              altitudeDeg:
                solar.altitudeDegrees,

              azimuthDeg:
                solar.azimuthDegrees,

              aboveHorizon:
                solar.isAboveHorizon,
            },

            physicalFootprint: {
              requiredLengthM:
                layout.requiredLengthM,

              requiredWidthM:
                layout.requiredWidthM,

              fitsField:
                layout.fitsField,
            },
          };

          downloadBlob(
            new Blob(
              [
                JSON.stringify(
                  metadata,
                  null,
                  2,
                ),
              ],
              {
                type:
                  "application/json",
              },
            ),
            `${basename}.json`,
          );

          setSnapshotStatus(
            "4K PNG and metadata downloaded.",
          );

          window.setTimeout(
            () =>
              setSnapshotStatus(
                "",
              ),
            4000,
          );
        },
        "image/png",
      );
    } catch {
      setSnapshotStatus(
        "Snapshot export was blocked. Check browser canvas permissions.",
      );
    }
  }

  return (
    <div className="land-scene-stack">
      <div
        ref={
          sceneHostRef
        }
        className={`scene-container scene-research-host ${
          cleanScene
            ? "scene-research-clean"
            : ""
        }`}
      >
        <div
          className="scene-research-toolbar"
          role="toolbar"
          aria-label="3D research scene controls"
        >
          <div className="scene-research-toolbar-group">
            <button
              type="button"
              onClick={() =>
                setCameraView(
                  "perspective",
                )
              }
              className={
                cameraView ===
                "perspective"
                  ? "active"
                  : ""
              }
            >
              3D
            </button>

            <button
              type="button"
              onClick={() =>
                setCameraView(
                  "top",
                )
              }
              className={
                cameraView ===
                "top"
                  ? "active"
                  : ""
              }
            >
              Top
            </button>

            <button
              type="button"
              onClick={() =>
                setCameraView(
                  "front",
                )
              }
              className={
                cameraView ===
                "front"
                  ? "active"
                  : ""
              }
            >
              Front
            </button>

            <button
              type="button"
              onClick={() =>
                setCameraView(
                  "side",
                )
              }
              className={
                cameraView ===
                "side"
                  ? "active"
                  : ""
              }
            >
              Side
            </button>
          </div>

          <div className="scene-research-toolbar-group">
            <button
              type="button"
              title="Zoom in"
              aria-label="Zoom in"
              onClick={() =>
                setCameraScale(
                  (
                    value,
                  ) =>
                    Math.max(
                      0.55,
                      Number(
                        (
                          value -
                          0.15
                        ).toFixed(
                          2,
                        ),
                      ),
                    ),
                )
              }
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              title="Fit scene"
              aria-label="Fit scene"
              onClick={() =>
                setCameraScale(
                  1,
                )
              }
            >
              Fit
            </button>

            <button
              type="button"
              title="Zoom out"
              aria-label="Zoom out"
              onClick={() =>
                setCameraScale(
                  (
                    value,
                  ) =>
                    Math.min(
                      1.8,
                      Number(
                        (
                          value +
                          0.15
                        ).toFixed(
                          2,
                        ),
                      ),
                    ),
                )
              }
            >
              <ZoomOut size={16} />
            </button>

            <button
              type="button"
              title="Reset camera"
              aria-label="Reset camera"
              onClick={
                resetCamera
              }
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="scene-research-toolbar-group">
            <button
              type="button"
              title={
                cleanScene
                  ? "Restore electrical equipment"
                  : "Hide electrical equipment for a clean figure"
              }
              aria-pressed={
                cleanScene
              }
              onClick={() =>
                setCleanScene(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
            >
              {cleanScene ? (
                <Eye size={16} />
              ) : (
                <EyeOff size={16} />
              )}

              Clean
            </button>

            <button
              type="button"
              title="Open fullscreen"
              aria-label="Open fullscreen"
              onClick={
                toggleFullscreen
              }
            >
              <Maximize2 size={16} />
            </button>

            <button
              type="button"
              className="scene-research-export"
              title="Download 4K PNG and JSON metadata"
              onClick={
                exportResearchSnapshot
              }
            >
              <Camera size={16} />
              Export 4K
            </button>
          </div>

          {snapshotStatus ? (
            <span
              className="scene-research-status"
              role="status"
            >
              {snapshotStatus}
            </span>
          ) : null}
        </div>

        <Canvas
          key={`${cameraView}-${cameraScale}-${cleanScene}`}
          shadows
          dpr={[
            1,
            2,
          ]}
          gl={{
            antialias:
              true,

            preserveDrawingBuffer:
              true,

            powerPreference:
              "high-performance",
          }}
          onCreated={(
            state,
          ) => {
            sceneCanvasRef.current =
              state.gl.domElement;
          }}
          camera={{
            position:
              cameraPosition,
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

            {electrical &&
            !cleanScene ? (
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
