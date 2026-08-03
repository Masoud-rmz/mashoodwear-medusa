import { IRAN_PROVINCES } from "../../api/medusa/iranProvinces";

/**
 * Iran shipping address fields for Medusa / Iran Pack checkout & account.
 * @param {{
 *   values: Record<string, string>,
 *   fieldErrors: Record<string, string>,
 *   disabled?: boolean,
 *   idPrefix?: string,
 *   showEmail?: boolean,
 *   onChange: (field: string, value: string) => void
 * }} props
 */
export default function IranAddressForm({
  values,
  fieldErrors,
  disabled = false,
  idPrefix = "checkout",
  showEmail = true,
  onChange,
}) {
  const field = (name) => ({
    id: `${idPrefix}-${name}`,
    name: name,
    value: values[name] || "",
    disabled,
    "aria-invalid": Boolean(fieldErrors[name]),
    "aria-describedby": fieldErrors[name]
      ? `${idPrefix}-${name}-error`
      : undefined,
    onChange: (event) => onChange(name, event.target.value),
  });

  return (
    <div className="checkout-address-form">
      <div className="checkout-form-row">
        <label className="checkout-label" htmlFor={`${idPrefix}-first_name`}>
          نام
          <input
            className="checkout-input"
            {...field("first_name")}
            autoComplete="given-name"
          />
          {fieldErrors.first_name && (
            <span
              id={`${idPrefix}-first_name-error`}
              className="checkout-field-error"
            >
              {fieldErrors.first_name}
            </span>
          )}
        </label>
        <label className="checkout-label" htmlFor={`${idPrefix}-last_name`}>
          نام خانوادگی
          <input
            className="checkout-input"
            {...field("last_name")}
            autoComplete="family-name"
          />
          {fieldErrors.last_name && (
            <span
              id={`${idPrefix}-last_name-error`}
              className="checkout-field-error"
            >
              {fieldErrors.last_name}
            </span>
          )}
        </label>
      </div>

      <label className="checkout-label" htmlFor={`${idPrefix}-phone`}>
        موبایل
        <input
          className="checkout-input"
          {...field("phone")}
          inputMode="tel"
          autoComplete="tel"
          placeholder="09121234567"
          dir="ltr"
        />
        {fieldErrors.phone && (
          <span id={`${idPrefix}-phone-error`} className="checkout-field-error">
            {fieldErrors.phone}
          </span>
        )}
      </label>

      {showEmail && (
        <label className="checkout-label" htmlFor={`${idPrefix}-email`}>
          ایمیل (اختیاری)
          <input
            className="checkout-input"
            {...field("email")}
            type="email"
            autoComplete="email"
            dir="ltr"
          />
        </label>
      )}

      <label className="checkout-label" htmlFor={`${idPrefix}-province`}>
        استان
        <select className="checkout-input" {...field("province")}>
          <option value="">انتخاب استان</option>
          {IRAN_PROVINCES.map((province) => (
            <option key={province.code} value={province.en}>
              {province.fa}
            </option>
          ))}
        </select>
        {fieldErrors.province && (
          <span
            id={`${idPrefix}-province-error`}
            className="checkout-field-error"
          >
            {fieldErrors.province}
          </span>
        )}
      </label>

      <label className="checkout-label" htmlFor={`${idPrefix}-city`}>
        شهر
        <input
          className="checkout-input"
          {...field("city")}
          autoComplete="address-level2"
        />
        {fieldErrors.city && (
          <span id={`${idPrefix}-city-error`} className="checkout-field-error">
            {fieldErrors.city}
          </span>
        )}
      </label>

      <label className="checkout-label" htmlFor={`${idPrefix}-address_1`}>
        نشانی
        <textarea
          className="checkout-input checkout-textarea"
          {...field("address_1")}
          rows={3}
          autoComplete="street-address"
        />
        {fieldErrors.address_1 && (
          <span
            id={`${idPrefix}-address_1-error`}
            className="checkout-field-error"
          >
            {fieldErrors.address_1}
          </span>
        )}
      </label>

      <label className="checkout-label" htmlFor={`${idPrefix}-postal_code`}>
        کد پستی
        <input
          className="checkout-input"
          {...field("postal_code")}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="۱۰ رقم"
          dir="ltr"
          maxLength={10}
        />
        {fieldErrors.postal_code && (
          <span
            id={`${idPrefix}-postal_code-error`}
            className="checkout-field-error"
          >
            {fieldErrors.postal_code}
          </span>
        )}
      </label>
    </div>
  );
}
