import { useState } from "react";

/**
 * Apply / remove Medusa gift card codes on the cart (Loyalty plugin Store API).
 * @param {{
 *   giftCards: Array<{ code: string, id?: string }>,
 *   onApply: (code: string) => Promise<void>,
 *   onRemove: (code: string) => Promise<void>,
 *   disabled?: boolean
 * }} props
 */
export default function GiftCodeForm({
  giftCards = [],
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
      setMessage("کارت هدیه اعمال شد");
    } catch (err) {
      setIsError(true);
      setMessage(err?.message || "اعمال کارت هدیه ممکن نشد");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (giftCode) => {
    if (busy || disabled) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      await onRemove(giftCode);
      setMessage("کارت هدیه حذف شد");
    } catch (err) {
      setIsError(true);
      setMessage(err?.message || "حذف کارت هدیه ممکن نشد");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="promo-code-block">
      <p className="promo-code-label">کارت هدیه</p>
      <form className="promo-code-form" onSubmit={handleApply}>
        <input
          type="text"
          className="promo-code-input"
          name="gift_code"
          autoComplete="off"
          placeholder="کد کارت هدیه"
          value={code}
          disabled={busy || disabled}
          onChange={(event) => setCode(event.target.value)}
          aria-label="کد کارت هدیه"
        />
        <button
          type="submit"
          className="btn btn-primary promo-code-apply"
          disabled={busy || disabled || !code.trim()}
        >
          {busy ? "…" : "اعمال"}
        </button>
      </form>

      {giftCards.length > 0 && (
        <ul className="promo-code-list">
          {giftCards.map((card) => (
            <li key={card.id || card.code} className="promo-code-chip">
              <span>{card.code}</span>
              <button
                type="button"
                className="promo-code-remove"
                disabled={busy || disabled}
                onClick={() => handleRemove(card.code)}
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
