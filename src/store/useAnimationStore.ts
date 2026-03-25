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
  autoPeak: 0.55,
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
  simulateReducedMotion: boolean;

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
  setSimulateReducedMotion: (enabled: boolean) => void;

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

  // History (Undo/Redo)
  historyPast: Array<{
    animationA: AnimationConfig;
    animationB: AnimationConfig;
    activePresetIdA: PresetId | "custom";
    activePresetIdB: PresetId | "custom";
    activeGalleryKeyA: string;
    activeGalleryKeyB: string;
    componentType: UIComponentType;
  }>;
  historyFuture: Array<{
    animationA: AnimationConfig;
    animationB: AnimationConfig;
    activePresetIdA: PresetId | "custom";
    activePresetIdB: PresetId | "custom";
    activeGalleryKeyA: string;
    activeGalleryKeyB: string;
    componentType: UIComponentType;
  }>;
  historyLog: Array<{ id: string; at: number; label: string }>;
  historyMax: number;
  canUndo: boolean;
  canRedo: boolean;
  commitHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;
  restoreHistoryIndex: (index: number) => void;

  // External import/export (share links / JSON)
  applyImportedSetup: (payload: {
    componentType?: UIComponentType;
    animationA: AnimationConfig;
    animationB: AnimationConfig;
    codeLanguage?: CodeLanguage;
  }) => void;

  // Gallery UX: favorites + likes (local only)
  favorites: Record<string, boolean>;
  likes: Record<string, number>;
  liked: Record<string, boolean>;
  toggleFavorite: (key: string) => void;
  toggleLike: (key: string) => void;
};

function getTargetConfig(state: State, target: CompareTarget) {
  return target === "A" ? state.animationA : state.animationB;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function captureHistorySnapshot(s: State) {
  return {
    animationA: deepClone(s.animationA),
    animationB: deepClone(s.animationB),
    activePresetIdA: s.activePresetIdA,
    activePresetIdB: s.activePresetIdB,
    activeGalleryKeyA: s.activeGalleryKeyA,
    activeGalleryKeyB: s.activeGalleryKeyB,
    componentType: s.componentType,
  };
}

export const useAnimationStore = create<State>()(
  persist(
    (set, get) => ({
      compareMode: false,
      editTarget: "A",
      animationA: DEFAULT_CONFIG,
      animationB: { ...DEFAULT_CONFIG, scale: 0.98, rotate: -3, opacity: 0.9, shadow: 0.5, autoPeak: 0.55 },
      codeLanguage: "framer-motion",
      theme: "dark",
      componentType: "button",
      simulateReducedMotion: false,
      activePresetIdA: "custom",
      activePresetIdB: "custom",
      activeGalleryKeyA: "none",
      activeGalleryKeyB: "none",
      customGallery: [],

      galleryHover: { active: false },
      favorites: {},
      likes: {},
      liked: {},
      historyPast: [],
      historyFuture: [],
      historyLog: [],
      historyMax: 30,
      canUndo: false,
      canRedo: false,

      commitHistory: (label) => {
        const s = get();
        const snapshot = captureHistorySnapshot(s);
        set((state) => {
          const entry = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, at: Date.now(), label };
          const nextPast = [...state.historyPast, snapshot].slice(-state.historyMax);
          const nextLog = [...state.historyLog, entry].slice(-state.historyMax);
          return {
            historyPast: nextPast,
            historyFuture: [],
            historyLog: nextLog,
            canUndo: nextPast.length > 0,
            canRedo: false,
          };
        });
      },

      setEditTarget: (target) => set({ editTarget: target }),
      setCompareMode: (enabled) => set({ compareMode: enabled }),
      setCodeLanguage: (lang) => set({ codeLanguage: lang }),
      setTheme: (theme) => set({ theme }),
      setSimulateReducedMotion: (enabled) => set({ simulateReducedMotion: enabled }),
      setComponentType: (type) => {
        const s = get();
        if (s.componentType === type) return;
        get().commitHistory(`Component: ${type}`);
        set({ componentType: type });
      },

      setConfig: (target, patch) => {
        get().commitHistory(`Edit ${target}`);
        const update = (cfg: AnimationConfig) => ({ ...cfg, ...patch });
        const nextActivePresetId: PresetId | "custom" = "custom";
        if (target === "A") {
          set({ animationA: update(get().animationA), activePresetIdA: nextActivePresetId, activeGalleryKeyA: "none" });
        } else {
          set({ animationB: update(get().animationB), activePresetIdB: nextActivePresetId, activeGalleryKeyB: "none" });
        }
      },

      applyPreset: (target, presetId) => {
        get().commitHistory(`Preset: ${presetId} (${target})`);
        const preset = getPresetById(presetId);
        if (!preset) return;
        if (target === "A") {
          set({ animationA: preset.config, activePresetIdA: presetId, activeGalleryKeyA: `preset:${presetId}` });
        } else {
          set({ animationB: preset.config, activePresetIdB: presetId, activeGalleryKeyB: `preset:${presetId}` });
        }
      },

      resetTarget: (target) => {
        get().commitHistory(`Reset ${target}`);
        if (target === "A") {
          set({ animationA: DEFAULT_CONFIG, activePresetIdA: "custom", activeGalleryKeyA: "none" });
        } else {
          set({ animationB: DEFAULT_CONFIG, activePresetIdB: "custom", activeGalleryKeyB: "none" });
        }
      },

      copyAToB: () => {
        get().commitHistory("Copy A → B");
        const s = get();
        set({
          animationB: { ...s.animationA },
          activePresetIdB: s.activePresetIdA,
          activeGalleryKeyB: s.activeGalleryKeyA,
        });
      },
      copyBToA: () => {
        get().commitHistory("Copy B → A");
        const s = get();
        set({
          animationA: { ...s.animationB },
          activePresetIdA: s.activePresetIdB,
          activeGalleryKeyA: s.activeGalleryKeyB,
        });
      },
      swapAB: () => {
        get().commitHistory("Swap A ↔ B");
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
        get().commitHistory(`Load saved ${id} (${target})`);
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

      toggleFavorite: (key) => {
        set((s) => {
          const next = { ...s.favorites, [key]: !s.favorites[key] };
          if (!next[key]) delete next[key];
          return { favorites: next };
        });
      },

      toggleLike: (key) => {
        set((s) => {
          const alreadyLiked = !!s.liked[key];
          const nextLiked = { ...s.liked, [key]: !alreadyLiked };
          const prevCount = s.likes[key] ?? 0;
          const nextCount = alreadyLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
          return {
            liked: nextLiked,
            likes: { ...s.likes, [key]: nextCount },
          };
        });
      },

      undo: () => {
        const s = get();
        if (s.historyPast.length === 0) return;
        const prev = s.historyPast[s.historyPast.length - 1];
        const currentSnap = captureHistorySnapshot(s);
        const nextPast = s.historyPast.slice(0, -1);
        const nextFuture = [...s.historyFuture, currentSnap];
        const nextLog = s.historyLog.slice(0, -1);
        set({
          animationA: prev.animationA,
          animationB: prev.animationB,
          activePresetIdA: prev.activePresetIdA,
          activePresetIdB: prev.activePresetIdB,
          activeGalleryKeyA: prev.activeGalleryKeyA,
          activeGalleryKeyB: prev.activeGalleryKeyB,
          componentType: prev.componentType,
          historyPast: nextPast,
          historyFuture: nextFuture,
          historyLog: nextLog,
          canUndo: nextPast.length > 0,
          canRedo: nextFuture.length > 0,
        });
      },

      redo: () => {
        const s = get();
        if (s.historyFuture.length === 0) return;
        const next = s.historyFuture[s.historyFuture.length - 1];
        const currentSnap = captureHistorySnapshot(s);
        const nextFuture = s.historyFuture.slice(0, -1);
        const nextPast = [...s.historyPast, currentSnap].slice(-s.historyMax);
        const entry = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, at: Date.now(), label: "Redo" };
        const nextLog = [...s.historyLog, entry].slice(-s.historyMax);
        set({
          animationA: next.animationA,
          animationB: next.animationB,
          activePresetIdA: next.activePresetIdA,
          activePresetIdB: next.activePresetIdB,
          activeGalleryKeyA: next.activeGalleryKeyA,
          activeGalleryKeyB: next.activeGalleryKeyB,
          componentType: next.componentType,
          historyPast: nextPast,
          historyFuture: nextFuture,
          historyLog: nextLog,
          canUndo: nextPast.length > 0,
          canRedo: nextFuture.length > 0,
        });
      },

      restoreHistoryIndex: (index) => {
        const s = get();
        const item = s.historyPast[index];
        if (!item) return;
        const currentSnap = captureHistorySnapshot(s);
        const nextPast = s.historyPast.slice(0, index);
        const nextLog = s.historyLog.slice(0, index);
        set({
          animationA: item.animationA,
          animationB: item.animationB,
          activePresetIdA: item.activePresetIdA,
          activePresetIdB: item.activePresetIdB,
          activeGalleryKeyA: item.activeGalleryKeyA,
          activeGalleryKeyB: item.activeGalleryKeyB,
          componentType: item.componentType,
          historyPast: nextPast,
          historyFuture: [currentSnap],
          historyLog: nextLog,
          canUndo: nextPast.length > 0,
          canRedo: true,
        });
      },

      applyImportedSetup: (payload) => {
        if (!payload) return;
        set((s) => ({
          animationA: deepClone(payload.animationA),
          animationB: deepClone(payload.animationB),
          componentType: payload.componentType ?? s.componentType,
          codeLanguage: payload.codeLanguage ?? s.codeLanguage,
          activePresetIdA: "custom",
          activePresetIdB: "custom",
          activeGalleryKeyA: "none",
          activeGalleryKeyB: "none",
          historyPast: [],
          historyFuture: [],
          historyLog: [],
          canUndo: false,
          canRedo: false,
          galleryHover: { active: false },
        }));
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

