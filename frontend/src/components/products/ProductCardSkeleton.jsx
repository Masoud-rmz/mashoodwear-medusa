/**
 * Skeleton placeholder while product cards load.
 */
export default function ProductCardSkeleton() {
  return (
    <div className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card-image skeleton-block" />
      <div className="product-card-body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--price" />
      </div>
    </div>
  );
}
