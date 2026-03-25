import { useMemo, useState } from "react";
import { AnimatedButton } from "../Preview/AnimatedButton";
import { PRESETS } from "../../features/presets/presets";
import type { Trigger } from "../../types/animation";
import { useAnimationStore } from "../../store/useAnimationStore";

const HEARTS: Record<string, number> = {
  "soft-hover": 24,
  "material-press": 12,
  "elastic-click": 18,
};

export function Gallery() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const applyPreset = useAnimationStore((s) => s.applyPreset);

  const target = (compareMode ? editTarget : "A") as "A" | "B";

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Trigger>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PRESETS.filter((p) => {
      const matchesQuery =
        !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
      const matchesFilter = filter === "all" ? true : p.trigger === filter;
      return matchesQuery && matchesFilter;
    });
  }, [q, filter]);

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-100">Gallery</div>
          <div className="text-xs text-zinc-500">Быстрый выбор готовых микроанимаций</div>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="w-56 rounded-xl bg-zinc-950/40 px-3 py-2 text-sm ring-1 ring-zinc-800 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={filter === "all" ? "rounded-xl bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400" : "rounded-xl bg-zinc-950/20 px-3 py-1 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={filter === "hover" ? "rounded-xl bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400" : "rounded-xl bg-zinc-950/20 px-3 py-1 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"}
          onClick={() => setFilter("hover")}
        >
          Hover
        </button>
        <button
          type="button"
          className={filter === "click" ? "rounded-xl bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400" : "rounded-xl bg-zinc-950/20 px-3 py-1 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"}
          onClick={() => setFilter("click")}
        >
          Click
        </button>
        <button
          type="button"
          className={filter === "auto" ? "rounded-xl bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400" : "rounded-xl bg-zinc-950/20 px-3 py-1 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"}
          onClick={() => setFilter("auto")}
        >
          Loader
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => applyPreset(target, p.id as any)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") applyPreset(target, p.id as any);
            }}
            className="group cursor-pointer rounded-2xl bg-zinc-950/30 p-3 text-left ring-1 ring-zinc-800 hover:bg-zinc-950/45"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-100">{p.name}</div>
                <div className="truncate text-xs text-zinc-500">{p.description}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-300">
                <span aria-hidden>❤️</span>
                <span>{HEARTS[p.id] ?? 0}</span>
              </div>
            </div>

            <div className="mt-3">
              <AnimatedButton config={p.config} compact active={false} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

