// src/features/compose/components/ProgressRing.tsx
import React from "react";
import { View } from "react-native";
import Animated, { interpolateColor, useAnimatedProps } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({
  size = 200,
  strokeWidth = 6,
  progress, // SharedValue<number> (0..1)
  from = "#ffffff",
  to = "#38bdf8",
  bg = "rgba(255,255,255,0.08)",
}: {
  size?: number;
  strokeWidth?: number;
  progress: any;
  from?: string;
  to?: string;
  bg?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  const animatedProps = useAnimatedProps(() => {
    // progress.value를 렌더 중 접근하지 않고, 애니메이션 context에서만 사용
    const p = Math.max(0, Math.min(1, progress.value)); 
    const stroke = interpolateColor(p, [0, 1], [from, to], "RGB");
    return {
      strokeDashoffset: c * (1 - p),
      stroke,
    };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={strokeWidth} fill="transparent" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${c}, ${c}`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}
