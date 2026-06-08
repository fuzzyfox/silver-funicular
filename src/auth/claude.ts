import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const execFileAsync = promisify(execFile);

export interface ClaudeToken {
  accessToken: string;
  refreshToken?: string;
  /** Epoch milliseconds. */
  expiresAt?: number;
}

/** Shape stored under the "Claude Code-credentials" keychain entry / .credentials.json. */
interface StoredCredentials {
  claudeAiOauth?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
}

/**
 * Read the Claude Code OAuth token.
 *
 * On macOS the credential lives in the login keychain under
 * "Claude Code-credentials"; the first read triggers a one-time
 * "Always Allow" prompt. Falls back to ~/.claude/.credentials.json
 * (used on Linux/Windows) when the keychain entry is absent.
 *
 * Returns null when no credential can be found — the caller should
 * prompt the user to sign in via the `claude` CLI.
 */
export async function getClaudeToken(): Promise<ClaudeToken | null> {
  const fromKeychain = await readKeychain();
  if (fromKeychain) return fromKeychain;
  return readCredentialsFile();
}

async function readKeychain(): Promise<ClaudeToken | null> {
  try {
    const { stdout } = await execFileAsync("security", [
      "find-generic-password",
      "-s",
      "Claude Code-credentials",
      "-w",
    ]);
    return parseCredentials(stdout);
  } catch {
    // Entry missing, or the user denied the keychain prompt.
    return null;
  }
}

async function readCredentialsFile(): Promise<ClaudeToken | null> {
  try {
    const raw = await readFile(join(homedir(), ".claude", ".credentials.json"), "utf8");
    return parseCredentials(raw);
  } catch {
    return null;
  }
}

function parseCredentials(raw: string): ClaudeToken | null {
  try {
    const parsed = JSON.parse(raw) as StoredCredentials;
    const oauth = parsed.claudeAiOauth;
    if (!oauth?.accessToken) return null;
    return {
      accessToken: oauth.accessToken,
      refreshToken: oauth.refreshToken,
      expiresAt: oauth.expiresAt,
    };
  } catch {
    return null;
  }
}

/** True when the token has a known expiry that is in the past. */
export function isExpired(token: ClaudeToken): boolean {
  return typeof token.expiresAt === "number" && token.expiresAt <= Date.now();
}
