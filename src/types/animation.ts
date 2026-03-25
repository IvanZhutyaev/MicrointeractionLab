export type Trigger = "hover" | "click" | "auto" | "hoverClick";

export type EasingPreset = "easeOut" | "easeIn" | "easeInOut" | "linear";

export type EasingConfig =
  | { kind: "preset"; preset: EasingPreset }
  | { kind: "cubicBezier"; x1: number; y1: number; x2: number; y2: number };

export type AnimationConfig = {
  trigger: Trigger;
  duration: number; // ms
  delay: number; // ms
  easing: EasingConfig;
  scale: number;
  translateX: number; // px
  translateY: number; // px
  rotate: number; // deg
  opacity: number; // 0..1
  shadow: number; // 0..1
  /**
   * Auto-only: where the "peak" state happens in the timeline (0..1).
   * 0 => idle at start, 1 => idle at end.
   */
  autoPeak: number;
};

export type CompareTarget = "A" | "B";

