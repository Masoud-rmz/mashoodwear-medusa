import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AdminApp from "./admin/AdminApp";
import RequireCustomerAuth from "./components/RequireCustomerAuth";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CollectionsPage from "./pages/CollectionsPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryDetailPage from "./pages/CategoryDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import OrderResultPage from "./pages/OrderResultPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import HowToBuyPage from "./pages/HowToBuyPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import OrderDetailPage from "./pages/OrderDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/cms/*" element={<AdminApp />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection" element={<Navigate to="/products" replace />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/:slug" element={<CategoryDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <RequireCustomerAuth>
              <CheckoutPage />
            </RequireCustomerAuth>
          }
        />
        <Route
          path="/checkout/payment"
          element={
            <RequireCustomerAuth>
              <PaymentPage />
            </RequireCustomerAuth>
          }
        />
        <Route path="/order/result" element={<OrderResultPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/how-to-buy" element={<HowToBuyPage />} />
      </Route>
    </Routes>
  );
}
