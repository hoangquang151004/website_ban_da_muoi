import httpClient from "@/lib/httpClient";
import type { ChatApiResponse, ChatLlmInfo } from "@/types";

export interface SendChatMessagePayload {
  message: string;
  session_id?: string;
}

export const chatService = {
  async sendMessage(payload: SendChatMessagePayload): Promise<ChatApiResponse> {
    const { data } = await httpClient.post("/chat", payload, {
      timeout: 120_000,
    });
    return (data?.data ?? data) as ChatApiResponse;
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
