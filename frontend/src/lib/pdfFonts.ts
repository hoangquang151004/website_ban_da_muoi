import type { jsPDF } from "jspdf";

const ROBOTO_REGULAR =
  "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf";
const ROBOTO_BOLD =
  "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf";

let fontCache: { regular: string; bold: string } | null = null;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function loadRobotoFonts(doc: jsPDF): Promise<void> {
  if (!fontCache) {
    const [regRes, boldRes] = await Promise.all([
      fetch(ROBOTO_REGULAR),
      fetch(ROBOTO_BOLD),
    ]);
    if (!regRes.ok || !boldRes.ok) {
      throw new Error("Không tải được font cho PDF.");
    }
    const [regBuf, boldBuf] = await Promise.all([
      regRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);
    fontCache = {
      regular: bufferToBase64(regBuf),
      bold: bufferToBase64(boldBuf),
    };
  }
  doc.addFileToVFS("Roboto-Regular.ttf", fontCache.regular);
  doc.addFileToVFS("Roboto-Bold.ttf", fontCache.bold);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
}

export const PDF_TABLE_BASE = {
  styles: {
    font: "Roboto",
    fontSize: 9,
    cellPadding: 2.5,
  },
  headStyles: {
    font: "Roboto",
    fontStyle: "bold" as const,
    fillColor: [242, 140, 38] as [number, number, number],
    textColor: 255,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252] as [number, number, number],
  },
};
