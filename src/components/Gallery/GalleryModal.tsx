import { useEffect } from "react";
import { Gallery } from "./Gallery";

export function GalleryModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-50 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Gallery</div>
            <div className="truncate text-xs text-zinc-400">Presets и сохраненные микроанимации</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800/40 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-800/60"
          >
            Close
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4">
          <Gallery />
        </div>
      </div>
    </div>
  );
}

