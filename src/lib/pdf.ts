import type { jsPDF } from "jspdf";
import { renderBarcodeDataUrl, type LabelTemplate } from "./barcode";
import type { CellAppearance, SheetItem } from "../components/LabelSheet";

const PAGE_W = 210; // mm (A4)
const PAGE_H = 297; // mm
const PAD = 5; // margen de página (mm)
const GAP = 2; // separación entre etiquetas (mm)
const CELL_PAD = 2; // relleno interior de cada etiqueta (mm)
const CORNER = 1.5; // radio de esquinas (mm)

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen del código"));
    img.src = src;
  });
}

function fitText(doc: jsPDF, text: string, maxWidthMm: number): string {
  if (doc.getTextWidth(text) <= maxWidthMm) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + "…") > maxWidthMm) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

interface RenderedLabel {
  item: SheetItem;
  dataUrl: string | null;
  img: HTMLImageElement | null;
}

/** Pre-renderiza los códigos (sin texto incrustado) y carga sus imágenes en paralelo. */
async function renderAll(
  items: SheetItem[],
  appearance: CellAppearance
): Promise<RenderedLabel[]> {
  return Promise.all(
    items.map(async (item) => {
      const { dataUrl } = renderBarcodeDataUrl({
        symbology: item.symbology,
        value: item.value,
        width: appearance.moduleWidth,
        height: appearance.height,
        fontSize: appearance.fontSize,
        margin: appearance.margin,
        showText: false, // el texto se dibuja aparte, sin duplicados
        lineColor: appearance.lineColor,
      });
      return {
        item,
        dataUrl,
        img: dataUrl ? await loadImage(dataUrl) : null,
      };
    })
  );
}

async function drawLabel(
  doc: jsPDF,
  rendered: RenderedLabel,
  x: number,
  y: number,
  w: number,
  h: number,
  appearance: CellAppearance
): Promise<void> {
  const { item, dataUrl, img } = rendered;

  // Borde de la etiqueta
  doc.setDrawColor(199, 203, 224);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, CORNER, CORNER, "S");

  const innerW = w - CELL_PAD * 2;
  const innerH = h - CELL_PAD * 2;

  // Fuente proporcional al tamaño de la etiqueta
  const fontScale = h <= 40 ? 2.6 : 3.4; // mm
  const topText = item.label || "";
  const topTextH = topText ? fontScale + 1.5 : 0;
  const bottomTextH = appearance.showText ? fontScale * 0.9 + 1.5 : 0;
  const availH = innerH - topTextH - bottomTextH;

  if (dataUrl && img) {
    const ratio = img.naturalHeight / img.naturalWidth;
    let imgW = innerW;
    let imgH = imgW * ratio;
    if (imgH > availH) {
      imgH = availH;
      imgW = imgH / ratio;
    }
    const imgX = x + w / 2 - imgW / 2;
    const imgY = y + CELL_PAD + topTextH + (availH - imgH) / 2;

    doc.setFillColor(255, 255, 255);
    doc.rect(imgX, imgY, imgW, imgH, "F");
    doc.addImage(dataUrl, "PNG", imgX, imgY, imgW, imgH, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontScale);
    doc.setTextColor(229, 72, 77);
    doc.text("Código no válido", x + w / 2, y + CELL_PAD + topTextH + availH / 2, {
      align: "center",
      maxWidth: innerW,
    });
  }

  // Texto personalizado (arriba)
  if (topText) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontScale);
    doc.setTextColor(24, 27, 46);
    doc.text(fitText(doc, topText, innerW), x + w / 2, y + CELL_PAD + fontScale, {
      align: "center",
      maxWidth: innerW,
    });
  }

  // Valor (abajo)
  if (appearance.showText) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontScale * 0.9);
    doc.setTextColor(24, 27, 46);
    doc.text(
      fitText(doc, item.value, innerW),
      x + w / 2,
      y + h - CELL_PAD - 0.6,
      { align: "center", maxWidth: innerW }
    );
  }
}

function drawEmptyCell(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(221, 223, 234);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.2, 1.2], 0);
  doc.roundedRect(x, y, w, h, CORNER, CORNER, "S");
  doc.setLineDashPattern([], 0);
}

/**
 * Genera un PDF A4 replicando la cuadrícula de la hoja de impresión
 * (mismas medidas en mm y misma plantilla) y lo descarga.
 */
export async function exportSheetToPdf(
  items: SheetItem[],
  template: LabelTemplate,
  appearance: CellAppearance,
  filename = "hoja-de-etiquetas.pdf"
): Promise<void> {
  // Carga diferida: jsPDF solo se descarga cuando el usuario pulsa el botón.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  const rendered = await renderAll(items, appearance);

  const perPage = template.cols * template.rows;
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const centered = template.cols === 1 && template.rows === 1;

  for (let page = 0; page < pages; page += 1) {
    if (page > 0) doc.addPage();

    const start = page * perPage;
    const pageItems = rendered.slice(start, start + perPage);

    for (let i = 0; i < pageItems.length; i += 1) {
      const col = i % template.cols;
      const row = Math.floor(i / template.cols);
      const x = centered
        ? (PAGE_W - template.width) / 2
        : PAD + col * (template.width + GAP);
      const y = centered
        ? (PAGE_H - template.height) / 2
        : PAD + row * (template.height + GAP);
      await drawLabel(doc, pageItems[i], x, y, template.width, template.height, appearance);
    }

    // Celdas vacías punteadas para conservar la alineación
    for (let i = pageItems.length; i < perPage; i += 1) {
      const col = i % template.cols;
      const row = Math.floor(i / template.cols);
      const x = centered
        ? (PAGE_W - template.width) / 2
        : PAD + col * (template.width + GAP);
      const y = centered
        ? (PAGE_H - template.height) / 2
        : PAD + row * (template.height + GAP);
      drawEmptyCell(doc, x, y, template.width, template.height);
    }
  }

  // Descarga manual: más robusta que doc.save() en todos los navegadores.
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
