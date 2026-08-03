/**
 * Display Medusa Admin «ویژگی‌ها» (weight / dimensions / customs) on PDP.
 * @param {{
 *   attributes?: {
 *     height?: number | null,
 *     width?: number | null,
 *     length?: number | null,
 *     weight?: number | null,
 *     hsCode?: string,
 *     midCode?: string,
 *     originCountry?: string
 *   } | null
 * }} props
 */
export default function ProductAttributes({ attributes }) {
  if (!attributes) {
    return null;
  }

  /** @type {Array<{ label: string, value: string }>} */
  const rows = [];

  if (attributes.height != null) {
    rows.push({ label: "ارتفاع", value: String(attributes.height) });
  }
  if (attributes.width != null) {
    rows.push({ label: "عرض", value: String(attributes.width) });
  }
  if (attributes.length != null) {
    rows.push({ label: "طول", value: String(attributes.length) });
  }
  if (attributes.weight != null) {
    rows.push({ label: "وزن", value: String(attributes.weight) });
  }
  if (attributes.midCode) {
    rows.push({ label: "کد MID", value: attributes.midCode });
  }
  if (attributes.hsCode) {
    rows.push({ label: "کد HS", value: attributes.hsCode });
  }
  if (attributes.originCountry) {
    rows.push({ label: "کشور مبدا", value: attributes.originCountry });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="product-attributes" aria-labelledby="product-attributes-title">
      <h2 id="product-attributes-title" className="product-attributes-title">
        ویژگی‌ها
      </h2>
      <dl className="product-attributes-list">
        {rows.map((row) => (
          <div key={row.label} className="product-attributes-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
