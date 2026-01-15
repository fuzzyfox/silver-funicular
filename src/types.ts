export interface AgentUsage {
  name: string;
  model: string;
  usagePercentage: number;
  currentUsage: number;
  limit: number;
  logoPath: string;
  error?: string;
}

export interface ClaudeUsageResponse {
  workspaces: Array<{
    id: string;
    name: string;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
    limits: {
      input_tokens: number;
      output_tokens: number;
    };
  }>;
}

export interface AnthropicBillingResponse {
  daily_usage?: {
    date: string;
    input_tokens: number;
    output_tokens: number;
    request_count: number;
  }[];
  monthly_limit?: {
    limit_tokens: number;
    used_tokens: number;
  };
}
