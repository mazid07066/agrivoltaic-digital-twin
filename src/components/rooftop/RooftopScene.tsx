"use client";

import {
  OrbitControls,
} from "@react-three/drei";
import {
  Canvas,
} from "@react-three/fiber";
import {
  Suspense,
  useMemo,
} from "react";
import {
  Color,
  PCFShadowMap,
} from "three";

import {
  solveRectangularRoofLayout,
} from "@/lib/geometry/rectangularRoof";
import type {
  FlatRoofSiteProfile,
} from "@/lib/sites/schema";

interface RooftopSceneProps {
  site: FlatRoofSiteProfile;
}

function RooftopModel({
  site,
}: RooftopSceneProps) {
  const geometry = site.siteGeometry;

  const layout = useMemo(
    () =>
      solveRectangularRoofLayout({
        geometry,
        moduleWidthM:
          site.pvConfiguration.moduleWidth,
        moduleLengthM:
          site.pvConfiguration.moduleLength,
        modulePowerW:
          site.pvConfiguration.modulePower,
      }),
    [
      geometry,
      site.pvConfiguration.moduleLength,
      site.pvConfiguration.modulePower,
      site.pvConfiguration.moduleWidth,
    ],
  );

  const roofWidthM =
    geometry.roofWidthM;
  const roofLengthM =
    geometry.roofLengthM;
  const buildingHeightM =
    geometry.buildingHeightM;

  const roofElevationM =
    buildingHeightM;

  const roofCenterX =
    roofWidthM / 2;
  const roofCenterZ =
    roofLengthM / 2;

  const tiltRad =
    (geometry.array.tiltDeg *
      Math.PI) /
    180;

  const roofAzimuthRad =
    (-geometry.roofAzimuthDeg *
      Math.PI) /
    180;

  const arrayRelativeAzimuthRad =
    (-
      (
        geometry.array.azimuthDeg -
        geometry.roofAzimuthDeg
      ) *
      Math.PI) /
    180;

  const parapetHeightM =
    geometry.parapet.enabled
      ? geometry.parapet.heightM
      : 0;

  const parapetWidthM =
    geometry.parapet.enabled
      ? Math.max(
          geometry.parapet.widthM,
          0.08,
        )
      : 0;

  return (
    <group
      rotation={[
        0,
        roofAzimuthRad,
        0,
      ]}
    >
      <group
        position={[
          -roofCenterX,
          0,
          -roofCenterZ,
        ]}
      >
        <mesh
          position={[
            roofCenterX,
            buildingHeightM / 2,
            roofCenterZ,
          ]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[
              roofWidthM,
              Math.max(
                buildingHeightM,
                0.1,
              ),
              roofLengthM,
            ]}
          />
          <meshStandardMaterial
            color="#d9dee7"
            roughness={0.86}
          />
        </mesh>

        <mesh
          position={[
            roofCenterX,
            roofElevationM + 0.06,
            roofCenterZ,
          ]}
          receiveShadow
        >
          <boxGeometry
            args={[
              roofWidthM,
              0.12,
              roofLengthM,
            ]}
          />
          <meshStandardMaterial
            color="#9aa5b1"
            roughness={0.92}
          />
        </mesh>

        {geometry.parapet.enabled ? (
          <>
            <mesh
              position={[
                roofCenterX,
                roofElevationM +
                  parapetHeightM / 2,
                parapetWidthM / 2,
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  roofWidthM,
                  parapetHeightM,
                  parapetWidthM,
                ]}
              />
              <meshStandardMaterial
                color="#c4cbd4"
              />
            </mesh>

            <mesh
              position={[
                roofCenterX,
                roofElevationM +
                  parapetHeightM / 2,
                roofLengthM -
                  parapetWidthM / 2,
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  roofWidthM,
                  parapetHeightM,
                  parapetWidthM,
                ]}
              />
              <meshStandardMaterial
                color="#c4cbd4"
              />
            </mesh>

            <mesh
              position={[
                parapetWidthM / 2,
                roofElevationM +
                  parapetHeightM / 2,
                roofCenterZ,
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  parapetWidthM,
                  parapetHeightM,
                  roofLengthM,
                ]}
              />
              <meshStandardMaterial
                color="#c4cbd4"
              />
            </mesh>

            <mesh
              position={[
                roofWidthM -
                  parapetWidthM / 2,
                roofElevationM +
                  parapetHeightM / 2,
                roofCenterZ,
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  parapetWidthM,
                  parapetHeightM,
                  roofLengthM,
                ]}
              />
              <meshStandardMaterial
                color="#c4cbd4"
              />
            </mesh>
          </>
        ) : null}

        {layout.placements.map(
          (placement) => (
            <group
              key={`${placement.rowIndex}-${placement.columnIndex}`}
              position={[
                placement.centerXM,
                roofElevationM +
                  geometry.array
                    .rackHeightM,
                placement.centerYM,
              ]}
              rotation={[
                0,
                arrayRelativeAzimuthRad,
                0,
              ]}
            >
              <mesh
                rotation={[
                  tiltRad,
                  0,
                  0,
                ]}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[
                    placement.footprintWidthM,
                    0.08,
                    Math.max(
                      placement.footprintLengthM,
                      0.05,
                    ),
                  ]}
                />
                <meshStandardMaterial
                  color="#12345a"
                  metalness={0.18}
                  roughness={0.4}
                />
              </mesh>

              <mesh
                position={[
                  0,
                  -Math.max(
                    geometry.array
                      .rackHeightM,
                    0.05,
                  ) / 2,
                  0,
                ]}
                castShadow
              >
                <boxGeometry
                  args={[
                    0.06,
                    Math.max(
                      geometry.array
                        .rackHeightM,
                      0.05,
                    ),
                    0.06,
                  ]}
                />
                <meshStandardMaterial
                  color="#64748b"
                  metalness={0.55}
                  roughness={0.5}
                />
              </mesh>
            </group>
          ),
        )}
      </group>

      <gridHelper
        args={[
          Math.max(
            roofLengthM,
            roofWidthM,
          ) * 2,
          30,
          "#94a3b8",
          "#d8dee7",
        ]}
        position={[
          0,
          0,
          0,
        ]}
      />

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        position={[
          0,
          -0.03,
          0,
        ]}
        receiveShadow
      >
        <planeGeometry
          args={[
            Math.max(
              roofLengthM,
              roofWidthM,
            ) * 3,
            Math.max(
              roofLengthM,
              roofWidthM,
            ) * 3,
          ]}
        />
        <meshStandardMaterial
          color="#eef2f6"
          roughness={1}
        />
      </mesh>
    </group>
  );
}

function SceneFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#f59e0b"
      />
    </mesh>
  );
}

export default function RooftopScene({
  site,
}: RooftopSceneProps) {
  const geometry = site.siteGeometry;

  const maximumDimensionM =
    Math.max(
      geometry.roofLengthM,
      geometry.roofWidthM,
      geometry.buildingHeightM,
      10,
    );

  const cameraDistance =
    maximumDimensionM * 1.25;

  const targetY =
    Math.max(
      geometry.buildingHeightM * 0.55,
      1,
    );

  return (
    <div className="h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <Canvas
        shadows
        dpr={[
          1,
          1.5,
        ]}
        camera={{
          position: [
            cameraDistance,
            cameraDistance * 0.78,
            cameraDistance,
          ],
          fov: 42,
          near: 0.1,
          far:
            cameraDistance * 12,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
        onCreated={({
          gl,
          scene,
        }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type =
            PCFShadowMap;

          scene.background =
            new Color("#eef3f7");
        }}
      >
        <ambientLight
          intensity={1.25}
        />

        <hemisphereLight
          args={[
            "#ffffff",
            "#8a96a3",
            1.25,
          ]}
        />

        <directionalLight
          position={[
            cameraDistance * 0.7,
            cameraDistance * 1.4,
            cameraDistance * 0.45,
          ]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.1}
          shadow-camera-far={
            cameraDistance * 4
          }
          shadow-camera-left={
            -maximumDimensionM
          }
          shadow-camera-right={
            maximumDimensionM
          }
          shadow-camera-top={
            maximumDimensionM
          }
          shadow-camera-bottom={
            -maximumDimensionM
          }
        />

        <Suspense
          fallback={<SceneFallback />}
        >
          <RooftopModel site={site} />
        </Suspense>

        <OrbitControls
          makeDefault
          target={[
            0,
            targetY,
            0,
          ]}
          enableDamping
          dampingFactor={0.08}
          minDistance={
            maximumDimensionM * 0.45
          }
          maxDistance={
            maximumDimensionM * 5
          }
          maxPolarAngle={
            Math.PI / 2.02
          }
        />
      </Canvas>
    </div>
  );
}
