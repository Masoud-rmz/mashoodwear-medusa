import { Link } from "react-router-dom";
import { medusaAdminUrl } from "../../api/medusa/client";

const COPY = {
  products: {
    title: "Products moved to Medusa Admin",
    body: "Catalog, variants, prices, and inventory are managed only in Medusa Admin. This panel no longer edits Express products — that would create a second source of truth.",
  },
  categories: {
    title: "Categories moved to Medusa Admin",
    body: "Product categories live in Medusa. Use Medusa Admin for category CRUD; this `/admin` panel is CMS-only (pages, home, settings).",
  },
};

/**
 * Deprecation stub for Express product/category CRUD (Path A admin).
 * purpose --- steer merchants to Medusa Admin instead of dual catalog SoT ---
 * @param {{ resource?: "products" | "categories" }} props
 */
export default function CommerceMovedToMedusaPage({ resource = "products" }) {
  const copy = COPY[resource] || COPY.products;

  return (
    <div className="admin-moved-panel">
      <h1 className="admin-page-title">{copy.title}</h1>
      <p className="admin-hint">{copy.body}</p>
      <div className="admin-page-header-actions" style={{ marginTop: "1.5rem" }}>
        <a
          href={medusaAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Open Medusa Admin
        </a>
        <Link to="/admin" className="btn btn-secondary">
          Back to CMS dashboard
        </Link>
      </div>
    </div>
  );
}
