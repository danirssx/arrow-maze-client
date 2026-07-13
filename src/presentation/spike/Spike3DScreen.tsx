/**
 * THROWAWAY SPIKE (MAZ-225 / T0). Not production code, not part of the game flow.
 *
 * Runnable harness that wires the R3F scene to gestures + HUD so a human can run
 * it on a real device (EAS dev-client build) and read the go/no-go signals:
 *   - the FPS overlay (target >= 50fps with ~20 neon tube arrows),
 *   - orbit (one-finger drag) + zoom (pinch),
 *   - tap → raycast → the picked arrow id shown in the HUD.
 */
/* eslint-disable react/no-unknown-property -- react-three-fiber intrinsics (attach/args/intensity) are not DOM props. */
import { Canvas } from "@react-three/fiber/native";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { ArrowTubes, FpsMeter, OrbitRig, Picker, type OrbitState } from "./Spike3DScene";
import { generateSpikeArrows } from "./spikeArrows";

const CUBE = 4;
const INITIAL: OrbitState = { azimuth: 0.6, polar: 1.1, distance: 12 };

export function Spike3DScreen(): React.JSX.Element {
  const arrows = useMemo(() => generateSpikeArrows(20, CUBE), []);
  const orbit = useRef<OrbitState>({ ...INITIAL });
  const gestureStart = useRef<OrbitState>({ ...INITIAL });
  const pickFn = useRef<((x: number, y: number) => string | null) | null>(null);
  const [fps, setFps] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const onPickerReady = useCallback((fn: (x: number, y: number) => string | null) => {
    pickFn.current = fn;
  }, []);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .onBegin(() => {
        gestureStart.current = { ...orbit.current };
      })
      .onUpdate((e) => {
        orbit.current.azimuth = gestureStart.current.azimuth - e.translationX * 0.01;
        orbit.current.polar = gestureStart.current.polar - e.translationY * 0.01;
      })
      .runOnJS(true);

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        gestureStart.current = { ...orbit.current };
      })
      .onUpdate((e) => {
        orbit.current.distance = Math.max(4, Math.min(40, gestureStart.current.distance / e.scale));
      })
      .runOnJS(true);

    const tap = Gesture.Tap()
      .maxDistance(10)
      .onEnd((e) => {
        setPicked(pickFn.current ? pickFn.current(e.x, e.y) : null);
      })
      .runOnJS(true);

    return Gesture.Simultaneous(Gesture.Exclusive(tap, pan), pinch);
  }, []);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>
          <Canvas camera={{ position: [8, 6, 8], fov: 55 }} gl={{ antialias: true }}>
            <color attach="background" args={["#0a0a14"]} />
            <ambientLight intensity={0.25} />
            <OrbitRig orbit={orbit} />
            <ArrowTubes arrows={arrows} size={CUBE} />
            <Picker onReady={onPickerReady} />
            <FpsMeter onSample={setFps} />
          </Canvas>
        </View>
      </GestureDetector>
      <View pointerEvents="none" style={styles.hud}>
        <Text style={styles.fps}>{fps} FPS</Text>
        <Text style={styles.pick}>tap → {picked ?? "—"}</Text>
        <Text style={styles.hint}>drag: orbit · pinch: zoom · tap: pick</Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0a0a14" },
  hud: { position: "absolute", top: 48, left: 20 },
  fps: { color: "#39FF14", fontSize: 22, fontWeight: "700" },
  pick: { color: "#00E5FF", fontSize: 16, marginTop: 4 },
  hint: { color: "#8888aa", fontSize: 12, marginTop: 8 },
});
