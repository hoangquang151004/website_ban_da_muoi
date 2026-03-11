"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import AdminHeader from "@/components/admin/Header";
import httpClient from "@/lib/httpClient";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReviewItem {
  id: number;
  product_id: number;
  product_name: string;
  user_id: number;
  user_full_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  avg_rating: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const reviewApi = {
  async list(params: Record<string, any>) {
    const { data } = await httpClient.get("/admin/reviews", { params });
    return data?.data ?? data;
  },
  async approve(id: number, is_approved: boolean) {
    const { data } = await httpClient.put(`/admin/reviews/${id}`, {
      is_approved,
    });
    return data?.data ?? data;
  },
  async reply(id: number, admin_reply: string) {
    const { data } = await httpClient.post(`/admin/reviews/${id}/reply`, {
      admin_reply,
    });
    return data?.data ?? data;
  },
  async deleteReply(id: number) {
    const { data } = await httpClient.delete(`/admin/reviews/${id}/reply`);
    return data?.data ?? data;
  },
  async delete(id: number) {
    await httpClient.delete(`/admin/reviews/${id}`);
  },
  async stats() {
    const { data } = await httpClient.get("/admin/reviews/stats");
    return data?.data ?? data;
  },
};

// ─── Star component ───────────────────────────────────────────────────────────
function Stars({
  rating,
  size = "text-[14px]",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`material-symbols-outlined ${size} ${i <= rating ? "text-amber-400" : "text-slate-200"}`}
        >
          star
        </span>
      ))}
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600",
  "bg-emerald-100 text-emerald-600",
  "bg-pink-100 text-pink-600",
  "bg-orange-100 text-orange-600",
  "bg-violet-100 text-violet-600",
  "bg-cyan-100 text-cyan-600",
];

function Avatar({ name, id }: { name: string; id: number }) {
  const color = AVATAR_COLORS[id % AVATAR_COLORS.length];
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className={`size-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${color}`}
    >
      {initials}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [tabApproved, setTabApproved] = useState<boolean | null>(null); // false=pending, true=approved, null=all
  const [filterRating, setFilterRating] = useState<number | "">("");
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Load stats
  const loadStats = useCallback(() => {
    reviewApi
      .stats()
      .then((s) => {
        if (s) setStats(s);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load reviews
  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: pageSize };
    if (tabApproved !== null) params.is_approved = tabApproved;
    if (filterRating) params.rating = filterRating;
    if (search.trim()) params.search = search.trim();

    reviewApi
      .list(params)
      .then((res) => {
        setReviews(res?.items ?? []);
        setTotal(res?.total ?? 0);
        setTotalPages(res?.total_pages ?? 1);
      })
      .catch(() => toast.error("Không thể tải danh sách đánh giá"))
      .finally(() => setLoading(false));
  }, [tabApproved, filterRating, search, page, pageSize]);

  function changeTab(v: boolean | null) {
    setTabApproved(v);
    setPage(1);
  }

  // ── Approve / Reject ───────────────────────────────────────────────────────
  async function handleApprove(review: ReviewItem, approve: boolean) {
    setApprovingId(review.id);
    const tid = toast.loading(approve ? "Đang hiện..." : "Đang ẩn...");
    try {
      const updated = await reviewApi.approve(review.id, approve);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, ...updated } : r)),
      );
      toast.success(approve ? "Đã hiện đánh giá!" : "Đã ẩn đánh giá!", {
        id: tid,
      });
      loadStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Lỗi khi cập nhật", {
        id: tid,
      });
    } finally {
      setApprovingId(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const tid = toast.loading("Đang xóa...");
    try {
      await reviewApi.delete(deleteTarget.id);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Đã xóa đánh giá!", { id: tid });
      loadStats();
    } catch {
      toast.error("Lỗi khi xóa đánh giá", { id: tid });
    } finally {
      setDeletingId(null);
    }
  }

  // ── Reply ──────────────────────────────────────────────────────────────────
  function openReply(review: ReviewItem) {
    setReplyTarget(review);
    setReplyText(review.admin_reply ?? "");
  }

  async function handleReply() {
    if (!replyTarget || !replyText.trim()) return;
    setReplyLoading(true);
    const tid = toast.loading("Đang gửi phản hồi...");
    try {
      const updated = await reviewApi.reply(replyTarget.id, replyText.trim());
      setReviews((prev) =>
        prev.map((r) => (r.id === replyTarget.id ? { ...r, ...updated } : r)),
      );
      setReplyTarget(null);
      toast.success("Đã gửi phản hồi!", { id: tid });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Lỗi khi gửi phản hồi", {
        id: tid,
      });
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleDeleteReply(review: ReviewItem) {
    const tid = toast.loading("Đang xóa phản hồi...");
    try {
      const updated = await reviewApi.deleteReply(review.id);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, ...updated } : r)),
      );
      toast.success("Đã xóa phản hồi!", { id: tid });
    } catch {
      toast.error("Lỗi khi xóa phản hồi", { id: tid });
    }
  }

  const safePage = Math.min(page, Math.max(1, totalPages));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col overflow-hidden flex-1">
        <AdminHeader
          placeholder="Tìm kiếm nội dung đánh giá, tên khách hàng..."
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Header + Stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Quản lý Đánh giá
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                hiện, phản hồi và quản lý ý kiến khách hàng
              </p>
            </div>
            {stats && (
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Đã ẩn
                  </p>
                  <p className="text-xl font-bold text-amber-600">
                    {stats.pending}
                  </p>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Đã hiện
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {stats.approved}
                  </p>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Điểm TB
                  </p>
                  <div className="flex items-center gap-1 justify-center">
                    <p className="text-xl font-bold text-slate-900">
                      {stats.avg_rating}
                    </p>
                    <span className="material-symbols-outlined text-amber-400 text-sm">
                      star
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab row */}
            <div className="flex items-center justify-between border-b border-slate-200 px-2">
              <div className="flex">
                {[
                  { label: "Tất cả", val: null },
                  { label: "Đã ẩn", val: false },
                  { label: "Đã hiện", val: true },
                ].map((tab) => (
                  <button
                    key={String(tab.val)}
                    onClick={() => changeTab(tab.val)}
                    className={`px-5 py-3.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                      tabApproved === tab.val
                        ? "font-bold text-primary border-primary"
                        : "font-medium text-slate-500 border-transparent hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                    {stats && (
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${tabApproved === tab.val ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"}`}
                      >
                        {tab.val === null
                          ? stats.total
                          : tab.val
                            ? stats.approved
                            : stats.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Rating filter */}
              <div className="pr-4">
                <select
                  value={filterRating}
                  onChange={(e) => {
                    setFilterRating(
                      e.target.value === "" ? "" : Number(e.target.value),
                    );
                    setPage(1);
                  }}
                  className="pl-2 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-primary cursor-pointer bg-white"
                >
                  <option value="">Tất cả sao</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} sao
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-5 py-4 whitespace-nowrap">Khách hàng</th>
                    <th className="px-5 py-4 whitespace-nowrap">Sản phẩm</th>
                    <th className="px-5 py-4 whitespace-nowrap">Đánh giá</th>
                    <th className="px-5 py-4 whitespace-nowrap">Nội dung</th>
                    <th className="px-5 py-4 whitespace-nowrap">Ngày</th>
                    <th className="px-5 py-4 whitespace-nowrap">Trạng thái</th>
                    <th className="px-5 py-4 text-center whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-sm text-slate-400"
                      >
                        <span className="inline-block size-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin mr-2 align-middle" />
                        Đang tải...
                      </td>
                    </tr>
                  )}
                  {!loading && reviews.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-sm text-slate-400"
                      >
                        <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">
                          rate_review
                        </span>
                        Không có đánh giá nào.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    reviews.map((review) => (
                      <tr
                        key={review.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={review.user_full_name || "?"}
                              id={review.user_id}
                            />
                            <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                              {review.user_full_name || "Ẩn danh"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="text-sm text-slate-600 max-w-[160px] truncate block"
                            title={review.product_name}
                          >
                            {review.product_name || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Stars rating={review.rating} />
                        </td>
                        <td className="px-5 py-4 max-w-[260px]">
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {review.comment || "—"}
                          </p>
                          {review.admin_reply && (
                            <div className="mt-1.5 flex items-start gap-1.5 bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-1.5">
                              <span className="material-symbols-outlined text-primary text-xs shrink-0 mt-0.5">
                                storefront
                              </span>
                              <p className="text-xs text-primary line-clamp-2">
                                {review.admin_reply}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {fmtDate(review.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              review.is_approved
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[10px]">
                              {review.is_approved
                                ? "check_circle"
                                : "visibility_off"}
                            </span>
                            {review.is_approved ? "Đã hiện" : "Đã ẩn"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Approve / Hide */}
                            {!review.is_approved ? (
                              <button
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Hiện"
                                disabled={approvingId === review.id}
                                onClick={() => handleApprove(review, true)}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  check_circle
                                </span>
                              </button>
                            ) : (
                              <button
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Ẩn đánh giá"
                                disabled={approvingId === review.id}
                                onClick={() => handleApprove(review, false)}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility_off
                                </span>
                              </button>
                            )}
                            {/* Reply */}
                            <button
                              className={`p-1.5 rounded-lg transition-all ${review.admin_reply ? "text-primary bg-primary/10" : "text-slate-400 hover:text-primary hover:bg-primary/10"}`}
                              title={
                                review.admin_reply ? "Sửa phản hồi" : "Phản hồi"
                              }
                              onClick={() => openReply(review)}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                reply
                              </span>
                            </button>
                            {/* Delete reply */}
                            {review.admin_reply && (
                              <button
                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                title="Xóa phản hồi"
                                onClick={() => handleDeleteReply(review)}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  undo
                                </span>
                              </button>
                            )}
                            {/* Delete */}
                            <button
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Xóa đánh giá"
                              onClick={() => setDeleteTarget(review)}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Hiển thị{" "}
                <span className="font-bold">
                  {total === 0
                    ? "0"
                    : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, total)}`}
                </span>{" "}
                trong <span className="font-bold">{total}</span> đánh giá
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - safePage) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (
                      idx > 0 &&
                      typeof arr[idx - 1] === "number" &&
                      (p as number) - (arr[idx - 1] as number) > 1
                    )
                      acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "..." ? (
                      <span
                        key={`e-${i}`}
                        className="size-8 flex items-center justify-center text-xs text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={`size-8 flex items-center justify-center rounded-lg text-xs font-medium ${safePage === item ? "bg-primary text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reply Modal ───────────────────────────────────────────────────────── */}
      {replyTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {replyTarget.admin_reply
                    ? "Chỉnh sửa phản hồi"
                    : "Phản hồi đánh giá"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  của {replyTarget.user_full_name}
                </p>
              </div>
              <button
                onClick={() => setReplyTarget(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Customer review */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    name={replyTarget.user_full_name || "?"}
                    id={replyTarget.user_id}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {replyTarget.user_full_name}
                    </p>
                    <Stars rating={replyTarget.rating} size="text-[12px]" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {replyTarget.comment || "—"}
                </p>
              </div>
              {/* Reply input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phản hồi của cửa hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập phản hồi từ cửa hàng..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-sm placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {replyText.length} ký tự
                </p>
              </div>
            </div>
            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setReplyTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReply}
                disabled={replyLoading || !replyText.trim()}
                className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {replyLoading && (
                  <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span className="material-symbols-outlined text-sm">send</span>
                {replyLoading ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ───────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-500">
                  warning
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Xóa đánh giá
                </h2>
                <p className="text-sm text-slate-500">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar
                  name={deleteTarget.user_full_name || "?"}
                  id={deleteTarget.user_id}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {deleteTarget.user_full_name}
                  </p>
                  <Stars rating={deleteTarget.rating} size="text-[11px]" />
                </div>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">
                {deleteTarget.comment}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === deleteTarget.id}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-60 flex items-center gap-2"
              >
                {deletingId === deleteTarget.id && (
                  <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
