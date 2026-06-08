import { AgentUsage, ClaudeOAuthUsageResponse, ClaudeUsageWindow, UsageWindow } from "../types";
import { getClaudeToken, isExpired } from "../auth/claude";

const USAGE_ENDPOINT = "https://api.anthropic.com/api/oauth/usage";

// The endpoint rate-limits aggressively unless it sees a claude-code User-Agent.
// The exact version doesn't matter; it just needs the claude-code/ prefix.
const USER_AGENT = "claude-code/2.1.168";

const REFRESH_HINT = "Run `claude` once to refresh your session, then retry.";

/**
 * Fetch Claude subscription usage from Anthropic's OAuth usage endpoint —
 * the same server-side window state Claude Code's /usage shows, so it
 * reflects usage across all your devices (desktop, mobile, web).
 */
export async function getClaudeUsage(): Promise<AgentUsage> {
  const base: Pick<AgentUsage, "name" | "logoPath"> = {
    name: "Claude",
    logoPath: "claude-logo.png",
  };

  const token = await getClaudeToken();
  if (!token) {
    return {
      ...base,
      windows: [],
      error: "Not signed in to Claude Code.",
      hint: "Run `claude` and sign in, then retry.",
    };
  }

  if (isExpired(token)) {
    return { ...base, windows: [], error: "Claude session expired.", hint: REFRESH_HINT };
  }

  try {
    const response = await fetch(USAGE_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "anthropic-beta": "oauth-2025-04-20",
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      return { ...base, windows: [], error: "Claude session unauthorized.", hint: REFRESH_HINT };
    }
    if (!response.ok) {
      return { ...base, windows: [], error: `Usage request failed (${response.status}).` };
    }

    const data = (await response.json()) as ClaudeOAuthUsageResponse;
    const windows = toWindows(data);

    if (windows.length === 0) {
      return { ...base, windows: [], error: "No usage windows reported." };
    }

    return { ...base, windows };
  } catch (error) {
    return {
      ...base,
      windows: [],
      error: error instanceof Error ? error.message : "Unknown error fetching usage.",
    };
  }
}

function toWindows(data: ClaudeOAuthUsageResponse): UsageWindow[] {
  const windows: UsageWindow[] = [];
  push(windows, "5 hour", data.five_hour);
  push(windows, "7 day", data.seven_day);
  push(windows, "7 day (Opus)", data.seven_day_opus);
  push(windows, "7 day (Sonnet)", data.seven_day_sonnet);
  return windows;
}

function push(windows: UsageWindow[], label: string, window: ClaudeUsageWindow | null | undefined) {
  if (!window || typeof window.utilization !== "number") return;
  windows.push({
    label,
    utilization: window.utilization,
    resetsAt: window.resets_at ? new Date(window.resets_at) : undefined,
  });
}
