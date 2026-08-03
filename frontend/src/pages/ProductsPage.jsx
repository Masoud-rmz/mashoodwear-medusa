import { useCallback, useEffect, useMemo, useState } from "react";
import { getCatalogFacets, getCategories, getProducts } from "../api/client";
import { PRODUCTS_PAGE_LIMIT, PRODUCT_COLORS, PRODUCT_SIZES } from "../constants/filters";
import { filtersToApiParams, useProductFilters } from "../hooks/useProductFilters";
import FilterBottomSheet from "../components/products/FilterBottomSheet";
import Pagination from "../components/products/Pagination";
import ProductCard from "../components/products/ProductCard";
import ProductCardSkeleton from "../components/products/ProductCardSkeleton";
import ProductFilters from "../components/products/ProductFilters";
import ProductSearchBar from "../components/products/ProductSearchBar";
import StateMessage from "../components/StateMessage";

const SKELETON_COUNT = 6;

/**
 * Products catalog page with filters, search, and pagination.
 */
export default function ProductsPage() {
  const { filters, applyFilters, clearFilters, setPage, writeFilters } =
    useProductFilters();

  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [categories, setCategories] = useState([]);
  const [facetSizes, setFacetSizes] = useState(PRODUCT_SIZES);
  const [facetColors, setFacetColors] = useState(PRODUCT_COLORS);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PRODUCTS_PAGE_LIMIT)),
    [total]
  );

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((response) => {
        if (!cancelled) {
          setCategories(response.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
        }
      });

    getCatalogFacets()
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.sizes?.length) {
          setFacetSizes(response.sizes);
        }
        if (response.colors?.length) {
          setFacetColors(response.colors);
        }
      })
      .catch(() => {
        /* keep hardcoded fallbacks */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await getProducts({
          ...filtersToApiParams(filters),
          signal: controller.signal,
        });

        if (!active) {
          return;
        }

        if (response.items.length === 0 && response.total > 0 && filters.page > 1) {
          setPage(1);
          return;
        }

        setProducts(response.items);
        setTotal(response.total);
      } catch (fetchError) {
        if (!active || controller.signal.aborted) {
          return;
        }
        setError(true);
        setProducts([]);
        setTotal(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [filters, setPage]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await getProducts(filtersToApiParams(filters));
      if (response.items.length === 0 && response.total > 0 && filters.page > 1) {
        setPage(1);
        return;
      }
      setProducts(response.items);
      setTotal(response.total);
    } catch {
      setError(true);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, setPage]);

  const handleDesktopFilterChange = (next) => {
    writeFilters({ ...next, page: 1 });
  };

  const handleSearch = (value) => {
    applyFilters({ ...filters, search: value });
  };

  const handleSheetApply = (next) => {
    applyFilters(next);
  };

  return (
    <div className="products-page container">
      <h1 className="page-title">Products</h1>

      <ProductSearchBar
        value={searchDraft}
        onChange={setSearchDraft}
        onSearch={handleSearch}
      />

      <button
        type="button"
        className="btn btn-secondary filters-mobile-btn"
        onClick={() => setSheetOpen(true)}
      >
        Filters
      </button>

      <div className="products-layout">
        <aside className="filters-sidebar" aria-label="Product filters">
          <ProductFilters
            categories={categories}
            filters={filters}
            onChange={handleDesktopFilterChange}
            onClear={clearFilters}
            sizes={facetSizes}
            colors={facetColors}
          />
        </aside>

        <div className="products-results">
          {!loading && !error && total > 0 && (
            <p className="products-meta" aria-live="polite">
              Showing {products.length} of {total} product{total === 1 ? "" : "s"}
            </p>
          )}

          {loading && (
            <div className="product-grid" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          )}

          {!loading && error && (
            <StateMessage
              variant="error"
              message="Couldn't load data — refresh the page"
              actionLabel="Try again"
              onAction={loadProducts}
            />
          )}

          {!loading && !error && products.length === 0 && (
            <StateMessage
              variant="empty"
              message="No products match these filters — try changing them"
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} showStockLabel />
                ))}
              </div>
              <Pagination
                page={filters.page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <FilterBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        filters={filters}
        onApply={handleSheetApply}
        onClear={clearFilters}
        sizes={facetSizes}
        colors={facetColors}
      />
    </div>
  );
}
