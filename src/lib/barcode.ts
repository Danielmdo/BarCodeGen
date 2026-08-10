import JsBarcode from "jsbarcode";

/* ------------------------------------------------------------------ */
/*  Simbologías                                                        */
/* ------------------------------------------------------------------ */

export type SymbologyId =
  | "CODE128"
  | "EAN13"
  | "EAN8"
  | "UPCA"
  | "UPCE"
  | "ITF14"
  | "CODE39"
  | "CODE93"
  | "Codabar";

export interface Symbology {
  id: SymbologyId;
  name: string;
  hint: string;
}

export const SYMBOLOGIES: Symbology[] = [
  { id: "CODE128", name: "Code 128", hint: "Alfanumérico · uso general" },
  { id: "EAN13", name: "EAN-13", hint: "Retail · 12 o 13 dígitos" },
  { id: "EAN8", name: "EAN-8", hint: "Retail compacto · 7 u 8 dígitos" },
  { id: "UPCA", name: "UPC-A", hint: "Retail EE. UU. · 11 o 12 dígitos" },
  { id: "UPCE", name: "UPC-E", hint: "UPC comprimido · 6 dígitos u 8 con control" },
  { id: "ITF14", name: "ITF-14", hint: "Cajas y pallets · 13 o 14 dígitos" },
  { id: "CODE39", name: "Code 39", hint: "Industrial · A–Z y 0–9" },
  { id: "CODE93", name: "Code 93", hint: "Alfanumérico de alta densidad" },
  { id: "Codabar", name: "Codabar", hint: "Bancos, laboratorios y librerías" },
];

/* ------------------------------------------------------------------ */
/*  Validación                                                         */
/* ------------------------------------------------------------------ */

export function validateInput(symbology: SymbologyId, value: string): string | null {
  const v = value.trim();
  if (!v) return "Escribe un valor para generar la etiqueta.";

  switch (symbology) {
    case "EAN13":
      if (!/^\d{12,13}$/.test(v)) return "EAN-13 requiere 12 o 13 dígitos.";
      break;
    case "EAN8":
      if (!/^\d{7,8}$/.test(v)) return "EAN-8 requiere 7 u 8 dígitos.";
      break;
    case "UPCA":
      if (!/^\d{11,12}$/.test(v)) return "UPC-A requiere 11 o 12 dígitos.";
      break;
    case "UPCE":
      if (!/^\d{6}$/.test(v) && !/^[01]\d{7}$/.test(v))
        return "UPC-E requiere 6 dígitos o 8 (empezando por 0/1, con dígito de control).";
      break;
    case "ITF14":
      if (!/^\d{13,14}$/.test(v)) return "ITF-14 requiere 13 o 14 dígitos.";
      break;
    case "CODE39":
      if (!/^[A-Z0-9\-. $/+%]+$/.test(v))
        return "Code 39 admite A–Z, 0–9 y los símbolos - . espacio $ / + %.";
      break;
    case "CODE128":
    case "CODE93":
      break; // alfanumérico general
    case "Codabar":
      if (!/^[0-9\-$:./+]+$/.test(v))
        return "Codabar admite dígitos y los símbolos - $ : . / +.";
      break;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Propuesta automática de códigos                                    */
/* ------------------------------------------------------------------ */

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Genera un valor aleatorio garantizado válido para la simbología:
 * EAN-13/UPC-A/EAN-8/ITF-14 (12/11/7/13 dígitos) dejan que JsBarcode
 * calcule el dígito de control; UPC-E de 6 dígitos es siempre válido.
 */
export function proposeCode(symbology: SymbologyId): string {
  const randInt = (n: number) => Math.floor(Math.random() * n);
  const randDigits = (n: number) =>
    Array.from({ length: n }, () => randInt(10)).join("");
  const randAlnum = (n: number) =>
    Array.from({ length: n }, () => ALPHANUM[randInt(ALPHANUM.length)]).join("");

  switch (symbology) {
    case "EAN13":
      return randDigits(12);
    case "EAN8":
      return randDigits(7);
    case "UPCA":
      return randDigits(11);
    case "UPCE":
      return randDigits(6);
    case "ITF14":
      return randDigits(13);
    case "CODE39":
      return randAlnum(8);
    case "CODE128":
      return randAlnum(10);
    case "CODE93":
      return randAlnum(10);
    case "Codabar":
      return "A" + randDigits(6) + "B";
  }
}

/* ------------------------------------------------------------------ */
/*  Ajustes compartidos de la etiqueta                                 */
/* ------------------------------------------------------------------ */

export interface BarcodeSettings {
  value: string;
  symbology: SymbologyId;
  labelText: string;
  showText: boolean;
  moduleWidth: number;
  height: number;
  fontSize: number;
  margin: number;
  lineColor: string;
}

/* ------------------------------------------------------------------ */
/*  Render a alta resolución (canvas → PNG)                            */
/* ------------------------------------------------------------------ */

export interface BarcodeOptions {
  symbology: SymbologyId;
  value: string;
  width?: number; // ancho de módulo (px)
  height?: number; // altura (px)
  fontSize?: number;
  margin?: number;
  showText?: boolean;
  lineColor?: string;
  text?: string; // texto personalizado bajo el código
}

export interface BarcodeResult {
  dataUrl: string | null;
  error: string | null;
}

/** Factor de escala para que la imagen impresa salga nítida (≈300 dpi). */
const SCALE = 3;

/** Nombres de formato que espera JsBarcode (UPC-A se registra como "UPC"). */
const FORMAT_NAMES: Record<SymbologyId, string> = {
  CODE128: "CODE128",
  EAN13: "EAN13",
  EAN8: "EAN8",
  UPCA: "UPC",
  UPCE: "UPCE",
  ITF14: "ITF14",
  CODE39: "CODE39",
  CODE93: "CODE93",
  Codabar: "codabar",
};

function translateError(message: string): string {
  if (/invalid characters/i.test(message))
    return "El valor contiene caracteres no válidos para esta simbología.";
  if (/invalid/i.test(message))
    return "El valor no es válido para esta simbología (revisa el dígito de control).";
  return message;
}

export function renderBarcodeDataUrl(options: BarcodeOptions): BarcodeResult {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, options.value, {
      format: FORMAT_NAMES[options.symbology],
      width: (options.width ?? 2) * SCALE,
      height: (options.height ?? 48) * SCALE,
      fontSize: (options.fontSize ?? 16) * SCALE,
      margin: (options.margin ?? 5) * SCALE,
      displayValue: options.showText ?? true,
      text: options.text || undefined,
      lineColor: options.lineColor ?? "#111827",
      background: "#ffffff",
      textMargin: 6 * SCALE,
    });
    return { dataUrl: canvas.toDataURL("image/png"), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { dataUrl: null, error: translateError(message) };
  }
}

/* ------------------------------------------------------------------ */
/*  Plantillas de etiquetas (A4, en milímetros)                        */
/* ------------------------------------------------------------------ */

export interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  cols: number;
  rows: number;
  width: number; // mm
  height: number; // mm
}

export const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    id: "large",
    name: "Grande",
    description: "1 etiqueta por página",
    cols: 1,
    rows: 1,
    width: 100,
    height: 60,
  },
  {
    id: "2x7",
    name: "A4 · 2 × 7",
    description: "2 columnas × 7 filas",
    cols: 2,
    rows: 7,
    width: 99,
    height: 39,
  },
  {
    id: "3x8",
    name: "A4 · 3 × 8",
    description: "3 columnas × 8 filas",
    cols: 3,
    rows: 8,
    width: 65,
    height: 34,
  },
  {
    id: "4x6",
    name: "A4 · 4 × 6",
    description: "4 columnas × 6 filas",
    cols: 4,
    rows: 6,
    width: 48,
    height: 46,
  },
];
