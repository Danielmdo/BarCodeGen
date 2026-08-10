import { useEffect, useState } from "react";
import { SYMBOLOGIES, validateInput, type SymbologyId } from "../lib/barcode";
import { XIcon } from "./icons";

export interface ItemPatch {
  value: string;
  label: string;
  symbology: SymbologyId;
}

interface EditItemModalProps {
  initialValue: string;
  initialLabel: string;
  initialSymbology: SymbologyId;
  onSave: (patch: ItemPatch) => void;
  onClose: () => void;
}

export function EditItemModal({
  initialValue,
  initialLabel,
  initialSymbology,
  onSave,
  onClose,
}: EditItemModalProps) {
  const [value, setValue] = useState(initialValue);
  const [label, setLabel] = useState(initialLabel);
  const [symbology, setSymbology] = useState<SymbologyId>(initialSymbology);

  const error = validateInput(symbology, value);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Editar etiqueta">
        <div className="modal-head">
          <div>
            <h3>Editar etiqueta</h3>
            <p className="card-desc">Modifica el código, la simbología o el texto.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="modal-fields">
          <label className="field">
            <span className="field-label">Código / valor</span>
            <input
              className="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field-label">Simbología</span>
            <select
              className="input"
              value={symbology}
              onChange={(e) => setSymbology(e.target.value as SymbologyId)}
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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nombre, precio, referencia…"
            />
          </label>

          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!!error}
            onClick={() => onSave({ value: value.trim(), label: label.trim(), symbology })}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
