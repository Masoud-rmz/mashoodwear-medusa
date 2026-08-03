import { useEffect, useState } from "react";
import ProductFilters from "./ProductFilters";

/**
 * Mobile bottom sheet for product filters — draft state until Apply.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   categories: Array<{ id: number, name: string, slug: string }>,
 *   filters: import('../../hooks/useProductFilters').ProductFilterState,
 *   onApply: (next: import('../../hooks/useProductFilters').ProductFilterState) => void,
 *   onClear: () => void
 * }} props
 */
export default function FilterBottomSheet({
  open,
  onClose,
  categories,
  filters,
  onApply,
  onClear,
  sizes,
  colors,
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <>
      <button
        type="button"
        className="sheet-overlay open"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        className="filter-sheet open"
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <p className="filter-label">Filters</p>
        <ProductFilters
          idPrefix="sheet"
          categories={categories}
          filters={draft}
          onChange={setDraft}
          onClear={handleClear}
          showClearButton={false}
          sizes={sizes}
          colors={colors}
        />
        <button
          type="button"
          className="btn btn-primary filter-sheet-apply"
          onClick={handleApply}
        >
          Apply filters
        </button>
      </div>
    </>
  );
}
