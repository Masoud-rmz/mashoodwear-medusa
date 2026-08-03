import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_MAX_PRICE,
  DEFAULT_MIN_PRICE,
  PRODUCTS_PAGE_LIMIT,
} from "../constants/filters";

/**
 * @typedef {object} ProductFilterState
 * @property {string | null} category
 * @property {string | null} size
 * @property {string | null} color
 * @property {number} minPrice
 * @property {number} maxPrice
 * @property {string} search
 * @property {number} page
 */

/**
 * Clamp and normalize price range values from URL params.
 * @param {number} minPrice
 * @param {number} maxPrice
 * @returns {{ minPrice: number, maxPrice: number }}
 */
export function normalizePriceRange(minPrice, maxPrice) {
  let min = Number.isFinite(minPrice) ? minPrice : DEFAULT_MIN_PRICE;
  let max = Number.isFinite(maxPrice) ? maxPrice : DEFAULT_MAX_PRICE;

  min = Math.max(DEFAULT_MIN_PRICE, Math.min(min, DEFAULT_MAX_PRICE));
  max = Math.max(DEFAULT_MIN_PRICE, Math.min(max, DEFAULT_MAX_PRICE));

  if (min > max) {
    return { minPrice: max, maxPrice: min };
  }

  return { minPrice: min, maxPrice: max };
}

/**
 * Parse optional numeric query param — missing param must not become 0.
 * @param {URLSearchParams} params
 * @param {string} key
 * @returns {number}
 */
function parseOptionalNumber(params, key) {
  const raw = params.get(key);
  if (raw === null || raw === "") {
    return NaN;
  }
  return Number(raw);
}

/**
 * Parse product filter state from URL search params.
 * @param {URLSearchParams} params
 * @returns {ProductFilterState}
 */
export function parseFilterParams(params) {
  const minPrice = parseOptionalNumber(params, "minPrice");
  const maxPrice = parseOptionalNumber(params, "maxPrice");
  const page = Number(params.get("page"));
  const { minPrice: normalizedMin, maxPrice: normalizedMax } = normalizePriceRange(
    minPrice,
    maxPrice
  );

  return {
    category: params.get("category") || null,
    size: params.get("size") || null,
    color: params.get("color") || null,
    minPrice: normalizedMin,
    maxPrice: normalizedMax,
    search: params.get("search") || "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/**
 * Build API query params from filter state.
 * @param {ProductFilterState} filters
 * @returns {Record<string, string | number>}
 */
export function filtersToApiParams(filters) {
  const params = {
    page: filters.page,
    limit: PRODUCTS_PAGE_LIMIT,
  };

  if (filters.category) {
    params.category = filters.category;
  }
  if (filters.size) {
    params.size = filters.size;
  }
  if (filters.color) {
    params.color = filters.color;
  }
  if (filters.search.trim()) {
    params.search = filters.search.trim();
  }
  if (filters.minPrice > DEFAULT_MIN_PRICE) {
    params.minPrice = filters.minPrice;
  }
  if (
    filters.maxPrice < DEFAULT_MAX_PRICE &&
    filters.maxPrice > DEFAULT_MIN_PRICE
  ) {
    params.maxPrice = filters.maxPrice;
  }

  return params;
}

/**
 * Sync product filters with URL search params.
 * @returns {{
 *   filters: ProductFilterState,
 *   applyFilters: (next?: ProductFilterState) => void,
 *   clearFilters: () => void,
 *   setPage: (page: number) => void,
 *   hasActiveFilters: boolean,
 *   writeFilters: (next: ProductFilterState, options?: { replace?: boolean }) => void
 * }}
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseFilterParams(searchParams),
    [searchParams]
  );

  const writeFilters = useCallback(
    (next, options = {}) => {
      const params = new URLSearchParams();

      if (next.category) {
        params.set("category", next.category);
      }
      if (next.size) {
        params.set("size", next.size);
      }
      if (next.color) {
        params.set("color", next.color);
      }
      if (next.minPrice > DEFAULT_MIN_PRICE) {
        params.set("minPrice", String(next.minPrice));
      }
      if (next.maxPrice < DEFAULT_MAX_PRICE) {
        params.set("maxPrice", String(next.maxPrice));
      }
      if (next.search.trim()) {
        params.set("search", next.search.trim());
      }
      if (next.page > 1) {
        params.set("page", String(next.page));
      }

      setSearchParams(params, options);
    },
    [setSearchParams]
  );

  const applyFilters = useCallback(
    (next = filters) => {
      writeFilters({ ...next, page: 1 });
    },
    [filters, writeFilters]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback(
    (page) => {
      writeFilters({ ...filters, page });
    },
    [filters, writeFilters]
  );

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.category ||
        filters.size ||
        filters.color ||
        filters.search.trim() ||
        filters.minPrice > DEFAULT_MIN_PRICE ||
        filters.maxPrice < DEFAULT_MAX_PRICE
    );
  }, [filters]);

  return {
    filters,
    applyFilters,
    clearFilters,
    setPage,
    hasActiveFilters,
    writeFilters,
  };
}
