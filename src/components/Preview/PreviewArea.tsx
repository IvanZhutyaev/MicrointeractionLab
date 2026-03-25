import { useState } from "react";
import { useAnimationStore } from "../../store/useAnimationStore";
import { AnimatedButton } from "./AnimatedButton";

export function PreviewArea() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);

  const [replayA, setReplayA] = useState(0);
  const [replayB, setReplayB] = useState(0);

  return (
    <div className="h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      {!compareMode ? (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <AnimatedButton config={animationA} active={editTarget === "A"} replayKey={replayA} />
          {animationA.trigger === "auto" ? (
            <button
              type="button"
              onClick={() => setReplayA((v) => v + 1)}
              className="rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
            >
              Replay
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation A</div>
            <div className="flex flex-col items-center gap-3">
              <AnimatedButton config={animationA} active={editTarget === "A"} replayKey={replayA} />
              {animationA.trigger === "auto" ? (
                <button
                  type="button"
                  onClick={() => setReplayA((v) => v + 1)}
                  className="rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                >
                  Replay
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation B</div>
            <div className="flex flex-col items-center gap-3">
              <AnimatedButton config={animationB} active={editTarget === "B"} replayKey={replayB} />
              {animationB.trigger === "auto" ? (
                <button
                  type="button"
                  onClick={() => setReplayB((v) => v + 1)}
                  className="rounded-lg bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-950/80"
                >
                  Replay
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

