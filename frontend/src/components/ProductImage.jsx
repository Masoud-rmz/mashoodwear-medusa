import { useState } from "react";

/**
 * Product/collection image with graceful fallback when upload is missing or broken.
 * @param {{
 *   src?: string | null,
 *   alt?: string,
 *   className?: string,
 *   fallbackClassName?: string,
 *   fallbackLabel?: string
 * }} props
 */
export default function ProductImage({
  src,
  alt = "",
  className,
  fallbackClassName = "product-image-fallback",
  fallbackLabel = "No image",
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={fallbackClassName} role="img" aria-label={fallbackLabel}>
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
