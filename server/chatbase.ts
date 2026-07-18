/**
 * Chatbase API v2 client — the living voice of Kayla's Unicorn oracle.
 * Server-side only: the API key must never reach the browser.
 * Docs: https://chatbase.co/docs (API v2)
 */

const CHATBASE_BASE = "https://www.chatbase.co/api/v2";

export interface OracleReply {
  text: string;
  conversationId: string | null;
  credits: number | null;
}

function getConfig() {
  const apiKey = process.env.CHATBASE_UNICORN_API;
  // Prefer the explicit agent id secret; fall back to extracting from the
  // iframe/page URL secret if present.
  let agentId = process.env.CHATBASE_UNICORN_AGENT_ID || "";
  if (!agentId) {
    const page = process.env.CHATBASE_UNICORN_PAGE || "";
    const m = page.match(/chatbot-iframe\/([a-zA-Z0-9_-]+)/);
    if (m) agentId = m[1];
  }
  return { apiKey, agentId };
}

export function isOracleConfigured(): boolean {
  const { apiKey, agentId } = getConfig();
  return Boolean(apiKey && agentId);
}

/**
 * Send one message to the oracle. Non-streaming — the game types the answer
 * out itself, staying true to the terminal typewriter aesthetic.
 */
export async function askOracle(
  message: string,
  conversationId?: string | null,
  timeoutMs = 45_000,
): Promise<OracleReply> {
  const { apiKey, agentId } = getConfig();
  if (!apiKey || !agentId) {
    throw new Error("Oracle is not configured (missing Chatbase credentials).");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${CHATBASE_BASE}/agents/${agentId}/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        stream: false,
        ...(conversationId ? { conversationId } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Chatbase ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      data?: {
        parts?: Array<{ type: string; text?: string }>;
        metadata?: { conversationId?: string; usage?: { credits?: number } };
      };
    };

    const text = (json.data?.parts ?? [])
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("\n")
      .trim();

    if (!text) throw new Error("The oracle answered with silence (empty response).");

    return {
      text,
      conversationId: json.data?.metadata?.conversationId ?? null,
      credits: json.data?.metadata?.usage?.credits ?? null,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Lightweight health probe for the Chatbase API. */
export async function oracleHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${CHATBASE_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
