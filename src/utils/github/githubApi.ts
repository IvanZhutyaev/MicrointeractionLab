export type GitHubError = {
  message: string;
  status?: number;
  documentation_url?: string;
};

async function parseGitHubError(response: Response): Promise<GitHubError> {
  try {
    const json = (await response.json()) as Partial<GitHubError>;
    return {
      message: json.message ?? response.statusText,
      status: response.status,
      documentation_url: json.documentation_url,
    };
  } catch {
    return { message: response.statusText, status: response.status };
  }
}

export async function githubRequest<T>({
  token,
  path,
  method,
  body,
}: {
  token: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await parseGitHubError(res);
    throw new Error(err.message);
  }

  return (await res.json()) as T;
}

