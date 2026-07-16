"use client";
import { Sun } from "lucide-react";
import { getSolarPosition, getSurfaceOrientation } from "@/lib/simulation/solarPosition";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Grid,
  OrbitControls,
  Sky,
} from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/store/useSimulationStore";

function PanelRow({
  rowIndex,
  rowPosition,
  trackerAngle,
}: {
  rowIndex: number;
  rowPosition: number;
  trackerAngle: number;
}) {
  const configuration = useSimulationStore(
    (state) => state.configuration,
  );

  const { pv } = configuration;

  const rowLength = Math.min(
    pv.modulesPerRow * pv.moduleWidth,
    36,
  );

  const visualTilt = pv.trackingMode === "fixed" ? pv.tilt : trackerAngle;
  const tiltRadians = THREE.MathUtils.degToRad(visualTilt);

  return (
    <group
      position={[0, pv.panelHeight, rowPosition]}
      rotation={[tiltRadians, 0, 0]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[rowLength, 0.12, pv.moduleLength]} />
        <meshStandardMaterial
          color="#0b3d5c"
          metalness={0.45}
          roughness={0.3}
        />
      </mesh>

      {Array.from({ length: pv.modulesPerRow + 1 }).map(
        (_, index) => {
          const x =
            -rowLength / 2 +
            (index / pv.modulesPerRow) * rowLength;

          return (
            <mesh
              key={`divider-${rowIndex}-${index}`}
              position={[x, 0.065, 0]}
            >
              <boxGeometry
                args={[0.025, 0.015, pv.moduleLength]}
              />
              <meshStandardMaterial color="#9fb4c4" />
            </mesh>
          );
        },
      )}

      <mesh position={[0, -pv.panelHeight / 2, 0]}>
        <cylinderGeometry
          args={[0.08, 0.1, pv.panelHeight, 10]}
        />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
    </group>
  );
}

function CropRows() {
  const configuration = useSimulationStore(
    (state) => state.configuration,
  );

  const cropRows = useMemo(() => {
    const rows: Array<{ x: number; z: number }> = [];

    for (let x = -17; x <= 17; x += 1.6) {
      for (let z = -9; z <= 9; z += 1.6) {
        rows.push({ x, z });
      }
    }

    return rows;
  }, []);

  const cropColors: Record<string, string> = {
    tomato: "#2f9e44",
    lettuce: "#74b816",
    spinach: "#2b8a3e",
    potato: "#5c940d",
    rice: "#94d82d",
    wheat: "#e9b949",
  };

  return (
    <group>
      {cropRows.map((position, index) => (
        <group
          key={`crop-${index}`}
          position={[position.x, 0.18, position.z]}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.05, 0.35, 6]} />
            <meshStandardMaterial color="#3f6212" />
          </mesh>

          <mesh position={[0, 0.2, 0]} castShadow>
            <sphereGeometry args={[0.13, 7, 7]} />
            <meshStandardMaterial
              color={
                cropColors[configuration.cropId] ?? "#4d7c0f"
              }
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Farm({ trackerAngleOverride }: { trackerAngleOverride?: number }) {
  const configuration = useSimulationStore(
    (state) => state.configuration,
  );
  const selectedHour = useSimulationStore(
    (state) => state.selectedHour,
  );

  const { pv, site, simulationDate } = configuration;

  const rowPositions = useMemo(() => {
    const totalWidth =
      Math.max(pv.numberOfRows - 1, 0) * pv.rowSpacing;

    return Array.from(
      { length: pv.numberOfRows },
      (_, index) => -totalWidth / 2 + index * pv.rowSpacing,
    );
  }, [pv.numberOfRows, pv.rowSpacing]);

  const solar = useMemo(() => getSolarPosition(
    simulationDate, selectedHour, site.latitude, site.longitude, site.timezone,
  ), [simulationDate, selectedHour, site.latitude, site.longitude, site.timezone]);
  const surface = getSurfaceOrientation(
    pv.trackingMode, solar, pv.tilt, pv.azimuth, pv.maximumTrackerAngle,
  );
  const displayedTrackerAngle = trackerAngleOverride ?? surface.trackerAngle;

  return (
    <>
      <ambientLight intensity={solar.isAboveHorizon ? 0.55 : 0.08} />

      {solar.isAboveHorizon && <directionalLight
        position={solar.threePosition}
        intensity={Math.max(0.6, Math.sin(solar.altitudeRadians) * 3.2)}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />}

      <Sky
        sunPosition={solar.threePosition}
        turbidity={6}
        rayleigh={1.5}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, -0.02, 0]}
      >
        <planeGeometry args={[44, 24]} />
        <meshStandardMaterial color="#7a9b57" />
      </mesh>

      <CropRows />

      {rowPositions.map((rowPosition, index) => (
        <PanelRow
          key={`panel-row-${index}`}
          rowIndex={index}
          rowPosition={rowPosition}
          trackerAngle={displayedTrackerAngle}
        />
      ))}

      <Grid
        position={[0, 0.015, 0]}
        args={[44, 24]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#50734a"
        sectionSize={4}
        sectionThickness={0.8}
        sectionColor="#355e3b"
        fadeDistance={45}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {solar.isAboveHorizon && <Environment preset="sunset" />}
    </>
  );
}

export default function AgrivoltaicScene({ trackerAngle }: { trackerAngle?: number }) {
  const configuration = useSimulationStore((state) => state.configuration);
  const selectedHour = useSimulationStore((state) => state.selectedHour);
  const solar = useMemo(() => getSolarPosition(
    configuration.simulationDate, selectedHour,
    configuration.site.latitude, configuration.site.longitude,
    configuration.site.timezone,
  ), [configuration, selectedHour]);
  return (
    <div className="scene-container">
      <Canvas
        shadows
        camera={{
          position: [22, 17, 25],
          fov: 45,
          near: 0.1,
          far: 200,
        }}
      >
        <Suspense fallback={null}>
          <Farm trackerAngleOverride={trackerAngle} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={10}
            maxDistance={70}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 1, 0]}
          />
        </Suspense>
      </Canvas>

      <div className="scene-help">
        Drag to rotate • Scroll to zoom • Right-drag to move
      </div>
      <div className="solar-position-badge">
        <Sun size={15} />
        <div>
          <strong>Altitude: {solar.altitudeDegrees.toFixed(1)}°</strong>
          <span>Azimuth: {solar.azimuthDegrees.toFixed(1)}° • {solar.isAboveHorizon ? "Above horizon" : "Below horizon"}</span>
        </div>
      </div>
    </div>
  );
}
