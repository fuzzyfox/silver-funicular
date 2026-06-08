import { List, Icon, Color, ActionPanel, Action } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import React from "react";
import { getClaudeUsage } from "./clients/claude";
import { AgentUsage, UsageWindow } from "./types";

export default function Command() {
  const { data: agents, isLoading, revalidate } = usePromise(fetchAllAgents);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search usage…">
      {agents?.map((agent) => (
        <List.Section key={agent.name} title={agent.name} subtitle={agent.detail}>
          {agent.error ? (
            <List.Item
              icon={{ source: agent.logoPath, fallback: Icon.Stars }}
              title={agent.error}
              subtitle={agent.hint}
              accessories={[{ icon: { source: Icon.ExclamationMark, tintColor: Color.Red } }]}
              actions={<Actions onRefresh={revalidate} copyText={agent.hint ?? agent.error} />}
            />
          ) : (
            agent.windows.map((window) => (
              <List.Item
                key={window.label}
                icon={{ source: agent.logoPath, fallback: Icon.Stars }}
                title={window.label}
                accessories={[
                  { text: resetText(window) },
                  {
                    tag: {
                      value: `${window.utilization.toFixed(0)}%`,
                      color: usageColor(window.utilization),
                    },
                  },
                ]}
                actions={<Actions onRefresh={revalidate} />}
              />
            ))
          )}
        </List.Section>
      ))}
      <List.EmptyView
        title="No usage to show"
        description="Sign in to Claude Code with `claude`, then refresh."
        icon={Icon.BarChart}
      />
    </List>
  );
}

async function fetchAllAgents(): Promise<AgentUsage[]> {
  // Run providers concurrently; add Codex here once its endpoint is wired up.
  const results = await Promise.all([getClaudeUsage()]);
  return results;
}

function Actions({ onRefresh, copyText }: { onRefresh: () => void; copyText?: string }) {
  return (
    <ActionPanel>
      <Action
        title="Refresh"
        icon={Icon.ArrowClockwise}
        onAction={onRefresh}
        shortcut={{ modifiers: ["cmd"], key: "r" }}
      />
      {copyText && (
        <Action.CopyToClipboard title="Copy Message" content={copyText} shortcut={{ modifiers: ["cmd"], key: "c" }} />
      )}
    </ActionPanel>
  );
}

function usageColor(percentage: number): Color {
  if (percentage >= 90) return Color.Red;
  if (percentage >= 75) return Color.Orange;
  if (percentage >= 50) return Color.Yellow;
  return Color.Green;
}

function resetText(window: UsageWindow): string {
  if (!window.resetsAt) return "";
  const ms = window.resetsAt.getTime() - Date.now();
  if (ms <= 0) return "resetting…";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `resets in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `resets in ${hours}h`;
  return `resets in ${Math.round(hours / 24)}d`;
}
