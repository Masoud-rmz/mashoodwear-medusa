import { colorNameToSlug, resolveColorHex } from "../../utils/colorSwatches";

/**
 * Size / height / color / extra option pickers for product detail.
 * Options come from Medusa Admin product options (size, قد, color, …).
 * @param {{
 *   sizes: string[],
 *   heights?: string[],
 *   colors: string[],
 *   extraOptions?: Array<{ title: string, values: string[] }>,
 *   selectedSize: string | null,
 *   selectedHeight?: string | null,
 *   selectedColor: string | null,
 *   selectedExtras?: Record<string, string | null>,
 *   onSizeChange: (size: string | null) => void,
 *   onHeightChange?: (height: string | null) => void,
 *   onColorChange: (color: string | null) => void,
 *   onExtraChange?: (title: string, value: string | null) => void,
 *   showColorPicker?: boolean,
 *   showHeightPicker?: boolean,
 *   isColorAvailable?: (color: string) => boolean,
 *   orphanedColorsHint?: string | null
 * }} props
 */
export default function VariantPicker({
  sizes,
  heights = [],
  colors,
  extraOptions = [],
  selectedSize,
  selectedHeight = null,
  selectedColor,
  selectedExtras = {},
  onSizeChange,
  onHeightChange,
  onColorChange,
  onExtraChange,
  showColorPicker = true,
  showHeightPicker = false,
  isColorAvailable = () => true,
  orphanedColorsHint = null,
}) {
  return (
    <>
      {sizes.length > 0 && (
        <div className="variant-group">
          <p className="variant-label">سایز / Size</p>
          <div className="size-grid" role="group" aria-label="Size">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`size-btn${selectedSize === size ? " active" : ""}`}
                aria-pressed={selectedSize === size}
                onClick={() => onSizeChange(selectedSize === size ? null : size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {showHeightPicker && heights.length > 0 && (
        <div className="variant-group">
          <p className="variant-label">قد / Height</p>
          <div className="size-grid" role="group" aria-label="Height">
            {heights.map((height) => (
              <button
                key={height}
                type="button"
                className={`size-btn${selectedHeight === height ? " active" : ""}`}
                aria-pressed={selectedHeight === height}
                onClick={() =>
                  onHeightChange?.(selectedHeight === height ? null : height)
                }
              >
                {height}
              </button>
            ))}
          </div>
        </div>
      )}

      {showColorPicker && colors.length > 0 && (
        <div className="variant-group">
          <p className="variant-label">رنگ / Color</p>
          <div className="color-swatches" role="group" aria-label="Color">
            {colors.map((color) => {
              const slug = colorNameToSlug(color);
              const hex = resolveColorHex(color);
              const available = isColorAvailable(color);
              return (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${slug || "unknown"}${
                    selectedColor === color ? " active" : ""
                  }${available ? "" : " color-swatch--unavailable"}`}
                  style={hex ? { background: hex } : undefined}
                  title={available ? color : `${color} (unavailable)`}
                  aria-label={color}
                  aria-pressed={selectedColor === color}
                  aria-disabled={!available}
                  disabled={!available}
                  onClick={() => {
                    if (!available) {
                      return;
                    }
                    onColorChange(selectedColor === color ? null : color);
                  }}
                />
              );
            })}
          </div>
          {selectedColor && (
            <p className="variant-color-name" aria-live="polite">
              {selectedColor}
            </p>
          )}
          {orphanedColorsHint && (
            <p className="variant-color-hint" role="note">
              {orphanedColorsHint}
            </p>
          )}
        </div>
      )}

      {extraOptions.map((option) => (
        <div key={option.title} className="variant-group">
          <p className="variant-label">{option.title}</p>
          <div className="size-grid" role="group" aria-label={option.title}>
            {option.values.map((value) => {
              const selected = selectedExtras[option.title] === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`size-btn${selected ? " active" : ""}`}
                  aria-pressed={selected}
                  onClick={() =>
                    onExtraChange?.(option.title, selected ? null : value)
                  }
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
