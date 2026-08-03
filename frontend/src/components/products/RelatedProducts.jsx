import { useEffect, useState } from "react";
import { getRelatedProducts } from "../../api/client";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

const SUGGESTION_LIMIT = 4;

/**
 * Suggested products grid shown below the product detail.
 * @param {{ productSlug: string }} props
 */
export default function RelatedProducts({ productSlug }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productSlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function loadRelated() {
      setLoading(true);

      try {
        const response = await getRelatedProducts(productSlug, {
          limit: SUGGESTION_LIMIT,
          signal: controller.signal,
        });

        if (cancelled) {
          return;
        }

        if (response.notFound) {
          setProducts([]);
          return;
        }

        setProducts(response.items ?? []);
      } catch (error) {
        if (cancelled || error?.name === "AbortError") {
          return;
        }
        setProducts([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRelated();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [productSlug]);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="related-products" aria-labelledby="related-products-heading">
      <div className="section-header">
        <h2 id="related-products-heading" className="section-title">
          You may also like
        </h2>
      </div>

      {loading ? (
        <div className="product-grid" aria-busy="true" aria-label="Loading suggested products">
          {Array.from({ length: SUGGESTION_LIMIT }, (_, index) => (
            <ProductCardSkeleton key={`related-skeleton-${index}`} />
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
