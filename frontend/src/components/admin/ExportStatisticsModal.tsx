"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ALL_REPORT_SECTIONS,
  REPORT_SECTION_OPTIONS,
  exportStatisticsCsv,
  exportStatisticsPdf,
  type StatisticsReportData,
  type StatisticsReportSection,
} from "@/lib/statisticsReportExport";

export type ExportFormat = "pdf" | "csv";

interface ExportStatisticsModalProps {
  open: boolean;
  onClose: () => void;
  reportData: StatisticsReportData;
}

export default function ExportStatisticsModal({
  open,
  onClose,
  reportData,
}: ExportStatisticsModalProps) {
  const [selected, setSelected] = useState<StatisticsReportSection[]>([
    ...ALL_REPORT_SECTIONS,
  ]);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([...ALL_REPORT_SECTIONS]);
      setFormat("pdf");
    }
  }, [open]);

  if (!open) return null;

  const allSelected = selected.length === ALL_REPORT_SECTIONS.length;

  const toggleSection = (id: StatisticsReportSection) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelected(allSelected ? [] : [...ALL_REPORT_SECTIONS]);
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất một loại báo cáo.");
      return;
    }
    setExporting(true);
    try {
      if (format === "pdf") {
        await exportStatisticsPdf(selected, reportData);
        toast.success("Đã xuất báo cáo PDF.");
      } else {
        exportStatisticsCsv(selected, reportData);
        toast.success("Đã xuất báo cáo CSV.");
      }
      onClose();
    } catch {
      toast.error("Xuất báo cáo thất bại. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2
              id="export-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Xuất báo cáo thống kê
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Kỳ: {reportData.dateFrom} → {reportData.dateTo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Định dạng file
            </p>
            <div className="flex gap-3">
              <label
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  format === "pdf"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={() => setFormat("pdf")}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-xl">
                  picture_as_pdf
                </span>
                <span className="text-sm font-bold">PDF</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  format === "csv"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-xl">
                  table_chart
                </span>
                <span className="text-sm font-bold">CSV</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">
                Loại báo cáo ({selected.length}/{ALL_REPORT_SECTIONS.length})
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-bold text-primary hover:underline"
              >
                {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
            <ul className="space-y-2">
              {REPORT_SECTION_OPTIONS.map((opt) => {
                const checked = selected.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSection(opt.id)}
                        className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-900 block">
                          {opt.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {opt.description}
                        </span>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || selected.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">
                  progress_activity
                </span>
                Đang xuất...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  {format === "pdf" ? "picture_as_pdf" : "download"}
                </span>
                Xuất {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
