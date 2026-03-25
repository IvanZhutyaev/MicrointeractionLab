import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useAnimationStore } from "../../store/useAnimationStore";
import { AnimatedElement } from "./AnimatedElement";

export function PreviewArea() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);
  const componentType = useAnimationStore((s) => s.componentType);

  const reducedMotion = useReducedMotion();
  const initialAutoMode = useMemo(() => (reducedMotion ? ("active" as const) : ("auto" as const)), [reducedMotion]);

  const [autoModeA, setAutoModeA] = useState<"auto" | "idle" | "active">(initialAutoMode);
  const [autoModeB, setAutoModeB] = useState<"auto" | "idle" | "active">(initialAutoMode);

  useEffect(() => {
    if (animationA.trigger !== "auto") return;
    if (autoModeA !== "auto") return;
    // auto motion is base -> target -> base, so after duration+delay it should look like "idle"
    const ms = animationA.duration + animationA.delay + 50;
    const t = window.setTimeout(() => setAutoModeA("idle"), ms);
    return () => window.clearTimeout(t);
  }, [animationA.trigger, animationA.duration, animationA.delay, autoModeA]);

  useEffect(() => {
    if (animationB.trigger !== "auto") return;
    if (autoModeB !== "auto") return;
    const ms = animationB.duration + animationB.delay + 50;
    const t = window.setTimeout(() => setAutoModeB("idle"), ms);
    return () => window.clearTimeout(t);
  }, [animationB.trigger, animationB.duration, animationB.delay, autoModeB]);

  useEffect(() => {
    // If the user flips reduced-motion while the app is open, re-seed auto mode.
    setAutoModeA(initialAutoMode);
    setAutoModeB(initialAutoMode);
  }, [initialAutoMode]);

  return (
    <div className="h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      {!compareMode ? (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <AnimatedElement
            config={animationA}
            componentType={componentType}
            active={editTarget === "A"}
            autoPreviewMode={animationA.trigger === "auto" ? autoModeA : undefined}
          />

          {animationA.trigger === "auto" ? (
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setAutoModeA("idle")}
                className={
                  autoModeA === "idle"
                    ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                    : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                }
              >
                Idle
              </button>
              <button
                type="button"
                onClick={() => setAutoModeA("active")}
                className={
                  autoModeA === "active"
                    ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                    : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                }
              >
                Active
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation A</div>
            <div className="flex flex-col items-center gap-3">
              <AnimatedElement
                config={animationA}
                componentType={componentType}
                active={editTarget === "A"}
                autoPreviewMode={animationA.trigger === "auto" ? autoModeA : undefined}
              />

              {animationA.trigger === "auto" ? (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoModeA("idle")}
                    className={
                      autoModeA === "idle"
                        ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Idle
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoModeA("active")}
                    className={
                      autoModeA === "active"
                        ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Active
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation B</div>
            <div className="flex flex-col items-center gap-3">
              <AnimatedElement
                config={animationB}
                componentType={componentType}
                active={editTarget === "B"}
                autoPreviewMode={animationB.trigger === "auto" ? autoModeB : undefined}
              />

              {animationB.trigger === "auto" ? (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoModeB("idle")}
                    className={
                      autoModeB === "idle"
                        ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Idle
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoModeB("active")}
                    className={
                      autoModeB === "active"
                        ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Active
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

