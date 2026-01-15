import { List, Icon, Color, ActionPanel, Action, getPreferenceValues, Detail } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import React from "react";
import { getClaudeUsage, formatTokenCount } from "./clients/claude";
import { getJetBrainsUsage } from "./clients/jetbrains";
import { AgentUsage } from "./types";

interface Preferences {
  anthropicApiKey?: string;
  jetbrainsApiToken?: string;
  jetbrainsServerUrl?: string;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data: agents, isLoading, revalidate } = usePromise(fetchAllAgents);

  async function fetchAllAgents(): Promise<AgentUsage[]> {
    const results: AgentUsage[] = [];

    // Fetch Claude usage if API key is configured
    if (preferences.anthropicApiKey) {
      const claudeUsage = await getClaudeUsage();
      results.push(claudeUsage);
    }

    // Fetch JetBrains Junie usage if API token is configured
    if (preferences.jetbrainsApiToken) {
      const jetbrainsUsage = await getJetBrainsUsage();
      results.push(jetbrainsUsage);
    }

    // Future: Add more agents here (OpenAI, etc.)

    return results;
  }

  if (!preferences.anthropicApiKey && !preferences.jetbrainsApiToken) {
    return (
      <Detail
        markdown="# No API Keys Configured

Please configure at least one API key in the extension preferences to track agent usage.

## Supported Agents:
- **Claude Code** - Requires Anthropic API Key
- **JetBrains Junie** - Requires JetBrains IDE Services Automation Token

To configure API keys:
1. Open Raycast preferences (⌘,)
2. Navigate to Extensions
3. Select Agent Usage Tracker
4. Enter your API key(s) or token(s)

### Note on JetBrains Junie
JetBrains Junie tracking requires a JetBrains IDE Services automation token, which is available for enterprise users. Personal JetBrains AI accounts can track usage through the IDE widget.
"
        actions={
          <ActionPanel>
            <Action.Open
              title="Open Extension Preferences"
              target="raycast://extensions/your-name/agent-usage-tracker"
              icon={Icon.Gear}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search agents...">
      {agents?.map((agent: AgentUsage, index: number) => (
        <List.Item
          key={index}
          icon={{ source: agent.logoPath, fallback: Icon.RobotFilled }}
          title={agent.name}
          subtitle={agent.model}
          accessories={[
            {
              tag: {
                value: `${agent.usagePercentage.toFixed(1)}%`,
                color: getUsageColor(agent.usagePercentage),
              },
            },
            {
              text: agent.error
                ? "Error"
                : `${formatTokenCount(agent.currentUsage)} / ${formatTokenCount(agent.limit)}`,
              icon: agent.error ? Icon.ExclamationMark : Icon.BarChart,
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
              {agent.error && (
                <Action.CopyToClipboard
                  title="Copy Error"
                  content={agent.error}
                  shortcut={{ modifiers: ["cmd"], key: "e" }}
                />
              )}
            </ActionPanel>
          }
          detail={
            <List.Item.Detail
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Agent" text={agent.name} />
                  <List.Item.Detail.Metadata.Label title="Model" text={agent.model} />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label
                    title="Usage"
                    text={`${agent.usagePercentage.toFixed(1)}%`}
                    icon={{ source: Icon.BarChart, tintColor: getUsageColor(agent.usagePercentage) }}
                  />
                  <List.Item.Detail.Metadata.Label title="Current Usage" text={formatTokenCount(agent.currentUsage)} />
                  <List.Item.Detail.Metadata.Label title="Limit" text={formatTokenCount(agent.limit)} />
                  {agent.error && (
                    <>
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="Error" text={agent.error} icon={Icon.ExclamationMark} />
                    </>
                  )}
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      ))}
      {agents?.length === 0 && (
        <List.EmptyView
          title="No Agents Configured"
          description="Please configure API keys in preferences to track agent usage"
          icon={Icon.RobotFilled}
        />
      )}
    </List>
  );
}

function getUsageColor(percentage: number): Color {
  if (percentage >= 90) return Color.Red;
  if (percentage >= 75) return Color.Orange;
  if (percentage >= 50) return Color.Yellow;
  return Color.Green;
}
