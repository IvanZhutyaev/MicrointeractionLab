import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { AnimationConfig } from "../../types/animation";
import type { UIComponentType } from "../../types/ui";
import { easingToFramerEase, mapConfigToMotionProps, shadowToCss } from "../../features/animation/mapConfigToMotion";

type Props = {
  config: AnimationConfig;
  componentType: UIComponentType;
  compact?: boolean;
  active?: boolean;
  replayKey?: number;
  autoPreviewMode?: "auto" | "idle" | "active";
};

function buildAutoKey(config: AnimationConfig, componentType: UIComponentType, replayKey?: number) {
  const easingKey =
    config.easing.kind === "preset"
      ? config.easing.preset
      : `${config.easing.x1.toFixed(2)},${config.easing.y1.toFixed(2)},${config.easing.x2.toFixed(2)},${config.easing.y2.toFixed(2)}`;

  return `auto-${componentType}-${replayKey ?? 0}-${config.duration}-${config.delay}-${config.scale}-${config.translateX}-${config.translateY}-${config.rotate}-${config.opacity}-${config.shadow}-${easingKey}`;
}

export function AnimatedElement({
  config,
  componentType,
  compact,
  active,
  replayKey,
  autoPreviewMode = "auto",
}: Props) {
  const reducedMotion = useReducedMotion();

  const baseStyle: CSSProperties = {
    boxShadow: shadowToCss(0),
  };

  const autoMotionKey = config.trigger === "auto" ? buildAutoKey(config, componentType, replayKey) : undefined;

  const motionProps = mapConfigToMotionProps(config);

  const ease = easingToFramerEase(config.easing);

  if (config.trigger === "auto" && (autoPreviewMode === "idle" || autoPreviewMode === "active")) {
    const shadow0 = shadowToCss(0);
    const shadow1 = shadowToCss(config.shadow);

    const idleState = {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      boxShadow: shadow0,
    };

    const activeState = {
      scale: config.scale,
      opacity: config.opacity,
      x: config.translateX,
      y: config.translateY,
      rotate: config.rotate,
      boxShadow: shadow1,
    };

    motionProps.initial = idleState;
    motionProps.animate = autoPreviewMode === "idle" ? idleState : activeState;
    motionProps.transition = { duration: 0, delay: 0, ease };
  } else if (reducedMotion) {
    // Important: for `auto` we animate from base -> target -> base.
    // If we just set duration=0, it will snap to the last keyframe ("base") and look like nothing happened.
    // So in reduced-motion mode we jump directly to the "target" state.
    if (config.trigger === "auto") {
      const shadow0 = shadowToCss(0);
      const shadow1 = shadowToCss(config.shadow);

      // In reduced-motion mode we treat "auto" as "active" for visibility.
      motionProps.initial = { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0, boxShadow: shadow0 };
      motionProps.animate = {
        scale: config.scale,
        opacity: config.opacity,
        x: config.translateX,
        y: config.translateY,
        rotate: config.rotate,
        boxShadow: shadow1,
      };
      motionProps.transition = { duration: 0, delay: 0, ease };
    } else if (motionProps.transition) {
      const t = motionProps.transition as Record<string, unknown>;
      motionProps.transition = { ...t, duration: 0, delay: 0 };
    }
  }

  const sharedFocusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

  if (componentType === "button") {
    const classes = [
      "select-none rounded-xl font-semibold tracking-tight",
      "bg-zinc-50 text-zinc-950",
      sharedFocusClass,
      "transition-colors",
      active ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-950" : "",
      compact ? "px-4 py-2 text-sm" : "px-6 py-4 text-base",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <motion.button
        key={autoMotionKey}
        type="button"
        className={classes}
        style={baseStyle}
        {...(motionProps as any)}
      >
        Button
      </motion.button>
    );
  }

  if (componentType === "input") {
    const classes = [
      "rounded-xl bg-zinc-50 text-zinc-950",
      sharedFocusClass,
      "px-4 py-3 text-sm",
      "border border-transparent",
      active ? "ring-2 ring-indigo-400" : "",
      compact ? "max-w-[18rem]" : "max-w-[22rem]",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <motion.input
        key={autoMotionKey}
        type="text"
        placeholder="Input"
        className={classes}
        style={baseStyle}
        {...(motionProps as any)}
      />
    );
  }

  // card
  const classes = [
    "rounded-2xl bg-zinc-50/5 p-6 text-zinc-50/90",
    "ring-1 ring-zinc-800/80",
    "transition-colors",
    active ? "ring-2 ring-indigo-400/70" : "",
    sharedFocusClass.replaceAll("ring-offset-zinc-950", "ring-offset-zinc-950"),
    compact ? "w-full" : "w-full min-w-[12rem]",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      key={autoMotionKey}
      tabIndex={0}
      role="group"
      className={classes}
      style={baseStyle}
      {...(motionProps as any)}
    >
      <div className="text-xs text-zinc-300">Card</div>
      <div className="mt-2 text-sm font-semibold">Microinteraction</div>
    </motion.div>
  );
}

