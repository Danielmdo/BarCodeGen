import { LayersIcon, SparklesIcon } from "./icons";
import { NumberField } from "./ControlsPanel";
import { SYMBOLOGIES, type SymbologyId } from "../lib/barcode";

interface BatchPanelProps {
  batchText: string;
  onBatchTextChange: (value: string) => void;
  batchQty: number;
  onBatchQtyChange: (value: number) => void;
  symbology: SymbologyId;
  onGenerate: () => void;
  onProposeBatch: () => void;
}

export function BatchPanel({
  batchText,
  onBatchTextChange,
  batchQty,
  onBatchQtyChange,
  symbology,
  onGenerate,
  onProposeBatch,
}: BatchPanelProps) {
  const info = SYMBOLOGIES.find((s) => s.id === symbology);

  return (
    <div className="card">
      <section className="card-section">
        <h2 className="card-title">Generación masiva</h2>
        <p className="card-desc">Un código por línea. Ideal para inventarios y series.</p>

        <label className="field">
          <span className="field-label">Lista de códigos</span>
          <textarea
            className="input textarea"
            rows={6}
            value={batchText}
            onChange={(e) => onBatchTextChange(e.target.value)}
            placeholder={"7501234567890\n7501234567891\n7501234567892"}
            spellCheck={false}
          />
        </label>
        <div className="batch-tools">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onProposeBatch}>
            <SparklesIcon size={14} /> Proponer 5 códigos
          </button>
        </div>

        <div className="grid-2 batch-qty">
          <NumberField
            label="Cantidad por código"
            value={batchQty}
            min={1}
            max={999}
            step={1}
            onChange={onBatchQtyChange}
          />
          <div className="btn-align">
            <button className="btn btn-primary grow" onClick={onGenerate}>
              <LayersIcon size={16} /> Generar hoja
            </button>
          </div>
        </div>

        <p className="hint">
          Formato esperado: <strong>{info?.name}</strong> ({info?.hint.toLowerCase()}). Solo
          se añaden a la hoja las líneas válidas.
        </p>
      </section>
    </div>
  );
}
