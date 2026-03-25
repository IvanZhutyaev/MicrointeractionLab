import { useAnimationStore } from "../../store/useAnimationStore";
import { AnimatedButton } from "./AnimatedButton";

export function PreviewArea() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);

  return (
    <div className="h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      {!compareMode ? (
        <div className="flex items-center justify-center h-full">
          <AnimatedButton config={animationA} active={editTarget === "A"} />
        </div>
      ) : (
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation A</div>
            <AnimatedButton config={animationA} active={editTarget === "A"} />
          </div>
          <div className="flex-1">
            <div className="mb-3 text-xs text-zinc-400">Animation B</div>
            <AnimatedButton config={animationB} active={editTarget === "B"} />
          </div>
        </div>
      )}
    </div>
  );
}

