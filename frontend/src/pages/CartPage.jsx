import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StateMessage from "../components/StateMessage";
import ProductImage from "../components/ProductImage";
import PromoCodeForm from "../components/cart/PromoCodeForm";
import GiftCodeForm from "../components/cart/GiftCodeForm";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../hooks/useCart";
import { isCheckoutEnabled } from "../utils/cartStorage";
import { formatPrice, formatPriceWithToman } from "../utils/formatPrice";
import { isMedusaCommerceEnabled } from "../api/medusa/client";
import { DEFAULT_COLOR_SENTINEL } from "../api/medusa/mappers.js";

/**
 * Shopping cart page with qty controls, Medusa promo codes, and checkout CTA.
 */
export default function CartPage() {
  const {
    items,
    loading,
    error,
    refresh,
    updateQuantity,
    removeItem,
    moneySummary,
    applyPromoCode,
    removePromoCode,
    applyGiftCode,
    removeGiftCode,
  } = useCart();
  const { isLoggedIn } = useAuth();
  const [stockMessage, setStockMessage] = useState(null);
  const [busyLineId, setBusyLineId] = useState(null);
  const medusaEnabled = isMedusaCommerceEnabled();

  const checkoutEnabled = isCheckoutEnabled(items);
  const displayTotal = useMemo(() => {
    if (medusaEnabled && moneySummary?.total !== undefined) {
      return moneySummary.total;
    }
    return items.reduce(
      (sum, line) => sum + (Number(line.price) || 0) * (Number(line.quantity) || 0),
      0
    );
  }, [medusaEnabled, moneySummary, items]);

  const lineKey = (line) =>
    line.lineItemId ||
    `${line.productId}-${line.selectedSize}-${line.selectedColor}`;

  const formatVariantLabel = (line) => {
    const parts = [];
    if (line.selectedSize) {
      parts.push(line.selectedSize);
    }
    if (line.selectedHeight) {
      parts.push(line.selectedHeight);
    }
    const color = line.selectedColor;
    if (color && color !== DEFAULT_COLOR_SENTINEL) {
      parts.push(color);
    }
    if (parts.length === 0) {
      return "One size";
    }
    return parts.join(", ");
  };

  const handleQuantityChange = async (line, delta) => {
    const nextQty = line.quantity + delta;
    const key = lineKey(line);
    setBusyLineId(key);
    try {
      const { capped } = await updateQuantity(line, nextQty);
      if (capped) {
        setStockMessage(
          "Quantity adjusted — not enough stock for that size and color"
        );
      } else {
        setStockMessage(null);
      }
    } catch {
      setStockMessage("Could not update quantity — try again");
    } finally {
      setBusyLineId(null);
    }
  };

  const handleRemove = async (line) => {
    const key = lineKey(line);
    setBusyLineId(key);
    try {
      await removeItem(line);
      setStockMessage(null);
    } catch {
      setStockMessage("Could not remove item — try again");
    } finally {
      setBusyLineId(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="cart-page container">
        <h1 className="page-title">Cart</h1>
        <p className="cart-loading" role="status">
          Loading cart…
        </p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="cart-page container">
        <h1 className="page-title">Cart</h1>
        <StateMessage
          variant="error"
          message="Couldn't load your cart"
          actionLabel="Try again"
          onAction={() => {
            refresh();
          }}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page container">
        <h1 className="page-title">Cart</h1>
        <StateMessage
          variant="empty"
          message="Your cart is empty"
          actionLabel="View Products"
          onAction={() => {
            window.location.href = "/products";
          }}
        />
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1 className="page-title">Cart</h1>

      {stockMessage && (
        <p className="cart-stock-message" role="alert">
          {stockMessage}
        </p>
      )}

      {!isLoggedIn && (
        <p className="cart-stock-message" role="status">
          برای تکمیل خرید باید وارد حساب شوید یا ثبت‌نام کنید.
        </p>
      )}

      <div className="cart-lines">
        {items.map((line) => {
          const key = lineKey(line);
          const busy = busyLineId === key;
          return (
            <article key={key} className="cart-line">
              <Link to={`/products/${line.slug}`} className="cart-line-image">
                <ProductImage
                  src={line.imageUrl}
                  fallbackClassName="cart-line-image--placeholder"
                  fallbackLabel="No image"
                />
              </Link>

              <div className="cart-line-body">
                <Link to={`/products/${line.slug}`} className="cart-line-name">
                  {line.name}
                </Link>
                <p className="cart-line-variant">{formatVariantLabel(line)}</p>
                <p className="cart-line-unit">{formatPrice(line.price)} each</p>

                <div className="cart-line-actions">
                  <div className="qty-control" aria-label="Quantity">
                    <button
                      type="button"
                      className="qty-btn"
                      aria-label="Decrease quantity"
                      disabled={busy}
                      onClick={() => handleQuantityChange(line, -1)}
                    >
                      −
                    </button>
                    <span className="qty-value">{line.quantity}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      aria-label="Increase quantity"
                      disabled={busy}
                      onClick={() => handleQuantityChange(line, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cart-remove-btn"
                    disabled={busy}
                    onClick={() => handleRemove(line)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="cart-line-total">
                {formatPriceWithToman(line.price * line.quantity)}
              </p>
            </article>
          );
        })}
      </div>

      <div className="cart-footer">
        {medusaEnabled && (
          <>
            <PromoCodeForm
              promotions={moneySummary.promotions || []}
              onApply={applyPromoCode}
              onRemove={removePromoCode}
            />
            <GiftCodeForm
              giftCards={moneySummary.giftCards || []}
              onApply={applyGiftCode}
              onRemove={removeGiftCode}
            />
          </>
        )}

        <div className="cart-totals">
          {medusaEnabled && (
            <>
              <p className="cart-total-row">
                <span>جمع اقلام</span>
                <span>{formatPriceWithToman(moneySummary.itemSubtotal)}</span>
              </p>
              {moneySummary.discountTotal > 0 && (
                <p className="cart-total-row cart-total-row--discount">
                  <span>تخفیف</span>
                  <span>−{formatPriceWithToman(moneySummary.discountTotal)}</span>
                </p>
              )}
              {moneySummary.giftCardTotal > 0 && (
                <p className="cart-total-row cart-total-row--discount">
                  <span>کارت هدیه</span>
                  <span>−{formatPriceWithToman(moneySummary.giftCardTotal)}</span>
                </p>
              )}
              {moneySummary.shippingTotal > 0 && (
                <p className="cart-total-row">
                  <span>ارسال</span>
                  <span>{formatPriceWithToman(moneySummary.shippingTotal)}</span>
                </p>
              )}
              <p className="cart-total-row">
                <span>مالیات</span>
                <span>{formatPriceWithToman(moneySummary.taxTotal || 0)}</span>
              </p>
            </>
          )}
          <p className="cart-grand-total">
            <span>Total</span>
            <span>{formatPriceWithToman(displayTotal)}</span>
          </p>
        </div>

        <Link
          to={
            isLoggedIn
              ? "/checkout"
              : `/login?mode=register&redirect=${encodeURIComponent("/checkout")}`
          }
          className={`btn btn-primary${checkoutEnabled ? "" : " btn-disabled"}`}
          aria-disabled={!checkoutEnabled}
          onClick={(event) => {
            if (!checkoutEnabled) {
              event.preventDefault();
            }
          }}
        >
          {isLoggedIn ? "Continue to Checkout" : "ورود / ثبت‌نام برای خرید"}
        </Link>
      </div>
    </div>
  );
}
