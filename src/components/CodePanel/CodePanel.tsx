import { useMemo, useState } from "react";
import { useAnimationStore } from "../../store/useAnimationStore";
import type { CompareTarget } from "../../types/animation";
import { generateFramerMotionCode } from "../../utils/codegen/generateFramerMotionCode";
import { generateCssCode } from "../../utils/codegen/generateCssCode";
import { copyTextToClipboard } from "../../utils/clipboard";
import pkg from "../../../package.json";
import { githubRequest } from "../../utils/github/githubApi";

function parseGithubSlug(repoUrl: string | undefined): { owner: string; repo: string } | null {
  if (!repoUrl) return null;
  // Expected: git+https://github.com/Owner/Repo.git or https://github.com/Owner/Repo
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

export function CodePanel() {
  const compareMode = useAnimationStore((s) => s.compareMode);
  const editTarget = useAnimationStore((s) => s.editTarget);
  const animationA = useAnimationStore((s) => s.animationA);
  const animationB = useAnimationStore((s) => s.animationB);
  const codeLanguage = useAnimationStore((s) => s.codeLanguage);
  const setCodeLanguage = useAnimationStore((s) => s.setCodeLanguage);
  const componentType = useAnimationStore((s) => s.componentType);

  const target: CompareTarget = compareMode ? editTarget : "A";
  const config = target === "A" ? animationA : animationB;

  const repoSlug = useMemo(() => parseGithubSlug((pkg as any)?.repository?.url), []);

  const code = useMemo(() => {
    if (codeLanguage === "css") return generateCssCode(config, componentType);
    return generateFramerMotionCode(config, componentType);
  }, [codeLanguage, config, componentType]);

  const [toast, setToast] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [githubBusy, setGithubBusy] = useState(false);

  const issueTitle = `Microinteraction (${componentType}, ${config.trigger}, ${Math.round(config.duration)}ms)`;
  const easingLabel =
    config.easing.kind === "preset"
      ? config.easing.preset
      : `cubic-bezier(${config.easing.x1},${config.easing.y1},${config.easing.x2},${config.easing.y2})`;

  const issueBody = [
    `Microinteraction Lab - generated snippet`,
    ``,
    `Component: ${componentType}`,
    `Trigger: ${config.trigger}`,
    `Timing: duration=${Math.round(config.duration)}ms, delay=${Math.round(config.delay)}ms`,
    `Easing: ${easingLabel}`,
    `Transform: scale=${config.scale}, translateX=${Math.round(config.translateX)}px, translateY=${Math.round(config.translateY)}px, rotate=${Math.round(
      config.rotate,
    )}deg`,
    `Opacity: ${config.opacity}, Shadow: ${config.shadow}`,
    ``,
    `Generated code (${codeLanguage}):`,
    "```",
    code,
    "```",
  ].join("\n");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

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

        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-200">GitHub integration</div>
              <div className="text-[11px] text-zinc-500">PAT введите, и создайте Gist/Issue через API</div>
            </div>
          </div>

          <label className="block">
            <div className="mb-1 text-[11px] text-zinc-400">Personal Access Token</div>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_... (scope gist + repo/public_repo)"
              className="w-full rounded-lg bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 ring-1 ring-zinc-800 placeholder:text-zinc-600"
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={githubBusy}
              onClick={async () => {
                if (!repoSlug) return showToast("GitHub repo not found");
                if (!githubToken.trim()) return showToast("Paste GitHub token first");
                if (!code.trim()) return showToast("Nothing to share");

                try {
                  setGithubBusy(true);
                  const trigger = config.trigger;
                  const ext = codeLanguage === "css" ? "css" : "tsx";
                  const filename = `microinteraction-${componentType}-${trigger}-${Date.now()}.${ext}`;
                  const payload = {
                    description: `Microinteraction Lab - ${componentType}/${trigger}`,
                    public: false,
                    files: {
                      [filename]: {
                        content: code,
                      },
                    },
                  };

                  const gist = await githubRequest<{ html_url: string }>({
                    token: githubToken.trim(),
                    path: "/gists",
                    method: "POST",
                    body: payload,
                  });

                  showToast("Gist created");
                  window.open(gist.html_url, "_blank", "noopener,noreferrer");
                } catch (e: any) {
                  showToast(e?.message ?? "Failed to create Gist");
                } finally {
                  setGithubBusy(false);
                }
              }}
              className="rounded-xl bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50"
            >
              Create Gist
            </button>

            <button
              type="button"
              disabled={githubBusy}
              onClick={async () => {
                if (!repoSlug) return showToast("GitHub repo not found");
                if (!githubToken.trim()) return showToast("Paste GitHub token first");
                try {
                  setGithubBusy(true);
                  const payload = {
                    title: issueTitle,
                    body: issueBody,
                    labels: ["enhancement"],
                  };

                  const issue = await githubRequest<{ html_url: string }>({
                    token: githubToken.trim(),
                    path: `/repos/${repoSlug.owner}/${repoSlug.repo}/issues`,
                    method: "POST",
                    body: payload,
                  });

                  showToast("Issue created");
                  window.open(issue.html_url, "_blank", "noopener,noreferrer");
                } catch (e: any) {
                  showToast(e?.message ?? "Failed to create Issue");
                } finally {
                  setGithubBusy(false);
                }
              }}
              className="rounded-xl bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-900/60 disabled:opacity-50"
            >
              Create Issue
            </button>
          </div>

          <button
            type="button"
            disabled={githubBusy}
            onClick={async () => {
              if (!repoSlug) return showToast("GitHub repo not found");
              if (!githubToken.trim()) return showToast("Paste GitHub token first");

              try {
                setGithubBusy(true);

                // 1) Find default branch
                const repo = await githubRequest<{ default_branch: string }>({
                  token: githubToken.trim(),
                  path: `/repos/${repoSlug.owner}/${repoSlug.repo}`,
                  method: "GET",
                });

                const baseBranch = repo.default_branch;
                const baseRef = await githubRequest<{ object: { sha: string } }>({
                  token: githubToken.trim(),
                  path: `/repos/${repoSlug.owner}/${repoSlug.repo}/git/ref/heads/${baseBranch}`,
                  method: "GET",
                });

                // 2) Create branch
                const branch = `microinteraction-${Date.now()}`;
                await githubRequest({
                  token: githubToken.trim(),
                  path: `/repos/${repoSlug.owner}/${repoSlug.repo}/git/refs`,
                  method: "POST",
                  body: { ref: `refs/heads/${branch}`, sha: baseRef.object.sha },
                });

                // 3) Commit a file with generated snippet
                const ext = codeLanguage === "css" ? "css" : "tsx";
                const filename = `microinteraction-${componentType}-${config.trigger}-${Date.now()}.${ext}`;
                const filePath = `microinteraction-lab/generated/${filename}`;

                const b64 = window.btoa(unescape(encodeURIComponent(code)));
                await githubRequest({
                  token: githubToken.trim(),
                  path: `/repos/${repoSlug.owner}/${repoSlug.repo}/contents/${filePath}`,
                  method: "PUT",
                  body: {
                    message: `Add ${componentType} microinteraction snippet`,
                    content: b64,
                    branch,
                  },
                });

                // 4) Create PR
                const pr = await githubRequest<{ html_url: string }>({
                  token: githubToken.trim(),
                  path: `/repos/${repoSlug.owner}/${repoSlug.repo}/pulls`,
                  method: "POST",
                  body: {
                    title: issueTitle,
                    head: branch,
                    base: baseBranch,
                    body: issueBody,
                  },
                });

                showToast("PR created");
                window.open(pr.html_url, "_blank", "noopener,noreferrer");
              } catch (e: any) {
                showToast(e?.message ?? "Failed to create PR");
              } finally {
                setGithubBusy(false);
              }
            }}
            className="mt-2 w-full rounded-xl bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50"
          >
            Create PR (commit + open)
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            const slug = parseGithubSlug((pkg as any)?.repository?.url);
            if (!slug) {
              setToast("GitHub repo not found");
              window.setTimeout(() => setToast(null), 1600);
              return;
            }

            const targetLabel = compareMode ? `Editing ${target}` : "Live generation";
            const trigger = config.trigger;
            const easingLabel =
              config.easing.kind === "preset" ? config.easing.preset : `cubic-bezier(${config.easing.x1},${config.easing.y1},${config.easing.x2},${config.easing.y2})`;

            const body = [
              `Microinteraction Lab - generated snippet`,
              ``,
              `Component: ${componentType}`,
              `Trigger: ${trigger}`,
              `Timing: duration=${Math.round(config.duration)}ms, delay=${Math.round(config.delay)}ms`,
              `Easing: ${easingLabel}`,
              `Transform: scale=${config.scale}, translateX=${Math.round(config.translateX)}px, translateY=${Math.round(config.translateY)}px, rotate=${Math.round(
                config.rotate,
              )}deg`,
              `Opacity: ${config.opacity}, Shadow: ${config.shadow}`,
              ``,
              `Generated code (${codeLanguage}):`,
              "```tsx",
              code.slice(0, 6000),
              "```",
            ].join("\n");

            const title = `Microinteraction (${componentType}, ${trigger}, ${Math.round(config.duration)}ms)`;
            const url = `https://github.com/${slug.owner}/${slug.repo}/issues/new?title=${encodeURIComponent(
              title,
            )}&body=${encodeURIComponent(body)}&labels=enhancement`;

            window.open(url, "_blank", "noopener,noreferrer");
          }}
          className="mt-2 w-full rounded-xl bg-zinc-900/40 px-3 py-2 text-sm font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-900/60"
        >
          Share on GitHub (Issue)
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

