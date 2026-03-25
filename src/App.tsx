import { useMemo, useState } from "react";
import { useAnimationStore } from "./store/useAnimationStore";
import { ControlsPanel } from "./components/Controls/ControlsPanel";
import { PreviewArea } from "./components/Preview/PreviewArea";
import { CodePanel } from "./components/CodePanel/CodePanel";
import { GalleryModal } from "./components/Gallery/GalleryModal";

export default function App() {
  const theme = useAnimationStore((s) => s.theme);
  const setTheme = useAnimationStore((s) => s.setTheme);
  const [showGallery, setShowGallery] = useState(false);

  const rootClassName = useMemo(() => {
    if (theme === "light") {
      return "min-h-screen bg-zinc-50 text-zinc-900 p-4";
    }
    return "min-h-screen bg-zinc-950 text-zinc-50 p-4";
  }, [theme]);

  return (
    <div className={rootClassName}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold tracking-tight">Microinteraction Lab</div>
          <div className="hidden text-xs text-zinc-500 sm:block">Real-time UI microinteractions</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-900/55 dark:bg-zinc-900/40"
          >
            Theme: {theme}
          </button>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-900/55"
          >
            GitHub
          </a>
          <button
            type="button"
            onClick={() => setShowGallery((v) => !v)}
            className="rounded-xl bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400 hover:bg-indigo-500/20"
          >
            Gallery
          </button>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-90px)] flex-col gap-4 lg:min-h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <ControlsPanel />
          </aside>
          <section className="lg:col-span-6">
            <PreviewArea />
          </section>
          <aside className="lg:col-span-3">
            <CodePanel />
          </aside>
        </div>
      </main>

      {showGallery ? <GalleryModal onClose={() => setShowGallery(false)} /> : null}
    </div>
  );
}

