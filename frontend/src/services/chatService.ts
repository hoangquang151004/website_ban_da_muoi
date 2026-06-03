import httpClient from "@/lib/httpClient";
import type { ChatApiResponse, ChatLlmInfo } from "@/types";

const rawApiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

export const CHAT_API_BASE_URL = /\/api\/v1$/i.test(rawApiUrl)
  ? rawApiUrl
  : `${rawApiUrl}/api/v1`;

/** Bật SSE mặc định; tắt bằng NEXT_PUBLIC_CHAT_STREAM=false */
export const CHAT_STREAM_ENABLED =
  process.env.NEXT_PUBLIC_CHAT_STREAM !== "false";

export interface SendChatMessagePayload {
  message: string;
  session_id?: string;
}

export interface ChatStreamStatusPayload {
  step: string;
  message: string;
  intent?: string;
}

export interface ChatStreamCallbacks {
  onStatus?: (data: ChatStreamStatusPayload) => void;
  onToken?: (content: string) => void;
  onDone?: (payload: ChatApiResponse) => void;
  onError?: (message: string) => void;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("himalayan-auth");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

function parseSseFrames(buffer: string): {
  frames: Array<{ event: string; data: Record<string, unknown> }>;
  rest: string;
} {
  const frames: Array<{ event: string; data: Record<string, unknown> }> = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    const line = part
      .split("\n")
      .find((l) => l.startsWith("data: "));
    if (!line) continue;
    try {
      const parsed = JSON.parse(line.slice(6)) as {
        event?: string;
        data?: Record<string, unknown>;
      };
      if (parsed.event) {
        frames.push({
          event: parsed.event,
          data: parsed.data ?? {},
        });
      }
    } catch {
      // ignore malformed frames
    }
  }

  return { frames, rest };
}

export const chatService = {
  async sendMessage(payload: SendChatMessagePayload): Promise<ChatApiResponse> {
    const { data } = await httpClient.post("/chat", payload, {
      timeout: 120_000,
    });
    return (data?.data ?? data) as ChatApiResponse;
  },

  async streamMessage(
    payload: SendChatMessagePayload,
    callbacks: ChatStreamCallbacks,
    signal?: AbortSignal,
  ): Promise<ChatApiResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${CHAT_API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(
        errText || `Chat stream failed (${response.status})`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Chat stream: empty response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let finalPayload: ChatApiResponse | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = parseSseFrames(buffer);
      buffer = rest;

      for (const frame of frames) {
        switch (frame.event) {
          case "status":
            callbacks.onStatus?.(frame.data as ChatStreamStatusPayload);
            break;
          case "token": {
            const content = String(frame.data.content ?? "");
            if (content) callbacks.onToken?.(content);
            break;
          }
          case "done":
            finalPayload = frame.data as ChatApiResponse;
            callbacks.onDone?.(finalPayload);
            break;
          case "error":
            callbacks.onError?.(String(frame.data.message ?? "Stream error"));
            break;
          default:
            break;
        }
      }
    }

    if (buffer.trim()) {
      const { frames } = parseSseFrames(`${buffer}\n\n`);
      for (const frame of frames) {
        if (frame.event === "done") {
          finalPayload = frame.data as ChatApiResponse;
          callbacks.onDone?.(finalPayload);
        }
      }
    }

    if (!finalPayload) {
      throw new Error("Chat stream ended without done event");
    }

    return finalPayload;
  },

  async getLlmInfo(): Promise<ChatLlmInfo> {
    const { data } = await httpClient.get("/chat/llm-info");
    return (data?.data ?? data) as ChatLlmInfo;
  },

  async clearSession(sessionId: string): Promise<void> {
    await httpClient.delete(`/chat/session/${encodeURIComponent(sessionId)}`);
  },
};

// TODO Phase 6: ho tro upload image/file vao chat neu backend cho phep
