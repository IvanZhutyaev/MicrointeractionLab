import { PRESETS } from "../../features/presets/presets";
import type { ReactNode } from "react";
import type { EasingPreset } from "../../types/animation";
import type { EasingConfig, AnimationConfig, CompareTarget, Trigger } from "../../types/animation";
import { useAnimationStore } from "../../store/useAnimationStore";
import type { UIComponentType } from "../../types/ui";
import { EasingBezierGraph } from "./EasingBezierGraph";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-2 text-xs font-semibold text-zinc-200">{title}</div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
        <span>{label}</span>
        {hint ? <span className="text-zinc-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      className="w-full accent-indigo-400"
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function ControlsPanel() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const setCompareMode = useAnimationStore((s) => s.setCompareMode);
  const setEditTarget = useAnimationStore((s) => s.setEditTarget);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);

  const activePresetIdA = useAnimationStore((s) => s.activePresetIdA);
  const activePresetIdB = useAnimationStore((s) => s.activePresetIdB);
  const setConfig = useAnimationStore((s) => s.setConfig);
  const applyPreset = useAnimationStore((s) => s.applyPreset);
  const resetTarget = useAnimationStore((s) => s.resetTarget);
  const componentType = useAnimationStore((s) => s.componentType);
  const setComponentType = useAnimationStore((s) => s.setComponentType);
  const copyAToB = useAnimationStore((s) => s.copyAToB);
  const copyBToA = useAnimationStore((s) => s.copyBToA);
  const swapAB = useAnimationStore((s) => s.swapAB);

  const target: CompareTarget = compareMode ? editTarget : "A";
  const config: AnimationConfig = target === "A" ? animationA : animationB;
  const activePresetId = target === "A" ? activePresetIdA : activePresetIdB;

  const currentEasingKind = config.easing.kind;
  const cubicEasing = config.easing.kind === "cubicBezier" ? config.easing : null;

  const setEasing = (next: EasingConfig) => {
    setConfig(target, { easing: next });
  };

  const easingPresets: Array<{ preset: EasingPreset; label: string }> = [
    { preset: "easeOut", label: "ease-out" },
    { preset: "easeIn", label: "ease-in" },
    { preset: "easeInOut", label: "ease-in-out" },
    { preset: "linear", label: "linear" },
  ];

  const onTriggerChange = (trigger: Trigger) => setConfig(target, { trigger });

  return (
    <div className="flex h-full flex-col gap-4">
      <Section title="Mode">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Compare Mode</div>
            <div className="text-xs text-zinc-500">Два превью рядом</div>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <span>{compareMode ? "On" : "Off"}</span>
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
            />
          </label>
        </div>

        {compareMode ? (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditTarget("A")}
                className={
                  target === "A"
                    ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                    : "flex-1 rounded-lg bg-zinc-800/40 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60"
                }
              >
                Edit A
              </button>
              <button
                type="button"
                onClick={() => setEditTarget("B")}
                className={
                  target === "B"
                    ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                    : "flex-1 rounded-lg bg-zinc-800/40 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60"
                }
              >
                Edit B
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={copyAToB}
                className="rounded-lg bg-zinc-800/40 py-2 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800/60"
              >
                A → B
              </button>
              <button
                type="button"
                onClick={swapAB}
                className="rounded-lg bg-zinc-800/40 py-2 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800/60"
              >
                Swap
              </button>
              <button
                type="button"
                onClick={copyBToA}
                className="rounded-lg bg-zinc-800/40 py-2 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800/60"
              >
                B → A
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => resetTarget(target)}
            className="flex-1 rounded-lg bg-zinc-800/40 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800/60"
          >
            Reset
          </button>
          <div className="w-10" />
        </div>
      </Section>

      <Section title="Component">
        <div className="flex items-center gap-2">
          <select
            className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 ring-1 ring-zinc-800"
            value={componentType}
            onChange={(e) => setComponentType(e.target.value as UIComponentType)}
          >
            <option value="button">Button</option>
            <option value="card">Card</option>
            <option value="input">Input</option>
          </select>
        </div>
      </Section>

      <Section title="Trigger">
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-zinc-100">
              <input
                type="radio"
                name={`trigger-${target}`}
                checked={config.trigger === "hover"}
                onChange={() => onTriggerChange("hover")}
              />
              Hover
            </div>
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-zinc-100">
              <input
                type="radio"
                name={`trigger-${target}`}
                checked={config.trigger === "click"}
                onChange={() => onTriggerChange("click")}
              />
              Click
            </div>
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-zinc-100">
              <input
                type="radio"
                name={`trigger-${target}`}
                checked={config.trigger === "auto"}
                onChange={() => onTriggerChange("auto")}
              />
              Auto / Load
            </div>
          </label>
        </div>

        {config.trigger === "auto" ? (
          <div className="mt-3 text-[11px] text-zinc-500">
            Auto/Load стартует при маунте; для наглядности переключи `Idle/Active` в превью.
          </div>
        ) : null}
      </Section>

      <Section title="Presets">
        <div className="flex items-center gap-2">
          <select
            className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 ring-1 ring-zinc-800"
            value={activePresetId}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "custom") return;
              applyPreset(target, v as any);
            }}
          >
            <option value="custom">Custom</option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section title="Timing">
        <Field label="Duration" hint={`${Math.round(config.duration)}ms`}>
          <Slider
            value={config.duration}
            min={50}
            max={900}
            step={10}
            onChange={(v) => setConfig(target, { duration: clamp(v, 50, 900) })}
          />
        </Field>
        <Field label="Delay" hint={`${Math.round(config.delay)}ms`}>
          <Slider
            value={config.delay}
            min={0}
            max={500}
            step={10}
            onChange={(v) => setConfig(target, { delay: clamp(v, 0, 500) })}
          />
        </Field>
      </Section>

      <Section title="Easing">
        <Field label="Type">
          <select
            className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 ring-1 ring-zinc-800"
            value={currentEasingKind}
            onChange={(e) => {
              const kind = e.target.value as EasingConfig["kind"];
              if (kind === "preset") {
                setEasing({ kind: "preset", preset: "easeOut" });
              } else {
                setEasing({ kind: "cubicBezier", x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 });
              }
            }}
          >
            <option value="preset">Preset</option>
            <option value="cubicBezier">Cubic Bezier</option>
          </select>
        </Field>

        {currentEasingKind === "preset" ? (
          <Field label="Preset">
            <select
              className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 ring-1 ring-zinc-800"
              value={config.easing.preset}
              onChange={(e) => setEasing({ kind: "preset", preset: e.target.value as EasingPreset })}
            >
              {easingPresets.map((p) => (
                <option key={p.preset} value={p.preset}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="x1" hint={String(cubicEasing!.x1)}>
                <input
                  className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm ring-1 ring-zinc-800"
                  type="number"
                  step={0.05}
                  value={cubicEasing!.x1}
                  onChange={(e) =>
                    setEasing({
                      kind: "cubicBezier",
                      x1: Number(e.target.value),
                      y1: cubicEasing!.y1,
                      x2: cubicEasing!.x2,
                      y2: cubicEasing!.y2,
                    })
                  }
                />
              </Field>
              <Field label="y1" hint={String(cubicEasing!.y1)}>
                <input
                  className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm ring-1 ring-zinc-800"
                  type="number"
                  step={0.05}
                  value={cubicEasing!.y1}
                  onChange={(e) =>
                    setEasing({
                      kind: "cubicBezier",
                      x1: cubicEasing!.x1,
                      y1: Number(e.target.value),
                      x2: cubicEasing!.x2,
                      y2: cubicEasing!.y2,
                    })
                  }
                />
              </Field>
              <Field label="x2" hint={String(cubicEasing!.x2)}>
                <input
                  className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm ring-1 ring-zinc-800"
                  type="number"
                  step={0.05}
                  value={cubicEasing!.x2}
                  onChange={(e) =>
                    setEasing({
                      kind: "cubicBezier",
                      x1: cubicEasing!.x1,
                      y1: cubicEasing!.y1,
                      x2: Number(e.target.value),
                      y2: cubicEasing!.y2,
                    })
                  }
                />
              </Field>
              <Field label="y2" hint={String(cubicEasing!.y2)}>
                <input
                  className="w-full rounded-lg bg-zinc-900/50 px-3 py-2 text-sm ring-1 ring-zinc-800"
                  type="number"
                  step={0.05}
                  value={cubicEasing!.y2}
                  onChange={(e) =>
                    setEasing({
                      kind: "cubicBezier",
                      x1: cubicEasing!.x1,
                      y1: cubicEasing!.y1,
                      x2: cubicEasing!.x2,
                      y2: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>

            <div className="mt-3">
              <EasingBezierGraph
                x1={cubicEasing!.x1}
                y1={cubicEasing!.y1}
                x2={cubicEasing!.x2}
                y2={cubicEasing!.y2}
                onChange={({ x1: nx1, y1: ny1, x2: nx2, y2: ny2 }) => {
                  setEasing({
                    kind: "cubicBezier",
                    x1: nx1,
                    y1: ny1,
                    x2: nx2,
                    y2: ny2,
                  });
                }}
              />
            </div>
          </>
        )}
      </Section>

      <Section title="Transform">
        <Field label="Scale" hint={config.scale.toFixed(2)}>
          <Slider value={config.scale} min={0.8} max={1.3} step={0.01} onChange={(v) => setConfig(target, { scale: v })} />
        </Field>

        <Field label="Opacity" hint={config.opacity.toFixed(2)}>
          <Slider value={config.opacity} min={0.2} max={1} step={0.01} onChange={(v) => setConfig(target, { opacity: v })} />
        </Field>

        <Field label="Rotate" hint={`${Math.round(config.rotate)}deg`}>
          <Slider value={config.rotate} min={-20} max={20} step={1} onChange={(v) => setConfig(target, { rotate: v })} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Translate X" hint={`${Math.round(config.translateX)}px`}>
            <Slider value={config.translateX} min={-40} max={40} step={1} onChange={(v) => setConfig(target, { translateX: v })} />
          </Field>
          <Field label="Translate Y" hint={`${Math.round(config.translateY)}px`}>
            <Slider value={config.translateY} min={-40} max={40} step={1} onChange={(v) => setConfig(target, { translateY: v })} />
          </Field>
        </div>

        <Field label="Shadow" hint={config.shadow.toFixed(2)}>
          <Slider value={config.shadow} min={0} max={1} step={0.01} onChange={(v) => setConfig(target, { shadow: v })} />
        </Field>
      </Section>
    </div>
  );
}

