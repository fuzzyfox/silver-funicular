import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface CodexToken {
  accessToken: string;
  /** ChatGPT account id, sent as the ChatGPT-Account-Id header when present. */
  accountId?: string;
  /** Epoch milliseconds, decoded from the access token's `exp` claim. */
  expiresAt?: number;
}

/** Shape stored in ~/.codex/auth.json (written by the Codex CLI on login). */
interface StoredCredentials {
  tokens?: {
    access_token?: string;
    id_token?: string;
    account_id?: string;
  };
}

/**
 * Candidate auth.json locations, in priority order. The Codex CLI honours
 * CODEX_HOME, then falls back to the XDG config dir and finally ~/.codex.
 */
function candidatePaths(): string[] {
  const paths: string[] = [];
  if (process.env.CODEX_HOME) paths.push(join(process.env.CODEX_HOME, "auth.json"));
  paths.push(join(homedir(), ".config", "codex", "auth.json"));
  paths.push(join(homedir(), ".codex", "auth.json"));
  return paths;
}

/**
 * Read the Codex OAuth token from auth.json.
 *
 * Returns null when no credential can be found — the caller should prompt
 * the user to sign in via the `codex` CLI.
 */
export async function getCodexToken(): Promise<CodexToken | null> {
  for (const path of candidatePaths()) {
    const token = await readCredentialsFile(path);
    if (token) return token;
  }
  return null;
}

async function readCredentialsFile(path: string): Promise<CodexToken | null> {
  try {
    const raw = await readFile(path, "utf8");
    return parseCredentials(raw);
  } catch {
    return null;
  }
}

function parseCredentials(raw: string): CodexToken | null {
  try {
    const parsed = JSON.parse(raw) as StoredCredentials;
    const tokens = parsed.tokens;
    if (!tokens?.access_token) return null;
    return {
      accessToken: tokens.access_token,
      accountId: tokens.account_id ?? accountIdFromJwt(tokens.id_token),
      expiresAt: expiryFromJwt(tokens.access_token),
    };
  } catch {
    return null;
  }
}

/** Decode a JWT payload without verifying the signature. */
function decodeJwtPayload(jwt?: string): Record<string, unknown> | null {
  if (!jwt) return null;
  const segments = jwt.split(".");
  if (segments.length < 2) return null;
  try {
    const json = Buffer.from(segments[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Pull the ChatGPT account id out of the id_token's auth claim, if present. */
function accountIdFromJwt(idToken?: string): string | undefined {
  const payload = decodeJwtPayload(idToken);
  const auth = payload?.["https://api.openai.com/auth"];
  if (auth && typeof auth === "object" && "chatgpt_account_id" in auth) {
    const id = (auth as Record<string, unknown>).chatgpt_account_id;
    if (typeof id === "string") return id;
  }
  return undefined;
}

/** Read the `exp` claim (seconds) from the access token and convert to ms. */
function expiryFromJwt(accessToken: string): number | undefined {
  const payload = decodeJwtPayload(accessToken);
  const exp = payload?.exp;
  return typeof exp === "number" ? exp * 1000 : undefined;
}

/** True when the token has a known expiry that is in the past. */
export function isExpired(token: CodexToken): boolean {
  return typeof token.expiresAt === "number" && token.expiresAt <= Date.now();
}
