import { useMemo, useState } from "react";
import { AnimatedElement } from "../Preview/AnimatedElement";
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
  const componentType = useAnimationStore((s) => s.componentType);
  const activePresetIdA = useAnimationStore((s) => s.activePresetIdA);
  const activePresetIdB = useAnimationStore((s) => s.activePresetIdB);
  const savedItems = useAnimationStore((s) => s.customGallery);
  const activeGalleryKeyA = useAnimationStore((s) => s.activeGalleryKeyA);
  const activeGalleryKeyB = useAnimationStore((s) => s.activeGalleryKeyB);
  const favorites = useAnimationStore((s) => s.favorites);
  const likes = useAnimationStore((s) => s.likes);
  const liked = useAnimationStore((s) => s.liked);
  const toggleFavorite = useAnimationStore((s) => s.toggleFavorite);
  const toggleLike = useAnimationStore((s) => s.toggleLike);

  const target = (compareMode ? editTarget : "A") as "A" | "B";
  const activePresetId = target === "A" ? activePresetIdA : activePresetIdB;
  const activeGalleryKey = target === "A" ? activeGalleryKeyA : activeGalleryKeyB;

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Trigger>("all");
  const [tab, setTab] = useState<"presets" | "saved" | "favorites">("presets");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of PRESETS) for (const t of p.tags) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);

  const applySaved = useAnimationStore((s) => s.loadCustomToTarget);
  const deleteSaved = useAnimationStore((s) => s.deleteCustomGalleryItem);

  const saveToGallery = useAnimationStore((s) => s.saveCurrentToCustomGallery);
  const setGalleryHoverPreview = useAnimationStore((s) => s.setGalleryHoverPreview);
  const clearGalleryHoverPreview = useAnimationStore((s) => s.clearGalleryHoverPreview);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);
  const currentConfig = target === "A" ? animationA : animationB;

  const filteredPresets = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PRESETS.filter((p) => {
      const matchesQuery =
        !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
      const matchesFilter = filter === "all" ? true : p.trigger === filter;
      const matchesTag = tagFilter === "all" ? true : p.tags.includes(tagFilter);
      return matchesQuery && matchesFilter && matchesTag;
    });
  }, [q, filter, tagFilter]);

  const filteredSaved = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return savedItems;
    return savedItems.filter((it) => it.name.toLowerCase().includes(query));
  }, [q, savedItems]);

  const favoritePresets = useMemo(
    () => filteredPresets.filter((p) => !!favorites[`preset:${p.id}`]),
    [filteredPresets, favorites],
  );

  const favoriteSaved = useMemo(
    () => filteredSaved.filter((it) => !!favorites[`custom:${it.id}`]),
    [filteredSaved, favorites],
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2 sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("presets")}
            className={
              tab === "presets"
                ? "rounded-xl bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                : "rounded-xl bg-zinc-950/20 px-3 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
            }
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setTab("saved")}
            className={
              tab === "saved"
                ? "rounded-xl bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                : "rounded-xl bg-zinc-950/20 px-3 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
            }
          >
            Saved
          </button>
          <button
            type="button"
            onClick={() => setTab("favorites")}
            className={
              tab === "favorites"
                ? "rounded-xl bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400"
                : "rounded-xl bg-zinc-950/20 px-3 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
            }
          >
            Favorites
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl bg-zinc-950/40 px-3 py-2 text-sm ring-1 ring-zinc-800 placeholder:text-zinc-600 sm:w-64"
          />
        </div>
      </div>

      {tab === "presets" ? (
        <>
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

          <div className="mb-4">
            <div className="mb-1 text-[11px] text-zinc-400">Tag</div>
            <select
              className="w-full rounded-xl bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 ring-1 ring-zinc-800"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="all">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredPresets.map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => applyPreset(target, p.id as any)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") applyPreset(target, p.id as any);
                }}
                onMouseEnter={() => setHoveredItemKey(`preset:${p.id}`)}
                onMouseLeave={() => {
                  setHoveredItemKey(null);
                  clearGalleryHoverPreview();
                }}
                onFocus={() => {
                  setHoveredItemKey(`preset:${p.id}`);
                  setGalleryHoverPreview(target, p.config, componentType, `preset:${p.id}`);
                }}
                onBlur={() => {
                  setHoveredItemKey(null);
                  clearGalleryHoverPreview();
                }}
                onPointerEnter={() => {
                  setHoveredItemKey(`preset:${p.id}`);
                  setGalleryHoverPreview(target, p.config, componentType, `preset:${p.id}`);
                }}
                className={
                  p.id === activePresetId
                    ? "group cursor-pointer rounded-2xl bg-indigo-500/10 p-3 text-left ring-1 ring-indigo-400/80 hover:bg-indigo-500/15"
                    : "group cursor-pointer rounded-2xl bg-zinc-950/30 p-3 text-left ring-1 ring-zinc-800 hover:bg-zinc-950/45"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-100">{p.name}</div>
                    <div className="truncate text-xs text-zinc-500">{p.description}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <button
                      type="button"
                      aria-label="Toggle favorite"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(`preset:${p.id}`);
                      }}
                      className="rounded-lg bg-zinc-950/20 px-2 py-1 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                    >
                      {favorites[`preset:${p.id}`] ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      aria-label="Like"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(`preset:${p.id}`);
                      }}
                      className="rounded-lg bg-zinc-950/20 px-2 py-1 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                    >
                      ❤️ {(HEARTS[p.id] ?? 0) + (likes[`preset:${p.id}`] ?? 0)}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <AnimatedElement
                    config={p.config}
                    compact
                    componentType={componentType}
                    active={false}
                    triggerPreviewState={
                      p.config.trigger === "auto" ? undefined : hoveredItemKey === `preset:${p.id}` ? "active" : "idle"
                    }
                      autoTimelineProgress={
                        p.config.trigger === "auto"
                          ? hoveredItemKey === `preset:${p.id}`
                            ? p.config.autoPeak
                            : 0
                          : undefined
                      }
                  />
                </div>

                {p.id === activePresetId ? (
                  <div className="mt-2 text-[11px] font-semibold text-indigo-200">Selected</div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {tab === "saved" ? (
            <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-400">
              Сохраняй текущую настройку и возвращайся к ней позже.
            </div>
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("Название для сохранения:", "My Microinteraction");
                if (!name) return;
                saveToGallery(name, target, currentConfig);
              }}
              className="rounded-xl bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400 hover:bg-indigo-500/20"
            >
              Save current
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredSaved.map((it) => {
              const selected = activeGalleryKey === `custom:${it.id}`;
              const key = `custom:${it.id}`;
              const hovered = hoveredItemKey === key;
              return (
                <div
                  key={it.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => applySaved(it.id, target)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") applySaved(it.id, target);
                  }}
                  onMouseEnter={() => {
                    setHoveredItemKey(key);
                    setGalleryHoverPreview(target, it.config, it.componentType, key);
                  }}
                  onMouseLeave={() => {
                    setHoveredItemKey(null);
                    clearGalleryHoverPreview();
                  }}
                  onFocus={() => {
                    setHoveredItemKey(key);
                    setGalleryHoverPreview(target, it.config, it.componentType, key);
                  }}
                  onBlur={() => {
                    setHoveredItemKey(null);
                    clearGalleryHoverPreview();
                  }}
                  className={
                    selected
                      ? "group cursor-pointer rounded-2xl bg-indigo-500/10 p-3 text-left ring-1 ring-indigo-400/80 hover:bg-indigo-500/15"
                      : "group cursor-pointer rounded-2xl bg-zinc-950/30 p-3 text-left ring-1 ring-zinc-800 hover:bg-zinc-950/45"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-100">{it.name}</div>
                      <div className="truncate text-xs text-zinc-500">
                        {it.config.trigger.toUpperCase()} · {Math.round(it.config.duration)}ms
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Toggle favorite"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(`custom:${it.id}`);
                        }}
                        className="rounded-lg bg-zinc-950/20 px-2 py-1 text-[11px] font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                      >
                        {favorites[`custom:${it.id}`] ? "★" : "☆"}
                      </button>
                      <button
                        type="button"
                        aria-label="Like"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(`custom:${it.id}`);
                        }}
                        className="rounded-lg bg-zinc-950/20 px-2 py-1 text-[11px] font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                      >
                        ❤️ {likes[`custom:${it.id}`] ?? 0}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSaved(it.id, target);
                        }}
                        className="rounded-lg bg-zinc-950/20 px-2 py-1 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <AnimatedElement
                      config={it.config}
                      compact
                      componentType={it.componentType}
                      active={false}
                      triggerPreviewState={
                        it.config.trigger === "auto" ? undefined : hovered ? "active" : "idle"
                      }
                      autoTimelineProgress={
                        it.config.trigger === "auto" ? (hovered ? it.config.autoPeak : 0) : undefined
                      }
                    />
                  </div>

                  {selected ? (
                    <div className="mt-2 text-[11px] font-semibold text-indigo-200">Selected</div>
                  ) : null}
                </div>
              );
            })}
          </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-xs text-zinc-500">
                Любимые пресеты и сохранённые настройки.
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {favoritePresets.map((p) => {
                  const key = `preset:${p.id}`;
                  const likeExtra = likes[key] ?? 0;
                  const likeCount = (HEARTS[p.id] ?? 0) + likeExtra;
                  const fav = !!favorites[key];
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyPreset(target, p.id as any)}
                      onMouseEnter={() => {
                        setHoveredItemKey(`preset:${p.id}`);
                        setGalleryHoverPreview(target, p.config, componentType, `preset:${p.id}`);
                      }}
                      onMouseLeave={() => {
                        setHoveredItemKey(null);
                        clearGalleryHoverPreview();
                      }}
                      className={
                        p.id === activePresetId
                          ? "group cursor-pointer rounded-2xl bg-indigo-500/10 p-3 text-left ring-1 ring-indigo-400/80 hover:bg-indigo-500/15"
                          : "group cursor-pointer rounded-2xl bg-zinc-950/30 p-3 text-left ring-1 ring-zinc-800 hover:bg-zinc-950/45"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-100">{p.name}</div>
                          <div className="truncate text-xs text-zinc-500">{p.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Toggle favorite"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(key);
                            }}
                            className="rounded-lg bg-zinc-950/20 px-2 py-1 text-[11px] text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                          >
                            {fav ? "★" : "☆"}
                          </button>
                          <button
                            type="button"
                            aria-label="Like"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(key);
                            }}
                            className="rounded-lg bg-zinc-950/20 px-2 py-1 text-[11px] text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                          >
                            ❤️ {likeCount}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <AnimatedElement config={p.config} compact componentType={componentType} active={false} />
                      </div>
                      {p.id === activePresetId ? <div className="mt-2 text-[11px] font-semibold text-indigo-200">Selected</div> : null}
                    </div>
                  );
                })}
                {favoriteSaved.map((it) => {
                  const key = `custom:${it.id}`;
                  const selected = activeGalleryKey === key;
                  const likeExtra = likes[key] ?? 0;
                  const likedLocal = !!liked[key];
                  return (
                    <div
                      key={it.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => applySaved(it.id, target)}
                      onMouseEnter={() => {
                        setHoveredItemKey(key);
                        setGalleryHoverPreview(target, it.config, it.componentType, key);
                      }}
                      onMouseLeave={() => {
                        setHoveredItemKey(null);
                        clearGalleryHoverPreview();
                      }}
                      className={
                        selected
                          ? "group cursor-pointer rounded-2xl bg-indigo-500/10 p-3 text-left ring-1 ring-indigo-400/80 hover:bg-indigo-500/15"
                          : "group cursor-pointer rounded-2xl bg-zinc-950/30 p-3 text-left ring-1 ring-zinc-800 hover:bg-zinc-950/45"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-100">{it.name}</div>
                          <div className="truncate text-xs text-zinc-500">
                            {it.config.trigger.toUpperCase()} · {Math.round(it.config.duration)}ms
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(key);
                            }}
                            className="rounded-lg bg-zinc-950/20 px-2 py-1 text-[11px] text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                          >
                            {favorites[key] ? "★" : "☆"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(key);
                            }}
                            className="rounded-lg bg-zinc-950/20 px-2 py-1 text-[11px] text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-950/30"
                          >
                            ❤️ {likeExtra}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <AnimatedElement config={it.config} compact componentType={it.componentType} active={false} />
                      </div>
                      {selected ? <div className="mt-2 text-[11px] font-semibold text-indigo-200">Selected</div> : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

