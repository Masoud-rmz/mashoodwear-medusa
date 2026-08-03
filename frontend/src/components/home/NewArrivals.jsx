import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../../api/client";
import ScrollReveal from "../ScrollReveal";
import StateMessage from "../StateMessage";
import ProductCard from "../products/ProductCard";
import ProductCardSkeleton from "../products/ProductCardSkeleton";

const SKELETON_COUNT = 6;

/**
 * Featured products grid for the home page New Arrivals section.
 */
export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await getProducts({ featured: true, limit: 6 });
      setProducts(response.items);
    } catch {
      setError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <ScrollReveal className="section container new-arrivals">
      <div className="section-header">
        <h2 className="section-title">New Arrivals</h2>
        <Link to="/products" className="section-link">
          View all →
        </Link>
      </div>

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
          actionLabel="Refresh"
          onAction={() => window.location.reload()}
        />
      )}

      {!loading && !error && products.length === 0 && (
        <StateMessage
          variant="empty"
          message="Nothing to show right now — check back soon"
          actionLabel="Try again"
          onAction={loadProducts}
        />
      )}

      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </ScrollReveal>
  );
}
