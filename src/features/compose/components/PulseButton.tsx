// src/features/compose/components/PulseButton.tsx
import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import type { Phase } from "../compose.types";
import ProgressRing from "./ProgressRing";

export default function PulseButton({
  onPress,
  iconSource,
  disabled,
  progress,
  phase,
}: {
  onPress: () => void;
  iconSource: any;
  disabled?: boolean;
  progress: any; // SharedValue<number>
  phase: Phase;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(scale);
    if (phase === "idle") {
      scale.value = withTiming(1.05, { duration: 1300, easing: Easing.inOut(Easing.ease) });
      scale.value = withTiming(0.97, { duration: 1300, easing: Easing.inOut(Easing.ease) });
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [phase]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // progress.value를 렌더링 중에 접근하지 않고, 애니메이션 context에서만 사용
  const glowStyle = useAnimatedStyle(() => {
    const ringColor = interpolateColor(progress.value, [0, 1], ["#ffffff", "#38bdf8"], "RGB");
    return {
      backgroundColor: ringColor,
      opacity: interpolate(scale.value, [0.97, 1.05], [0.25, 0.6]),
    };
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute" }}>
        <ProgressRing size={220} strokeWidth={8} progress={progress} from="#ffffff" to="#38bdf8" bg="rgba(255,255,255,0.08)" />
      </View>

      <Animated.View style={[styles.btn, scaleStyle]}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }, glowStyle]} />
        <Pressable
          onPress={onPress}
          android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: true }}
          style={styles.pressable}
          disabled={disabled} // 상태에 따라 비활성화
        >
          <Image source={iconSource} style={{ width: 96, height: 96, borderRadius: 24 }} resizeMode="contain" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 180,
    height: 180,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pressable: {
    width: 180,
    height: 180,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
