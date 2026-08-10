import { AlertIcon, DownloadIcon, PlusIcon, PrinterIcon } from "./icons";
import {
  SYMBOLOGIES,
  type BarcodeResult,
  type BarcodeSettings,
} from "../lib/barcode";

interface PreviewCardProps {
  preview: BarcodeResult;
  settings: BarcodeSettings;
  onAdd: () => void;
  onPrint: () => void;
}

export function PreviewCard({ preview, settings, onAdd, onPrint }: PreviewCardProps) {
  const symbology = SYMBOLOGIES.find((s) => s.id === settings.symbology);

  function downloadPng() {
    if (!preview.dataUrl) return;
    const safe = settings.value.trim().replace(/[^\w-]+/g, "-") || "etiqueta";
    const a = document.createElement("a");
    a.href = preview.dataUrl;
    a.download = `barcode-${safe}.png`;
    a.click();
  }

  return (
    <div className="card preview-card">
      <div className="preview-head">
        <div>
          <h2 className="card-title">Vista previa</h2>
          <p className="card-desc">
            {symbology?.name} · {symbology?.hint}
          </p>
        </div>
        {settings.value.trim() && (
          <span className="badge" title={settings.value.trim()}>
            {settings.value.trim()}
          </span>
        )}
      </div>

      <div className="preview-stage">
        {preview.dataUrl ? (
          <img
            className="preview-img"
            src={preview.dataUrl}
            alt={`Código de barras ${settings.value.trim()}`}
          />
        ) : (
          <div className="preview-error">
            <AlertIcon size={26} />
            <span>{preview.error}</span>
          </div>
        )}
      </div>

      <div className="btn-row preview-actions">
        <button className="btn btn-primary grow" onClick={onAdd} disabled={!preview.dataUrl}>
          <PlusIcon size={16} /> Añadir a la hoja
        </button>
        <button
          className="btn btn-outline"
          onClick={downloadPng}
          disabled={!preview.dataUrl}
          title="Descargar imagen PNG"
        >
          <DownloadIcon size={16} /> PNG
        </button>
        <button
          className="btn btn-outline"
          onClick={onPrint}
          disabled={!preview.dataUrl}
          title="Imprimir solo esta etiqueta"
        >
          <PrinterIcon size={16} /> Imprimir
        </button>
      </div>

      <p className="hint preview-hint">
        El botón <strong>Imprimir</strong> envía solo esta etiqueta a una página. Usa{" "}
        <strong>Añadir a la hoja</strong> para armar una hoja completa con varias.
      </p>
    </div>
  );
}
