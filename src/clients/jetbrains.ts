import { getPreferenceValues } from "@raycast/api";
import { AgentUsage } from "../types";

interface Preferences {
  jetbrainsApiToken?: string;
  jetbrainsServerUrl?: string;
}

interface MetricValue {
  date: string;
  value: number;
}

interface ToolMetrics {
  tool: string;
  invocations?: MetricValue[];
  suggestions?: MetricValue[];
  acceptances?: MetricValue[];
}

interface MetricsResponse {
  metrics: ToolMetrics[];
}

/**
 * Get JetBrains AI (Junie) usage data via JetBrains IDE Services API
 *
 * Note: This requires JetBrains IDE Services with an automation token.
 * For personal JetBrains AI accounts, usage tracking is currently only
 * available through the IDE widget, not via public API.
 *
 * API Documentation:
 * - https://www.jetbrains.com/help/ide-services/ai-analytics-api.html
 * - https://www.jetbrains.com/help/ide-services/rest-api.html
 */
export async function getJetBrainsUsage(): Promise<AgentUsage> {
  const preferences = getPreferenceValues<Preferences>();
  const apiToken = preferences.jetbrainsApiToken;
  const serverUrl = preferences.jetbrainsServerUrl || "https://ide-services.jetbrains.com";

  if (!apiToken) {
    return {
      name: "JetBrains Junie",
      model: "Not configured",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "junie-logo.png",
      error: "API token not configured. IDE Services automation token required.",
    };
  }

  if (!serverUrl.trim()) {
    return {
      name: "JetBrains Junie",
      model: "Not configured",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "junie-logo.png",
      error: "Server URL not configured",
    };
  }

  try {
    // Calculate date range for current month
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    // Fetch AI effectiveness metrics for Junie
    const metricsUrl = `${serverUrl}/api/analytics/ai/effectiveness/metrics?fromDate=${startDate}&toDate=${endDate}&tool=junie`;

    const response = await fetch(metricsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please check your automation token.");
      } else if (response.status === 403) {
        throw new Error("Forbidden. Your token may not have access to AI Analytics.");
      } else if (response.status === 404) {
        throw new Error("API endpoint not found. Please verify your server URL.");
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as MetricsResponse;

    // Calculate total invocations for Junie
    let totalInvocations = 0;
    let totalSuggestions = 0;
    let totalAcceptances = 0;

    if (data.metrics && data.metrics.length > 0) {
      data.metrics.forEach((metric) => {
        if (metric.tool === "junie") {
          // Sum up invocations across all dates
          if (metric.invocations) {
            totalInvocations = metric.invocations.reduce((sum, item) => sum + item.value, 0);
          }
          if (metric.suggestions) {
            totalSuggestions = metric.suggestions.reduce((sum, item) => sum + item.value, 0);
          }
          if (metric.acceptances) {
            totalAcceptances = metric.acceptances.reduce((sum, item) => sum + item.value, 0);
          }
        }
      });
    }

    // For JetBrains AI, we'll use invocations as the primary metric
    // Note: Actual limits vary by subscription plan (Personal Pro, Teams, Enterprise)
    // Typical monthly limits range from 500-1000+ invocations
    const estimatedMonthlyLimit = 1000; // Default estimate
    const usagePercentage =
      estimatedMonthlyLimit > 0 ? Math.min((totalInvocations / estimatedMonthlyLimit) * 100, 100) : 0;

    // Calculate acceptance rate if we have suggestions
    const acceptanceRate = totalSuggestions > 0 ? ((totalAcceptances / totalSuggestions) * 100).toFixed(1) : "N/A";

    return {
      name: "JetBrains Junie",
      model: `Junie (${acceptanceRate}% acceptance)`,
      usagePercentage: Math.round(usagePercentage * 10) / 10,
      currentUsage: totalInvocations,
      limit: estimatedMonthlyLimit,
      logoPath: "junie-logo.png",
    };
  } catch (error) {
    console.error("Error fetching JetBrains usage:", error);
    return {
      name: "JetBrains Junie",
      model: "Error",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "junie-logo.png",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export function formatInvocationCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(2)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(2)}K`;
  }
  return count.toString();
}
