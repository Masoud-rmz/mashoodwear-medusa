import { useState } from "react";

/**
 * Apply / remove Medusa promotion codes on the cart.
 * Codes are created in Medusa Admin — this UI only calls Store API.
 * @param {{
 *   promotions: Array<{ code: string, id?: string }>,
 *   onApply: (code: string) => Promise<void>,
 *   onRemove: (code: string) => Promise<void>,
 *   disabled?: boolean
 * }} props
 */
export default function PromoCodeForm({
  promotions,
  onApply,
  onRemove,
  disabled = false,
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleApply = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || busy || disabled) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      await onApply(trimmed);
      setCode("");
      setMessage("کد تخفیف اعمال شد");
    } catch (err) {
      setIsError(true);
      setMessage(err?.message || "اعمال کد ممکن نشد");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (promoCode) => {
    if (busy || disabled) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      await onRemove(promoCode);
      setMessage("کد تخفیف حذف شد");
    } catch (err) {
      setIsError(true);
      setMessage(err?.message || "حذف کد ممکن نشد");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="promo-code-block">
      <p className="promo-code-label">کد تخفیف</p>
      <form className="promo-code-form" onSubmit={handleApply}>
        <input
          type="text"
          className="promo-code-input"
          name="promo_code"
          autoComplete="off"
          placeholder="مثلاً SUMMER20"
          value={code}
          disabled={busy || disabled}
          onChange={(event) => setCode(event.target.value)}
          aria-label="کد تخفیف"
        />
        <button
          type="submit"
          className="btn btn-primary promo-code-apply"
          disabled={busy || disabled || !code.trim()}
        >
          {busy ? "…" : "اعمال"}
        </button>
      </form>

      {promotions.length > 0 && (
        <ul className="promo-code-list">
          {promotions.map((promo) => (
            <li key={promo.id || promo.code} className="promo-code-chip">
              <span>{promo.code}</span>
              <button
                type="button"
                className="promo-code-remove"
                disabled={busy || disabled}
                onClick={() => handleRemove(promo.code)}
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p
          className={`promo-code-message${isError ? " promo-code-message--error" : ""}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
