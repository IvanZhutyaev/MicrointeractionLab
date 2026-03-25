import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnimationConfig, CompareTarget, EasingConfig } from "../types/animation";
import { getPresetById } from "../features/presets/presets";
import type { PresetId } from "../features/presets/types";
import type { UIComponentType } from "../types/ui";
import type { CustomGalleryItem } from "../types/gallery";

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
  componentType: UIComponentType;

  // Controls UX
  activePresetIdA: PresetId | "custom";
  activePresetIdB: PresetId | "custom";
  activeGalleryKeyA: string; // e.g. preset:soft-hover | custom:<id> | none
  activeGalleryKeyB: string;

  // Gallery storage
  customGallery: CustomGalleryItem[];

  // Transient: preview hovered item in main PreviewArea (not persisted)
  galleryHover:
    | {
        active: true;
        target: CompareTarget;
        config: AnimationConfig;
        componentType: UIComponentType;
        key: string;
      }
    | { active: false };

  // Actions
  setEditTarget: (target: CompareTarget) => void;
  setCompareMode: (enabled: boolean) => void;
  setCodeLanguage: (lang: CodeLanguage) => void;
  setTheme: (theme: ThemeMode) => void;
  setComponentType: (type: UIComponentType) => void;

  setConfig: (target: CompareTarget, patch: Partial<AnimationConfig>) => void;
  applyPreset: (target: CompareTarget, presetId: PresetId) => void;
  resetTarget: (target: CompareTarget) => void;

  // Compare helpers
  copyAToB: () => void;
  copyBToA: () => void;
  swapAB: () => void;

  // Custom gallery actions
  saveCurrentToCustomGallery: (name: string, target: CompareTarget, config: AnimationConfig) => void;
  loadCustomToTarget: (id: string, target: CompareTarget) => void;
  deleteCustomGalleryItem: (id: string, target: CompareTarget) => void;

  // Hover preview actions
  setGalleryHoverPreview: (target: CompareTarget, config: AnimationConfig, componentType: UIComponentType, key: string) => void;
  clearGalleryHoverPreview: () => void;
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
      componentType: "button",
      activePresetIdA: "custom",
      activePresetIdB: "custom",
      activeGalleryKeyA: "none",
      activeGalleryKeyB: "none",
      customGallery: [],

      galleryHover: { active: false },

      setEditTarget: (target) => set({ editTarget: target }),
      setCompareMode: (enabled) => set({ compareMode: enabled }),
      setCodeLanguage: (lang) => set({ codeLanguage: lang }),
      setTheme: (theme) => set({ theme }),
      setComponentType: (type) => set({ componentType: type }),

      setConfig: (target, patch) => {
        const update = (cfg: AnimationConfig) => ({ ...cfg, ...patch });
        const nextActivePresetId: PresetId | "custom" = "custom";
        if (target === "A") {
          set({ animationA: update(get().animationA), activePresetIdA: nextActivePresetId, activeGalleryKeyA: "none" });
        } else {
          set({ animationB: update(get().animationB), activePresetIdB: nextActivePresetId, activeGalleryKeyB: "none" });
        }
      },

      applyPreset: (target, presetId) => {
        const preset = getPresetById(presetId);
        if (!preset) return;
        if (target === "A") {
          set({ animationA: preset.config, activePresetIdA: presetId, activeGalleryKeyA: `preset:${presetId}` });
        } else {
          set({ animationB: preset.config, activePresetIdB: presetId, activeGalleryKeyB: `preset:${presetId}` });
        }
      },

      resetTarget: (target) => {
        if (target === "A") {
          set({ animationA: DEFAULT_CONFIG, activePresetIdA: "custom", activeGalleryKeyA: "none" });
        } else {
          set({ animationB: DEFAULT_CONFIG, activePresetIdB: "custom", activeGalleryKeyB: "none" });
        }
      },

      copyAToB: () => {
        const s = get();
        set({
          animationB: { ...s.animationA },
          activePresetIdB: s.activePresetIdA,
          activeGalleryKeyB: s.activeGalleryKeyA,
        });
      },
      copyBToA: () => {
        const s = get();
        set({
          animationA: { ...s.animationB },
          activePresetIdA: s.activePresetIdB,
          activeGalleryKeyA: s.activeGalleryKeyB,
        });
      },
      swapAB: () => {
        const s = get();
        set({
          animationA: { ...s.animationB },
          animationB: { ...s.animationA },
          activePresetIdA: s.activePresetIdB,
          activePresetIdB: s.activePresetIdA,
          activeGalleryKeyA: s.activeGalleryKeyB,
          activeGalleryKeyB: s.activeGalleryKeyA,
        });
      },

      saveCurrentToCustomGallery: (name, target, config) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const item: CustomGalleryItem = {
          id,
          name,
          createdAt: Date.now(),
          componentType: get().componentType,
          config,
        };
        set((s) => {
          const next = [...s.customGallery, item];
          if (target === "A") {
            return { customGallery: next, activePresetIdA: "custom", activeGalleryKeyA: `custom:${id}` };
          }
          return { customGallery: next, activePresetIdB: "custom", activeGalleryKeyB: `custom:${id}` };
        });
      },

      loadCustomToTarget: (id, target) => {
        const item = get().customGallery.find((x) => x.id === id);
        if (!item) return;
        if (target === "A") {
          set({ animationA: item.config, activePresetIdA: "custom", activeGalleryKeyA: `custom:${id}`, componentType: item.componentType });
        } else {
          set({ animationB: item.config, activePresetIdB: "custom", activeGalleryKeyB: `custom:${id}`, componentType: item.componentType });
        }
      },

      deleteCustomGalleryItem: (id, target) => {
        set((s) => {
          const next = s.customGallery.filter((x) => x.id !== id);
          if (target === "A") {
            const nextKey = s.activeGalleryKeyA === `custom:${id}` ? "none" : s.activeGalleryKeyA;
            return { customGallery: next, activeGalleryKeyA: nextKey };
          }
          const nextKey = s.activeGalleryKeyB === `custom:${id}` ? "none" : s.activeGalleryKeyB;
          return { customGallery: next, activeGalleryKeyB: nextKey };
        });
      },

      setGalleryHoverPreview: (target, config, componentType, key) => {
        set({
          galleryHover: { active: true, target, config, componentType, key },
        });
      },

      clearGalleryHoverPreview: () => {
        set({ galleryHover: { active: false } });
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

