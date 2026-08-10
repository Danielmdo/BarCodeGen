import { useCallback, useEffect, useMemo, useState } from "react";
import { BatchPanel } from "./components/BatchPanel";
import { ControlsPanel } from "./components/ControlsPanel";
import { EditItemModal, type ItemPatch } from "./components/EditItemModal";
import { LabelSheet, type SheetItem } from "./components/LabelSheet";
import { PreviewCard } from "./components/PreviewCard";
import { BarcodeIcon, FileTextIcon, PrinterIcon, TrashIcon } from "./components/icons";
import {
  LABEL_TEMPLATES,
  proposeCode,
  renderBarcodeDataUrl,
  validateInput,
  type BarcodeSettings,
  type LabelTemplate,
} from "./lib/barcode";
import { exportSheetToPdf } from "./lib/pdf";

export const DEFAULT_SETTINGS: BarcodeSettings = {
  value: "123456789012",
  symbology: "CODE128",
  labelText: "",
  showText: true,
  moduleWidth: 2,
  height: 48,
  fontSize: 16,
  margin: 5,
  lineColor: "#111827",
};

const SINGLE_TEMPLATE: LabelTemplate = LABEL_TEMPLATES.find(
  (t) => t.id === "large"
)!;

let uidCounter = 0;
function uid(): string {
  uidCounter += 1;
  return `item-${Date.now().toString(36)}-${uidCounter}`;
}

export default function App() {
  const [settings, setSettings] = useState<BarcodeSettings>(DEFAULT_SETTINGS);
  const [sheetItems, setSheetItems] = useState<SheetItem[]>([]);
  const [templateId, setTemplateId] = useState("2x7");
  const [tab, setTab] = useState<"preview" | "sheet">("preview");
  const [batchText, setBatchText] = useState("");
  const [batchQty, setBatchQty] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [editingItem, setEditingItem] = useState<SheetItem | null>(null);
  const [printOverride, setPrintOverride] = useState<{
    items: SheetItem[];
    template: LabelTemplate;
  } | null>(null);

  const template =
    LABEL_TEMPLATES.find((t) => t.id === templateId) ?? LABEL_TEMPLATES[1];

  const validationError = useMemo(
    () => validateInput(settings.symbology, settings.value),
    [settings.symbology, settings.value]
  );

  const preview = useMemo(() => {
    if (validationError) return { dataUrl: null, error: validationError };
    return renderBarcodeDataUrl({
      symbology: settings.symbology,
      value: settings.value.trim(),
      text: settings.labelText || undefined,
      width: settings.moduleWidth,
      height: settings.height,
      fontSize: settings.fontSize,
      margin: settings.margin,
      showText: settings.showText,
      lineColor: settings.lineColor,
    });
  }, [settings, validationError]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const updateSettings = (patch: Partial<BarcodeSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  function handlePropose() {
    setSettings((prev) => ({ ...prev, value: proposeCode(prev.symbology) }));
  }

  function handleProposeBatch() {
    const codes = Array.from({ length: 5 }, () => proposeCode(settings.symbology));
    setBatchText((prev) =>
      prev.trim() ? `${prev.trimEnd()}\n${codes.join("\n")}` : codes.join("\n")
    );
    setToast("5 códigos propuestos en la lista");
  }

  // Subconjunto estable de ajustes que usan las celdas de la hoja, para
  // que teclear el valor no obligue a re-renderizar cientos de etiquetas.
  const cellAppearance = useMemo(
    () => ({
      moduleWidth: settings.moduleWidth,
      height: settings.height,
      fontSize: settings.fontSize,
      margin: settings.margin,
      showText: settings.showText,
      lineColor: settings.lineColor,
    }),
    [
      settings.moduleWidth,
      settings.height,
      settings.fontSize,
      settings.margin,
      settings.showText,
      settings.lineColor,
    ]
  );

  function makeItem(value: string): SheetItem {
    return {
      id: uid(),
      value,
      label: settings.labelText,
      symbology: settings.symbology,
    };
  }

  function addToSheet() {
    if (validationError) return;
    setSheetItems((prev) => [...prev, makeItem(settings.value.trim())]);
    setToast("Etiqueta añadida a la hoja");
  }

  function handleGenerateBatch() {
    const lines = batchText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (!lines.length) {
      setToast("Pega al menos un código en la lista");
      return;
    }

    const added: SheetItem[] = [];
    let skipped = 0;
    for (const line of lines) {
      if (validateInput(settings.symbology, line)) {
        skipped += 1;
        continue;
      }
      for (let i = 0; i < batchQty; i += 1) added.push(makeItem(line));
    }

    if (added.length) {
      setSheetItems((prev) => [...prev, ...added]);
      setToast(
        skipped
          ? `Se añadieron ${added.length} etiquetas · ${skipped} líneas omitidas`
          : `Hoja generada con ${added.length} etiquetas`
      );
      setTab("sheet");
    } else {
      setToast("Ninguna línea es válida para la simbología seleccionada");
    }
  }

  const removeItem = useCallback((id: string) => {
    setSheetItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const duplicateItem = useCallback((item: SheetItem) => {
    setSheetItems((prev) => [...prev, { ...item, id: uid() }]);
  }, []);

  const openEdit = useCallback((item: SheetItem) => {
    setEditingItem(item);
  }, []);

  const updateItem = useCallback((id: string, patch: ItemPatch) => {
    setSheetItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
    setEditingItem(null);
    setToast("Etiqueta actualizada");
  }, []);

  function clearSheet() {
    setSheetItems([]);
    setToast("Hoja vaciada");
  }

  function printSheet() {
    if (!sheetItems.length) return;
    setPrintOverride(null);
    window.setTimeout(() => window.print(), 80);
  }

  async function handleExportPdf() {
    if (!sheetItems.length || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportSheetToPdf(sheetItems, template, cellAppearance);
      setToast("PDF descargado");
    } catch {
      setToast("No se pudo generar el PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  function printSingle() {
    if (validationError) return;
    setPrintOverride({ items: [makeItem(settings.value.trim())], template: SINGLE_TEMPLATE });
    window.setTimeout(() => window.print(), 80);
  }

  const printTemplate = printOverride?.template ?? template;
  const printItems = printOverride?.items ?? sheetItems;

  return (
    <div className="app-shell">
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="brand-logo">
              <BarcodeIcon size={22} />
            </div>
            <div className="brand-text">
              <h1>Barcode Studio</h1>
              <p>Genera códigos de barras e imprime etiquetas</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="pill">
              {sheetItems.length} {sheetItems.length === 1 ? "etiqueta" : "etiquetas"} en la hoja
            </span>
            <button
              className="btn btn-ghost"
              onClick={clearSheet}
              disabled={!sheetItems.length}
            >
              <TrashIcon size={16} /> Limpiar
            </button>
            <button
              className="btn btn-primary"
              onClick={printSheet}
              disabled={!sheetItems.length}
            >
              <PrinterIcon size={16} /> Imprimir hoja
            </button>
          </div>
        </header>

        <main className="layout">
          <aside className="side">
            <ControlsPanel
              settings={settings}
              onChange={updateSettings}
              error={validationError}
              onAdd={addToSheet}
              onPrintSingle={printSingle}
              onPropose={handlePropose}
            />
            <BatchPanel
              batchText={batchText}
              onBatchTextChange={setBatchText}
              batchQty={batchQty}
              onBatchQtyChange={setBatchQty}
              symbology={settings.symbology}
              onGenerate={handleGenerateBatch}
              onProposeBatch={handleProposeBatch}
            />
          </aside>

          <section className="workspace">
            <div className="tabs" role="tablist" aria-label="Vistas">
              <button
                className={`tab${tab === "preview" ? " active" : ""}`}
                onClick={() => setTab("preview")}
              >
                Vista previa
              </button>
              <button
                className={`tab${tab === "sheet" ? " active" : ""}`}
                onClick={() => setTab("sheet")}
              >
                Hoja de impresión
                {sheetItems.length > 0 && <span className="tab-count">{sheetItems.length}</span>}
              </button>
            </div>

            {tab === "preview" ? (
              <PreviewCard
                preview={preview}
                settings={settings}
                onAdd={addToSheet}
                onPrint={printSingle}
              />
            ) : (
              <div className="sheet-view">
                <div className="sheet-toolbar">
                  <div className="template-picker" role="group" aria-label="Plantilla de etiquetas">
                    {LABEL_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        className={`chip${t.id === template.id ? " active" : ""}`}
                        onClick={() => setTemplateId(t.id)}
                        title={t.description}
                      >
                        <span className="chip-name">{t.name}</span>
                        <span className="chip-desc">{t.description}</span>
                      </button>
                    ))}
                  </div>
                  <div className="sheet-actions">
                    <button
                      className="btn btn-outline"
                      onClick={handleExportPdf}
                      disabled={!sheetItems.length || exportingPdf}
                      title="Descargar la hoja como PDF"
                    >
                      <FileTextIcon size={16} />
                      {exportingPdf ? "Generando…" : "Guardar PDF"}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={printSheet}
                      disabled={!sheetItems.length}
                    >
                      <PrinterIcon size={16} /> Imprimir
                    </button>
                  </div>
                </div>

                {sheetItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon-wrap">
                      <BarcodeIcon size={26} />
                    </div>
                    <h3>Tu hoja está vacía</h3>
                    <p>
                      Añade etiquetas desde el panel izquierdo o usa la{" "}
                      <strong>generación masiva</strong> para llenarla con toda tu lista de
                      códigos.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="sheet-scroll">
                      <LabelSheet
                        variant="screen"
                        items={sheetItems}
                        template={template}
                        appearance={cellAppearance}
                        onRemove={removeItem}
                        onDuplicate={duplicateItem}
                        onEdit={openEdit}
                      />
                    </div>
                    <p className="hint print-tip">
                      💡 En el diálogo de impresión elige <strong>vertical</strong>, tamaño{" "}
                      <strong>A4</strong>, y desactiva encabezados, pies y márgenes para
                      aprovechar la hoja al máximo.
                    </p>
                  </>
                )}
              </div>
            )}
          </section>
        </main>

        <footer className="footer">by Daniel Mdo</footer>
      </div>

      {/* Vista exclusiva para impresión */}
      <div className="print-sheet" aria-hidden="true">
        <LabelSheet
          variant="print"
          items={printItems}
          template={printTemplate}
          appearance={cellAppearance}
        />
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status">
        {toast}
      </div>

      {editingItem && (
        <EditItemModal
          initialValue={editingItem.value}
          initialLabel={editingItem.label}
          initialSymbology={editingItem.symbology}
          onSave={(patch) => updateItem(editingItem.id, patch)}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
