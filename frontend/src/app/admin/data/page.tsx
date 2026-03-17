"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AdminHeader from "@/components/admin/Header";
import {
  adminDataService,
  type DataSourceItem,
  type DataSourceStatus,
  type IndexJobStatusResponse,
} from "@/services/adminDataService";

type FilterStatus = "all" | "queued" | "processing" | "indexed" | "failed";

type RowJobState = {
  sourceId: string;
  jobId: string;
  status: IndexJobStatusResponse["status"];
  progress: number;
  error: string | null;
  notifiedFailed: boolean;
};

const STATUS_STYLE: Record<
  DataSourceStatus,
  { label: string; className: string }
> = {
  queued: {
    label: "Queued",
    className: "bg-slate-100 text-slate-700",
  },
  processing: {
    label: "Processing",
    className: "bg-orange-100 text-orange-700",
  },
  indexed: {
    label: "Indexed",
    className: "bg-emerald-100 text-emerald-700",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
  },
  deleted: {
    label: "Deleted",
    className: "bg-slate-100 text-slate-500",
  },
};

const TYPE_ICON: Record<string, { icon: string; className: string }> = {
  pdf: { icon: "picture_as_pdf", className: "bg-red-100 text-red-600" },
  txt: { icon: "description", className: "bg-slate-100 text-slate-600" },
  docx: { icon: "article", className: "bg-blue-100 text-blue-600" },
  csv: { icon: "table_chart", className: "bg-emerald-100 text-emerald-600" },
  md: { icon: "markdown", className: "bg-indigo-100 text-indigo-600" },
  unknown: { icon: "draft", className: "bg-slate-100 text-slate-500" },
};

function getTypeIcon(type: string) {
  const key = type.toLowerCase();
  return TYPE_ICON[key] ?? TYPE_ICON.unknown;
}

function fmtDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("vi-VN", {
    hour12: false,
  });
}

export default function AdminDataPage() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploading, setUploading] = useState(false);

  const [reindexingMap, setReindexingMap] = useState<Record<string, boolean>>(
    {},
  );
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});
  const [jobStateBySource, setJobStateBySource] = useState<
    Record<string, RowJobState>
  >({});

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminDataService.listDataSources({
        page,
        limit,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setSources(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    const activeJobs = Object.values(jobStateBySource).filter(
      (job) => job.status === "queued" || job.status === "processing",
    );

    if (activeJobs.length === 0) {
      return;
    }

    let disposed = false;

    const pollJobs = async () => {
      const pollingTargets = Object.values(jobStateBySource).filter(
        (job) => job.status === "queued" || job.status === "processing",
      );

      if (pollingTargets.length === 0) {
        return;
      }

      const settled = await Promise.allSettled(
        pollingTargets.map((job) =>
          adminDataService.getIndexJobStatus(job.jobId),
        ),
      );

      if (disposed) {
        return;
      }

      let shouldRefreshList = false;

      setJobStateBySource((prev) => {
        const next = { ...prev };

        pollingTargets.forEach((target, index) => {
          const result = settled[index];
          const existing = next[target.sourceId];
          if (!existing) {
            return;
          }

          if (result.status === "rejected") {
            next[target.sourceId] = {
              ...existing,
              status: "failed",
              error:
                result.reason instanceof Error
                  ? result.reason.message
                  : "Không thể lấy trạng thái job",
            };
            shouldRefreshList = true;
            return;
          }

          const payload = result.value;
          next[target.sourceId] = {
            ...existing,
            status: payload.status,
            progress: payload.progress,
            error: payload.error,
          };

          if (payload.status === "failed" && !existing.notifiedFailed) {
            toast.error(
              `Indexing thất bại: ${payload.error ?? "Không có chi tiết lỗi"}`,
            );
            next[target.sourceId].notifiedFailed = true;
          }

          if (payload.status === "indexed" || payload.status === "failed") {
            shouldRefreshList = true;
          }
        });

        return next;
      });

      if (shouldRefreshList) {
        void fetchSources();
      }
    };

    void pollJobs();
    const interval = window.setInterval(() => {
      void pollJobs();
    }, 4000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [jobStateBySource, fetchSources]);

  const filteredSources = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return sources;

    return sources.filter((item) => {
      const text = [item.name, item.type, STATUS_STYLE[item.status].label]
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [searchValue, sources]);

  const indexedCount = useMemo(
    () => sources.filter((x) => x.status === "indexed").length,
    [sources],
  );

  const totalChunksOnPage = useMemo(
    () => sources.reduce((sum, item) => sum + item.chunks, 0),
    [sources],
  );

  const activeJobs = useMemo(
    () =>
      Object.values(jobStateBySource).filter(
        (x) => x.status === "queued" || x.status === "processing",
      ),
    [jobStateBySource],
  );

  const topJob = activeJobs[0];

  const setJobForSource = (
    sourceId: string,
    jobId: string,
    initialStatus: IndexJobStatusResponse["status"] = "queued",
  ) => {
    setJobStateBySource((prev) => ({
      ...prev,
      [sourceId]: {
        sourceId,
        jobId,
        status: initialStatus,
        progress: 0,
        error: null,
        notifiedFailed: false,
      },
    }));
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Vui lòng chọn tập tin trước khi tải lên");
      return;
    }

    setUploading(true);
    const tid = toast.loading("Đang tải lên nguồn dữ liệu...");

    try {
      const result = await adminDataService.uploadDataSource({
        file: uploadFile,
        category: uploadCategory,
        tags: uploadTags,
      });

      setJobForSource(result.source_id, result.job_id, "queued");
      setUploadFile(null);
      setUploadCategory("");
      setUploadTags("");
      await fetchSources();
      toast.success("Upload thành công, job indexing đã được tạo", { id: tid });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload nguồn dữ liệu thất bại",
        { id: tid },
      );
    } finally {
      setUploading(false);
    }
  };

  const handleReindex = async (sourceId: string) => {
    setReindexingMap((prev) => ({ ...prev, [sourceId]: true }));
    const tid = toast.loading("Đang tạo job re-index...");

    try {
      const result = await adminDataService.reindexDataSource(sourceId);
      setJobForSource(sourceId, result.job_id, "queued");
      await fetchSources();
      toast.success("Đã tạo job re-index", { id: tid });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-index thất bại", {
        id: tid,
      });
    } finally {
      setReindexingMap((prev) => ({ ...prev, [sourceId]: false }));
    }
  };

  const handleDelete = async (sourceId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa nguồn dữ liệu này?");
    if (!confirmed) {
      return;
    }

    setDeletingMap((prev) => ({ ...prev, [sourceId]: true }));
    const tid = toast.loading("Đang xóa nguồn dữ liệu...");

    try {
      await adminDataService.deleteDataSource(sourceId);
      setJobStateBySource((prev) => {
        const next = { ...prev };
        delete next[sourceId];
        return next;
      });
      await fetchSources();
      toast.success("Xóa nguồn dữ liệu thành công", { id: tid });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Xóa nguồn dữ liệu thất bại",
        {
          id: tid,
        },
      );
    } finally {
      setDeletingMap((prev) => ({ ...prev, [sourceId]: false }));
    }
  };

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        placeholder="Tìm kiếm nguồn dữ liệu..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <div className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Dữ liệu AI
            </h1>
            <p className="text-slate-500 mt-1">
              Quản lý và đồng bộ hóa Knowledge Base cho Vector Database
            </p>
          </div>
          <button
            onClick={() => setPage(1)}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
            Tải lại danh sách
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            {
              label: "Tổng nguồn dữ liệu",
              value: total.toLocaleString("vi-VN"),
              hint: `Trang ${page}/${Math.max(totalPages, 1)}`,
              hintClass: "text-slate-500",
              hintIcon: "description",
              icon: "folder_managed",
              iconClass: "bg-primary/10 text-primary",
            },
            {
              label: "Chunks trên trang",
              value: totalChunksOnPage.toLocaleString("vi-VN"),
              hint: "Tổng số đoạn dữ liệu đã cắt",
              hintClass: "text-blue-600",
              hintIcon: "segment",
              icon: "database",
              iconClass: "bg-blue-500/10 text-blue-500",
            },
            {
              label: "Nguồn đã Indexed",
              value: indexedCount.toLocaleString("vi-VN"),
              hint: `${sources.length} nguồn ở trang hiện tại`,
              hintClass: "text-emerald-600",
              hintIcon: "check_circle",
              icon: "memory",
              iconClass: "bg-emerald-500/10 text-emerald-500",
            },
            {
              label: "Job đang chạy",
              value: activeJobs.length.toLocaleString("vi-VN"),
              hint:
                activeJobs.length > 0
                  ? "Đang polling tự động"
                  : "Không có job hoạt động",
              hintClass:
                activeJobs.length > 0 ? "text-orange-600" : "text-slate-500",
              hintIcon: "sync",
              icon: "update",
              iconClass: "bg-orange-500/10 text-orange-500",
            },
          ].map((card) => (
            <article
              key={card.label}
              className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 font-medium text-sm">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.iconClass}`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p
                className={`text-xs mt-2 font-medium flex items-center gap-1 ${card.hintClass}`}
              >
                <span className="material-symbols-outlined text-xs">
                  {card.hintIcon}
                </span>
                {card.hint}
              </p>
            </article>
          ))}
        </div>

        <section className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                analytics
              </span>
              Trạng thái huấn luyện AI (VectorDB Indexing)
            </h2>
            <span className="text-sm font-semibold text-primary">
              {topJob
                ? `${topJob.progress}% Hoàn tất`
                : activeJobs.length > 0
                  ? "Đang xử lý"
                  : "Không có job chạy"}
            </span>
          </div>
          <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${topJob?.progress ?? 0}%` }}
            />
          </div>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
            <span>
              {topJob
                ? `Job: ${topJob.jobId} - ${STATUS_STYLE[topJob.status].label}`
                : "Chưa có job nào trong hàng đợi"}
            </span>
            <span>
              {topJob?.error
                ? `Lỗi: ${topJob.error}`
                : activeJobs.length > 0
                  ? `Đang theo dõi ${activeJobs.length} job`
                  : "Polling tự tắt khi không còn job"}
            </span>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
            <h2 className="font-bold text-slate-900">
              Danh sách nguồn dữ liệu
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as FilterStatus);
                  setPage(1);
                }}
                className="text-sm border border-primary/20 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="queued">Queued</option>
                <option value="processing">Processing</option>
                <option value="indexed">Indexed</option>
                <option value="failed">Failed</option>
              </select>
              <button
                onClick={() => void fetchSources()}
                className="p-2 rounded-lg hover:bg-white text-slate-500 transition-colors"
                title="Tải lại"
              >
                <span className="material-symbols-outlined text-xl">sync</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={() => void fetchSources()}
                className="text-xs font-semibold px-3 py-1 rounded bg-white border border-red-200 hover:bg-red-100"
              >
                Thử lại
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-slate-400 border-b border-primary/10">
                  <th className="px-6 py-4 font-bold">Tên nguồn</th>
                  <th className="px-6 py-4 font-bold">Loại</th>
                  <th className="px-6 py-4 font-bold">Trạng thái</th>
                  <th className="px-6 py-4 font-bold">Ngày thêm</th>
                  <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      Đang tải danh sách nguồn dữ liệu...
                    </td>
                  </tr>
                ) : filteredSources.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      Không tìm thấy nguồn dữ liệu phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredSources.map((item) => {
                    const iconMeta = getTypeIcon(item.type);
                    const jobState = jobStateBySource[item.id];
                    const effectiveStatus =
                      (jobState?.status as DataSourceStatus | undefined) ??
                      item.status;
                    const status = STATUS_STYLE[effectiveStatus];
                    const isRowReindexing = reindexingMap[item.id] === true;
                    const isRowDeleting = deletingMap[item.id] === true;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-primary/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-8 rounded flex items-center justify-center ${iconMeta.className}`}
                            >
                              <span className="material-symbols-outlined text-xl">
                                {iconMeta.icon}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                v{item.version} •{" "}
                                {item.chunks.toLocaleString("vi-VN")} chunks
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div>
                            <p>{item.type.toUpperCase()}</p>
                            {item.category && (
                              <p className="text-xs text-slate-400">
                                {item.category}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`w-fit px-2 py-1 text-[10px] font-bold rounded-full uppercase ${status.className}`}
                            >
                              {status.label}
                            </span>
                            {(jobState?.status === "queued" ||
                              jobState?.status === "processing") && (
                              <span className="text-xs text-slate-500">
                                {jobState.progress}%
                              </span>
                            )}
                            {jobState?.status === "failed" &&
                              jobState.error && (
                                <span
                                  className="text-xs text-red-500 max-w-56 truncate"
                                  title={jobState.error}
                                >
                                  {jobState.error}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {fmtDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={isRowReindexing || isRowDeleting}
                              onClick={() => void handleReindex(item.id)}
                              className="p-1 text-primary hover:bg-primary/10 rounded"
                              title="Re-index"
                            >
                              <span className="material-symbols-outlined text-xl">
                                {isRowReindexing ? "progress_activity" : "sync"}
                              </span>
                            </button>
                            <button
                              disabled={isRowReindexing || isRowDeleting}
                              onClick={() => void handleDelete(item.id)}
                              className="p-1 text-red-400 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-xl">
                                {isRowDeleting ? "progress_activity" : "delete"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-primary/10 flex items-center justify-between text-sm text-slate-600">
            <span>
              Tổng: {total.toLocaleString("vi-VN")} nguồn • Trang {page}/
              {Math.max(totalPages, 1)}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="bg-white p-8 rounded-xl border-2 border-dashed border-primary/20">
            <div className="flex items-start gap-4">
              <div className="size-14 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">
                  upload_file
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Tải lên tập tin
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  Hỗ trợ PDF, CSV, TXT, DOCX. Sau khi upload, hệ thống tự tạo
                  job indexing.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="md:col-span-1 flex items-center justify-center min-h-11 px-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {uploadFile ? "Đổi tập tin" : "Chọn tập tin"}
                  </label>

                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    placeholder="Category (tuỳ chọn)"
                    className="md:col-span-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                  />

                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="Tags, cách nhau bởi dấu phẩy"
                    className="md:col-span-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-slate-500 min-h-4">
                    {uploadFile
                      ? `Đã chọn: ${uploadFile.name} (${Math.ceil(uploadFile.size / 1024)} KB)`
                      : "Chưa chọn tập tin"}
                  </p>

                  <button
                    onClick={() => void handleUpload()}
                    disabled={uploading}
                    className="bg-primary/10 hover:bg-primary/20 text-primary px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-60"
                  >
                    {uploading ? "Đang upload..." : "Upload và tạo job"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
