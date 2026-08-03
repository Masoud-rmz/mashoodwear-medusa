import { Navigate, Outlet } from "react-router-dom";
import { isAdminAuthenticated } from "../../utils/adminAuth";

/**
 * Guard admin routes — redirect to login when no token.
 */
export default function ProtectedRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
