# Task 08 — Tạo UI Admin Chat Report (AI Text-to-SQL)

**Ước tính:** 60 phút  
**Phụ thuộc:** Task 01 và backend AI Agent hoàn thành  
**File cần tạo:** `frontend/src/app/admin/ai-report/page.tsx`  
**File cần sửa:** `frontend/src/services/adminService.ts` (thêm method)  
**File cần sửa (tuỳ chọn):** Sidebar admin để thêm link

---

## Tổng quan

Backend endpoint `POST /api/v1/admin/chat/report` cho phép admin đặt câu hỏi bằng ngôn ngữ tự nhiên để AI tự động tạo SQL và trả về kết quả.

Ví dụ input: _"Doanh thu tháng 6 là bao nhiêu?"_  
Output: câu SQL + bảng dữ liệu + answer

---

## Bước 1 — Thêm method vào `adminService.ts`

```typescript
// ─── AI Report (Text-to-SQL) ───────────────────────────────────────────────
async queryReport(question: string): Promise<{
  answer: string;
  sql_query: string;
  raw_data: Record<string, any>[];
  columns: string[];
  error?: string;
}> {
  const { data } = await httpClient.post("/admin/chat/report", { message: question });
  return data?.data ?? data;
},
```

---

## Bước 2 — Tạo `frontend/src/app/admin/ai-report/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { adminService } from "@/services/adminService";

interface ReportResult {
  answer: string;
  sql_query: string;
  raw_data: Record<string, any>[];
  columns: string[];
  error?: string;
}

const EXAMPLE_QUERIES = [
  "Doanh thu 30 ngày gần nhất là bao nhiêu?",
  "Top 5 sản phẩm bán chạy nhất?",
  "Số đơn hàng đang chờ xử lý?",
  "Sản phẩm nào tồn kho dưới 10 cái?",
  "Doanh thu theo từng danh mục tháng này?",
  "Khách hàng nào mua nhiều nhất?",
];

export default function AIReportPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{ question: string; result: ReportResult }>
  >([]);

  const handleSubmit = async (q?: string) => {
    const query = (q ?? question).trim();
    if (!query || isLoading) return;
    setQuestion(query);
    setIsLoading(true);
    setResult(null);
    try {
      const res = await adminService.queryReport(query);
      setResult(res);
      setHistory((prev) => [
        { question: query, result: res },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      setResult({
        answer: "Có lỗi xảy ra. Vui lòng thử lại.",
        sql_query: "",
        raw_data: [],
        columns: [],
        error: err?.response?.data?.message ?? "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Báo cáo AI</h1>
        <p className="text-slate-500 mt-1">
          Đặt câu hỏi bằng tiếng Việt, AI sẽ tự động truy vấn dữ liệu và trả
          lời.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ví dụ: Doanh thu tháng này là bao nhiêu?"
            rows={2}
            className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !question.trim()}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-orange-600 transition-colors"
          >
            {isLoading ? "Đang phân tích..." : "Hỏi AI"}
          </button>
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleSubmit(q)}
              className="text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-3 py-1 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="inline-flex items-center gap-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span>AI đang phân tích câu hỏi và truy vấn dữ liệu...</span>
          </div>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-4">
          {/* Answer */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                AI
              </div>
              <div className="flex-1">
                <p className="text-slate-800">{result.answer}</p>
                {result.error && (
                  <p className="text-red-500 text-sm mt-2">
                    Lỗi: {result.error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SQL Query */}
          {result.sql_query && (
            <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto">
              <p className="text-slate-400 text-xs mb-2">SQL đã tạo:</p>
              <code className="text-green-400 text-sm font-mono whitespace-pre">
                {result.sql_query}
              </code>
            </div>
          )}

          {/* Data Table */}
          {result.raw_data && result.raw_data.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-700 text-sm">
                  Dữ liệu ({result.raw_data.length} bản ghi)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {(result.columns ?? Object.keys(result.raw_data[0])).map(
                        (col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.raw_data.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        {(result.columns ?? Object.keys(row)).map((col) => (
                          <td key={col} className="px-4 py-3 text-slate-700">
                            {String(row[col] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query History */}
      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Lịch sử câu hỏi
          </h2>
          <div className="space-y-2">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(h.question)}
                className="w-full text-left bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-orange-300 transition-colors"
              >
                <p className="text-sm font-medium text-slate-700">
                  {h.question}
                </p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {h.result.answer}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Bước 3 — Thêm link vào sidebar admin

Tìm file sidebar hoặc layout admin (`frontend/src/app/admin/layout.tsx` hoặc `frontend/src/components/admin/Sidebar.tsx`), thêm:

```tsx
{ href: "/admin/ai-report", label: "Báo cáo AI", icon: SparklesIcon }
```

---

## Kiểm tra hoàn thành (DoD)

- [ ] `/admin/ai-report` load thành công, form hiển thị
- [ ] Gõ câu hỏi → Enter → loading indicator → nhận kết quả từ AI
- [ ] Answer text hiển thị đúng ngôn ngữ tiếng Việt
- [ ] SQL query box hiển thị câu lệnh AI tạo ra
- [ ] Bảng dữ liệu render đúng columns và rows
- [ ] 6 nút gợi ý sẵn → click → auto-submit
- [ ] Lịch sử câu hỏi lưu tối đa 10 câu, click để hỏi lại
- [ ] Câu hỏi SQL injection (DROP TABLE, DELETE FROM) → backend chặn, UI hiển thị thông báo lỗi đúng chỗ
- [ ] Link trong sidebar admin trỏ đúng đến trang này
