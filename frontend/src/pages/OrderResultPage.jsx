import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  completeCheckoutCart,
  mapGatewayResultToUiStatus,
  readLastOrderSummary,
} from "../api/medusa/payment";
import {
  messageForPaymentError,
  messageForPaymentStatus,
} from "../api/medusa/paymentMessages";
import { useCart } from "../hooks/useCart";
import { useSite } from "../context/SiteContext";
import { formatPriceWithToman } from "../utils/formatPrice";

/**
 * Gateway return + order result (bank or card-to-card).
 * Card-to-card: order is registered first; then show card + receipt links.
 */
export default function OrderResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useCart();
  const { checkoutSettings } = useSite();
  const ranRef = useRef(false);

  const gatewayResult = searchParams.get("result");
  const cartIdFromQuery = searchParams.get("cart_id");
  const ref = searchParams.get("ref");
  const method = searchParams.get("method");
  const statusFromQuery = searchParams.get("status");
  const orderIdFromQuery = searchParams.get("order_id") || "";
  const displayIdFromQuery = searchParams.get("display_id");
  const amountFromQuery = searchParams.get("amount");

  const [status, setStatus] = useState(() => {
    if (statusFromQuery === "awaiting_receipt") {
      return "awaiting_receipt";
    }
    if (gatewayResult) {
      return mapGatewayResultToUiStatus(gatewayResult);
    }
    return "pending_payment";
  });
  const [orderId, setOrderId] = useState(orderIdFromQuery);
  const [displayId, setDisplayId] = useState(
    displayIdFromQuery != null && displayIdFromQuery !== ""
      ? displayIdFromQuery
      : null
  );
  const [errorCode, setErrorCode] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(gatewayResult) && method !== "card_to_card"
  );
  const [copiedCard, setCopiedCard] = useState(false);

  const bankCardNumber = checkoutSettings?.bankCardNumber || "";
  const bankCardHolder = checkoutSettings?.bankCardHolder || "";
  const bankName = checkoutSettings?.bankName || "";
  const orderAmount = amountFromQuery ? Number(amountFromQuery) : 0;

  const instagramUrl = checkoutSettings?.instagramDirectUrl || "";
  const telegramUsername = checkoutSettings?.telegramUsername || "";
  const telegramUrl = telegramUsername ? `https://t.me/${telegramUsername}` : "";

  const receiptMessage = (() => {
    const parts = ["سلام، رسید پرداخت کارت‌به‌کارت سفارش Mashoodwear را ارسال می‌کنم."];
    if (displayId != null) {
      parts.push(`شماره ثبت سفارش: ${displayId}`);
    }
    if (orderAmount > 0) {
      parts.push(`مبلغ: ${formatPriceWithToman(orderAmount)}`);
    }
    return parts.join(" ");
  })();

  const handleCopyCard = async () => {
    if (!bankCardNumber) {
      return;
    }
    try {
      await navigator.clipboard.writeText(bankCardNumber.replace(/\s/g, ""));
      setCopiedCard(true);
      window.setTimeout(() => setCopiedCard(false), 2000);
    } catch {
      setCopiedCard(false);
    }
  };

  useEffect(() => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    if (method === "card_to_card" || statusFromQuery === "awaiting_receipt") {
      const cached = readLastOrderSummary();
      setStatus("awaiting_receipt");
      setOrderId(orderIdFromQuery || cached?.orderId || "");
      setDisplayId(displayIdFromQuery ?? cached?.displayId ?? null);
      setLoading(false);
      void refresh();
      return;
    }

    const cached = readLastOrderSummary();
    if (
      (cached?.status === "paid" || cached?.status === "awaiting_receipt") &&
      cached.orderId &&
      !gatewayResult
    ) {
      setStatus(cached.status);
      setOrderId(cached.orderId);
      setDisplayId(cached.displayId ?? null);
      setLoading(false);
      return;
    }

    const uiFromGateway = mapGatewayResultToUiStatus(gatewayResult);

    if (uiFromGateway === "failed" || uiFromGateway === "config_incomplete") {
      setStatus(uiFromGateway === "config_incomplete" ? "config_incomplete" : "failed");
      setLoading(false);
      return;
    }

    if (!gatewayResult) {
      setStatus("pending_payment");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function finishOrder() {
      setLoading(true);
      setErrorCode(null);
      try {
        const result = await completeCheckoutCart(cartIdFromQuery || undefined);
        if (cancelled) {
          return;
        }
        setStatus(result.status);
        if (result.orderDisplay?.orderId) {
          setOrderId(result.orderDisplay.orderId);
          setDisplayId(result.orderDisplay.displayId);
        }
        if (result.error) {
          setErrorCode(result.error);
        }
        await refresh();
      } catch {
        if (!cancelled) {
          setStatus("pending_payment");
          setErrorCode("network_error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void finishOrder();
    return () => {
      cancelled = true;
    };
  }, [
    gatewayResult,
    cartIdFromQuery,
    refresh,
    method,
    statusFromQuery,
    orderIdFromQuery,
    displayIdFromQuery,
  ]);

  const title =
    status === "paid"
      ? "پرداخت تأیید شد"
      : status === "awaiting_receipt"
        ? "سفارش ثبت شد"
        : status === "failed"
          ? "پرداخت ناموفق"
          : status === "config_incomplete"
            ? "درگاه آماده نیست"
            : "در انتظار تأیید پرداخت";

  const statusClass =
    status === "paid"
      ? "order-result--paid"
      : status === "awaiting_receipt"
        ? "order-result--pending"
        : status === "failed" || status === "config_incomplete"
          ? "order-result--failed"
          : "order-result--pending";

  const showTracking = status === "paid";
  const showRegisterNumber = status === "awaiting_receipt" && displayId != null;

  return (
    <div className="checkout-page container" dir="rtl">
      <h1 className="page-title">{title}</h1>

      <section className={`checkout-panel order-result ${statusClass}`}>
        {loading ? (
          <p className="checkout-hint" role="status">
            در حال ثبت سفارش…
          </p>
        ) : (
          <>
            <p className="order-result-message" role="status">
              {messageForPaymentStatus(status)}
            </p>

            {errorCode && status !== "paid" && status !== "awaiting_receipt" && (
              <p className="checkout-error" role="alert">
                {messageForPaymentError(errorCode)}
              </p>
            )}

            {showTracking && (
              <dl className="order-result-meta">
                {displayId != null && (
                  <>
                    <dt>کد پیگیری</dt>
                    <dd className="order-result-tracking">{displayId}</dd>
                  </>
                )}
                {orderId && (
                  <>
                    <dt>شناسه سفارش</dt>
                    <dd className="order-result-id">{orderId}</dd>
                  </>
                )}
              </dl>
            )}

            {showRegisterNumber && (
              <dl className="order-result-meta">
                <dt>شماره ثبت سفارش</dt>
                <dd className="order-result-tracking">{displayId}</dd>
              </dl>
            )}

            {status === "awaiting_receipt" && (
              <>
                <h2 className="checkout-section-title">۲ — کارت‌به‌کارت</h2>
                {orderAmount > 0 && (
                  <p className="checkout-pay-amount">
                    <span>مبلغ قابل واریز</span>
                    <strong>{formatPriceWithToman(orderAmount)}</strong>
                  </p>
                )}
                {bankCardNumber ? (
                  <dl className="payment-card-details">
                    <dt>شماره کارت</dt>
                    <dd className="payment-card-number">
                      <span>{bankCardNumber}</span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCopyCard}
                      >
                        {copiedCard ? "کپی شد" : "کپی"}
                      </button>
                    </dd>
                    {bankCardHolder && (
                      <>
                        <dt>به نام</dt>
                        <dd>{bankCardHolder}</dd>
                      </>
                    )}
                    {bankName && (
                      <>
                        <dt>بانک</dt>
                        <dd>{bankName}</dd>
                      </>
                    )}
                  </dl>
                ) : (
                  <p className="checkout-error" role="alert">
                    شماره کارت در تنظیمات سایت ثبت نشده. با پشتیبانی تماس بگیرید.
                  </p>
                )}

                <ol className="order-result-steps">
                  <li>مبلغ بالا را به کارت واریز کنید</li>
                  <li>رسید را با ذکر شماره ثبت سفارش بفرستید</li>
                  <li>پس از تأیید ادمین، کد پیگیری در «حساب من» ظاهر می‌شود</li>
                </ol>

                <h2 className="checkout-section-title">۳ — ارسال رسید</h2>
                <div className="payment-receipt-links">
                  {instagramUrl && (
                    <a
                      className="btn btn-primary"
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ارسال رسید در اینستاگرام
                    </a>
                  )}
                  {telegramUrl && (
                    <a
                      className="btn btn-primary"
                      href={`${telegramUrl}?text=${encodeURIComponent(receiptMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ارسال رسید در تلگرام
                    </a>
                  )}
                  {!instagramUrl && !telegramUrl && (
                    <p className="checkout-hint">
                      لینک اینستاگرام/تلگرام در CMS تنظیم نشده است.
                    </p>
                  )}
                </div>
              </>
            )}

            {ref && status === "paid" && (
              <p className="checkout-hint">
                کد پیگیری درگاه: <span className="order-result-id">{ref}</span>
              </p>
            )}

            <div className="checkout-pay-actions">
              {status === "awaiting_receipt" && (
                <>
                  {orderId ? (
                    <Link
                      to={`/account/orders/${orderId}`}
                      className="btn btn-primary"
                    >
                      مشاهده سفارش در حساب
                    </Link>
                  ) : (
                    <Link to="/account" className="btn btn-primary">
                      حساب من
                    </Link>
                  )}
                  <Link to="/products" className="btn btn-secondary">
                    ادامه خرید
                  </Link>
                </>
              )}
              {showTracking && (
                <>
                  {orderId && (
                    <Link
                      to={`/account/orders/${orderId}`}
                      className="btn btn-primary"
                    >
                      جزئیات سفارش
                    </Link>
                  )}
                  <Link to="/products" className="btn btn-secondary">
                    ادامه خرید
                  </Link>
                </>
              )}
              {(status === "failed" || status === "config_incomplete") && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate("/checkout/payment")}
                  >
                    تلاش مجدد پرداخت
                  </button>
                  <Link to="/checkout" className="btn btn-secondary">
                    بازگشت به checkout
                  </Link>
                </>
              )}
              {status === "pending_payment" && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    بررسی دوباره
                  </button>
                  <Link to="/checkout/payment" className="btn btn-secondary">
                    بازگشت به پرداخت
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
