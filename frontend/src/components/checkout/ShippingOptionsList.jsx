import { formatPriceWithToman } from "../../utils/formatPrice";

/**
 * Radio list of Iran region shipping options from Medusa.
 * @param {{
 *   options: Array<{ id: string, name: string, amount: number }>,
 *   selectedId: string | null,
 *   disabled?: boolean,
 *   onSelect: (optionId: string) => void
 * }} props
 */
export default function ShippingOptionsList({
  options,
  selectedId,
  disabled = false,
  onSelect,
}) {
  if (!options.length) {
    return (
      <p className="checkout-shipping-empty" role="status">
        روش ارسالی برای این آدرس پیدا نشد.
      </p>
    );
  }

  return (
    <fieldset className="checkout-shipping-list" disabled={disabled}>
      <legend className="checkout-section-title">روش ارسال</legend>
      {options.map((option) => {
        const inputId = `shipping-${option.id}`;
        return (
          <label key={option.id} className="checkout-shipping-option" htmlFor={inputId}>
            <input
              id={inputId}
              type="radio"
              name="shipping-option"
              value={option.id}
              checked={selectedId === option.id}
              onChange={() => onSelect(option.id)}
            />
            <span className="checkout-shipping-name">{option.name}</span>
            <span className="checkout-shipping-price">
              {formatPriceWithToman(option.amount)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
