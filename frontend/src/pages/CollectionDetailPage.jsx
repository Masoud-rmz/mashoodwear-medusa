import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCollectionBySlug } from "../api/client";
import ProductCard from "../components/products/ProductCard";
import ProductCardSkeleton from "../components/products/ProductCardSkeleton";
import StateMessage from "../components/StateMessage";

/**
 * Single brand collection with product grid and stock labels.
 */
export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
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

    getCollectionBySlug(slug)
      .then((response) => {
        if (response.notFound) {
          setNotFound(true);
          setCollection(null);
          return;
        }
        setCollection(response.collection);
      })
      .catch(() => {
        setError(true);
        setCollection(null);
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
          message="Collection not found — this drop may have ended"
          actionLabel="View Collections"
          onAction={() => navigate("/collections")}
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
            message="Could not load this collection"
            actionLabel="Try again"
            onAction={load}
          />
        )}

        {!loading && !error && collection && (
          <>
            <header className="collection-detail-header">
              <Link to="/collections" className="back-link">
                ← Collections
              </Link>
              <h1 className="page-title">{collection.name}</h1>
              {collection.description && (
                <p className="collection-detail-description">{collection.description}</p>
              )}
              <p className="collection-detail-count">
                {collection.productCount} {collection.productCount === 1 ? "piece" : "pieces"}
              </p>
            </header>

            {collection.products.length === 0 ? (
              <StateMessage
                variant="empty"
                message="No products in this collection yet"
                actionLabel="View Products"
                onAction={() => navigate("/products")}
              />
            ) : (
              <div className="product-grid">
                {collection.products.map((product) => (
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
