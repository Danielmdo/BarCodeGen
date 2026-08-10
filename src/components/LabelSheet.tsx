import { memo, useMemo } from "react";
import { CopyIcon, PencilIcon, TrashIcon } from "./icons";
import {
  renderBarcodeDataUrl,
  type BarcodeSettings,
  type LabelTemplate,
  type SymbologyId,
} from "../lib/barcode";

export interface SheetItem {
  id: string;
  value: string;
  label: string;
  symbology: SymbologyId;
}

/** Ajustes que afectan a cada celda de la hoja (referencia estable en App). */
export type CellAppearance = Pick<
  BarcodeSettings,
  "moduleWidth" | "height" | "fontSize" | "margin" | "showText" | "lineColor"
>;

interface LabelSheetProps {
  items: SheetItem[];
  template: LabelTemplate;
  appearance: CellAppearance;
  variant: "screen" | "print";
  onRemove?: (id: string) => void;
  onDuplicate?: (item: SheetItem) => void;
  onEdit?: (item: SheetItem) => void;
}

const LabelCell = memo(function LabelCell({
  item,
  appearance,
  small,
  variant,
  onRemove,
  onDuplicate,
  onEdit,
}: {
  item: SheetItem;
  appearance: CellAppearance;
  small: boolean;
  variant: "screen" | "print";
  onRemove?: (id: string) => void;
  onDuplicate?: (item: SheetItem) => void;
  onEdit?: (item: SheetItem) => void;
}) {
  const { dataUrl, error } = useMemo(
    () =>
      renderBarcodeDataUrl({
        symbology: item.symbology,
        value: item.value,
        text: item.label || undefined,
        width: appearance.moduleWidth,
        height: appearance.height,
        fontSize: appearance.fontSize,
        margin: appearance.margin,
        showText: appearance.showText,
        lineColor: appearance.lineColor,
      }),
    [item, appearance]
  );

  return (
    <div className={`label-cell${small ? " small" : ""}`}>
      {item.label && <div className="label-custom">{item.label}</div>}
      <div className="label-barcode-box">
        {error ? (
          <span className="label-error">{error}</span>
        ) : (
          <img
            className="label-barcode"
            src={dataUrl ?? ""}
            alt={`Código ${item.value}`}
          />
        )}
      </div>
      <div className="label-value">{item.value}</div>

      {variant === "screen" && (
        <div className="cell-actions">
          <button
            type="button"
            onClick={() => onEdit?.(item)}
            title="Editar etiqueta"
            aria-label="Editar etiqueta"
          >
            <PencilIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate?.(item)}
            title="Duplicar etiqueta"
            aria-label="Duplicar etiqueta"
          >
            <CopyIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => onRemove?.(item.id)}
            title="Quitar de la hoja"
            aria-label="Quitar de la hoja"
          >
            <TrashIcon size={13} />
          </button>
        </div>
      )}
    </div>
  );
});

function EmptyCell() {
  return <div className="label-cell is-empty" />;
}

export function LabelSheet({
  items,
  template,
  appearance,
  variant,
  onRemove,
  onDuplicate,
  onEdit,
}: LabelSheetProps) {
  const small = template.width <= 60;
  const centered = template.cols === 1 && template.rows === 1;

  // Rellena la cuadrícula para conservar la alineación en cada página.
  const perPage = template.cols * template.rows;
  const placeholders = (perPage - (items.length % perPage)) % perPage;

  const gridStyle = {
    gridTemplateColumns: `repeat(${template.cols}, ${template.width}mm)`,
    gridAutoRows: `${template.height}mm`,
  };

  return (
    <div
      className={`label-sheet${centered ? " label-sheet-center" : ""}`}
      style={gridStyle}
    >
      {items.map((item) => (
        <LabelCell
          key={item.id}
          item={item}
          appearance={appearance}
          small={small}
          variant={variant}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
        />
      ))}
      {placeholders > 0 &&
        Array.from({ length: placeholders }, (_, i) => <EmptyCell key={`ph-${i}`} />)}
    </div>
  );
}
