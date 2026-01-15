import { getPreferenceValues } from "@raycast/api";
import { AgentUsage } from "../types";

interface Preferences {
  githubToken?: string;
  githubOrg?: string;
}

interface CopilotCodeCompletions {
  total_engaged_users?: number;
  languages?: Array<{
    name: string;
    total_engaged_users?: number;
  }>;
  editors?: Array<{
    name: string;
    total_engaged_users?: number;
  }>;
  models?: Array<{
    name: string;
    is_custom_model?: boolean;
    custom_model_training_date?: string;
    total_engaged_users?: number;
    languages?: Array<{
      name: string;
      total_engaged_users?: number;
      total_code_suggestions?: number;
      total_code_acceptances?: number;
      total_code_lines_suggested?: number;
      total_code_lines_accepted?: number;
    }>;
  }>;
}

interface DayMetrics {
  date: string;
  total_active_users?: number;
  total_engaged_users?: number;
  copilot_ide_code_completions?: CopilotCodeCompletions;
  copilot_ide_chat?: {
    total_engaged_users?: number;
  };
  copilot_dotcom_chat?: {
    total_engaged_users?: number;
  };
  copilot_dotcom_pull_requests?: {
    total_engaged_users?: number;
  };
}

interface MetricsResponse {
  data?: DayMetrics[];
}

/**
 * Get GitHub Copilot usage data via GitHub REST API
 *
 * API Documentation:
 * - https://docs.github.com/en/rest/copilot/copilot-metrics
 * - https://docs.github.com/en/copilot/managing-copilot/managing-github-copilot-in-your-organization/reviewing-usage-data-for-github-copilot-in-your-organization
 */
export async function getCopilotUsage(): Promise<AgentUsage> {
  const preferences = getPreferenceValues<Preferences>();
  const token = preferences.githubToken;
  const org = preferences.githubOrg;

  if (!token) {
    return {
      name: "GitHub Copilot",
      model: "Not configured",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "copilot-logo.png",
      error: "GitHub token not configured",
    };
  }

  if (!org) {
    return {
      name: "GitHub Copilot",
      model: "Not configured",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "copilot-logo.png",
      error: "GitHub organization not configured",
    };
  }

  try {
    // Fetch Copilot metrics for the organization
    const metricsUrl = `https://api.github.com/orgs/${org}/copilot/metrics`;

    const response = await fetch(metricsUrl, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please check your GitHub token.");
      } else if (response.status === 403) {
        throw new Error("Forbidden. Your token needs 'manage_billing:copilot' or 'read:org' scope.");
      } else if (response.status === 404) {
        throw new Error(`Organization '${org}' not found or Copilot not enabled.`);
      } else if (response.status === 500) {
        throw new Error("GitHub API error. Please try again later.");
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as MetricsResponse;

    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid API response format");
    }

    // Calculate metrics from the most recent 30 days
    let totalSuggestions = 0;
    let totalAcceptances = 0;
    let totalActiveUsers = 0;
    let totalEngagedUsers = 0;
    let primaryModel = "copilot-codex";

    // Process metrics (API returns up to 100 days, we'll use the last 30)
    const recentMetrics = data.slice(-30);

    recentMetrics.forEach((day: DayMetrics) => {
      totalActiveUsers = Math.max(totalActiveUsers, day.total_active_users || 0);
      totalEngagedUsers = Math.max(totalEngagedUsers, day.total_engaged_users || 0);

      // Sum up code completions
      if (day.copilot_ide_code_completions?.models) {
        day.copilot_ide_code_completions.models.forEach((model) => {
          if (model.name) {
            primaryModel = model.name;
          }
          if (model.languages) {
            model.languages.forEach((lang) => {
              totalSuggestions += lang.total_code_suggestions || 0;
              totalAcceptances += lang.total_code_acceptances || 0;
            });
          }
        });
      }
    });

    // Calculate acceptance rate
    const acceptanceRate = totalSuggestions > 0 ? ((totalAcceptances / totalSuggestions) * 100).toFixed(1) : "N/A";

    // For Copilot, we'll track based on number of active seats
    // Typical organizations have a set number of licensed seats
    // We'll use engaged users vs active users as the metric
    const seatUsagePercentage = totalActiveUsers > 0 ? (totalEngagedUsers / totalActiveUsers) * 100 : 0;

    return {
      name: "GitHub Copilot",
      model: `${primaryModel} (${acceptanceRate}% acceptance)`,
      usagePercentage: Math.round(seatUsagePercentage * 10) / 10,
      currentUsage: totalEngagedUsers,
      limit: totalActiveUsers,
      logoPath: "copilot-logo.png",
    };
  } catch (error) {
    console.error("Error fetching GitHub Copilot usage:", error);
    return {
      name: "GitHub Copilot",
      model: "Error",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "copilot-logo.png",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export function formatSeats(count: number): string {
  return `${count} seat${count !== 1 ? "s" : ""}`;
}
