import type { AnimationConfig, EasingConfig, PresetId, Trigger } from "./types";

export type Preset = {
  id: PresetId;
  name: string;
  trigger: Trigger;
  description: string;
  config: AnimationConfig;
};

const easing = (cfg: EasingConfig): EasingConfig => cfg;

export const PRESETS: Preset[] = [
  {
    id: "soft-hover",
    name: "Soft Hover",
    trigger: "hover",
    description: "Мягкое увеличение и легкое затемнение при наведении.",
    config: {
      trigger: "hover",
      duration: 200,
      delay: 0,
      easing: easing({ kind: "preset", preset: "easeOut" }),
      scale: 1.08,
      translateX: 0,
      translateY: 0,
      rotate: 0,
      opacity: 0.92,
      shadow: 0.35,
    },
  },
  {
    id: "material-press",
    name: "Material Press",
    trigger: "click",
    description: "Как кнопка Material: небольшое прижатие и тень.",
    config: {
      trigger: "click",
      duration: 140,
      delay: 0,
      easing: easing({ kind: "preset", preset: "easeInOut" }),
      scale: 0.98,
      translateX: 0,
      translateY: 2,
      rotate: 0,
      opacity: 1,
      shadow: 0.55,
    },
  },
  {
    id: "elastic-click",
    name: "Elastic Click",
    trigger: "click",
    description: "Легкий упругий клик: заметный отклик без перегруза.",
    config: {
      trigger: "click",
      duration: 320,
      delay: 0,
      easing: easing({ kind: "cubicBezier", x1: 0.2, y1: 0.9, x2: 0.2, y2: 1 }),
      scale: 1.06,
      translateX: 0,
      translateY: -1,
      rotate: 3,
      opacity: 0.98,
      shadow: 0.65,
    },
  },
];

export function getPresetById(id: PresetId): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

