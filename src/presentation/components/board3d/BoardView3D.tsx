/* eslint-disable react/no-unknown-property -- react-three-fiber uses Three.js intrinsic props, not RN DOM props. */
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";
import type { GameUiState } from "@/presentation/state/GameUiState";
import {
  buildArrowTubeDescriptors,
  type ArrowTubeDescriptor,
  type Point3,
  volumeSize
} from "./board3dGeometry";

const BG = "#0A0C18";
const LATTICE = "#30385D";
const CAMERA_DISTANCE = 12;

function add(a: Point3, b: Point3, scale = 1): Point3 {
  return [a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale];
}

function vectors(points: readonly Point3[]): THREE.Vector3[] {
  return points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
}

function tubePoints(descriptor: ArrowTubeDescriptor): THREE.Vector3[] {
  const points = descriptor.points.length >= 2 ? descriptor.points : [descriptor.points[0] ?? [0, 0, 0], add(descriptor.points[0] ?? [0, 0, 0], descriptor.direction, 0.7)];
  return vectors(points);
}

function buildTubeGroup(descriptor: ArrowTubeDescriptor): THREE.Group {
  const color = new THREE.Color(descriptor.color);
  const curve = new THREE.CatmullRomCurve3(tubePoints(descriptor));
  const segments = Math.min(MAX_TUBE_SEGMENTS, Math.max(8, descriptor.points.length * 8));
  // MeshBasicMaterial: no lighting needed, color always visible on any WebGL impl.
  const core = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, 0.08, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
  );
  const halo = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, 0.22, 8, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.42, 12),
    new THREE.MeshBasicMaterial({ color })
  );
  const headPoint = descriptor.points[descriptor.points.length - 1] ?? [0, 0, 0];
  head.position.set(...add(headPoint, descriptor.direction, 0.24));
  head.userData.arrowId = descriptor.id;
  core.userData.arrowId = descriptor.id;
  halo.userData.arrowId = descriptor.id;

  const group = new THREE.Group();
  group.userData.arrowId = descriptor.id;
  group.add(halo);
  group.add(core);
  group.add(head);
  return group;
}

const PHI_MIN = 0.15;
const PHI_MAX = Math.PI / 2;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.0;
const ORBIT_SENSITIVITY = 0.005;
const ZOOM_SENSITIVITY = 0.008;
const TAP_MAX_DRIFT_PX = 10;

// Cap tube segments to avoid WebGL buffer overflow on dense 3-D boards.
const MAX_TUBE_SEGMENTS = 64;
const SHAKE_DURATION = 0.3;
const SHAKE_AMPLITUDE = 0.28;

interface CameraRef {
  theta: number;
  phi: number;
  zoom: number;
  panStartTheta: number;
  panStartPhi: number;
  pinchStartZoom: number;
  panDrift: number;
}

interface ShakeRef {
  active: boolean;
  elapsed: number;
  /** Snapshot of shakeArrowId that triggered the current shake, to detect new triggers. */
  lastArrowId: string | null;
}

// Exported for unit testing — not part of the public component API.
// Picks the arrowId of the mesh closest to the camera under the tapped pixel.
// tapX/tapY are in the canvas-local coordinate space (pixels from top-left).
export function pickArrowId(
  camera: THREE.Camera,
  scene: THREE.Object3D,
  canvasWidth: number,
  canvasHeight: number,
  tapX: number,
  tapY: number,
): string | null {
  const raycaster = new THREE.Raycaster();
  const ndcX = (tapX / canvasWidth) * 2 - 1;
  const ndcY = -(tapY / canvasHeight) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  const hits = raycaster.intersectObject(scene, true);
  for (const hit of hits) {
    let obj: THREE.Object3D | null = hit.object;
    while (obj !== null) {
      if (typeof obj.userData["arrowId"] === "string") {
        return obj.userData["arrowId"] as string;
      }
      obj = obj.parent;
    }
  }
  return null;
}

function NeonTubeArrow({ descriptor }: { descriptor: ArrowTubeDescriptor }): React.JSX.Element {
  const group = useMemo(() => buildTubeGroup(descriptor), [descriptor]);
  return <primitive object={group} />;
}


function VolumeLattice({ size }: { size: ReturnType<typeof volumeSize> }): React.JSX.Element {
  const width = Math.max(size.columns - 1, 1);
  const height = Math.max(size.rows - 1, 1);
  const depth = Math.max(size.depth - 1, 1);

  return (
    <group>
      <gridHelper args={[Math.max(width, depth) + 2, Math.max(size.columns, size.depth), LATTICE, LATTICE]} position={[0, -height / 2 - 0.35, 0]} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width + 1, height + 1, depth + 1)]} />
        <lineBasicMaterial color={LATTICE} transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

// Subset of R3F state needed by the render loop and raycaster.
// `ReturnType<typeof useThree>` resolves to `{}` when the @react-three/fiber/native
// sub-path export lacks explicit typings, so we declare the shape explicitly.
interface R3FState {
  camera: THREE.Camera;
  scene: THREE.Scene;
  gl: THREE.WebGLRenderer;
}

// R3F's internal frameloop doesn't start with expo-gl on New Architecture (Fabric).
// This component exports the R3F state synchronously in the render function so
// the outer component can drive the render loop from its own setInterval (which works).
function StateExporter({ stateRef }: { stateRef: React.MutableRefObject<R3FState | null> }): null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateRef.current = useThree() as any as R3FState;
  return null;
}

// Applies a damped sinusoidal X-shake to the scene when shakeRef.active is set.
// Runs entirely in the Three.js render loop — no RN Animated involved.
function ShakeHandler({ shakeRef }: { shakeRef: React.RefObject<ShakeRef> }): null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { scene } = useThree() as any as R3FState;
  useFrame((_, delta) => {
    if (!shakeRef.current.active) return;
    shakeRef.current.elapsed += delta;
    const t = shakeRef.current.elapsed / SHAKE_DURATION;
    if (t >= 1) {
      shakeRef.current.active = false;
      scene.position.x = 0;
      return;
    }
    // 3 full oscillations with exponential decay
    scene.position.x = SHAKE_AMPLITUDE * Math.sin(t * Math.PI * 6) * (1 - t);
  });
  return null;
}

// Inner component that assumes bounds !== null, so all hooks are unconditional.
function BoardView3DInner({
  state,
  onArrowTap,
}: {
  state: GameUiState & { bounds: NonNullable<GameUiState["bounds"]> };
  onArrowTap: (arrowId: string) => void;
}): React.JSX.Element {
  const size = volumeSize(state.bounds);
  const baseDistance = Math.max(CAMERA_DISTANCE, size.rows + size.columns + size.depth);

  const allDescriptors = useMemo(
    () => buildArrowTubeDescriptors(state.arrows, state.bounds!, []),
    [state.arrows, state.bounds],
  );

  const extractedSet = new Set(state.extractedArrowIds);
  const activeDescriptors = allDescriptors.filter((d) => !extractedSet.has(d.id));

  // Shake ref — mutated by ShakeHandler in useFrame, never triggers re-render.
  const shakeRef = useRef<ShakeRef>({ active: false, elapsed: 0, lastArrowId: null });

  // Trigger shake when state.shakeArrowId changes to a new non-null value.
  useEffect(() => {
    if (state.shakeArrowId !== null && state.shakeArrowId !== shakeRef.current.lastArrowId) {
      shakeRef.current = { active: true, elapsed: 0, lastArrowId: state.shakeArrowId };
    }
  }, [state.shakeArrowId]);

  const cam = useRef<CameraRef>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    zoom: 1,
    panStartTheta: Math.PI / 4,
    panStartPhi: Math.PI / 3,
    pinchStartZoom: 1,
    panDrift: 0,
  });

  // R3F state exported synchronously from StateExporter's render (useEffect doesn't
  // run inside R3F Canvas on expo-gl + Fabric, but the render function does).
  const r3fStateRef = useRef<R3FState | null>(null);
  // Canvas layout for raycasting tap coordinates.
  const layoutRef = useRef({ width: 1, height: 1 });
  // Touch tracking for orbit + tap discrimination.
  const touchRef = useRef({ startX: 0, startY: 0 });

  // Render loop. R3F's internal frameloop doesn't start on expo-gl + Fabric (New Arch),
  // so we drive rendering from here using setInterval + direct gl.render() + endFrameEXP().
  useEffect(() => {
    let lastTime = Date.now();

    const intervalId = setInterval(() => {
      const now = Date.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = r3fStateRef.current;
      if (!state) return;

      // R3F's resize observer doesn't fire on expo-gl + Fabric (New Architecture).
      // Keep the camera aspect in sync with the actual layout so raycasting stays accurate.
      if (state.camera instanceof THREE.PerspectiveCamera) {
        const { width, height } = layoutRef.current;
        if (width > 0 && height > 0) {
          const aspect = width / height;
          if (Math.abs(state.camera.aspect - aspect) > 0.001) {
            state.camera.aspect = aspect;
            state.camera.updateProjectionMatrix();
          }
        }
      }

      const { theta, phi, zoom } = cam.current;
      const r = baseDistance * zoom;
      state.camera.position.set(
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta),
      );
      state.camera.lookAt(0, 0, 0);

      state.gl.render(state.scene, state.camera);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (state.gl as any).getContext?.() as { endFrameEXP?: () => void } | null;
      ctx?.endFrameEXP?.();
    }, 16);

    return () => clearInterval(intervalId);
  }, [baseDistance]);

  return (
    <View
      testID="board-view-3d"
      style={styles.container}
      onLayout={(e) => {
        layoutRef.current = {
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        };
      }}
    >
      <Canvas
        testID="board-view-3d-canvas"
        frameloop="never"
        style={{ ...StyleSheet.absoluteFillObject }}
        camera={{ position: [baseDistance, baseDistance * 0.65, baseDistance], fov: 50 }}
        gl={{ antialias: true, outputColorSpace: THREE.LinearSRGBColorSpace }}
      >
        <color attach="background" args={[BG]} />
        <ambientLight intensity={0.22} />
        <pointLight position={[6, 8, 6]} intensity={1.35} />
        <StateExporter stateRef={r3fStateRef} />
        <ShakeHandler shakeRef={shakeRef} />
        <VolumeLattice size={size} />
        {activeDescriptors.map((descriptor) => (
          <NeonTubeArrow key={descriptor.id} descriptor={descriptor} />
        ))}
      </Canvas>
      {/* Gesture overlay — sits on top of Canvas, handles orbit + tap natively.
          This avoids R3F pointer-event / endFrameEXP conflicts on expo-gl + Fabric. */}
      <View
        style={StyleSheet.absoluteFillObject}
        onTouchStart={(e) => {
          const t = e.nativeEvent.touches[0];
          if (!t) return;
          touchRef.current = { startX: t.locationX, startY: t.locationY };
          cam.current.panStartTheta = cam.current.theta;
          cam.current.panStartPhi = cam.current.phi;
          cam.current.panDrift = 0;
        }}
        onTouchMove={(e) => {
          const t = e.nativeEvent.touches[0];
          if (!t) return;
          const dx = t.locationX - touchRef.current.startX;
          const dy = t.locationY - touchRef.current.startY;
          cam.current.panDrift = Math.max(Math.abs(dx), Math.abs(dy));
          cam.current.theta = cam.current.panStartTheta - dx * ORBIT_SENSITIVITY;
          cam.current.phi = Math.max(
            PHI_MIN,
            Math.min(PHI_MAX, cam.current.panStartPhi - dy * ORBIT_SENSITIVITY),
          );
        }}
        onTouchEnd={() => {
          if (cam.current.panDrift <= TAP_MAX_DRIFT_PX) {
            const state = r3fStateRef.current;
            if (state) {
              // Use start coords (from onTouchStart) — more reliable than
              // changedTouches[0].locationX/Y which can be wrong on Android.
              const arrowId = pickArrowId(
                state.camera, state.scene,
                layoutRef.current.width, layoutRef.current.height,
                touchRef.current.startX, touchRef.current.startY,
              );
              if (arrowId !== null) onArrowTap(arrowId);
            }
          }
        }}
      />
    </View>
  );
}

export function BoardView3D({
  state,
  onArrowTap,
}: {
  state: GameUiState;
  onArrowTap: (arrowId: string) => void;
}): React.JSX.Element {
  if (state.bounds === null) {
    return <View testID="board-view-3d-empty" style={styles.empty} />;
  }
  return (
    <BoardView3DInner
      state={state as GameUiState & { bounds: NonNullable<GameUiState["bounds"]> }}
      onArrowTap={onArrowTap}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: BG
  },
  empty: {
    flex: 1,
    minHeight: 320,
    borderRadius: 8,
    backgroundColor: BG
  }
});
