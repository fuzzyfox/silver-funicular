import { AgentUsage, CodexRateLimitWindow, CodexUsageResponse, UsageWindow } from "../types";
import { getCodexToken, isExpired } from "../auth/codex";

const USAGE_ENDPOINT = "https://chatgpt.com/backend-api/wham/usage";

const REFRESH_HINT = "Run `codex` once to refresh your session, then retry.";

/**
 * Fetch Codex subscription usage from ChatGPT's backend usage endpoint —
 * the server-side rate-limit window state shared across all your devices,
 * the same data `codex` shows via /status.
 *
 * Undocumented endpoint; may change without notice.
 */
export async function getCodexUsage(): Promise<AgentUsage> {
  const base: Pick<AgentUsage, "name" | "logoPath"> = {
    name: "Codex",
    logoPath: "codex-logo.png",
  };

  const token = await getCodexToken();
  if (!token) {
    return {
      ...base,
      windows: [],
      error: "Not signed in to Codex.",
      hint: "Run `codex` and sign in, then retry.",
    };
  }

  if (isExpired(token)) {
    return { ...base, windows: [], error: "Codex session expired.", hint: REFRESH_HINT };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
    };
    if (token.accountId) headers["ChatGPT-Account-Id"] = token.accountId;

    const response = await fetch(USAGE_ENDPOINT, { method: "GET", headers });

    if (response.status === 401) {
      return { ...base, windows: [], error: "Codex session unauthorized.", hint: REFRESH_HINT };
    }
    if (!response.ok) {
      return { ...base, windows: [], error: `Usage request failed (${response.status}).` };
    }

    const data = (await response.json()) as CodexUsageResponse;
    const windows = toWindows(data);
    const detail = formatDetail(data);

    if (windows.length === 0) {
      return { ...base, detail, windows: [], error: "No usage windows reported." };
    }

    return { ...base, detail, windows };
  } catch (error) {
    return {
      ...base,
      windows: [],
      error: error instanceof Error ? error.message : "Unknown error fetching usage.",
    };
  }
}

function toWindows(data: CodexUsageResponse): UsageWindow[] {
  const windows: UsageWindow[] = [];
  push(windows, "5 hour", data.rate_limit?.primary_window);
  push(windows, "7 day", data.rate_limit?.secondary_window);
  return windows;
}

function push(windows: UsageWindow[], label: string, window: CodexRateLimitWindow | null | undefined) {
  if (!window || typeof window.used_percent !== "number") return;
  windows.push({
    label,
    utilization: window.used_percent,
    resetsAt: typeof window.reset_at === "number" ? new Date(window.reset_at * 1000) : undefined,
  });
}

/** Build the section subtitle from plan and credit balance, if present. */
function formatDetail(data: CodexUsageResponse): string | undefined {
  const parts: string[] = [];
  if (data.plan_type) {
    parts.push(data.plan_type.charAt(0).toUpperCase() + data.plan_type.slice(1));
  }
  const credits = data.credits;
  if (credits && !credits.unlimited && typeof credits.balance === "number") {
    parts.push(`$${credits.balance.toFixed(2)} credits`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}
