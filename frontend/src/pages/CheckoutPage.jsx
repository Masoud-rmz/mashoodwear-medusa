import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import StateMessage from "../components/StateMessage";
import IranAddressForm from "../components/checkout/IranAddressForm";
import ShippingOptionsList from "../components/checkout/ShippingOptionsList";
import { useSite } from "../context/SiteContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../hooks/useCart";
import { isMedusaCommerceEnabled } from "../api/medusa/client";
import {
  buildIranAddressPayload,
  extractCartTotals,
  getCheckoutCartSnapshot,
  listCartShippingOptions,
  setCartShippingOption,
  updateCartIranAddress,
  validateIranCheckoutAddress,
} from "../api/medusa/checkout";
import {
  createCustomerAddress,
  formatCustomerAddressLabel,
  listCustomerAddresses,
} from "../api/medusa/customer";
import {
  mapIranAddressFieldErrors,
  messageForCheckoutError,
} from "../api/medusa/checkoutMessages";
import { calculateCartTotal } from "../utils/cartStorage";
import { formatPriceWithToman } from "../utils/formatPrice";
import { buildOrderCopyText } from "../utils/orderCopy";

const EMPTY_ADDRESS = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  province: "",
  city: "",
  address_1: "",
  postal_code: "",
};

/**
 * Checkout — Iran address (C-03) + shipping (C-04); DM is optional fallback only.
 */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { checkoutSettings } = useSite();
  const { isLoggedIn, customer } = useAuth();
  const { items, loading: cartLoading, refresh } = useCart();
  const medusaEnabled = isMedusaCommerceEnabled();

  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [saveToAccount, setSaveToAccount] = useState(true);

  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingId, setSelectedShippingId] = useState(null);
  const [savingShipping, setSavingShipping] = useState(false);
  const [shippingReady, setShippingReady] = useState(false);

  const [cartTotals, setCartTotals] = useState({
    itemTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    discountTotal: 0,
    giftCardTotal: 0,
    grandTotal: 0,
  });
  const [toastMessage, setToastMessage] = useState(null);

  const instagramUrl = checkoutSettings?.instagramDirectUrl || "";
  const telegramUsername = checkoutSettings?.telegramUsername || "";
  const telegramUrl = telegramUsername ? `https://t.me/${telegramUsername}` : "";

  const localItemTotal = useMemo(() => calculateCartTotal(items), [items]);

  useEffect(() => {
    const cart = getCheckoutCartSnapshot();
    if (cart) {
      setCartTotals(extractCartTotals(cart));
    } else {
      setCartTotals({
        itemTotal: localItemTotal,
        shippingTotal: 0,
        taxTotal: 0,
        discountTotal: 0,
        giftCardTotal: 0,
        grandTotal: localItemTotal,
      });
    }
  }, [items, localItemTotal, shippingReady, addressSaved]);

  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn || !medusaEnabled) {
      setSavedAddresses([]);
      setSelectedSavedId("");
      return undefined;
    }

    listCustomerAddresses().then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      setSavedAddresses(result.addresses);
      const defaultAddress =
        result.addresses.find((row) => row.isDefaultShipping) ||
        result.addresses[0];
      if (defaultAddress) {
        setSelectedSavedId(defaultAddress.id);
        setAddress({
          first_name: defaultAddress.firstName,
          last_name: defaultAddress.lastName,
          phone: defaultAddress.phone,
          email: "",
          province: defaultAddress.province,
          city: defaultAddress.city,
          address_1: defaultAddress.address1,
          postal_code: defaultAddress.postalCode,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, medusaEnabled]);

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setSelectedSavedId("");
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const handleSelectSavedAddress = (addressId) => {
    setSelectedSavedId(addressId);
    setFormError(null);
    setFieldErrors({});
    if (!addressId) {
      return;
    }
    const row = savedAddresses.find((item) => item.id === addressId);
    if (!row) {
      return;
    }
    setAddress({
      first_name: row.firstName,
      last_name: row.lastName,
      phone: row.phone,
      email: "",
      province: row.province,
      city: row.city,
      address_1: row.address1,
      postal_code: row.postalCode,
    });
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    if (!medusaEnabled) {
      setFormError("Checkout به Medusa ایرانیزه متصل نیست.");
      return;
    }

    setSavingAddress(true);
    setFormError(null);
    setFieldErrors({});
    setAddressSaved(false);
    setShippingReady(false);
    setSelectedShippingId(null);
    setShippingOptions([]);

    const payload = buildIranAddressPayload(address);

    try {
      const validation = await validateIranCheckoutAddress(payload);
      if (!validation.ok) {
        setFieldErrors(mapIranAddressFieldErrors(validation.fields));
        setFormError(messageForCheckoutError(validation.error));
        return;
      }

      const customerEmail =
        customer?.email ||
        address.email ||
        (address.phone
          ? `${String(address.phone).replace(/\D/g, "")}@phone.local`
          : "");
      const cart = await updateCartIranAddress({
        address: payload,
        email: customerEmail,
      });
      setCartTotals(extractCartTotals(cart));
      setAddressSaved(true);

      if (isLoggedIn && saveToAccount && !selectedSavedId) {
        const saved = await createCustomerAddress({
          ...payload,
          is_default_shipping: savedAddresses.length === 0,
          is_default_billing: savedAddresses.length === 0,
        });
        if (saved.ok && Array.isArray(saved.addresses)) {
          setSavedAddresses(saved.addresses);
        }
      }

      const options = await listCartShippingOptions();
      setShippingOptions(options);
      if (!options.length) {
        setFormError(messageForCheckoutError("shipping_unavailable"));
      }
    } catch {
      setFormError(messageForCheckoutError("network_error"));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSelectShipping = async (optionId) => {
    setSavingShipping(true);
    setFormError(null);
    setSelectedShippingId(optionId);
    setShippingReady(false);

    try {
      const cart = await setCartShippingOption(optionId);
      setCartTotals(extractCartTotals(cart));
      setShippingReady(true);
      await refresh();
    } catch {
      setShippingReady(false);
      setFormError(messageForCheckoutError("network_error"));
    } finally {
      setSavingShipping(false);
    }
  };

  const handleCopy = async () => {
    const text = buildOrderCopyText(items);
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage("جزئیات سفارش کپی شد");
    } catch {
      setToastMessage("کپی نشد — دستی کپی کنید");
    }
  };

  if (cartLoading && items.length === 0) {
    return (
      <div className="checkout-page container">
        <h1 className="page-title">Checkout</h1>
        <p className="cart-loading" role="status">
          Loading cart…
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page container">
        <h1 className="page-title">Checkout</h1>
        <StateMessage
          variant="empty"
          message="سبد خرید خالی است — قبل از تسویه‌حساب محصول اضافه کنید"
          actionLabel="مشاهده سبد"
          onAction={() => navigate("/cart")}
        />
      </div>
    );
  }

  return (
    <div className="checkout-page container">
      <h1 className="page-title">Checkout</h1>
      <p className="checkout-lead">
        آدرس ایران و روش ارسال را ثبت کنید. پرداخت بانکی در مرحله بعد انجام می‌شود.
      </p>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-panel">
            <h2 className="checkout-section-title">آدرس ارسال</h2>
            <form onSubmit={handleSaveAddress}>
              {isLoggedIn && savedAddresses.length > 0 && (
                <div className="checkout-saved-addresses">
                  <label
                    className="checkout-saved-label"
                    htmlFor="checkout-saved-address"
                  >
                    آدرس ذخیره‌شده
                  </label>
                  <select
                    id="checkout-saved-address"
                    className="checkout-saved-select"
                    value={selectedSavedId}
                    disabled={savingAddress}
                    onChange={(event) =>
                      handleSelectSavedAddress(event.target.value)
                    }
                  >
                    <option value="">آدرس جدید / ویرایش دستی</option>
                    {savedAddresses.map((row) => (
                      <option key={row.id} value={row.id}>
                        {formatCustomerAddressLabel(row)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <IranAddressForm
                values={address}
                fieldErrors={fieldErrors}
                disabled={savingAddress}
                onChange={handleAddressChange}
              />

              {isLoggedIn && !selectedSavedId && (
                <label className="checkout-save-to-account">
                  <input
                    type="checkbox"
                    checked={saveToAccount}
                    disabled={savingAddress}
                    onChange={(event) => setSaveToAccount(event.target.checked)}
                  />
                  ذخیره این آدرس در حساب کاربری
                </label>
              )}

              {formError && (
                <p className="checkout-error" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingAddress}
              >
                {savingAddress ? "در حال بررسی…" : "تأیید آدرس و ادامه"}
              </button>
            </form>
          </section>

          {addressSaved && (
            <section className="checkout-panel">
              <ShippingOptionsList
                options={shippingOptions}
                selectedId={selectedShippingId}
                disabled={savingShipping}
                onSelect={handleSelectShipping}
              />
              {savingShipping && (
                <p className="checkout-hint" role="status">
                  در حال ثبت روش ارسال…
                </p>
              )}
              {shippingReady && (
                <p className="checkout-success" role="status">
                  آدرس و ارسال ثبت شد — سبد آمادهٔ پرداخت است.
                </p>
              )}
              <button
                type="button"
                className={`btn btn-primary${shippingReady ? "" : " btn-disabled"}`}
                disabled={!shippingReady}
                onClick={() => navigate("/checkout/payment")}
              >
                ادامه به پرداخت
              </button>
            </section>
          )}

          <details className="checkout-fallback">
            <summary>سفارش از طریق پیام‌رسان (پشتیبان)</summary>
            <p className="checkout-hint">
              مسیر اصلی پرداخت بانکی است. این بخش فقط پشتیبان است.
            </p>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Instagram DM
              </a>
            )}
            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="checkout-telegram"
              >
                Telegram
              </a>
            )}
            <button type="button" className="btn btn-secondary" onClick={handleCopy}>
              کپی جزئیات سفارش
            </button>
          </details>
        </div>

        <aside className="checkout-summary">
          <h2 className="checkout-summary-title">خلاصه سفارش</h2>
          {items.map((line) => (
            <div
              key={
                line.lineItemId ||
                `${line.productId}-${line.selectedSize}-${line.selectedColor}`
              }
              className="checkout-line"
            >
              <span>
                {line.name} ({line.selectedSize}, {line.selectedColor}) ×{" "}
                {line.quantity}
              </span>
              <span>{formatPriceWithToman(line.price * line.quantity)}</span>
            </div>
          ))}
          <div className="checkout-subtotal">
            <span>اقلام</span>
            <span>{formatPriceWithToman(cartTotals.itemTotal || localItemTotal)}</span>
          </div>
          {cartTotals.discountTotal > 0 && (
            <div className="checkout-subtotal">
              <span>تخفیف</span>
              <span>−{formatPriceWithToman(cartTotals.discountTotal)}</span>
            </div>
          )}
          {cartTotals.giftCardTotal > 0 && (
            <div className="checkout-subtotal">
              <span>کارت هدیه</span>
              <span>−{formatPriceWithToman(cartTotals.giftCardTotal)}</span>
            </div>
          )}
          <div className="checkout-subtotal">
            <span>ارسال</span>
            <span>
              {shippingReady || cartTotals.shippingTotal > 0
                ? formatPriceWithToman(cartTotals.shippingTotal)
                : "—"}
            </span>
          </div>
          <div className="checkout-subtotal">
            <span>مالیات</span>
            <span>{formatPriceWithToman(cartTotals.taxTotal || 0)}</span>
          </div>
          <div className="checkout-total">
            <span>جمع</span>
            <span>
              {formatPriceWithToman(
                cartTotals.grandTotal ||
                  cartTotals.itemTotal +
                    cartTotals.shippingTotal +
                    (cartTotals.taxTotal || 0) ||
                  localItemTotal
              )}
            </span>
          </div>
          <Link to="/cart" className="checkout-help-link">
            بازگشت به سبد
          </Link>
        </aside>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}
