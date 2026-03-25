import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { AnimationConfig } from "../../types/animation";
import type { UIComponentType } from "../../types/ui";
import { easingToFramerEase, mapConfigToMotionProps, shadowToCss } from "../../features/animation/mapConfigToMotion";
import { useAnimationStore } from "../../store/useAnimationStore";

type Props = {
  config: AnimationConfig;
  componentType: UIComponentType;
  compact?: boolean;
  active?: boolean;
  replayKey?: number;
  autoPreviewMode?: "auto" | "idle" | "active";
  // For hover/click we can force a preview state (useful on touch / for gallery).
  triggerPreviewState?: "idle" | "active";
  // For auto we can drive the preview by timeline progress (0..1).
  autoTimelineProgress?: number;
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
  triggerPreviewState,
  autoTimelineProgress,
}: Props) {
  const reducedMotion = useReducedMotion();
  const simulateReducedMotion = useAnimationStore((s) => s.simulateReducedMotion);
  const effectiveReducedMotion = reducedMotion || simulateReducedMotion;

  const baseStyle: CSSProperties = {
    boxShadow: shadowToCss(0),
  };

  const autoMotionKey = config.trigger === "auto" && autoTimelineProgress === undefined ? buildAutoKey(config, componentType, replayKey) : undefined;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const easingToBezierPoints = (easing: AnimationConfig["easing"]) => {
    if (easing.kind === "cubicBezier") return easing;
    switch (easing.preset) {
      case "easeOut":
        return { kind: "cubicBezier" as const, x1: 0, y1: 0, x2: 0.58, y2: 1 };
      case "easeIn":
        return { kind: "cubicBezier" as const, x1: 0.42, y1: 0, x2: 1, y2: 1 };
      case "easeInOut":
        return { kind: "cubicBezier" as const, x1: 0.42, y1: 0, x2: 0.58, y2: 1 };
      case "linear":
        return { kind: "cubicBezier" as const, x1: 0, y1: 0, x2: 1, y2: 1 };
    }
  };

  const cubicBezierEase = (t: number, x1: number, y1: number, x2: number, y2: number) => {
    // Solve for u in x(u)=t, then return y(u).
    const cubicX = (u: number) => {
      const u1 = 1 - u;
      return 3 * u1 * u1 * u * x1 + 3 * u1 * u * u * x2 + u * u * u;
    };
    const cubicY = (u: number) => {
      const u1 = 1 - u;
      return 3 * u1 * u1 * u * y1 + 3 * u1 * u * u * y2 + u * u * u;
    };

    // Fast paths.
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      const x = cubicX(mid);
      if (x < t) lo = mid;
      else hi = mid;
    }
    const u = (lo + hi) / 2;
    return cubicY(u);
  };

  const getTransition = (): { duration: number; delay: number; ease: string | number[] } => {
    const ease = easingToFramerEase(config.easing);
    return { duration: config.duration / 1000, delay: config.delay / 1000, ease };
  };

  const baseState = {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    boxShadow: shadowToCss(0),
  };

  const activeState = {
    scale: config.scale,
    opacity: config.opacity,
    x: config.translateX,
    y: config.translateY,
    rotate: config.rotate,
    boxShadow: shadowToCss(config.shadow),
  };

  const motionProps = (() => {
    // 1) Auto timeline scrubbing.
    if (config.trigger === "auto" && typeof autoTimelineProgress === "number") {
      const peakTime = Math.max(0.01, Math.min(0.99, config.autoPeak));
      const t = Math.max(0, Math.min(1, autoTimelineProgress));

      const bez = easingToBezierPoints(config.easing);
      const { x1, y1, x2, y2 } = bez;

      if (t <= peakTime) {
        const seg = t / peakTime;
        const eased = cubicBezierEase(seg, x1, y1, x2, y2);
        const shadowN = lerp(0, config.shadow, eased);
        return {
          initial: baseState,
          animate: {
            scale: lerp(1, config.scale, eased),
            opacity: lerp(1, config.opacity, eased),
            x: lerp(0, config.translateX, eased),
            y: lerp(0, config.translateY, eased),
            rotate: lerp(0, config.rotate, eased),
            boxShadow: shadowToCss(shadowN),
          },
          transition: { duration: 0, delay: 0 },
        };
      }

      const seg = (t - peakTime) / (1 - peakTime);
      const eased = cubicBezierEase(seg, x1, y1, x2, y2);
      const shadowN = lerp(config.shadow, 0, eased);

      return {
        initial: baseState,
        animate: {
          scale: lerp(config.scale, 1, eased),
          opacity: lerp(config.opacity, 1, eased),
          x: lerp(config.translateX, 0, eased),
          y: lerp(config.translateY, 0, eased),
          rotate: lerp(config.rotate, 0, eased),
          boxShadow: shadowToCss(shadowN),
        },
        transition: { duration: 0, delay: 0 },
      };
    }

    // 2) Forced preview for hover/click (touch-friendly).
    if (config.trigger !== "auto" && triggerPreviewState) {
      if (triggerPreviewState === "idle") {
        return {
          initial: baseState,
          animate: baseState,
          transition: { duration: 0, delay: 0 },
        };
      }
      return {
        initial: baseState,
        animate: activeState,
        transition: { duration: 0, delay: 0 },
      };
    }

    // 3) Auto in idle/active mode (static frame).
    if (config.trigger === "auto" && (autoPreviewMode === "idle" || autoPreviewMode === "active")) {
      return {
        initial: baseState,
        animate: autoPreviewMode === "idle" ? baseState : activeState,
        transition: effectiveReducedMotion ? { duration: 0, delay: 0 } : { duration: 0, delay: 0 },
      };
    }

    // 4) Default behaviour: whileHover/whileTap/auto keyframes.
    const p = mapConfigToMotionProps(config);
    if (!effectiveReducedMotion) return p;

    // Reduced motion: snap in a visible way.
    if (config.trigger === "auto") {
      return {
        ...p,
        initial: baseState,
        animate: activeState,
        transition: { duration: 0, delay: 0 },
      };
    }
    if (p.transition) {
      return {
        ...p,
        transition: { ...(p.transition as Record<string, unknown>), duration: 0, delay: 0 },
      };
    }
    return p;
  })();

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

