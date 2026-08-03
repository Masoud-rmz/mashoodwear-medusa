import { useCallback, useEffect, useState } from "react";
import IranAddressForm from "../checkout/IranAddressForm";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  formatCustomerAddressLabel,
  listCustomerAddresses,
  updateCustomerAddress,
} from "../../api/medusa/customer";
import {
  mapIranAddressFieldErrors,
  messageForCheckoutError,
} from "../../api/medusa/checkoutMessages";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  province: "",
  city: "",
  address_1: "",
  postal_code: "",
  address_name: "",
};

/**
 * Saved Iran addresses on the buyer account (Store API → Medusa Admin Customers).
 */
export default function AccountAddressesPanel() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isDefault, setIsDefault] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await listCustomerAddresses();
    setLoading(false);
    if (!result.ok) {
      setError(result.message || "خواندن آدرس‌ها ناموفق بود.");
      setAddresses([]);
      return;
    }
    setAddresses(result.addresses);
    setError(null);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsDefault(addresses.length === 0);
    setFieldErrors({});
    setShowForm(false);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsDefault(addresses.length === 0);
    setFieldErrors({});
    setError(null);
    setMessage(null);
    setShowForm(true);
  };

  const startEdit = (row) => {
    setForm({
      first_name: row.firstName,
      last_name: row.lastName,
      phone: row.phone,
      email: "",
      province: row.province,
      city: row.city,
      address_1: row.address1,
      postal_code: row.postalCode,
      address_name: row.addressName || "",
    });
    setEditingId(row.id);
    setIsDefault(row.isDefaultShipping);
    setFieldErrors({});
    setError(null);
    setMessage(null);
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setFieldErrors({});

    const payload = {
      ...form,
      is_default_shipping: isDefault,
      is_default_billing: isDefault,
    };

    const result = editingId
      ? await updateCustomerAddress(editingId, payload)
      : await createCustomerAddress(payload);

    setBusy(false);

    if (!result.ok) {
      setFieldErrors(mapIranAddressFieldErrors(result.fields));
      setError(
        messageForCheckoutError(result.error) ||
          result.message ||
          "ذخیره آدرس ناموفق بود."
      );
      return;
    }

    if (Array.isArray(result.addresses) && result.addresses.length > 0) {
      setAddresses(result.addresses);
    } else {
      await reload();
    }
    setMessage(editingId ? "آدرس به‌روز شد." : "آدرس ذخیره شد.");
    resetForm();
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm("این آدرس حذف شود؟")) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await deleteCustomerAddress(addressId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message || "حذف آدرس ناموفق بود.");
      return;
    }
    setMessage("آدرس حذف شد.");
    if (editingId === addressId) {
      resetForm();
    }
    await reload();
  };

  return (
    <section className="account-panel">
      <div className="account-panel-header">
        <h2 className="account-section-title">آدرس‌های ذخیره‌شده</h2>
        {!showForm && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={startCreate}
            disabled={busy}
          >
            افزودن آدرس
          </button>
        )}
      </div>

      <p className="account-address-hint">
        آدرس‌ها روی حساب Medusa ذخیره می‌شوند و در Admin (
        <span dir="ltr">Customers → Addresses</span>) دیده می‌شوند.
      </p>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-info">{message}</p>}

      {loading ? (
        <p className="auth-lead">در حال بارگذاری آدرس‌ها…</p>
      ) : addresses.length === 0 && !showForm ? (
        <p className="auth-lead">هنوز آدرسی ذخیره نکرده‌اید.</p>
      ) : (
        <ul className="account-address-list">
          {addresses.map((row) => (
            <li key={row.id} className="account-address-card">
              <div>
                <strong>{formatCustomerAddressLabel(row)}</strong>
                <p className="account-address-meta">
                  {row.address1}
                  {row.isDefaultShipping ? " · پیش‌فرض ارسال" : ""}
                </p>
                <p className="account-address-meta" dir="ltr">
                  {row.phone}
                </p>
              </div>
              <div className="account-address-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => startEdit(row)}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => handleDelete(row.id)}
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form className="account-address-form" onSubmit={handleSubmit}>
          <h3 className="account-address-form-title">
            {editingId ? "ویرایش آدرس" : "آدرس جدید"}
          </h3>
          <label className="checkout-label" htmlFor="account-address_name">
            برچسب (اختیاری)
            <input
              id="account-address_name"
              className="checkout-input"
              value={form.address_name}
              disabled={busy}
              placeholder="مثلاً خانه / محل کار"
              onChange={(event) =>
                handleChange("address_name", event.target.value)
              }
            />
          </label>
          <IranAddressForm
            idPrefix="account"
            showEmail={false}
            values={form}
            fieldErrors={fieldErrors}
            disabled={busy}
            onChange={handleChange}
          />
          <label className="account-checkbox">
            <input
              type="checkbox"
              checked={isDefault}
              disabled={busy}
              onChange={(event) => setIsDefault(event.target.checked)}
            />
            آدرس پیش‌فرض ارسال
          </label>
          <div className="account-address-form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "در حال ذخیره…" : editingId ? "ذخیره تغییرات" : "ذخیره آدرس"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={resetForm}
            >
              انصراف
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
