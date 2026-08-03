import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCategoryBySlug } from "../api/client";
import ProductCard from "../components/products/ProductCard";
import ProductCardSkeleton from "../components/products/ProductCardSkeleton";
import StateMessage from "../components/StateMessage";

/**
 * Single Medusa category with product grid.
 */
export default function CategoryDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    if (!slug) {
      return;
    }
    setLoading(true);
    setError(false);
    setNotFound(false);

    getCategoryBySlug(slug)
      .then((response) => {
        if (response.notFound) {
          setNotFound(true);
          setCategory(null);
          return;
        }
        setCategory(response.category);
      })
      .catch(() => {
        setError(true);
        setCategory(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (notFound) {
    return (
      <div className="container collection-detail-page">
        <StateMessage
          variant="empty"
          message="Category not found"
          actionLabel="View Categories"
          onAction={() => navigate("/categories")}
        />
      </div>
    );
  }

  return (
    <div className="collection-detail-page">
      <div className="container">
        {loading && (
          <>
            <div className="collection-detail-header collection-detail-header--skeleton" />
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </>
        )}

        {error && (
          <StateMessage
            variant="error"
            message="Could not load this category"
            actionLabel="Try again"
            onAction={load}
          />
        )}

        {!loading && !error && category && (
          <>
            <header className="collection-detail-header">
              <Link to="/categories" className="back-link">
                ← Categories
              </Link>
              <h1 className="page-title">{category.name}</h1>
              <p className="collection-detail-count">
                {category.productCount}{" "}
                {category.productCount === 1 ? "piece" : "pieces"}
              </p>
            </header>

            {(category.products || []).length === 0 ? (
              <StateMessage
                variant="empty"
                message="No products in this category yet"
                actionLabel="View Products"
                onAction={() => navigate("/products")}
              />
            ) : (
              <div className="product-grid">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} showStockLabel />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
