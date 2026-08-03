import { useEffect, useMemo, useState } from "react";
import {
  createReturnRequest,
  listReturnShippingOptions,
} from "../../api/medusa/returns";

/**
 * Buyer return request form for an order detail page.
 * @param {{
 *   orderId: string,
 *   items: Array<{ id: string, title: string, quantity: number, returnableQuantity: number }>
 * }} props
 */
export default function OrderReturnPanel({ orderId, items }) {
  const returnableItems = useMemo(
    () => (items || []).filter((item) => Number(item.returnableQuantity) > 0),
    [items]
  );

  const [selected, setSelected] = useState(() => ({}));
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingOptionId, setShippingOptionId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    listReturnShippingOptions().then((result) => {
      if (cancelled) return;
      setLoadingOptions(false);
      if (!result.ok) {
        setShippingOptions([]);
        setError(result.message || null);
        return;
      }
      setShippingOptions(result.options);
      setShippingOptionId(result.options[0]?.id || "");
      if (result.options.length === 0) {
        setError(
          "روش ارسال مرجوعی در بک‌اند تعریف نشده — درخواست ثبت نمی‌شود تا Shipping Option با is_return فعال شود."
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (returnableItems.length === 0) {
    return (
      <section className="account-panel" id="order-return-panel">
        <h2 className="account-section-title">مرجوعی</h2>
        <p className="auth-lead">
          فعلاً قلم قابل‌مرجوعی برای این سفارش وجود ندارد (معمولاً پس از تحویل).
        </p>
      </section>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const payloadItems = returnableItems
      .map((item) => ({
        id: item.id,
        quantity: Number(selected[item.id]) || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (payloadItems.length === 0) {
      setBusy(false);
      setError("حداقل یک قلم برای مرجوعی انتخاب کنید.");
      return;
    }

    const result = await createReturnRequest({
      orderId,
      items: payloadItems,
      returnShippingOptionId: shippingOptionId,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage("درخواست مرجوعی ثبت شد.");
  }

  return (
    <section className="account-panel" id="order-return-panel">
      <h2 className="account-section-title">مرجوعی</h2>
      {loadingOptions && <p className="auth-lead">در حال بارگذاری روش ارسال…</p>}
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-info">{message}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <ul className="account-order-list">
          {returnableItems.map((item) => (
            <li key={item.id} className="account-order-row">
              <div>
                <strong>{item.title}</strong>
                <span className="account-order-meta">
                  قابل مرجوعی: {item.returnableQuantity}
                </span>
              </div>
              <label className="auth-label">
                تعداد
                <input
                  className="auth-input"
                  type="number"
                  min={0}
                  max={item.returnableQuantity}
                  value={selected[item.id] ?? 0}
                  onChange={(event) =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.id]: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
            </li>
          ))}
        </ul>

        {shippingOptions.length > 0 && (
          <label className="auth-label">
            روش ارسال مرجوعی
            <select
              className="auth-input"
              value={shippingOptionId}
              onChange={(event) => setShippingOptionId(event.target.value)}
              required
            >
              {shippingOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !shippingOptionId || shippingOptions.length === 0}
        >
          {busy ? "در حال ثبت…" : "ثبت درخواست مرجوعی"}
        </button>
      </form>
    </section>
  );
}
