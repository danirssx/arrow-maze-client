/* eslint-disable react/no-unknown-property -- react-three-fiber uses Three.js intrinsic props, not RN DOM props. */
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { useMemo, useRef } from "react";
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

interface CameraRef {
  theta: number;
  phi: number;
  zoom: number;
  panStartTheta: number;
  panStartPhi: number;
  pinchStartZoom: number;
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

// Reads cameraRef every frame and repositions the R3F camera in spherical coords.
// World axes are fixed — only the camera moves, arrow directions never change.
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

export function BoardView3D({ state }: { state: GameUiState }): React.JSX.Element {
  if (state.bounds === null) {
    return <View testID="board-view-3d-empty" style={styles.empty} />;
  }

  const descriptors = buildArrowTubeDescriptors(state.arrows, state.bounds, state.extractedArrowIds);
  const size = volumeSize(state.bounds);
  const baseDistance = Math.max(CAMERA_DISTANCE, size.rows + size.columns + size.depth);

  // Mutable ref — avoids re-renders on every gesture event
  const cam = useRef<CameraRef>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    zoom: 1,
    panStartTheta: Math.PI / 4,
    panStartPhi: Math.PI / 3,
    pinchStartZoom: 1,
  });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      cam.current.panStartTheta = cam.current.theta;
      cam.current.panStartPhi = cam.current.phi;
    })
    .onUpdate((e) => {
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

  const composed = Gesture.Simultaneous(pan, pinch);

  return (
    <GestureHandlerRootView testID="board-view-3d" style={styles.container}>
      <GestureDetector gesture={composed}>
        <View style={styles.container}>
          <Canvas testID="board-view-3d-canvas" camera={{ position: [baseDistance, baseDistance * 0.65, baseDistance], fov: 50 }} gl={{ antialias: true }}>
            <color attach="background" args={[BG]} />
            <ambientLight intensity={0.22} />
            <pointLight position={[6, 8, 6]} intensity={1.35} />
            <OrbitCamera cameraRef={cam} baseDistance={baseDistance} />
            <VolumeLattice size={size} />
            {descriptors.map((descriptor) => (
              <NeonTubeArrow key={descriptor.id} descriptor={descriptor} />
            ))}
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
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
