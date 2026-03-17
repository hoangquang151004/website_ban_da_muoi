import httpClient from "@/lib/httpClient";
import type { ChatApiResponse } from "@/types";

export interface SendChatMessagePayload {
  message: string;
  session_id?: string;
}

export const chatService = {
  async sendMessage(payload: SendChatMessagePayload): Promise<ChatApiResponse> {
    const { data } = await httpClient.post("/chat", payload);
    return (data?.data ?? data) as ChatApiResponse;
  },
};

// TODO Phase 6: ho tro upload image/file vao chat neu backend cho phep
