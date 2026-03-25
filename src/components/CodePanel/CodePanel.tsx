import { useEffect, useMemo, useState } from "react";
import { useAnimationStore } from "../../store/useAnimationStore";
import type { CompareTarget } from "../../types/animation";
import { generateFramerMotionCode } from "../../utils/codegen/generateFramerMotionCode";
import { generateCssCode } from "../../utils/codegen/generateCssCode";
import { copyTextToClipboard } from "../../utils/clipboard";
import pkg from "../../../package.json";
import { githubRequest } from "../../utils/github/githubApi";

function parseGithubSlug(input: string | undefined): { owner: string; repo: string } | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  // Accept `owner/repo`
  const m1 = s.match(/^([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (m1) return { owner: m1[1], repo: m1[2] };

  // Accept https://github.com/Owner/Repo and git+ssh / git+https variants
  const m2 = s.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (m2) return { owner: m2[1], repo: m2[2] };

  // Accept git@github.com:Owner/Repo.git
  const m3 = s.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (m3) return { owner: m3[1], repo: m3[2] };

  return null;
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

  const defaultRepoInput = (pkg as any)?.repository?.url as string | undefined;
  const [repoInput, setRepoInput] = useState<string>(defaultRepoInput ?? "");
  const repoSlug = useMemo(() => parseGithubSlug(repoInput), [repoInput]);

  const [commitDir, setCommitDir] = useState<string>("microinteraction-lab/generated");

  const code = useMemo(() => {
    if (codeLanguage === "css") return generateCssCode(config, componentType);
    return generateFramerMotionCode(config, componentType);
  }, [codeLanguage, config, componentType]);

  const codePreview = useMemo(() => {
    const max = 450;
    const snippet = code.slice(0, max);
    return code.length > max ? `${snippet}\n... (truncated)` : snippet;
  }, [code]);

  const [toast, setToast] = useState<string | null>(null);
  const [rememberGithubToken, setRememberGithubToken] = useState(false);
  const [githubToken, setGithubToken] = useState(() => {
    try {
      return sessionStorage.getItem("microinteractionlab:githubToken") ?? "";
    } catch {
      return "";
    }
  });
  const [githubBusy, setGithubBusy] = useState(false);
  const [githubCheckBusy, setGithubCheckBusy] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [githubDefaultBranch, setGithubDefaultBranch] = useState<string | null>(null);
  const [githubCheckError, setGithubCheckError] = useState<string | null>(null);
  const [prDraft, setPrDraft] = useState<{
    branch: string;
    filename: string;
    filePath: string;
  } | null>(null);
  const [lastPrUrl, setLastPrUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (!rememberGithubToken) return;
    try {
      if (githubToken.trim()) sessionStorage.setItem("microinteractionlab:githubToken", githubToken);
      else sessionStorage.removeItem("microinteractionlab:githubToken");
    } catch {
      // ignore storage errors
    }
  }, [rememberGithubToken, githubToken]);

  useEffect(() => {
    // If user already has token in sessionStorage, pre-check the toggle.
    try {
      const existing = sessionStorage.getItem("microinteractionlab:githubToken");
      if (existing && existing.trim() && !rememberGithubToken) setRememberGithubToken(true);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseGithubActionHint = (message: string) => {
    const m = message.toLowerCase();
    if (m.includes("bad credentials")) return "Токен неверный. Проверьте PAT.";
    if (m.includes("forbidden") || m.includes("resource not accessible")) {
      return "Недостаточно прав. Нужны gist + repo (или public_repo для public-репо).";
    }
    if (m.includes("not found")) return "Не вижу репозиторий по этому slug. Проверьте, что PAT имеет доступ.";
    return null;
  };

  const ensureGithubReady = async () => {
    if (!repoSlug) {
      showToast("Введите репозиторий (например `Owner/Repo` или URL на GitHub)");
      return false;
    }
    if (!githubToken.trim()) {
      showToast("Paste GitHub token first");
      return false;
    }

    // If previous check is already OK, don't spam the API.
    if (githubLogin && githubDefaultBranch && !githubCheckError) return true;

    try {
      setGithubCheckBusy(true);
      setGithubCheckError(null);

      const user = await githubRequest<{ login: string }>({
        token: githubToken.trim(),
        path: "/user",
        method: "GET",
      });
      setGithubLogin(user.login);

      const repo = await githubRequest<{ default_branch: string }>({
        token: githubToken.trim(),
        path: `/repos/${repoSlug.owner}/${repoSlug.repo}`,
        method: "GET",
      });
      setGithubDefaultBranch(repo.default_branch);

      showToast("GitHub access OK");
      return true;
    } catch (e: any) {
      const msg = e?.message ?? "GitHub check failed";
      setGithubCheckError(msg);
      const hint = parseGithubActionHint(msg);
      showToast(hint ?? msg);
      return false;
    } finally {
      setGithubCheckBusy(false);
    }
  };

  const buildPrDraft = () => {
    const ts = Date.now();
    const ext = codeLanguage === "css" ? "css" : "tsx";
    const filename = `microinteraction-${componentType}-${config.trigger}-${ts}.${ext}`;
    const normalizedDir = commitDir.trim().replace(/\/+$/g, "");
    const filePath = `${normalizedDir}/${filename}`;
    const branch = `microinteraction-${ts}`;
    return { branch, filename, filePath };
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
              <div className="text-[11px] text-zinc-500">
                PAT вводится для API (создание Gist/Issue/PR)
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1 text-[11px] text-zinc-400">Target repository</div>
            <input
              value={repoInput}
              onChange={(e) => {
                setRepoInput(e.target.value);
                setGithubLogin(null);
                setGithubDefaultBranch(null);
                setGithubCheckError(null);
                setPrDraft(null);
                setLastPrUrl(null);
              }}
              placeholder="Owner/Repo или https://github.com/Owner/Repo"
              className="w-full rounded-lg bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 ring-1 ring-zinc-800 placeholder:text-zinc-600"
            />
            <div className="mt-1 text-[11px] text-zinc-500">
              {repoSlug ? (
                <>
                  Понимаю:{" "}
                  <span className="font-semibold text-zinc-200">
                    {repoSlug.owner}/{repoSlug.repo}
                  </span>
                </>
              ) : (
                <>Непонятный формат. Введите `Owner/Repo` или URL.</>
              )}
            </div>
          </div>

          <label className="block">
            <div className="mb-1 text-[11px] text-zinc-400">Personal Access Token</div>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => {
                setGithubToken(e.target.value);
                setGithubLogin(null);
                setGithubDefaultBranch(null);
                setGithubCheckError(null);
              }}
              placeholder="ghp_... (scope gist + repo/public_repo)"
              className="w-full rounded-lg bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 ring-1 ring-zinc-800 placeholder:text-zinc-600"
            />
          </label>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[11px] text-zinc-400">Commit folder (path)</div>
              <input
                value={commitDir}
                onChange={(e) => {
                  setCommitDir(e.target.value);
                  setPrDraft(null);
                  setLastPrUrl(null);
                }}
                className="w-full rounded-lg bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 ring-1 ring-zinc-800 placeholder:text-zinc-600"
                placeholder="microinteraction-lab/generated"
              />
              <div className="mt-1 text-[11px] text-zinc-500">Без ведущего слеша.</div>
            </div>

            <label className="flex items-start gap-2 rounded-lg bg-zinc-950/20 px-3 py-2 text-[11px] text-zinc-300 ring-1 ring-zinc-800">
              <input
                type="checkbox"
                checked={rememberGithubToken}
                onChange={(e) => setRememberGithubToken(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Запомнить токен в `sessionStorage` (опасно, только если доверяешь устройству)
              </span>
            </label>
          </div>

          <div className="mt-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-500">
                Status:{" "}
                {githubCheckError ? (
                  <span className="text-rose-300">{githubCheckError}</span>
                ) : githubLogin && githubDefaultBranch ? (
                  <span className="text-emerald-300">
                    {githubLogin} · default `{githubDefaultBranch}`
                  </span>
                ) : (
                  <span>Not checked</span>
                )}
              </div>
              <button
                type="button"
                disabled={githubCheckBusy || githubBusy}
                onClick={() => void ensureGithubReady()}
                className="rounded-xl bg-zinc-900/40 px-3 py-2 text-[11px] font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-900/60 disabled:opacity-50"
              >
                Check access
              </button>
            </div>
            <div className="text-[11px] text-zinc-500">
              Нужно: `gist` + `repo` (или `public_repo` для public репо). Если репозиторий приватный — обязательно `repo`.
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={githubBusy}
              onClick={async () => {
                const ok = await ensureGithubReady();
                if (!ok) return;
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
                const ok = await ensureGithubReady();
                if (!ok) return;
                try {
                  setGithubBusy(true);
                  const payload = {
                    title: issueTitle,
                    body: issueBody,
                    labels: ["enhancement"],
                  };

                  const issue = await githubRequest<{ html_url: string }>({
                    token: githubToken.trim(),
                    path: `/repos/${repoSlug!.owner}/${repoSlug!.repo}/issues`,
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
            onClick={() => {
              if (!repoSlug) return showToast("GitHub repo not found");
              if (!githubToken.trim()) return showToast("Paste GitHub token first");

              const draft = buildPrDraft();
              setPrDraft(draft);
              setLastPrUrl(null);
              showToast("PR preview prepared");
            }}
            className="mt-2 w-full rounded-xl bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50"
          >
            Preview PR (branch + file)
          </button>

          {prDraft ? (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-200">PR preview</div>
                  <div className="text-[11px] text-zinc-500">
                    Branch: <span className="font-mono text-zinc-300">{prDraft.branch}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    File: <span className="font-mono text-zinc-300">{prDraft.filePath}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrDraft(null)}
                  className="rounded-xl bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-900/60"
                >
                  Cancel
                </button>
              </div>

              <div className="mb-3 text-[11px] text-zinc-500">
                Title: <span className="text-zinc-300">{issueTitle}</span>
              </div>
              <div className="mb-3 text-[11px] text-zinc-500">
                Content preview: <span className="font-mono text-zinc-300">{codeLanguage.toUpperCase()}</span> · {code.length} chars
              </div>

              <pre className="mb-3 max-h-28 overflow-auto rounded-lg bg-zinc-950/60 p-2 text-[11px] ring-1 ring-zinc-800">
                <code>{codePreview}</code>
              </pre>

              <button
                type="button"
                disabled={githubBusy}
                onClick={async () => {
                  const ok = await ensureGithubReady();
                  if (!ok) return;
                  if (!prDraft) return;

                  try {
                    setGithubBusy(true);

                    const baseBranch = githubDefaultBranch ?? "main";
                    const baseRef = await githubRequest<{ object: { sha: string } }>({
                      token: githubToken.trim(),
                      path: `/repos/${repoSlug!.owner}/${repoSlug!.repo}/git/ref/heads/${baseBranch}`,
                      method: "GET",
                    });

                    // 2) Create branch
                    await githubRequest({
                      token: githubToken.trim(),
                      path: `/repos/${repoSlug!.owner}/${repoSlug!.repo}/git/refs`,
                      method: "POST",
                      body: { ref: `refs/heads/${prDraft.branch}`, sha: baseRef.object.sha },
                    });

                    // 3) Commit a file with generated snippet
                    const b64 = window.btoa(unescape(encodeURIComponent(code)));
                    await githubRequest({
                      token: githubToken.trim(),
                      path: `/repos/${repoSlug!.owner}/${repoSlug!.repo}/contents/${prDraft.filePath}`,
                      method: "PUT",
                      body: {
                        message: `Add ${componentType} microinteraction snippet`,
                        content: b64,
                        branch: prDraft.branch,
                      },
                    });

                    // 4) Create PR
                    const pr = await githubRequest<{ html_url: string }>({
                      token: githubToken.trim(),
                      path: `/repos/${repoSlug!.owner}/${repoSlug!.repo}/pulls`,
                      method: "POST",
                      body: {
                        title: issueTitle,
                        head: prDraft.branch,
                        base: baseBranch,
                        body: issueBody,
                      },
                    });

                    setLastPrUrl(pr.html_url);
                    showToast("PR created");
                    window.open(pr.html_url, "_blank", "noopener,noreferrer");
                  } catch (e: any) {
                    showToast(e?.message ?? "Failed to create PR");
                  } finally {
                    setGithubBusy(false);
                  }
                }}
                className="w-full rounded-xl bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50"
              >
                Create PR (commit + open)
              </button>
            </div>
          ) : null}

          {lastPrUrl ? (
            <button
              type="button"
              disabled={githubBusy}
              onClick={async () => {
                const ok = await copyTextToClipboard(lastPrUrl);
                showToast(ok ? "PR link copied" : "Copy failed");
              }}
              className="mt-2 w-full rounded-xl bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-900/60 disabled:opacity-50"
            >
              Copy PR link
            </button>
          ) : null}
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

