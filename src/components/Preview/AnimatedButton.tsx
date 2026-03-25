import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { AnimationConfig } from "../../types/animation";
import { mapConfigToMotionProps, shadowToCss } from "../../features/animation/mapConfigToMotion";

type Props = {
  config: AnimationConfig;
  compact?: boolean;
  active?: boolean;
};

export function AnimatedButton({ config, compact, active }: Props) {
  const reducedMotion = useReducedMotion();

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

  if (reducedMotion) {
    return (
      <button type="button" className={baseButtonClass} style={baseStyle}>
        Button
      </button>
    );
  }

  const motionProps = mapConfigToMotionProps(config);

  return (
    <motion.button
      type="button"
      className={baseButtonClass}
      style={baseStyle}
      {...(motionProps as any)}
    >
      Button
    </motion.button>
  );
}

