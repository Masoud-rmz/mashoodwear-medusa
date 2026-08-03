import { DEFAULT_COLOR_SENTINEL } from "../api/medusa/mappers.js";
import { colorNameToSlug } from "./colorSwatches.js";

export { colorNameToSlug, resolveColorHex } from "./colorSwatches.js";

/**
 * Derive add-to-cart button and stock label from variant selection.
 * @param {{
 *   productStatus: string,
 *   variants: Array<{ size: string, color: string, stock: number }>,
 *   selectedSize: string | null,
 *   selectedColor: string | null,
 *   hasColorOptions?: boolean
 * }} input
 * @returns {{ disabled: boolean, label: string, stockLabel: string | null }}
 */
export function getAddToCartState({
  productStatus,
  variants,
  selectedSize,
  selectedColor,
  selectedHeight = null,
  selectedExtras = {},
  hasColorOptions = true,
  hasHeightOptions = false,
  extraOptions = [],
}) {
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);

  if (productStatus === "out_of_stock" || totalStock <= 0) {
    return { disabled: true, label: "Sold out", stockLabel: "Sold out" };
  }

  if (!selectedSize) {
    return {
      disabled: true,
      label: "ابتدا سایز را انتخاب کنید",
      stockLabel: null,
    };
  }

  if (hasHeightOptions && !selectedHeight) {
    return {
      disabled: true,
      label: "قد را انتخاب کنید",
      stockLabel: null,
    };
  }

  const effectiveColor = hasColorOptions
    ? selectedColor
    : selectedColor || DEFAULT_COLOR_SENTINEL;

  if (hasColorOptions && !effectiveColor) {
    return {
      disabled: true,
      label: "رنگ را انتخاب کنید",
      stockLabel: null,
    };
  }

  for (const option of extraOptions) {
    if (!selectedExtras[option.title]) {
      return {
        disabled: true,
        label: `${option.title} را انتخاب کنید`,
        stockLabel: null,
      };
    }
  }

  const variant = variants.find((item) => {
    if (item.size !== selectedSize) {
      return false;
    }
    if (item.color !== effectiveColor) {
      return false;
    }
    if (hasHeightOptions && String(item.height || "") !== String(selectedHeight)) {
      return false;
    }
    for (const option of extraOptions) {
      const wanted = selectedExtras[option.title];
      const actual = item.extraOptions?.[option.title];
      if (wanted && actual !== wanted) {
        return false;
      }
    }
    return true;
  });

  if (!variant || variant.stock <= 0) {
    return {
      disabled: true,
      label: "این ترکیب موجود نیست",
      stockLabel: "Sold out",
    };
  }

  let stockLabel = "In stock";
  if (variant.stock <= 3) {
    stockLabel = `Only ${variant.stock} left`;
  }

  return { disabled: false, label: "Add to Cart", stockLabel };
}

/**
 * Unique heights from variants.
 * @param {Array<{ height?: string }>} variants
 * @param {string[]} [declared]
 * @returns {string[]}
 */
export function uniqueHeights(variants, declared = []) {
  const values = [
    ...declared,
    ...variants.map((variant) => String(variant.height || "").trim()).filter(Boolean),
  ];
  return [...new Set(values)];
}

/**
 * Unique sizes from variants in display order.
 * @param {Array<{ size: string }>} variants
 * @param {string[]} [preferredOrder]
 * @returns {string[]}
 */
export function uniqueSizes(variants, preferredOrder = ["S", "M", "L", "XL", "2XL"]) {
  const sizes = [...new Set(variants.map((variant) => variant.size))];
  return sizes.sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left);
    const rightIndex = preferredOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) {
      return String(left).localeCompare(String(right));
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });
}

/**
 * Colors for the selected size.
 * Prefer product.declared colors when provided; otherwise unique variant colors.
 * @param {Array<{ size: string, color: string }>} variants
 * @param {string | null} selectedSize
 * @param {{ hasColorOptions?: boolean, declaredColors?: string[] }} [options]
 * @returns {string[]}
 */
export function colorsForSize(variants, selectedSize, options = {}) {
  const { hasColorOptions = true, declaredColors = null } = options;
  if (!hasColorOptions) {
    return [];
  }
  if (Array.isArray(declaredColors) && declaredColors.length > 0) {
    return declaredColors.filter(
      (color) => color && color !== DEFAULT_COLOR_SENTINEL
    );
  }
  const filtered = selectedSize
    ? variants.filter((variant) => variant.size === selectedSize)
    : variants;
  return [
    ...new Set(
      filtered
        .map((variant) => variant.color)
        .filter((color) => color && color !== DEFAULT_COLOR_SENTINEL)
    ),
  ];
}

/**
 * Whether a size+color combination exists with stock > 0.
 * @param {Array<{ size: string, color: string, stock: number }>} variants
 * @param {string | null} selectedSize
 * @param {string} color
 * @returns {boolean}
 */
export function isColorAvailableForSize(variants, selectedSize, color) {
  if (!color) {
    return false;
  }
  return variants.some((variant) => {
    if (variant.color !== color) {
      return false;
    }
    if (selectedSize && variant.size !== selectedSize) {
      return false;
    }
    return Number(variant.stock) > 0;
  });
}
