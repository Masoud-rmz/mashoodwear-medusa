/**
 * Require logged-in customer for checkout routes.
 * purpose --- redirect guests to login with return path ---
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function RequireCustomerAuth({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" role="status">
        <p className="cart-loading">در حال بررسی ورود…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?mode=register&redirect=${encodeURIComponent(redirect)}`}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}
