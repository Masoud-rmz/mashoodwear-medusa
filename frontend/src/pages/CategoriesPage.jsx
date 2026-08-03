import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories } from "../api/client";
import ScrollReveal from "../components/ScrollReveal";
import StateMessage from "../components/StateMessage";

/**
 * Product categories grid — Medusa categories by handle.
 */
export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getCategories()
      .then((response) => setCategories(response.items || []))
      .catch(() => {
        setError(true);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="collections-page">
      <div className="container">
        <h1 className="page-title">Categories</h1>
        <p className="collections-intro">Browse products by category.</p>

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
            message="Could not load categories — check your connection"
            actionLabel="Try again"
            onAction={load}
          />
        )}

        {!loading && !error && categories.length === 0 && (
          <StateMessage
            variant="empty"
            message="No categories yet — they will appear here once created in Medusa Admin"
            actionLabel="View Products"
            onAction={() => navigate("/products")}
          />
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="collections-grid">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} delay={index * 60}>
                <Link to={`/categories/${category.slug}`} className="collection-card">
                  <div className="collection-card-body">
                    <h2 className="collection-card-name">{category.name}</h2>
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
