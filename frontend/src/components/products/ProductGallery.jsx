import { useState } from "react";
import ProductImage from "../ProductImage";

/**
 * Product image gallery with thumbnail navigation and hover zoom.
 * @param {{ images: string[], productName: string }} props
 */
export default function ProductGallery({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || null;

  if (!activeImage) {
    return (
      <div className="product-gallery product-gallery--empty">
        <span>No image</span>
      </div>
    );
  }

  return (
    <div className="product-gallery-wrap">
      <div className="product-gallery">
        <ProductImage
          src={activeImage}
          alt={productName}
          className="product-gallery-main"
          fallbackClassName="product-gallery product-gallery--empty"
          fallbackLabel="No image"
        />
      </div>

      {images.length > 1 && (
        <div className="product-gallery-thumbs" role="tablist" aria-label="Product images">
          {images.map((imageUrl, index) => (
            <button
              key={imageUrl}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Image ${index + 1}`}
              className={`product-gallery-thumb${index === activeIndex ? " active" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              <ProductImage src={imageUrl} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
