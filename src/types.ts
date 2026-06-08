/** A single rate-limit window reported by the provider. */
export interface UsageWindow {
  /** Human label, e.g. "5 hour" or "7 day". */
  label: string;
  /** Percentage of the window's limit consumed (0–100). */
  utilization: number;
  /** When the window resets, if known. */
  resetsAt?: Date;
}

/** Normalised usage for one agent/subscription, shown as a row in the list. */
export interface AgentUsage {
  /** Display name, e.g. "Claude" or "Codex". */
  name: string;
  /** Optional plan/model detail, e.g. "Max" or the active model. */
  detail?: string;
  /** Logo asset filename in /assets. */
  logoPath: string;
  /** One or more rate-limit windows. Empty when an error occurred. */
  windows: UsageWindow[];
  /** Populated when fetching this agent failed; windows will be empty. */
  error?: string;
  /** Optional actionable hint shown alongside an error (e.g. "run claude"). */
  hint?: string;
}

/** Raw shape of GET https://api.anthropic.com/api/oauth/usage. */
export interface ClaudeOAuthUsageResponse {
  five_hour?: ClaudeUsageWindow | null;
  seven_day?: ClaudeUsageWindow | null;
  seven_day_opus?: ClaudeUsageWindow | null;
  seven_day_sonnet?: ClaudeUsageWindow | null;
  extra_usage?: {
    is_enabled?: boolean;
    monthly_limit?: number | null;
    used_credits?: number | null;
    utilization?: number | null;
  } | null;
}

export interface ClaudeUsageWindow {
  /** 0–100. */
  utilization: number;
  /** ISO 8601 UTC timestamp. */
  resets_at: string;
}
