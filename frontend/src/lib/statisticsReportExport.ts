import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { loadRobotoFonts, PDF_TABLE_BASE } from "@/lib/pdfFonts";
import type {
  StatisticsKPI,
  RevenuePoint,
  OrderStatusItem,
  TopProductItem,
  CategoryRevenueItem,
  ProductStatsItem,
  CustomerStatsItem,
} from "@/services/adminStatisticsService";

export type StatisticsReportSection =
  | "overview"
  | "revenue"
  | "order_status"
  | "top_products"
  | "category"
  | "product"
  | "customer";

export const REPORT_SECTION_OPTIONS: {
  id: StatisticsReportSection;
  label: string;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Tổng quan KPI",
    description: "Doanh thu, lợi nhuận, đơn hàng, khách mới",
  },
  {
    id: "revenue",
    label: "Doanh thu theo thời gian",
    description: "Biểu đồ doanh thu & số đơn theo kỳ",
  },
  {
    id: "order_status",
    label: "Trạng thái đơn hàng",
    description: "Phân bố trạng thái đơn trong kỳ",
  },
  {
    id: "top_products",
    label: "Top sản phẩm bán chạy",
    description: "Sản phẩm có doanh số cao nhất",
  },
  {
    id: "category",
    label: "Theo danh mục",
    description: "Doanh thu, giá vốn, lợi nhuận theo danh mục",
  },
  {
    id: "product",
    label: "Theo sản phẩm",
    description: "Chi tiết từng sản phẩm",
  },
  {
    id: "customer",
    label: "Theo khách hàng",
    description: "Doanh thu & số đơn theo khách",
  },
];

export const ALL_REPORT_SECTIONS: StatisticsReportSection[] =
  REPORT_SECTION_OPTIONS.map((o) => o.id);

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};

export interface StatisticsReportData {
  dateFrom: string;
  dateTo: string;
  kpi: StatisticsKPI | null;
  revenueChart: RevenuePoint[];
  orderStatus: OrderStatusItem[];
  topProducts: TopProductItem[];
  categoryRevenue: CategoryRevenueItem[];
  productStats: ProductStatsItem[];
  customerStats: CustomerStatsItem[];
}

function fmtMoney(val: number): string {
  return val.toLocaleString("vi-VN") + " đ";
}

function getTableEndY(doc: jsPDF): number {
  const withTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  return withTable.lastAutoTable?.finalY ?? 14;
}

function addReportHeader(
  doc: jsPDF,
  title: string,
  dateFrom: string,
  dateTo: string,
  y = 14,
): number {
  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, y);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kỳ báo cáo: ${dateFrom} → ${dateTo}`, 14, y + 7);
  doc.text(
    `Ngày xuất: ${new Date().toLocaleString("vi-VN")}`,
    14,
    y + 13,
  );
  return y + 20;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont("Roboto", "bold");
  doc.setFontSize(12);
  doc.setTextColor(242, 140, 38);
  doc.text(title, 14, y);
  doc.setFont("Roboto", "normal");
  return y + 6;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportStatisticsCsv(
  sections: StatisticsReportSection[],
  data: StatisticsReportData,
): void {
  const BOM = "\uFEFF";
  const lines: string[] = [];
  const {
    dateFrom,
    dateTo,
    kpi,
    revenueChart,
    orderStatus,
    topProducts,
    categoryRevenue,
    productStats,
    customerStats,
  } = data;

  lines.push(`Báo cáo kinh doanh,${dateFrom} - ${dateTo}`);

  if (sections.includes("overview") && kpi) {
    lines.push("");
    lines.push("=== KPI TỔNG HỢP ===");
    lines.push(`Doanh thu,${kpi.total_revenue}`);
    lines.push(`Lợi nhuận gộp,${kpi.gross_profit}`);
    lines.push(`Giá vốn hàng bán,${kpi.total_cost}`);
    lines.push(`Giá trị đơn trung bình,${kpi.avg_order_value}`);
    lines.push(`Đơn hoàn thành,${kpi.completed_orders}`);
    lines.push(`Khách hàng mới,${kpi.new_customers}`);
    lines.push(`Tăng trưởng doanh thu,${kpi.growth_pct}%`);
  }

  if (sections.includes("revenue")) {
    lines.push("");
    lines.push("=== DOANH THU THEO THỜI GIAN ===");
    lines.push("Nhãn,Doanh thu,Số đơn");
    revenueChart.forEach((p) => {
      lines.push(`${p.label},${p.revenue},${p.order_count}`);
    });
  }

  if (sections.includes("order_status")) {
    lines.push("");
    lines.push("=== TRẠNG THÁI ĐƠN HÀNG ===");
    lines.push("Trạng thái,Số lượng,Tỷ lệ (%)");
    orderStatus.forEach((s) => {
      lines.push(
        `${STATUS_LABELS[s.status] ?? s.status},${s.count},${s.percentage}`,
      );
    });
  }

  if (sections.includes("top_products")) {
    lines.push("");
    lines.push("=== TOP SẢN PHẨM BÁN CHẠY ===");
    lines.push("Hạng,Tên sản phẩm,Số lượng bán,Doanh thu");
    topProducts.forEach((p, idx) => {
      lines.push(
        `${idx + 1},"${p.product_name.replace(/"/g, '""')}",${p.total_sold},${p.total_revenue}`,
      );
    });
  }

  if (sections.includes("category")) {
    lines.push("");
    lines.push("=== DOANH THU THEO DANH MỤC ===");
    lines.push(
      "Danh mục,Số lượng bán,Doanh thu,Giá vốn,Lợi nhuận,Tỷ suất LN (%)",
    );
    categoryRevenue.forEach((c) => {
      lines.push(
        `"${c.category_name.replace(/"/g, '""')}",${c.qty_sold},${c.revenue},${c.cost},${c.profit},${c.margin_pct}`,
      );
    });
  }

  if (sections.includes("product")) {
    lines.push("");
    lines.push("=== THỐNG KÊ THEO SẢN PHẨM ===");
    lines.push(
      "Sản phẩm,Danh mục,Số lượng bán,Doanh thu,Giá vốn,Lợi nhuận,Tỷ suất LN (%)",
    );
    productStats.forEach((p) => {
      lines.push(
        `"${p.product_name.replace(/"/g, '""')}","${p.category_name.replace(/"/g, '""')}",${p.qty_sold},${p.revenue},${p.cost},${p.profit},${p.margin_pct}`,
      );
    });
  }

  if (sections.includes("customer")) {
    lines.push("");
    lines.push("=== THỐNG KÊ THEO KHÁCH HÀNG ===");
    lines.push("Khách hàng,Email,Số đơn,Doanh thu,Giá trị đơn TB");
    customerStats.forEach((c) => {
      lines.push(
        `"${c.customer_name.replace(/"/g, '""')}",${c.customer_email ?? ""},${c.order_count},${c.total_revenue},${c.avg_order_value}`,
      );
    });
  }

  const suffix = sections.join("-");
  downloadBlob(
    new Blob([BOM + lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
    `bao-cao-${suffix}_${dateFrom}_${dateTo}.csv`,
  );
}

export async function exportStatisticsPdf(
  sections: StatisticsReportSection[],
  data: StatisticsReportData,
): Promise<void> {
  const {
    dateFrom,
    dateTo,
    kpi,
    revenueChart,
    orderStatus,
    topProducts,
    categoryRevenue,
    productStats,
    customerStats,
  } = data;

  const wideSections: StatisticsReportSection[] = [
    "category",
    "product",
    "customer",
  ];
  const useLandscape = sections.some((s) => wideSections.includes(s));

  const doc = new jsPDF({
    orientation: useLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  await loadRobotoFonts(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = addReportHeader(
    doc,
    "BÁO CÁO KINH DOANH — ĐÁ MUỐI",
    dateFrom,
    dateTo,
  );

  const tableStyles = {
    ...PDF_TABLE_BASE,
    margin: { left: margin, right: margin },
  };

  const ensureSpace = (needed: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + needed > pageH - 14) {
      doc.addPage();
      y = margin;
    }
  };

  if (sections.includes("overview")) {
    ensureSpace(40);
    y = addSectionTitle(doc, "1. Tổng quan KPI", y);
    const kpiBody = kpi
      ? [
          ["Doanh thu", fmtMoney(kpi.total_revenue)],
          ["Lợi nhuận gộp", fmtMoney(kpi.gross_profit)],
          ["Giá vốn hàng bán", fmtMoney(kpi.total_cost)],
          ["Giá trị đơn trung bình", fmtMoney(kpi.avg_order_value)],
          ["Đơn hoàn thành", String(kpi.completed_orders)],
          ["Khách hàng mới", String(kpi.new_customers)],
          [
            "Tăng trưởng doanh thu",
            `${kpi.growth_pct >= 0 ? "+" : ""}${kpi.growth_pct}%`,
          ],
        ]
      : [["—", "Không có dữ liệu"]];

    autoTable(doc, {
      startY: y,
      head: [["Chỉ số", "Giá trị"]],
      body: kpiBody,
      ...tableStyles,
      tableWidth: Math.min(120, pageW - margin * 2),
    });
    y = getTableEndY(doc) + 12;
  }

  if (sections.includes("revenue")) {
    ensureSpace(30);
    y = addSectionTitle(doc, "2. Doanh thu theo thời gian", y);
    autoTable(doc, {
      startY: y,
      head: [["Kỳ", "Doanh thu", "Số đơn"]],
      body:
        revenueChart.length > 0
          ? revenueChart.map((p) => [
              p.label,
              fmtMoney(p.revenue),
              String(p.order_count),
            ])
          : [["—", "—", "Không có dữ liệu"]],
      ...tableStyles,
    });
    y = getTableEndY(doc) + 12;
  }

  if (sections.includes("order_status")) {
    ensureSpace(30);
    y = addSectionTitle(doc, "3. Trạng thái đơn hàng", y);
    autoTable(doc, {
      startY: y,
      head: [["Trạng thái", "Số lượng", "Tỷ lệ"]],
      body:
        orderStatus.length > 0
          ? orderStatus.map((s) => [
              STATUS_LABELS[s.status] ?? s.status,
              String(s.count),
              `${s.percentage}%`,
            ])
          : [["—", "—", "Không có dữ liệu"]],
      ...tableStyles,
    });
    y = getTableEndY(doc) + 12;
  }

  if (sections.includes("top_products")) {
    ensureSpace(30);
    y = addSectionTitle(doc, "4. Top sản phẩm bán chạy", y);
    autoTable(doc, {
      startY: y,
      head: [["Hạng", "Sản phẩm", "SL bán", "Doanh thu"]],
      body:
        topProducts.length > 0
          ? topProducts.map((p, idx) => [
              String(idx + 1),
              p.product_name,
              String(p.total_sold),
              fmtMoney(p.total_revenue),
            ])
          : [["—", "Không có dữ liệu", "—", "—"]],
      ...tableStyles,
      columnStyles: { 1: { cellWidth: 80 } },
    });
    y = getTableEndY(doc) + 12;
  }

  if (sections.includes("category")) {
    doc.addPage("a4", "landscape");
    y = margin;
    y = addSectionTitle(doc, "5. Thống kê theo danh mục", y);
    autoTable(doc, {
      startY: y,
      head: [
        ["Danh mục", "SL bán", "Doanh thu", "Giá vốn", "Lợi nhuận", "Tỷ suất LN"],
      ],
      body:
        categoryRevenue.length > 0
          ? categoryRevenue.map((c) => [
              c.category_name,
              String(c.qty_sold),
              fmtMoney(c.revenue),
              fmtMoney(c.cost),
              fmtMoney(c.profit),
              `${c.margin_pct}%`,
            ])
          : [["Không có dữ liệu", "—", "—", "—", "—", "—"]],
      ...tableStyles,
    });
    y = getTableEndY(doc) + 12;
  }

  if (sections.includes("product")) {
    doc.addPage("a4", "landscape");
    y = margin;
    y = addSectionTitle(doc, "6. Thống kê theo sản phẩm", y);
    autoTable(doc, {
      startY: y,
      head: [
        [
          "Sản phẩm",
          "Danh mục",
          "SL bán",
          "Doanh thu",
          "Giá vốn",
          "Lợi nhuận",
          "Tỷ suất LN",
        ],
      ],
      body:
        productStats.length > 0
          ? productStats.map((p) => [
              p.product_name,
              p.category_name,
              String(p.qty_sold),
              fmtMoney(p.revenue),
              fmtMoney(p.cost),
              fmtMoney(p.profit),
              `${p.margin_pct}%`,
            ])
          : [["Không có dữ liệu", "—", "—", "—", "—", "—", "—"]],
      ...tableStyles,
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 35 },
      },
    });
    y = getTableEndY(doc) + 12;
  }

  if (sections.includes("customer")) {
    doc.addPage("a4", "landscape");
    y = margin;
    y = addSectionTitle(doc, "7. Thống kê theo khách hàng", y);
    autoTable(doc, {
      startY: y,
      head: [["Khách hàng", "Email", "Số đơn", "Doanh thu", "Giá trị đơn TB"]],
      body:
        customerStats.length > 0
          ? customerStats.map((c) => [
              c.customer_name,
              c.customer_email ?? "—",
              String(c.order_count),
              fmtMoney(c.total_revenue),
              fmtMoney(c.avg_order_value),
            ])
          : [["Không có dữ liệu", "—", "—", "—", "—"]],
      ...tableStyles,
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 55 } },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Trang ${i} / ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  const suffix = sections.slice(0, 2).join("-") || "bao-cao";
  doc.save(`bao-cao-${suffix}_${dateFrom}_${dateTo}.pdf`);
}
