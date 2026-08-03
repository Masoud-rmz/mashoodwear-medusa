import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AccountAddressesPanel from "../components/account/AccountAddressesPanel";
import {
  listCustomerOrders,
  mapOrderToAccountRow,
  updateCustomerMe,
} from "../api/medusa/customer";
import { useAuth } from "../context/AuthContext";
import { formatPriceWithToman } from "../utils/formatPrice";

/**
 * Buyer account — profile, saved Iran addresses, order history.
 */
export default function AccountPage() {
  const { isLoggedIn, loading, customer, logout, refreshCustomer } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      setFirstName(customer.first_name || "");
      setLastName(customer.last_name || "");
    }
  }, [customer]);

  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn) {
      return undefined;
    }

    setOrdersLoading(true);
    listCustomerOrders({ limit: 30 }).then((result) => {
      if (cancelled) return;
      setOrdersLoading(false);
      if (!result.ok) {
        setError(result.message || "خواندن سفارش‌ها ناموفق بود.");
        setOrders([]);
        return;
      }
      setOrders(result.orders.map(mapOrderToAccountRow));
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="auth-page" dir="rtl">
        <p className="auth-lead">در حال بارگذاری حساب…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await updateCustomerMe({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refreshCustomer();
    setMessage("پروفایل ذخیره شد.");
  }

  return (
    <div className="account-page" dir="rtl">
      <header className="account-header">
        <div>
          <h1 className="account-title">حساب من</h1>
          <p className="account-phone">{customer?.phone || "—"}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          خروج
        </button>
      </header>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-info">{message}</p>}

      <section className="account-panel">
        <h2 className="account-section-title">پروفایل</h2>
        <form className="auth-form" onSubmit={handleSaveProfile}>
          <label className="auth-label">
            نام
            <input
              className="auth-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            نام خانوادگی
            <input
              className="auth-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "در حال ذخیره…" : "ذخیره"}
          </button>
        </form>
      </section>

      <AccountAddressesPanel />

      <section className="account-panel">
        <h2 className="account-section-title">سفارش‌ها</h2>
        {ordersLoading ? (
          <p className="auth-lead">در حال بارگذاری سفارش‌ها…</p>
        ) : orders.length === 0 ? (
          <p className="auth-lead">
            هنوز سفارشی ندارید.{" "}
            <Link to="/products">مشاهده محصولات</Link>
          </p>
        ) : (
          <ul className="account-order-list">
            {orders.map((order) => (
              <li key={order.id} className="account-order-row">
                <div>
                  <Link to={`/account/orders/${order.id}`}>
                    <strong>
                      {order.paymentConfirmed
                        ? `کد پیگیری #${order.displayId}`
                        : `ثبت #${order.displayId}`}
                    </strong>
                  </Link>
                  <span className="account-order-meta">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("fa-IR")
                      : "—"}
                  </span>
                  <span
                    className={`account-payment-badge${
                      order.paymentConfirmed
                        ? " account-payment-badge--ok"
                        : " account-payment-badge--wait"
                    }`}
                  >
                    {order.paymentLabel}
                  </span>
                </div>
                <div className="account-order-right">
                  <span>
                    {formatPriceWithToman(order.total)} · {order.itemCount} قلم
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
