import { Link } from "react-router-dom";
import { medusaAdminUrl } from "../../api/medusa/client";

const CMS_LINKS = [
  { to: "/admin/pages", label: "Pages", hint: "About, Contact, How to Buy" },
  { to: "/admin/home", label: "Home content", hint: "Hero and brand story" },
  { to: "/admin/settings", label: "Site settings", hint: "Card transfer, social links, logo, password" },
  { to: "/admin/collections", label: "CMS collections", hint: "Fallback only — prefer Medusa Admin cover image" },
];

/**
 * CMS-focused dashboard with Medusa Admin commerce CTA (Path A).
 * purpose --- no Express product/stock widgets; commerce lives in Medusa ---
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="admin-page-title">Brand CMS</h1>
      <p className="admin-hint">
        This panel edits brand content only. Products, orders, inventory, customers,
        and payment run in Medusa Admin.
      </p>

      <section className="admin-commerce-cta" aria-labelledby="medusa-admin-heading">
        <h2 id="medusa-admin-heading" className="admin-section-title">
          Store commerce
        </h2>
        <p className="admin-hint">
          Manage products, orders, inventory, and payment providers in Medusa Admin.
        </p>
        <a
          href={medusaAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary admin-medusa-cta"
        >
          Manage store in Medusa Admin
        </a>
      </section>

      <h2 className="admin-section-title">CMS shortcuts</h2>
      <ul className="admin-cms-link-list">
        {CMS_LINKS.map((item) => (
          <li key={item.to}>
            <Link to={item.to}>{item.label}</Link>
            <span className="admin-hint">{item.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
