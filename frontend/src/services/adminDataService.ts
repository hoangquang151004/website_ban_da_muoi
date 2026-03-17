import axios from "axios";
import httpClient from "@/lib/httpClient";

export type DataSourceStatus =
  | "queued"
  | "processing"
  | "indexed"
  | "failed"
  | "deleted";

export interface DataSourceItem {
  id: string;
  name: string;
  type: string;
  status: DataSourceStatus;
  created_at: string;
  chunks: number;
  version: number;
  category: string | null;
  tags: string[];
}

export interface DataSourceListPage {
  items: DataSourceItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UploadDataSourcePayload {
  file: File;
  category?: string;
  tags?: string;
}

export interface UploadDataSourceResponse {
  source_id: string;
  job_id: string;
  status: string;
}

export interface ReindexDataSourceResponse {
  job_id: string;
  status: string;
}

export interface DeleteDataSourceResponse {
  deleted: boolean;
}

export interface IndexJobStatusResponse {
  job_id: string;
  status: "queued" | "processing" | "indexed" | "failed";
  progress: number;
  error: string | null;
}

interface BackendResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

export interface ListDataSourceParams {
  page?: number;
  limit?: number;
  status?: Exclude<DataSourceStatus, "deleted">;
}

function extractData<T>(payload: BackendResponse<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as BackendResponse<T>).data;
  }
  return payload as T;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export const adminDataService = {
  async listDataSources(
    params: ListDataSourceParams = {},
  ): Promise<DataSourceListPage> {
    try {
      const { data } = await httpClient.get<
        BackendResponse<DataSourceListPage>
      >("/admin/data-sources", { params });
      return extractData(data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, "Không thể tải danh sách nguồn dữ liệu"),
      );
    }
  },

  async uploadDataSource(
    payload: UploadDataSourcePayload,
  ): Promise<UploadDataSourceResponse> {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.category?.trim()) {
      formData.append("category", payload.category.trim());
    }
    if (payload.tags?.trim()) {
      formData.append("tags", payload.tags.trim());
    }

    try {
      const { data } = await httpClient.post<
        BackendResponse<UploadDataSourceResponse>
      >("/admin/data-sources/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return extractData(data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, "Upload nguồn dữ liệu thất bại"),
      );
    }
  },

  async reindexDataSource(
    sourceId: string,
  ): Promise<ReindexDataSourceResponse> {
    try {
      const { data } = await httpClient.post<
        BackendResponse<ReindexDataSourceResponse>
      >(`/admin/data-sources/${sourceId}/reindex`);
      return extractData(data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Không thể re-index dữ liệu"));
    }
  },

  async deleteDataSource(sourceId: string): Promise<DeleteDataSourceResponse> {
    try {
      const { data } = await httpClient.delete<
        BackendResponse<DeleteDataSourceResponse>
      >(`/admin/data-sources/${sourceId}`);
      return extractData(data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, "Không thể xóa nguồn dữ liệu"),
      );
    }
  },

  async getIndexJobStatus(jobId: string): Promise<IndexJobStatusResponse> {
    try {
      const { data } = await httpClient.get<
        BackendResponse<IndexJobStatusResponse>
      >(`/admin/data-sources/jobs/${jobId}`);
      return extractData(data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, "Không thể lấy trạng thái indexing job"),
      );
    }
  },
};
