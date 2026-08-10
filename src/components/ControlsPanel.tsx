import { PlusIcon, PrinterIcon, SparklesIcon } from "./icons";
import {
  SYMBOLOGIES,
  type BarcodeSettings,
  type SymbologyId,
} from "../lib/barcode";

const COLOR_PRESETS = ["#111827", "#1d4ed8", "#dc2626", "#059669", "#7c3aed"];

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="number-wrap">
        <input
          className="input number-input"
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            if (e.target.value === "") {
              onChange(min);
              return;
            }
            const n = Number(e.target.value);
            if (Number.isNaN(n)) return;
            onChange(Math.min(max, Math.max(min, n)));
          }}
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
    </label>
  );
}

interface ControlsPanelProps {
  settings: BarcodeSettings;
  onChange: (patch: Partial<BarcodeSettings>) => void;
  error: string | null;
  onAdd: () => void;
  onPrintSingle: () => void;
  onPropose: () => void;
}

export function ControlsPanel({
  settings,
  onChange,
  error,
  onAdd,
  onPrintSingle,
  onPropose,
}: ControlsPanelProps) {
  const set = (patch: Partial<BarcodeSettings>) => onChange(patch);

  return (
    <div className="card">
      <section className="card-section">
        <h2 className="card-title">1 · Datos de la etiqueta</h2>
        <form
          className="field-stack"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd();
          }}
        >
          <label className="field">
            <span className="field-label">Código / valor</span>
            <div className="value-row">
              <input
                className="input"
                value={settings.value}
                onChange={(e) => set({ value: e.target.value })}
                placeholder="Ej: 7501234567890"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                className="btn btn-outline icon-btn"
                onClick={onPropose}
                title="Proponer un código válido"
                aria-label="Proponer un código válido"
              >
                <SparklesIcon size={16} />
              </button>
            </div>
            <span className="hint field-hint">
              ¿Sin idea? Pulsa ✨ para que propongamos un código válido (editable).
            </span>
          </label>

          <label className="field">
            <span className="field-label">Simbología</span>
            <select
              className="input"
              value={settings.symbology}
              onChange={(e) => set({ symbology: e.target.value as SymbologyId })}
            >
              {SYMBOLOGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.hint}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">
              Texto personalizado <span className="optional">opcional</span>
            </span>
            <input
              className="input"
              value={settings.labelText}
              onChange={(e) => set({ labelText: e.target.value })}
              placeholder="Nombre, precio, referencia…"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <div className="btn-row">
            <button className="btn btn-primary grow" type="submit" disabled={!!error}>
              <PlusIcon size={16} /> Añadir a la hoja
            </button>
            <button
              className="btn btn-outline icon-btn"
              type="button"
              onClick={onPrintSingle}
              disabled={!!error}
              title="Imprimir esta etiqueta"
              aria-label="Imprimir esta etiqueta"
            >
              <PrinterIcon size={16} />
            </button>
          </div>
        </form>
      </section>

      <section className="card-section">
        <h2 className="card-title">2 · Apariencia</h2>
        <div className="grid-2">
          <NumberField
            label="Ancho de barra"
            value={settings.moduleWidth}
            min={1}
            max={6}
            step={0.5}
            onChange={(v) => set({ moduleWidth: v })}
          />
          <NumberField
            label="Altura"
            value={settings.height}
            min={20}
            max={120}
            step={2}
            unit="px"
            onChange={(v) => set({ height: v })}
          />
          <NumberField
            label="Texto"
            value={settings.fontSize}
            min={8}
            max={36}
            step={1}
            unit="px"
            onChange={(v) => set({ fontSize: v })}
          />
          <NumberField
            label="Margen"
            value={settings.margin}
            min={0}
            max={20}
            step={1}
            unit="px"
            onChange={(v) => set({ margin: v })}
          />
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.showText}
            onChange={(e) => set({ showText: e.target.checked })}
          />
          <span>Mostrar el valor bajo el código</span>
        </label>

        <div className="field color-field">
          <span className="field-label">Color de las barras</span>
          <div className="color-row">
            <input
              type="color"
              className="color-input"
              value={settings.lineColor}
              onChange={(e) => set({ lineColor: e.target.value })}
              aria-label="Color de las barras"
            />
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${settings.lineColor === c ? " active" : ""}`}
                style={{ background: c }}
                onClick={() => set({ lineColor: c })}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
