import { Link, useLocation } from "react-router-dom";
import ProductImage from "../ProductImage";
import PersianText from "../PersianText";
import { formatPrice } from "../../utils/formatPrice";

/**
 * Map stock label text to CSS modifier class.
 * @param {string} stockLabel
 * @returns {string}
 */
function stockLabelClass(stockLabel) {
  if (stockLabel === "Sold out") {
    return "sold-out";
  }
  if (stockLabel.startsWith("Only ")) {
    return "low-stock";
  }
  return "in-stock";
}

/**
 * Product card for grids — no stock label on home per ui-behavior §4.1.
 * @param {{ product: import('../../types').ProductItem, showStockLabel?: boolean }} props
 */
export default function ProductCard({ product, showStockLabel = false }) {
  const location = useLocation();

  return (
    <div className="product-card-wrap">
      <Link
        to={`/products/${product.slug}`}
        state={{ from: location }}
        className="product-card"
      >
        <div className="product-card-image">
          <ProductImage
            src={product.imageUrl}
            className="product-card-image-inner"
            fallbackClassName="product-card-image-inner product-card-image-inner--placeholder"
            fallbackLabel="No image"
          />
        </div>
        <div className="product-card-body">
          <PersianText as="p" className="product-name" variant="heading">
            {product.name}
          </PersianText>
          <p className="product-price">{formatPrice(product.price)}</p>
          {showStockLabel && (
            <p className={`card-stock-label ${stockLabelClass(product.stockLabel)}`}>
              {product.stockLabel}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
