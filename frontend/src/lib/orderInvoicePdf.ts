import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, PaymentMethod } from "@/types";
import { loadRobotoFonts, PDF_TABLE_BASE } from "@/lib/pdfFonts";

const STORE_NAME = "Himalayan Glow";
const STORE_ADDRESS = "Website Bán Đá Muối Himalaya";
const STORE_PHONE = "1900 1234";
const STORE_EMAIL = "support@himalayanglow.vn";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "VNPay",
  vnpay: "VNPay",
  momo: "Ví MoMo",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang chuẩn bị",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
};

function fmtMoney(val: number): string {
  return Number(val).toLocaleString("vi-VN") + " đ";
}

function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function invoiceCode(orderId: number): string {
  return `HD-${String(orderId).padStart(6, "0")}`;
}

export async function exportOrderInvoicePdf(order: Order): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await loadRobotoFonts(doc);

  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  // ── Store header ──
  doc.setFont("Roboto", "bold");
  doc.setFontSize(18);
  doc.setTextColor(242, 140, 38);
  doc.text(STORE_NAME, margin, y);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  y += 7;
  doc.text(STORE_ADDRESS, margin, y);
  y += 5;
  doc.text(`ĐT: ${STORE_PHONE}  |  Email: ${STORE_EMAIL}`, margin, y);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text("HÓA ĐƠN BÁN HÀNG", pageW - margin, margin + 2, { align: "right" });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Số HĐ: ${invoiceCode(order.id)}`, pageW - margin, margin + 10, {
    align: "right",
  });
  doc.text(
    `Mã đơn: #${order.id}`,
    pageW - margin,
    margin + 16,
    { align: "right" },
  );
  doc.text(
    `Ngày lập: ${formatInvoiceDate(order.created_at)}`,
    pageW - margin,
    margin + 22,
    { align: "right" },
  );

  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Buyer info ──
  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("Thông tin khách hàng", margin, y);
  y += 6;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const buyerLines = [
    `Họ tên: ${order.receiver_name}`,
    `Điện thoại: ${order.receiver_phone}`,
    `Địa chỉ: ${order.receiver_address}`,
  ];
  if (order.note) {
    buyerLines.push(`Ghi chú: ${order.note}`);
  }
  buyerLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5;
  });

  y += 4;
  doc.setFont("Roboto", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Thanh toán:", margin, y);
  doc.setFont("Roboto", "normal");
  doc.text(
    PAYMENT_LABELS[order.payment_method] ?? order.payment_method,
    margin + 28,
    y,
  );
  doc.text("Trạng thái:", pageW / 2, y);
  doc.text(
    STATUS_LABELS[order.status] ?? order.status,
    pageW / 2 + 22,
    y,
  );
  y += 10;

  // ── Items table ──
  const itemsBody = order.items.map((item, idx) => [
    String(idx + 1),
    item.product_name ?? `Sản phẩm #${item.product_id}`,
    String(item.quantity),
    fmtMoney(Number(item.unit_price)),
    fmtMoney(Number(item.subtotal)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["STT", "Sản phẩm", "SL", "Đơn giá", "Thành tiền"]],
    body:
      itemsBody.length > 0
        ? itemsBody
        : [["—", "Không có sản phẩm", "—", "—", "—"]],
    ...PDF_TABLE_BASE,
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 75 },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  const tableEnd =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 20;
  y = tableEnd + 8;

  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0,
  );
  const total = Number(order.total_amount);
  const shippingFee = Math.max(0, total - itemsSubtotal);

  const summaryX = pageW - margin - 70;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  doc.text("Tạm tính:", summaryX, y);
  doc.text(fmtMoney(itemsSubtotal), pageW - margin, y, { align: "right" });
  y += 6;

  if (shippingFee > 0) {
    doc.text("Phí vận chuyển:", summaryX, y);
    doc.text(fmtMoney(shippingFee), pageW - margin, y, { align: "right" });
    y += 6;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(summaryX, y, pageW - margin, y);
  y += 6;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(12);
  doc.setTextColor(242, 140, 38);
  doc.text("Tổng thanh toán:", summaryX, y);
  doc.text(fmtMoney(total), pageW - margin, y, { align: "right" });
  y += 12;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const note =
    "Hóa đơn điện tử được tạo tự động từ hệ thống. Đây là chứng từ xác nhận đặt hàng, không thay thế hóa đơn GTGT nếu có phát sinh.";
  const splitNote = doc.splitTextToSize(note, pageW - margin * 2);
  doc.text(splitNote, margin, y);

  doc.save(`hoa-don-${invoiceCode(order.id)}.pdf`);
}
