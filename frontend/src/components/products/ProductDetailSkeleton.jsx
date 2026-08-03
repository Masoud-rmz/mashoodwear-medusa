/**
 * Skeleton layout while product detail loads.
 */
export default function ProductDetailSkeleton() {
  return (
    <div className="product-detail product-detail--skeleton" aria-busy="true" aria-label="Loading product">
      <div className="skeleton-block product-gallery product-gallery--empty" />
      <div className="product-info">
        <div className="skeleton-line skeleton-line--title" style={{ height: 32, width: "70%" }} />
        <div className="skeleton-line skeleton-line--price" style={{ marginBottom: 24 }} />
        <div className="skeleton-line" style={{ width: "40%" }} />
        <div className="skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton-line" style={{ width: "60%" }} />
      </div>
    </div>
  );
}
