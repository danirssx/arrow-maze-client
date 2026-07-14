/* eslint-disable react/no-unknown-property -- react-three-fiber uses Three.js intrinsic props, not RN DOM props. */
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
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
  const segments = Math.max(8, descriptor.points.length * 8);
  const core = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, 0.08, 8, false),
    new THREE.MeshStandardMaterial({
      color: "#050507",
      emissive: color,
      emissiveIntensity: 2.4,
      transparent: true,
      opacity: 0.94
    })
  );
  const halo = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, 0.22, 8, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.42, 12),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.8 })
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
const TAP_MAX_DRIFT_PX = 5;

const EXIT_FLY_SPEED = 4.0;
const EXIT_DURATION = 0.65;
const SHAKE_DURATION = 0.3;
const SHAKE_AMPLITUDE = 0.28;

interface CameraRef {
  theta: number;
  phi: number;
  zoom: number;
  panStartTheta: number;
  panStartPhi: number;
  pinchStartZoom: number;
  pendingTap: { x: number; y: number } | null;
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

// Plays the exit fly+fade animation for a single arrow inside the Three.js render loop.
// Flies the group along its descriptor.direction at EXIT_FLY_SPEED units/s while fading
// all mesh materials to opacity 0 over EXIT_DURATION seconds, then calls onFinished once.
function AnimatedArrow({
  descriptor,
  onFinished,
}: {
  descriptor: ArrowTubeDescriptor;
  onFinished: () => void;
}): React.JSX.Element {
  const group = useMemo(() => buildTubeGroup(descriptor), [descriptor]);
  const elapsed = useRef(0);
  const finished = useRef(false);
  const dir = useMemo(() => new THREE.Vector3(...descriptor.direction).normalize(), [descriptor.direction]);

  // Capture initial opacities on first frame so we can lerp from them.
  const initialOpacities = useRef<WeakMap<THREE.Material, number> | null>(null);

  useFrame((_, delta) => {
    if (finished.current) return;

    if (initialOpacities.current === null) {
      const map = new WeakMap<THREE.Material, number>();
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material as THREE.Material & { opacity?: number };
          if (typeof mat.opacity === "number") map.set(mat, mat.opacity);
        }
      });
      initialOpacities.current = map;
    }

    elapsed.current += delta;
    const t = Math.min(elapsed.current / EXIT_DURATION, 1);

    // Translate group along world direction
    group.position.copy(dir.clone().multiplyScalar(elapsed.current * EXIT_FLY_SPEED));

    // Fade all mesh materials
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material as THREE.Material & { opacity?: number };
        if (typeof mat.opacity === "number") {
          const initial = initialOpacities.current!.get(mat) ?? 1;
          mat.opacity = initial * (1 - t);
        }
      }
    });

    if (t >= 1 && !finished.current) {
      finished.current = true;
      onFinished();
    }
  });

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

// Reads cameraRef every frame and repositions the R3F camera in spherical coords.
function OrbitCamera({ cameraRef, baseDistance }: { cameraRef: React.RefObject<CameraRef>; baseDistance: number }): null {
  const { camera } = useThree();
  useFrame(() => {
    const { theta, phi, zoom } = cameraRef.current;
    const r = baseDistance * zoom;
    camera.position.set(
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Polls pendingTap each frame; when set, raycasts and fires onArrowTap.
function TapHandler({
  cameraRef,
  onArrowTap,
}: {
  cameraRef: React.RefObject<CameraRef>;
  onArrowTap: (arrowId: string) => void;
}): null {
  const { camera, scene, size } = useThree();
  useFrame(() => {
    const tap = cameraRef.current.pendingTap;
    if (tap === null) return;
    cameraRef.current.pendingTap = null;
    const arrowId = pickArrowId(camera, scene, size.width, size.height, tap.x, tap.y);
    if (arrowId !== null) onArrowTap(arrowId);
  });
  return null;
}

// Applies a damped sinusoidal X-shake to the scene when shakeRef.active is set.
// Runs entirely in the Three.js render loop — no RN Animated involved.
function ShakeHandler({ shakeRef }: { shakeRef: React.RefObject<ShakeRef> }): null {
  const { scene } = useThree();
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

  // All descriptors — extracted arrows are NOT filtered so we can animate them out.
  const allDescriptors = useMemo(
    () => buildArrowTubeDescriptors(state.arrows, state.bounds!, []),
    [state.arrows, state.bounds],
  );

  const descriptorById = useMemo(
    () => new Map(allDescriptors.map((d) => [d.id, d])),
    [allDescriptors],
  );

  // exitingIds: arrows currently playing the fly+fade animation (not yet unmounted).
  const [exitingIds, setExitingIds] = useState<ReadonlySet<string>>(() => new Set());
  const prevExtractedRef = useRef<ReadonlySet<string>>(new Set<string>(state.extractedArrowIds));

  // Detect newly extracted arrows and start their exit animation.
  useEffect(() => {
    const prev = prevExtractedRef.current;
    const curr = new Set(state.extractedArrowIds);
    const newlyExtracted = [...curr].filter((id) => !prev.has(id));
    if (newlyExtracted.length > 0) {
      setExitingIds((s) => new Set([...s, ...newlyExtracted]));
    }
    prevExtractedRef.current = curr;
  }, [state.extractedArrowIds]);

  const extractedSet = new Set(state.extractedArrowIds);

  // Active = not extracted and not playing exit animation.
  const activeDescriptors = allDescriptors.filter(
    (d) => !extractedSet.has(d.id) && !exitingIds.has(d.id),
  );

  // Exiting = those whose descriptor we still know (arrow must still exist in state.arrows).
  const exitingDescriptors = [...exitingIds]
    .map((id) => descriptorById.get(id))
    .filter((d): d is ArrowTubeDescriptor => d !== undefined);

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
    pendingTap: null,
    panDrift: 0,
  });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      cam.current.panStartTheta = cam.current.theta;
      cam.current.panStartPhi = cam.current.phi;
      cam.current.panDrift = 0;
    })
    .onUpdate((e) => {
      cam.current.panDrift = Math.max(Math.abs(e.translationX), Math.abs(e.translationY));
      cam.current.theta = cam.current.panStartTheta - e.translationX * ORBIT_SENSITIVITY;
      cam.current.phi = Math.max(
        PHI_MIN,
        Math.min(PHI_MAX, cam.current.panStartPhi - e.translationY * ORBIT_SENSITIVITY),
      );
    });

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      cam.current.pinchStartZoom = cam.current.zoom;
    })
    .onUpdate((e) => {
      cam.current.zoom = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, cam.current.pinchStartZoom / (1 + (e.scale - 1) * ZOOM_SENSITIVITY * 100)),
      );
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (cam.current.panDrift > TAP_MAX_DRIFT_PX) return;
      cam.current.pendingTap = { x: e.x, y: e.y };
    });

  const composed = Gesture.Simultaneous(pan, pinch, tap);

  return (
    <GestureHandlerRootView testID="board-view-3d" style={styles.container}>
      <GestureDetector gesture={composed}>
        <View style={styles.container}>
          <Canvas testID="board-view-3d-canvas" camera={{ position: [baseDistance, baseDistance * 0.65, baseDistance], fov: 50 }} gl={{ antialias: true }}>
            <color attach="background" args={[BG]} />
            <ambientLight intensity={0.22} />
            <pointLight position={[6, 8, 6]} intensity={1.35} />
            <OrbitCamera cameraRef={cam} baseDistance={baseDistance} />
            <TapHandler cameraRef={cam} onArrowTap={onArrowTap} />
            <ShakeHandler shakeRef={shakeRef} />
            <VolumeLattice size={size} />
            {activeDescriptors.map((descriptor) => (
              <NeonTubeArrow key={descriptor.id} descriptor={descriptor} />
            ))}
            {exitingDescriptors.map((descriptor) => (
              <AnimatedArrow
                key={descriptor.id}
                descriptor={descriptor}
                onFinished={() => setExitingIds((s) => {
                  const next = new Set(s);
                  next.delete(descriptor.id);
                  return next;
                })}
              />
            ))}
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
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
