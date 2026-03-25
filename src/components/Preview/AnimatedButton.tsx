import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { AnimationConfig } from "../../types/animation";
import { mapConfigToMotionProps, shadowToCss } from "../../features/animation/mapConfigToMotion";

type Props = {
  config: AnimationConfig;
  compact?: boolean;
  active?: boolean;
  replayKey?: number;
};

export function AnimatedButton({ config, compact, active, replayKey }: Props) {
  const reducedMotion = useReducedMotion();

  const easingKey =
    config.easing.kind === "preset"
      ? config.easing.preset
      : `${config.easing.x1.toFixed(2)},${config.easing.y1.toFixed(2)},${config.easing.x2.toFixed(2)},${config.easing.y2.toFixed(2)}`;

  const autoMotionKey =
    config.trigger === "auto"
      ? `auto-${replayKey ?? 0}-${config.duration}-${config.delay}-${config.scale}-${config.translateX}-${config.translateY}-${config.rotate}-${config.opacity}-${config.shadow}-${easingKey}`
      : undefined;

  const baseStyle: CSSProperties = {
    boxShadow: shadowToCss(0),
  };

  const baseButtonClass = [
    "select-none rounded-xl font-semibold tracking-tight",
    "bg-zinc-50 text-zinc-950",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
    "transition-colors",
    active ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-950" : "",
    compact ? "px-4 py-2 text-sm" : "px-6 py-4 text-base",
  ]
    .filter(Boolean)
    .join(" ");

  const motionProps = mapConfigToMotionProps(config);
  // In reduced-motion mode we still want the preview to reflect config changes,
  // but without visible animation/transitions.
  if (reducedMotion && motionProps.transition) {
    const t = motionProps.transition as Record<string, unknown>;
    motionProps.transition = { ...t, duration: 0, delay: 0 };
  }

  return (
    <motion.button
      key={autoMotionKey}
      type="button"
      className={baseButtonClass}
      style={baseStyle}
      {...(motionProps as any)}
    >
      Button
    </motion.button>
  );
}

