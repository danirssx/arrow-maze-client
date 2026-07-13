/**
 * THROWAWAY SPIKE (MAZ-225 / T0). Not production code.
 *
 * The three.js/R3F scene pieces for the 3D render proof-of-concept: neon tube
 * "arrows" in a cube volume (emissive core + additive halo, no post-process
 * bloom), an orbit rig driven by external gesture state, an FPS sampler, and an
 * imperative raycast picker that resolves a screen tap to an arrow id.
 */
/* eslint-disable react/no-unknown-property -- react-three-fiber intrinsics (position/object/attach/args/intensity) are not DOM props. */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SpikeArrow } from "./spikeArrows";

export interface OrbitState {
  azimuth: number;
  polar: number;
  distance: number;
}

function buildArrowMesh(arrow: SpikeArrow): THREE.Group {
  const curve = new THREE.CatmullRomCurve3(arrow.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const segments = arrow.points.length * 6;
  const color = new THREE.Color(arrow.color);

  const core = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, 0.12, 8, false),
    new THREE.MeshStandardMaterial({ color: "#050507", emissive: color, emissiveIntensity: 2.2, transparent: true, opacity: 0.92 })
  );
  const halo = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, 0.3, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  core.userData.arrowId = arrow.id;
  halo.userData.arrowId = arrow.id;

  const group = new THREE.Group();
  group.add(halo);
  group.add(core);
  group.userData.arrowId = arrow.id;
  return group;
}

/** Neon tube arrows, centered on the origin so the cube orbits around its middle. */
export function ArrowTubes({ arrows, size }: { arrows: readonly SpikeArrow[]; size: number }): React.JSX.Element {
  const groups = useMemo(() => arrows.map(buildArrowMesh), [arrows]);
  const offset = -size / 2;
  return (
    <group position={[offset, offset, offset]}>
      {groups.map((group) => (
        <primitive key={group.userData.arrowId as string} object={group} />
      ))}
    </group>
  );
}

/** Positions the camera on a sphere around the origin from external orbit state. */
export function OrbitRig({ orbit }: { orbit: React.RefObject<OrbitState> }): null {
  const camera = useThree((state) => state.camera);
  useFrame(() => {
    const { azimuth, polar, distance } = orbit.current;
    const clamped = Math.max(0.1, Math.min(Math.PI - 0.1, polar));
    camera.position.set(
      distance * Math.sin(clamped) * Math.sin(azimuth),
      distance * Math.cos(clamped),
      distance * Math.sin(clamped) * Math.cos(azimuth)
    );
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/** Samples frames-per-second roughly twice a second and reports it upward. */
export function FpsMeter({ onSample }: { onSample: (fps: number) => void }): null {
  const frames = useRef(0);
  const last = useRef(0);
  useFrame((state) => {
    frames.current += 1;
    const t = state.clock.elapsedTime;
    if (last.current === 0) last.current = t;
    const dt = t - last.current;
    if (dt >= 0.5) {
      onSample(Math.round(frames.current / dt));
      frames.current = 0;
      last.current = t;
    }
  });
  return null;
}

/** Exposes an imperative `pick(x, y)` that raycasts a screen tap to an arrow id. */
export function Picker({ onReady }: { onReady: (fn: (x: number, y: number) => string | null) => void }): null {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    const pick = (x: number, y: number): string | null => {
      const ndc = new THREE.Vector2((x / size.width) * 2 - 1, -((y / size.height) * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        const id = hit.object.userData?.arrowId;
        if (typeof id === "string") return id;
      }
      return null;
    };
    onReady(pick);
  }, [camera, scene, size, raycaster, onReady]);

  return null;
}
