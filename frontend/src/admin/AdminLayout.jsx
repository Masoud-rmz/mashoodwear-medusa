import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { medusaAdminUrl } from "../api/medusa/client";
import { clearAdminToken } from "../utils/adminAuth";

/** CMS-only nav — commerce CRUD lives in Medusa Admin (Path A). */
const NAV = [
  { to: "/cms", label: "Dashboard", end: true },
  { to: "/cms/pages", label: "Pages" },
  { to: "/cms/home", label: "Home" },
  { to: "/cms/collections", label: "Collections" },
  { to: "/cms/settings", label: "Settings" },
];

/**
 * Admin shell with sidebar navigation.
 */
export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminToken();
    navigate("/cms/login");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="admin-brand">MASHOOD Admin</p>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
          <a
            href={medusaAdminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav-external"
          >
            Medusa Admin ↗
          </a>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <span>Brand CMS</span>
          <div className="admin-header-actions">
            <a
              href={medusaAdminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Manage store in Medusa Admin
            </a>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
