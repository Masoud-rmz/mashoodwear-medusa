/**
 * Brand logo — image with hover zoom; falls back to MASHOOD text on error or missing URL.
 */
import { useState } from "react";

/**
 * @param {{ logoUrl?: string, className?: string, imageClassName?: string, fallbackClassName?: string, label?: string }} props
 */
export default function Logo({
  logoUrl,
  className = "logo",
  imageClassName = "logo-img",
  fallbackClassName = "logo-fallback",
  label = "Mashoodwear home",
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !imageFailed;

  return (
    <span className={className} aria-label={label}>
      {showImage ? (
        <img
          className={imageClassName}
          src={logoUrl}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={fallbackClassName}>MASHOOD</span>
      )}
    </span>
  );
}
