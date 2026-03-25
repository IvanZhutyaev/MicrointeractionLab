import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useAnimationStore } from "../../store/useAnimationStore";
import { AnimatedElement } from "./AnimatedElement";

export function PreviewArea() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);
  const componentType = useAnimationStore((s) => s.componentType);
  const galleryHover = useAnimationStore((s) => s.galleryHover);

  const hoveredA = galleryHover.active && galleryHover.target === "A";
  const hoveredB = galleryHover.active && galleryHover.target === "B";

  const animationAForPreview = hoveredA ? galleryHover.config : animationA;
  const animationBForPreview = hoveredB ? galleryHover.config : animationB;
  const componentTypeAForPreview = hoveredA ? galleryHover.componentType : componentType;
  const componentTypeBForPreview = hoveredB ? galleryHover.componentType : componentType;

  const peakAForPreview = animationAForPreview.autoPeak ?? 0.55;
  const peakBForPreview = animationBForPreview.autoPeak ?? 0.55;

  const reducedMotion = useReducedMotion();

  const defaultHoverClick = "idle" as const;
  const [hoverClickStateA, setHoverClickStateA] = useState<"idle" | "active">(defaultHoverClick);
  const [hoverClickStateB, setHoverClickStateB] = useState<"idle" | "active">(defaultHoverClick);

  const [fps, setFps] = useState<number>(0);
  const fpsFramesRef = useRef(0);
  const fpsLastRef = useRef<number>(performance.now());

  const peakAForInit = animationA.autoPeak ?? 0.55;
  const peakBForInit = animationB.autoPeak ?? 0.55;
  const [autoProgressA, setAutoProgressA] = useState<number>(reducedMotion ? peakAForInit : 0);
  const [autoProgressB, setAutoProgressB] = useState<number>(reducedMotion ? peakBForInit : 0);

  const [scrubbedA, setScrubbedA] = useState(false);
  const [scrubbedB, setScrubbedB] = useState(false);
  const scrubbedARef = useRef(false);
  const scrubbedBRef = useRef(false);

  const rafARef = useRef<number | null>(null);
  const rafBRef = useRef<number | null>(null);

  const autoPlayProgress = (
    anim: typeof animationA,
    setProgress: (v: number) => void,
    setScrubbed: (v: boolean) => void,
    scrubbedRef: typeof scrubbedARef,
    rafRef: typeof rafARef,
  ) => {
    if (anim.trigger !== "auto") return;
    setScrubbed(false);
    scrubbedRef.current = false;
    if (reducedMotion) {
      setProgress(anim.autoPeak ?? 0.55);
      return;
    }

    setProgress(0);
    const total = anim.delay + anim.duration;
    const start = performance.now();

    const tick = (now: number) => {
      if (scrubbedRef.current) return;
      const elapsed = now - start;
      const t = (elapsed - anim.delay) / Math.max(1, anim.duration);
      const clamped = Math.max(0, Math.min(1, t));
      setProgress(clamped);

      if (elapsed < total) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(1);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (rafARef.current) cancelAnimationFrame(rafARef.current);
    autoPlayProgress(animationAForPreview, setAutoProgressA, setScrubbedA, scrubbedARef, rafARef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationAForPreview.trigger, animationAForPreview.duration, animationAForPreview.delay, reducedMotion]);

  useEffect(() => {
    if (rafBRef.current) cancelAnimationFrame(rafBRef.current);
    autoPlayProgress(animationBForPreview, setAutoProgressB, setScrubbedB, scrubbedBRef, rafBRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationBForPreview.trigger, animationBForPreview.duration, animationBForPreview.delay, reducedMotion]);

  useEffect(() => {
    let raf = 0;
    fpsFramesRef.current = 0;
    fpsLastRef.current = performance.now();

    const tick = (now: number) => {
      fpsFramesRef.current += 1;
      const dt = now - fpsLastRef.current;
      if (dt >= 600) {
        const nextFps = Math.round((fpsFramesRef.current * 1000) / dt);
        setFps(nextFps);
        fpsFramesRef.current = 0;
        fpsLastRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="absolute right-3 top-3 rounded-lg bg-zinc-950/60 px-2 py-1 text-[11px] text-zinc-200 ring-1 ring-zinc-800">
        FPS: {fps || "—"}
      </div>
      {!compareMode ? (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <AnimatedElement
            config={animationAForPreview}
            componentType={componentTypeAForPreview}
            active={editTarget === "A"}
            triggerPreviewState={
              animationAForPreview.trigger === "auto" ? undefined : hoveredA ? "active" : hoverClickStateA
            }
            autoTimelineProgress={
              animationAForPreview.trigger === "auto"
                ? hoveredA
                ? peakAForPreview
                  : autoProgressA
                : undefined
            }
          />

          {animationAForPreview.trigger === "auto" && !hoveredA ? (
            <div className="w-full max-w-xs">
              <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Auto timeline</span>
                <span>{Math.round(autoProgressA * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(autoProgressA * 100)}
                onChange={(e) => {
                  setScrubbedA(true);
                  scrubbedARef.current = true;
                  setAutoProgressA(Number(e.target.value) / 100);
                }}
                className="w-full"
              />

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScrubbedA(true);
                    scrubbedARef.current = true;
                    setAutoProgressA(0);
                  }}
                  className={
                    autoProgressA < 0.02
                      ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                      : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                  }
                >
                  Idle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScrubbedA(true);
                    scrubbedARef.current = true;
                    setAutoProgressA(animationAForPreview.autoPeak ?? 0.55);
                  }}
                  className={
                    Math.abs(autoProgressA - peakAForPreview) < 0.03
                      ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                      : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                  }
                >
                  Active
                </button>
              </div>

              <div className="mt-1 text-[11px] text-zinc-500">
                Drag to scrub the animation (base → peak → base).
              </div>
            </div>
          ) : (
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setHoverClickStateA("idle")}
                className={
                  hoverClickStateA === "idle"
                    ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                    : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                }
              >
                Idle
              </button>
              <button
                type="button"
                onClick={() => setHoverClickStateA("active")}
                className={
                  hoverClickStateA === "active"
                    ? "rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                    : "rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                }
              >
                Active
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation A</div>
            <div className="flex flex-col items-center gap-3">
              <AnimatedElement
                config={animationAForPreview}
                componentType={componentTypeAForPreview}
                active={editTarget === "A"}
                triggerPreviewState={
                  animationAForPreview.trigger === "auto" ? undefined : hoveredA ? "active" : hoverClickStateA
                }
                autoTimelineProgress={
                  animationAForPreview.trigger === "auto"
                    ? hoveredA
                      ? peakAForPreview
                      : autoProgressA
                    : undefined
                }
              />

              {animationAForPreview.trigger === "auto" && !hoveredA ? (
                <div className="w-full max-w-xs">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Auto timeline</span>
                    <span>{Math.round(autoProgressA * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(autoProgressA * 100)}
                    onChange={(e) => {
                      setScrubbedA(true);
                      scrubbedARef.current = true;
                      setAutoProgressA(Number(e.target.value) / 100);
                    }}
                    className="w-full"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScrubbedA(true);
                        scrubbedARef.current = true;
                        setAutoProgressA(0);
                      }}
                      className={
                        autoProgressA < 0.02
                          ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                          : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                      }
                    >
                      Idle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScrubbedA(true);
                        scrubbedARef.current = true;
                    setAutoProgressA(animationAForPreview.autoPeak ?? 0.55);
                      }}
                    className={
                      Math.abs(autoProgressA - peakAForPreview) < 0.03
                        ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                    >
                      Active
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHoverClickStateA("idle")}
                    className={
                      hoverClickStateA === "idle"
                        ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Idle
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoverClickStateA("active")}
                    className={
                      hoverClickStateA === "active"
                        ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Active
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation B</div>
            <div className="flex flex-col items-center gap-3">
              <AnimatedElement
                config={animationBForPreview}
                componentType={componentTypeBForPreview}
                active={editTarget === "B"}
                triggerPreviewState={
                  animationBForPreview.trigger === "auto" ? undefined : hoveredB ? "active" : hoverClickStateB
                }
                autoTimelineProgress={
                  animationBForPreview.trigger === "auto"
                    ? hoveredB
                      ? peakBForPreview
                      : autoProgressB
                    : undefined
                }
              />

              {animationBForPreview.trigger === "auto" && !hoveredB ? (
                <div className="w-full max-w-xs">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Auto timeline</span>
                    <span>{Math.round(autoProgressB * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(autoProgressB * 100)}
                    onChange={(e) => {
                      setScrubbedB(true);
                      scrubbedBRef.current = true;
                      setAutoProgressB(Number(e.target.value) / 100);
                    }}
                    className="w-full"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScrubbedB(true);
                        scrubbedBRef.current = true;
                        setAutoProgressB(0);
                      }}
                      className={
                        autoProgressB < 0.02
                          ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                          : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                      }
                    >
                      Idle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScrubbedB(true);
                        scrubbedBRef.current = true;
                        setAutoProgressB(animationBForPreview.autoPeak ?? 0.55);
                      }}
                    className={
                      Math.abs(autoProgressB - peakBForPreview) < 0.03
                        ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                    >
                      Active
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHoverClickStateB("idle")}
                    className={
                      hoverClickStateB === "idle"
                        ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Idle
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoverClickStateB("active")}
                    className={
                      hoverClickStateB === "active"
                        ? "flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                        : "flex-1 rounded-lg bg-zinc-950/60 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                    }
                  >
                    Active
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

