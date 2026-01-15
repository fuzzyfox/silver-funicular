import { getPreferenceValues } from "@raycast/api";
import { AgentUsage } from "../types";

interface Preferences {
  anthropicApiKey?: string;
}

interface OrganizationUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens?: number;
  cache_read_tokens?: number;
}

interface UsageResponse {
  data: Array<{
    date: string;
    workspaces: Array<{
      workspace_id: string;
      workspace_name: string;
      model_name: string;
      usage: OrganizationUsage[];
    }>;
  }>;
}

export async function getClaudeUsage(): Promise<AgentUsage> {
  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.anthropicApiKey;

  if (!apiKey) {
    return {
      name: "Claude Code",
      model: "Not configured",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "claude-logo.png",
      error: "API key not configured",
    };
  }

  try {
    // First, try to get organization information
    const orgResponse = await fetch("https://api.anthropic.com/v1/organizations", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    });

    if (!orgResponse.ok) {
      throw new Error(`Failed to fetch organization info: ${orgResponse.status}`);
    }

    // Try to get usage data from the billing endpoint
    // Note: The Anthropic API has different endpoints depending on the account type
    // For Claude Code specifically, we'll need to use the appropriate workspace/organization endpoint

    // Attempt to get usage statistics
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    const usageResponse = await fetch(
      `https://api.anthropic.com/v1/organization/usage?start_date=${startDate}&end_date=${endDate}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    if (usageResponse.ok) {
      const usageData = (await usageResponse.json()) as UsageResponse;

      // Calculate total usage
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let modelName = "claude-sonnet-4-5";

      if (usageData.data && usageData.data.length > 0) {
        usageData.data.forEach((day) => {
          day.workspaces.forEach((workspace) => {
            if (workspace.model_name) {
              modelName = workspace.model_name;
            }
            workspace.usage.forEach((usage) => {
              totalInputTokens += usage.input_tokens || 0;
              totalOutputTokens += usage.output_tokens || 0;
            });
          });
        });
      }

      const totalTokens = totalInputTokens + totalOutputTokens;

      // Anthropic's typical monthly limit for API usage (this varies by plan)
      // For display purposes, we'll use a default limit
      // Users on different plans will have different limits
      const estimatedLimit = 1000000; // 1M tokens as default
      const usagePercentage = estimatedLimit > 0 ? Math.min((totalTokens / estimatedLimit) * 100, 100) : 0;

      return {
        name: "Claude Code",
        model: modelName,
        usagePercentage: Math.round(usagePercentage * 10) / 10,
        currentUsage: totalTokens,
        limit: estimatedLimit,
        logoPath: "claude-logo.png",
      };
    }

    // Fallback: Return basic info if usage endpoint is not available
    return {
      name: "Claude Code",
      model: "claude-sonnet-4-5",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "claude-logo.png",
      error: "Usage data not available. This may require specific API permissions.",
    };
  } catch (error) {
    console.error("Error fetching Claude usage:", error);
    return {
      name: "Claude Code",
      model: "Error",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "claude-logo.png",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(2)}K`;
  }
  return tokens.toString();
}
