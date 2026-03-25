import type { AnimationConfig, EasingConfig } from "../../types/animation";

export function easingToFramerEase(easing: EasingConfig): string | number[] {
  if (easing.kind === "preset") return easing.preset;
  // Framer Motion accepts cubic-bezier control points as an array.
  return [easing.x1, easing.y1, easing.x2, easing.y2];
}

export function shadowToCss(shadow: number): string {
  const t = Math.max(0, Math.min(1, shadow));
  const opacity = 0.05 + t * 0.35;
  const y = 8 + t * 16;
  const blur = 18 + t * 26;
  return `0px ${y.toFixed(0)}px ${blur.toFixed(0)}px rgba(0,0,0,${opacity.toFixed(3)})`;
}

export type MotionEngineProps = {
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  whileHover?: Record<string, unknown>;
  whileTap?: Record<string, unknown>;
  whileFocus?: Record<string, unknown>;
  transition?: Record<string, unknown>;
};

export function mapConfigToMotionProps(config: AnimationConfig): MotionEngineProps {
  const baseShadow = shadowToCss(0);
  const targetShadow = shadowToCss(config.shadow);

  const transitionSeconds = config.duration / 1000;
  const transitionDelaySeconds = config.delay / 1000;

  const ease = easingToFramerEase(config.easing);
  const transition = {
    duration: transitionSeconds,
    delay: transitionDelaySeconds,
    ease,
  };

  const base = {
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    boxShadow: baseShadow,
  };

  const target = {
    scale: config.scale,
    x: config.translateX,
    y: config.translateY,
    rotate: config.rotate,
    opacity: config.opacity,
    boxShadow: targetShadow,
  };

  if (config.trigger === "hover") {
    return {
      whileHover: target,
      whileFocus: target,
      transition,
    };
  }

  if (config.trigger === "click") {
    return {
      whileTap: target,
      whileFocus: target,
      transition,
    };
  }

  // auto/loading: run a single "in-out" sequence on mount.
  return {
    initial: base,
    animate: {
      ...base,
      scale: [base.scale, target.scale, base.scale],
      x: [0, target.x, 0],
      y: [0, target.y, 0],
      rotate: [0, target.rotate, 0],
      opacity: [1, target.opacity, 1],
      boxShadow: [baseShadow, targetShadow, baseShadow],
    },
    transition: {
      ...transition,
      times: [0, 0.55, 1],
    },
  };
}

