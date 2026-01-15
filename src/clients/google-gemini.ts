import { getPreferenceValues } from "@raycast/api";
import { AgentUsage } from "../types";

interface Preferences {
  googleApiKey?: string;
}

interface ModelInfo {
  name: string;
  displayName?: string;
  description?: string;
}

interface ModelsResponse {
  models: ModelInfo[];
}

/**
 * Get Google Gemini API usage data
 *
 * Note: Google Gemini API doesn't provide a direct usage tracking endpoint.
 * This implementation checks rate limit information and displays quota tiers.
 * Full usage tracking requires Google Cloud Monitoring API with service accounts.
 *
 * API Documentation:
 * - https://ai.google.dev/gemini-api/docs/rate-limits
 * - https://ai.google.dev/gemini-api/docs/api-key
 */
export async function getGoogleGeminiUsage(): Promise<AgentUsage> {
  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.googleApiKey;

  if (!apiKey) {
    return {
      name: "Google Gemini",
      model: "Not configured",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "gemini-logo.png",
      error: "Google API key not configured",
    };
  }

  try {
    // Make a lightweight API call to check access and get rate limit headers
    // Using the models list endpoint as it's a simple GET request
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const response = await fetch(modelsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid API key or insufficient permissions");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status === 400) {
        throw new Error("Invalid request. Check your API key.");
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ModelsResponse;

    // Try to extract rate limit information from headers
    // Note: Google Gemini API may include rate limit headers in responses
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining-minute");
    const rateLimitLimit = response.headers.get("x-ratelimit-limit-minute");

    // Get the primary model being used (usually gemini-pro or latest)
    let primaryModel = "gemini-1.5-pro";
    if (data.models && data.models.length > 0) {
      // Find the most recent stable model
      const proModel = data.models.find((m) => m.name.includes("gemini-1.5-pro"));
      const flashModel = data.models.find((m) => m.name.includes("gemini-1.5-flash"));
      if (proModel) {
        primaryModel = proModel.displayName || "gemini-1.5-pro";
      } else if (flashModel) {
        primaryModel = flashModel.displayName || "gemini-1.5-flash";
      }
    }

    // Determine tier and limits based on typical Google AI Studio quotas
    // Free tier: 15 RPM for gemini-pro, 1500 RPD
    // Paid tier: Much higher limits
    // Since we can't directly query user's tier, we estimate based on response
    const estimatedRPM = rateLimitLimit ? parseInt(rateLimitLimit) : 15;
    const remainingRPM = rateLimitRemaining ? parseInt(rateLimitRemaining) : estimatedRPM;

    // Calculate percentage based on requests per minute usage
    const usagePercentage = estimatedRPM > 0 ? ((estimatedRPM - remainingRPM) / estimatedRPM) * 100 : 0;

    // Determine tier based on limits
    let tier = "Free";
    if (estimatedRPM >= 1000) {
      tier = "Paid (High)";
    } else if (estimatedRPM >= 100) {
      tier = "Paid (Standard)";
    } else if (estimatedRPM > 15) {
      tier = "Paid";
    }

    return {
      name: "Google Gemini",
      model: `${primaryModel} (${tier})`,
      usagePercentage: Math.round(usagePercentage * 10) / 10,
      currentUsage: estimatedRPM - remainingRPM,
      limit: estimatedRPM,
      logoPath: "gemini-logo.png",
    };
  } catch (error) {
    console.error("Error fetching Google Gemini usage:", error);
    return {
      name: "Google Gemini",
      model: "Error",
      usagePercentage: 0,
      currentUsage: 0,
      limit: 0,
      logoPath: "gemini-logo.png",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export function formatRequests(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K requests`;
  }
  return `${count} requests`;
}
