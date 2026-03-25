import { useMemo, useState } from "react";
import { useAnimationStore } from "../../store/useAnimationStore";
import type { CompareTarget } from "../../types/animation";
import { generateFramerMotionCode } from "../../utils/codegen/generateFramerMotionCode";
import { generateCssCode } from "../../utils/codegen/generateCssCode";
import { copyTextToClipboard } from "../../utils/clipboard";

export function CodePanel() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);
  const codeLanguage = useAnimationStore((s) => s.codeLanguage);
  const setCodeLanguage = useAnimationStore((s) => s.setCodeLanguage);

  const target: CompareTarget = compareMode ? editTarget : "A";
  const config = target === "A" ? animationA : animationB;

  const code = useMemo(() => {
    if (codeLanguage === "css") return generateCssCode(config);
    return generateFramerMotionCode(config);
  }, [codeLanguage, config]);

  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-zinc-200">Code Panel</div>
          <div className="text-[11px] text-zinc-500">{compareMode ? `Editing ${target}` : "Live code generation"}</div>
        </div>

        <select
          className="rounded-lg bg-zinc-900/50 px-3 py-2 text-xs text-zinc-100 ring-1 ring-zinc-800"
          value={codeLanguage}
          onChange={(e) => setCodeLanguage(e.target.value as any)}
          aria-label="Code language"
        >
          <option value="framer-motion">Framer Motion</option>
          <option value="css">CSS</option>
        </select>
      </div>

      <div className="relative">
        <pre className="max-h-[420px] overflow-auto rounded-xl bg-zinc-950/60 p-3 ring-1 ring-zinc-800">
          <code>{code}</code>
        </pre>

        <button
          type="button"
          onClick={async () => {
            const ok = await copyTextToClipboard(code);
            setToast(ok ? "Copied!" : "Copy failed");
            window.setTimeout(() => setToast(null), 1400);
          }}
          className="mt-3 w-full rounded-xl bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-200 ring-1 ring-indigo-400 hover:bg-indigo-500/25"
        >
          Copy Code
        </button>

        {toast ? (
          <div className="absolute right-2 top-2 rounded-lg bg-zinc-950/80 px-3 py-1 text-xs text-zinc-100 ring-1 ring-zinc-800">
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}

