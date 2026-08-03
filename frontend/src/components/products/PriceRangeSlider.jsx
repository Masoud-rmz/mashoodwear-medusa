import { useId } from "react";
import {
  DEFAULT_MAX_PRICE,
  DEFAULT_MIN_PRICE,
} from "../../constants/filters";

/**
 * Dual-range price slider for product filters.
 * @param {{
 *   minPrice: number,
 *   maxPrice: number,
 *   onChange: (minPrice: number, maxPrice: number) => void,
 *   onCommit?: (minPrice: number, maxPrice: number) => void
 * }} props
 */
export default function PriceRangeSlider({
  minPrice,
  maxPrice,
  onChange,
  onCommit,
}) {
  const minId = useId();
  const maxId = useId();

  const range = DEFAULT_MAX_PRICE - DEFAULT_MIN_PRICE;
  const fillLeft = ((minPrice - DEFAULT_MIN_PRICE) / range) * 100;
  const fillRight = 100 - ((maxPrice - DEFAULT_MIN_PRICE) / range) * 100;

  const handleMinChange = (event) => {
    const nextMin = Math.min(Number(event.target.value), maxPrice - 50000);
    onChange(nextMin, maxPrice);
  };

  const handleMaxChange = (event) => {
    const nextMax = Math.max(Number(event.target.value), minPrice + 50000);
    onChange(minPrice, nextMax);
  };

  const commit = () => {
    onCommit?.(minPrice, maxPrice);
  };

  return (
    <div className="price-range">
      <div className="price-range-values">
        <span>{minPrice.toLocaleString("en-US")}</span>
        <span aria-hidden="true">—</span>
        <span>{maxPrice.toLocaleString("en-US")}</span>
      </div>
      <div className="price-range-sliders">
        <div className="price-range-track" aria-hidden="true" />
        <div
          className="price-range-fill"
          aria-hidden="true"
          style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
        />
        <input
          id={minId}
          type="range"
          className="price-range-input"
          min={DEFAULT_MIN_PRICE}
          max={DEFAULT_MAX_PRICE}
          step={50000}
          value={minPrice}
          onChange={handleMinChange}
          onMouseUp={commit}
          onTouchEnd={commit}
          aria-label="Minimum price"
        />
        <input
          id={maxId}
          type="range"
          className="price-range-input price-range-input--max"
          min={DEFAULT_MIN_PRICE}
          max={DEFAULT_MAX_PRICE}
          step={50000}
          value={maxPrice}
          onChange={handleMaxChange}
          onMouseUp={commit}
          onTouchEnd={commit}
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}
