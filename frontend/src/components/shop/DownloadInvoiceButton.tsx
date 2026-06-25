"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { exportOrderInvoicePdf } from "@/lib/orderInvoicePdf";
import type { Order } from "@/types";

interface DownloadInvoiceButtonProps {
  order: Order | null;
  className?: string;
  fullWidth?: boolean;
  variant?: "primary" | "outline";
}

export default function DownloadInvoiceButton({
  order,
  className = "",
  fullWidth = false,
  variant = "outline",
}: DownloadInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!order) {
      toast.error("Không có dữ liệu đơn hàng để xuất hóa đơn.");
      return;
    }
    setLoading(true);
    try {
      await exportOrderInvoicePdf(order);
      toast.success("Đã tải hóa đơn PDF.");
    } catch {
      toast.error("Không thể xuất hóa đơn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const baseClass = fullWidth ? "w-full" : "";
  const variantClass =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary/90"
      : "border border-border-color text-neutral-dark hover:bg-neutral-light";

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading || !order}
      className={`inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${variantClass} ${baseClass} ${className}`}
    >
      <span
        className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}
      >
        {loading ? "progress_activity" : "picture_as_pdf"}
      </span>
      {loading ? "Đang tạo PDF..." : "Tải hóa đơn PDF"}
    </button>
  );
}
