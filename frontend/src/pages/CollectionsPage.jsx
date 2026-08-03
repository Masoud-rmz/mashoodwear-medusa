import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCollections } from "../api/client";
import ScrollReveal from "../components/ScrollReveal";
import ProductImage from "../components/ProductImage";
import StateMessage from "../components/StateMessage";

/**
 * Brand collections grid — cover image, name, piece count.
 */
export default function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getCollections()
      .then((response) => setCollections(response.items))
      .catch(() => {
        setError(true);
        setCollections([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="collections-page">
      <div className="container">
        <h1 className="page-title">Collections</h1>
        <p className="collections-intro">Brand drops — limited runs built for the streets.</p>

        {loading && (
          <div className="collections-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="collection-card collection-card--skeleton" />
            ))}
          </div>
        )}

        {error && (
          <StateMessage
            variant="error"
            message="Could not load collections — check your connection"
            actionLabel="Try again"
            onAction={load}
          />
        )}

        {!loading && !error && collections.length === 0 && (
          <StateMessage
            variant="empty"
            message="No collections yet — new drops will appear here soon"
            actionLabel="View Products"
            onAction={() => navigate("/products")}
          />
        )}

        {!loading && !error && collections.length > 0 && (
          <div className="collections-grid">
            {collections.map((collection, index) => (
              <ScrollReveal key={collection.id} delay={index * 60}>
                <Link to={`/collections/${collection.slug}`} className="collection-card">
                  <div className="collection-card-cover">
                    <ProductImage
                      src={collection.coverImageUrl}
                      fallbackClassName="collection-card-cover--placeholder"
                      fallbackLabel="No cover"
                    />
                  </div>
                  <div className="collection-card-body">
                    <h2 className="collection-card-name">{collection.name}</h2>
                    <p className="collection-card-count">
                      {collection.productCount} {collection.productCount === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
