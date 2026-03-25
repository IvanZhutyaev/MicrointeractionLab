import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnimationConfig, CompareTarget, EasingConfig } from "../types/animation";
import { getPresetById } from "../features/presets/presets";
import type { PresetId } from "../features/presets/types";

export type CodeLanguage = "framer-motion" | "css";
export type ThemeMode = "dark" | "light";

const defaultEasing: EasingConfig = { kind: "preset", preset: "easeOut" };

const DEFAULT_CONFIG: AnimationConfig = {
  trigger: "hover",
  duration: 200,
  delay: 0,
  easing: defaultEasing,
  scale: 1.1,
  translateX: 0,
  translateY: 0,
  rotate: 5,
  opacity: 0.8,
  shadow: 0.6,
};

type State = {
  // Playground
  compareMode: boolean;
  editTarget: CompareTarget;
  animationA: AnimationConfig;
  animationB: AnimationConfig;

  // UX
  codeLanguage: CodeLanguage;
  theme: ThemeMode;

  // Controls UX
  activePresetIdA: PresetId | "custom";
  activePresetIdB: PresetId | "custom";

  // Actions
  setEditTarget: (target: CompareTarget) => void;
  setCompareMode: (enabled: boolean) => void;
  setCodeLanguage: (lang: CodeLanguage) => void;
  setTheme: (theme: ThemeMode) => void;

  setConfig: (target: CompareTarget, patch: Partial<AnimationConfig>) => void;
  applyPreset: (target: CompareTarget, presetId: PresetId) => void;
  resetTarget: (target: CompareTarget) => void;
};

function getTargetConfig(state: State, target: CompareTarget) {
  return target === "A" ? state.animationA : state.animationB;
}

export const useAnimationStore = create<State>()(
  persist(
    (set, get) => ({
      compareMode: false,
      editTarget: "A",
      animationA: DEFAULT_CONFIG,
      animationB: { ...DEFAULT_CONFIG, scale: 0.98, rotate: -3, opacity: 0.9, shadow: 0.5 },
      codeLanguage: "framer-motion",
      theme: "dark",
      activePresetIdA: "custom",
      activePresetIdB: "custom",

      setEditTarget: (target) => set({ editTarget: target }),
      setCompareMode: (enabled) => set({ compareMode: enabled }),
      setCodeLanguage: (lang) => set({ codeLanguage: lang }),
      setTheme: (theme) => set({ theme }),

      setConfig: (target, patch) => {
        const update = (cfg: AnimationConfig) => ({ ...cfg, ...patch });
        const nextActivePresetId: PresetId | "custom" = "custom";
        if (target === "A") {
          set({ animationA: update(get().animationA), activePresetIdA: nextActivePresetId });
        } else {
          set({ animationB: update(get().animationB), activePresetIdB: nextActivePresetId });
        }
      },

      applyPreset: (target, presetId) => {
        const preset = getPresetById(presetId);
        if (!preset) return;
        if (target === "A") {
          set({ animationA: preset.config, activePresetIdA: presetId });
        } else {
          set({ animationB: preset.config, activePresetIdB: presetId });
        }
      },

      resetTarget: (target) => {
        if (target === "A") {
          set({ animationA: DEFAULT_CONFIG, activePresetIdA: "custom" });
        } else {
          set({ animationB: DEFAULT_CONFIG, activePresetIdB: "custom" });
        }
      },
    }),
    {
      name: "microinteractionlab:v1",
      // Keep everything persisted (MVP requirement).
      partialize: (s) => s,
      version: 1,
    },
  ),
);

// Helper exported for codegen UI decisions.
export function getEditableTargetConfig(
  state: State,
  target: CompareTarget,
): AnimationConfig {
  return getTargetConfig(state, target);
}

