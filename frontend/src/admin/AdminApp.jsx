import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CommerceMovedToMedusaPage from "./pages/CommerceMovedToMedusaPage";
import CollectionsListPage from "./pages/CollectionsListPage";
import CollectionFormPage from "./pages/CollectionFormPage";
import PagesEditorPage from "./pages/PagesEditorPage";
import HomeSettingsPage from "./pages/HomeSettingsPage";
import SettingsPage from "./pages/SettingsPage";

/**
 * Admin SPA routes under /cms.
 * Path A: products/categories CRUD removed; commerce → Medusa Admin only.
 */
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="products"
            element={<CommerceMovedToMedusaPage resource="products" />}
          />
          <Route
            path="products/*"
            element={<CommerceMovedToMedusaPage resource="products" />}
          />
          <Route
            path="categories"
            element={<CommerceMovedToMedusaPage resource="categories" />}
          />
          <Route path="collections" element={<CollectionsListPage />} />
          <Route path="collections/new" element={<CollectionFormPage />} />
          <Route path="collections/:id" element={<CollectionFormPage />} />
          <Route path="pages" element={<PagesEditorPage />} />
          <Route path="home" element={<HomeSettingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/cms" replace />} />
    </Routes>
  );
}
