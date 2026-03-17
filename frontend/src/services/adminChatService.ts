import httpClient from "@/lib/httpClient";

export interface AdminChatReportResponse {
  answer: string;
  sql_query?: string;
  raw_data?: Record<string, unknown>[];
  error?: string;
}

export const adminChatService = {
  async askReport(message: string): Promise<AdminChatReportResponse> {
    const { data } = await httpClient.post("/admin/chat/report", { message });
    return (data?.data ?? data) as AdminChatReportResponse;
  },
};
