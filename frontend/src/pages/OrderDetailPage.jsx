import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import OrderReturnPanel from "../components/account/OrderReturnPanel";
import {
  getCustomerOrderById,
  mapOrderToDetail,
} from "../api/medusa/customer";
import { useAuth } from "../context/AuthContext";
import { formatPriceWithToman } from "../utils/formatPrice";

/**
 * Buyer order detail — line items, totals (incl. tax), return request.
 */
export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn || !orderId) {
      return undefined;
    }

    setLoading(true);
    setError(null);
    getCustomerOrderById(orderId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok || !result.order) {
        setError(result.message || "سفارش پیدا نشد.");
        setOrder(null);
        return;
      }
      setOrder(mapOrderToDetail(result.order));
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, orderId]);

  if (authLoading) {
    return (
      <div className="account-page" dir="rtl">
        <p className="auth-lead">در حال بارگذاری…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="account-page order-detail-page" dir="rtl">
      <header className="account-header">
        <div>
          <Link to="/account" className="back-link">
            ← حساب من
          </Link>
          <h1 className="account-title">
            {order
              ? order.paymentConfirmed
                ? `کد پیگیری #${order.displayId}`
                : `سفارش ثبت‌شده #${order.displayId}`
              : "جزئیات سفارش"}
          </h1>
        </div>
      </header>

      {loading && <p className="auth-lead">در حال بارگذاری سفارش…</p>}
      {error && <p className="auth-error">{error}</p>}

      {!loading && order && (
        <>
          <section className="account-panel">
            {order.paymentConfirmed ? (
              <p className="order-result-message" role="status">
                پرداخت تأیید شده است. کد پیگیری شما:{" "}
                <strong className="order-result-tracking">{order.displayId}</strong>
              </p>
            ) : (
              <p className="order-result-message" role="status">
                سفارش ثبت شده و در انتظار تأیید رسید توسط ادمین است. پس از تأیید،
                همین شماره به‌عنوان کد پیگیری نمایش داده می‌شود.
              </p>
            )}
            <p className="account-order-meta">
              وضعیت پرداخت: <strong>{order.paymentLabel}</strong>
              {order.fulfillmentStatus
                ? ` · ارسال: ${order.fulfillmentStatus}`
                : ""}
            </p>
            <p className="account-order-meta">
              تاریخ:{" "}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("fa-IR")
                : "—"}
            </p>
          </section>

          <section className="account-panel">
            <h2 className="account-section-title">اقلام</h2>
            <ul className="account-order-list">
              {order.items.map((item) => (
                <li key={item.id} className="account-order-row">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="account-order-meta">
                      تعداد: {item.quantity}
                    </span>
                  </div>
                  <div className="account-order-right">
                    {formatPriceWithToman(item.unitPrice * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="account-panel">
            <h2 className="account-section-title">مبالغ</h2>
            <div className="checkout-subtotal">
              <span>اقلام</span>
              <span>{formatPriceWithToman(order.itemSubtotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="checkout-subtotal">
                <span>تخفیف</span>
                <span>−{formatPriceWithToman(order.discountTotal)}</span>
              </div>
            )}
            {order.giftCardTotal > 0 && (
              <div className="checkout-subtotal">
                <span>کارت هدیه</span>
                <span>−{formatPriceWithToman(order.giftCardTotal)}</span>
              </div>
            )}
            <div className="checkout-subtotal">
              <span>ارسال</span>
              <span>{formatPriceWithToman(order.shippingTotal)}</span>
            </div>
            <div className="checkout-subtotal">
              <span>مالیات</span>
              <span>{formatPriceWithToman(order.taxTotal)}</span>
            </div>
            <div className="checkout-total">
              <span>جمع</span>
              <span>{formatPriceWithToman(order.total)}</span>
            </div>
          </section>

          <OrderReturnPanel orderId={order.id} items={order.items} />
        </>
      )}
    </div>
  );
}
