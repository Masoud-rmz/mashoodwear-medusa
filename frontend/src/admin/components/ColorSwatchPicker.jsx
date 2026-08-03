import { PRODUCT_COLORS } from "../../constants/filters";

/**
 * Toggle color swatches for admin product form — matches storefront palette.
 * @param {{
 *   selectedColors: string[],
 *   onChange: (colors: string[]) => void
 * }} props
 */
export default function ColorSwatchPicker({ selectedColors, onChange }) {
  const toggleColor = (colorName) => {
    if (selectedColors.includes(colorName)) {
      if (selectedColors.length === 1) {
        return;
      }
      onChange(selectedColors.filter((color) => color !== colorName));
      return;
    }
    onChange([...selectedColors, colorName]);
  };

  return (
    <div className="admin-color-picker">
      <div className="color-swatches" role="group" aria-label="Product colors">
        {PRODUCT_COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            className={`color-swatch ${color.slug}${
              selectedColors.includes(color.name) ? " active" : ""
            }`}
            aria-label={color.name}
            aria-pressed={selectedColors.includes(color.name)}
            onClick={() => toggleColor(color.name)}
          />
        ))}
      </div>
      <p className="admin-hint">
        Selected: {selectedColors.length > 0 ? selectedColors.join(", ") : "none"}
      </p>
    </div>
  );
}
