import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StateMessage from "../components/StateMessage";
import { useCart } from "../hooks/useCart";
import { useSite } from "../context/SiteContext";
import { isMedusaCommerceEnabled } from "../api/medusa/client";
import {
  completeCardToCardCheckout,
  getPaymentCartTotals,
  initiateIranBankPayment,
  redirectToIranBankGateway,
} from "../api/medusa/payment";
import { messageForPaymentError } from "../api/medusa/paymentMessages";
import { formatPriceWithToman } from "../utils/formatPrice";

/**
 * Payment step — register order first for card-to-card; then pay + send receipt on result page.
 */
export default function PaymentPage() {
  const navigate = useNavigate();
  const { items, loading: cartLoading, refresh } = useCart();
  const { checkoutSettings } = useSite();
  const medusaEnabled = isMedusaCommerceEnabled();

  const [method, setMethod] = useState("card_to_card");
  const [totals, setTotals] = useState(() => getPaymentCartTotals());
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [amountIrr, setAmountIrr] = useState(0);
  const [preparingBank, setPreparingBank] = useState(false);
  const [bankReady, setBankReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  const bankCardNumber = checkoutSettings?.bankCardNumber || "";
  const displayTotal = amountIrr || totals.grandTotal;

  useEffect(() => {
    setTotals(getPaymentCartTotals());
  }, [items]);

  useEffect(() => {
    if (method !== "bank" || !medusaEnabled) {
      return undefined;
    }

    let cancelled = false;

    async function prepareBank() {
      setPreparingBank(true);
      setError(null);
      setBankReady(false);
      setRedirectUrl(null);

      try {
        await refresh();
        const session = await initiateIranBankPayment();
        if (cancelled) {
          return;
        }
        setTotals(session.totals);
        setRedirectUrl(session.redirectUrl);
        setAmountIrr(session.amountIrr || session.totals.grandTotal);
        if (session.error === "config_incomplete" || !session.redirectUrl) {
          setError(session.error || "bank_gateway_unavailable");
          setBankReady(false);
        } else {
          setBankReady(true);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const code = err?.code || err?.message || "payment_session_failed";
        setError(
          ["shipping_required", "config_incomplete", "network_error"].includes(code)
            ? code
            : "payment_session_failed"
        );
        setBankReady(false);
      } finally {
        if (!cancelled) {
          setPreparingBank(false);
        }
      }
    }

    void prepareBank();
    return () => {
      cancelled = true;
    };
  }, [method, medusaEnabled, refresh]);

  const handleBankPay = () => {
    if (!redirectUrl) {
      setError("bank_gateway_unavailable");
      return;
    }
    setPaying(true);
    try {
      redirectToIranBankGateway(redirectUrl);
    } catch {
      setPaying(false);
      setError("redirect_unavailable");
    }
  };

  const handleRegisterOrder = async () => {
    setPaying(true);
    setError(null);
    try {
      await refresh();
      const result = await completeCardToCardCheckout();
      if (!result.ok) {
        setError(result.error || "complete_failed");
        setPaying(false);
        return;
      }
      const params = new URLSearchParams({
        method: "card_to_card",
        status: "awaiting_receipt",
      });
      if (result.orderDisplay?.orderId) {
        params.set("order_id", result.orderDisplay.orderId);
      }
      if (result.orderDisplay?.displayId != null) {
        params.set("display_id", String(result.orderDisplay.displayId));
      }
      if (displayTotal) {
        params.set("amount", String(displayTotal));
      }
      navigate(`/order/result?${params.toString()}`, { replace: true });
    } catch (err) {
      const code = err?.code || "complete_failed";
      setError(code === "shipping_required" ? "shipping_required" : "complete_failed");
      setPaying(false);
    }
  };

  if (cartLoading && items.length === 0) {
    return (
      <div className="checkout-page container">
        <h1 className="page-title">پرداخت</h1>
        <p className="cart-loading" role="status">
          Loading…
        </p>
      </div>
    );
  }

  if (items.length === 0 && !paying) {
    return (
      <div className="checkout-page container">
        <h1 className="page-title">پرداخت</h1>
        <StateMessage
          variant="empty"
          message="سبد خرید خالی است — قبل از پرداخت محصول اضافه کنید"
          actionLabel="بازگشت به سبد"
          onAction={() => navigate("/cart")}
        />
      </div>
    );
  }

  if (!medusaEnabled) {
    return (
      <div className="checkout-page container">
        <h1 className="page-title">پرداخت</h1>
        <StateMessage
          variant="error"
          message="تنظیمات Medusa ناقص است."
          actionLabel="بازگشت"
          onAction={() => navigate("/checkout")}
        />
      </div>
    );
  }

  return (
    <div className="checkout-page container" dir="rtl">
      <h1 className="page-title">پرداخت</h1>
      <p className="checkout-lead">
        ابتدا سفارش را ثبت کنید. بعد از ثبت، شماره کارت و لینک ارسال رسید نشان داده
        می‌شود.
      </p>

      <div className="checkout-layout">
        <section className="checkout-panel">
          <h2 className="checkout-section-title">روش پرداخت</h2>
          <div className="payment-method-tabs" role="tablist">
            <button
              type="button"
              className={method === "card_to_card" ? "auth-chip active" : "auth-chip"}
              onClick={() => {
                setMethod("card_to_card");
                setError(null);
              }}
            >
              کارت‌به‌کارت
            </button>
            <button
              type="button"
              className={method === "bank" ? "auth-chip active" : "auth-chip"}
              onClick={() => {
                setMethod("bank");
                setError(null);
              }}
            >
              درگاه بانکی
            </button>
          </div>

          {error && (
            <p className="checkout-error" role="alert">
              {messageForPaymentError(error) ||
                (error === "bank_gateway_unavailable"
                  ? "درگاه بانکی واقعی هنوز فعال نیست. از کارت‌به‌کارت استفاده کنید."
                  : error)}
            </p>
          )}

          {method === "card_to_card" ? (
            <div className="payment-card-transfer">
              <ol className="order-result-steps">
                <li>
                  <strong>الان:</strong> دکمه «ثبت سفارش» را بزنید
                </li>
                <li>
                  <strong>بعد:</strong> مبلغ را کارت‌به‌کارت واریز کنید
                </li>
                <li>
                  <strong>سپس:</strong> رسید را برای ادمین بفرستید
                </li>
              </ol>

              <p className="checkout-pay-amount">
                <span>مبلغ سفارش</span>
                <strong>{formatPriceWithToman(displayTotal)}</strong>
              </p>

              {!bankCardNumber && (
                <p className="checkout-hint" role="status">
                  توجه: شماره کارت در CMS تنظیم نشده؛ بعد از ثبت سفارش ممکن است
                  جزئیات کارت خالی باشد.
                </p>
              )}

              <button
                type="button"
                className="btn btn-primary"
                disabled={paying}
                onClick={handleRegisterOrder}
              >
                {paying ? "در حال ثبت سفارش…" : "۱ — ثبت سفارش"}
              </button>
            </div>
          ) : (
            <div className="payment-bank-gateway">
              <p className="checkout-hint">
                درگاه بانکی واقعی هنوز وصل نشده است. می‌توانید از stub استفاده کنید یا
                کارت‌به‌کارت را انتخاب کنید.
              </p>
              {preparingBank && (
                <p className="checkout-hint" role="status">
                  در حال آماده‌سازی درگاه…
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary"
                disabled={paying || preparingBank || !bankReady}
                onClick={handleBankPay}
              >
                {paying ? "در حال انتقال…" : "ادامه به درگاه بانکی"}
              </button>
              {!bankReady && !preparingBank && (
                <p className="checkout-hint">
                  اگر درگاه آماده نیست، از تب «کارت‌به‌کارت» استفاده کنید.
                </p>
              )}
            </div>
          )}
        </section>

        <aside className="checkout-summary">
          <h2 className="checkout-summary-title">خلاصه</h2>
          <p className="checkout-total">
            <span>مبلغ قابل پرداخت</span>
            <span>{formatPriceWithToman(displayTotal)}</span>
          </p>
          <Link to="/checkout" className="btn btn-secondary">
            بازگشت به آدرس / ارسال
          </Link>
        </aside>
      </div>
    </div>
  );
}
