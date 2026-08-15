import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { getProductBySlug } from "../api/client";
import Toast from "../components/Toast";
import PersianText from "../components/PersianText";
import ProductDetailSkeleton from "../components/products/ProductDetailSkeleton";
import ProductGallery from "../components/products/ProductGallery";
import RelatedProducts from "../components/products/RelatedProducts";
import VariantPicker from "../components/products/VariantPicker";
import ProductAttributes from "../components/products/ProductAttributes";
import StateMessage from "../components/StateMessage";
import { CheckIcon, SpinnerIcon } from "../components/icons";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../hooks/useCart";
import { DEFAULT_COLOR_SENTINEL } from "../api/medusa/mappers.js";
import {
  colorsForSize,
  getAddToCartState,
  isColorAvailableForSize,
  uniqueHeights,
  uniqueSizes,
} from "../utils/variantSelection";

/**
 * Product detail page — gallery, variants, stock-aware add to cart.
 */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedHeight, setSelectedHeight] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [toast, setToast] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const backLink = useMemo(() => {
    const from = location.state?.from;
    if (from?.pathname?.startsWith("/collections/")) {
      return { to: from.pathname, label: "← Back to Collection" };
    }
    return { to: "/products", label: "← Back to Products" };
  }, [location.state]);

  const loadProduct = useCallback(async () => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    setNotFound(false);
    setSelectedSize(null);
    setSelectedHeight(null);
    setSelectedColor(null);
    setSelectedExtras({});

    try {
      const response = await getProductBySlug(slug);
      if (response.notFound) {
        setProduct(null);
        setNotFound(true);
        return;
      }
      setProduct(response.product);
    } catch {
      setProduct(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  const hasColorOptions = Boolean(product?.hasColorOptions);
  const hasHeightOptions = Boolean(product?.hasHeightOptions);
  const declaredColors = product?.colors || [];
  const declaredSizes = product?.sizes || [];
  const extraOptions = product?.extraOptions || [];

  const sizes = useMemo(
    () => (product ? uniqueSizes(product.variants, undefined, declaredSizes) : []),
    [product, declaredSizes]
  );

  const heights = useMemo(
    () =>
      product
        ? uniqueHeights(product.variants, product.heights || [])
        : [],
    [product]
  );

  const colors = useMemo(
    () =>
      product
        ? colorsForSize(product.variants, selectedSize, {
            hasColorOptions,
            declaredColors,
          })
        : [],
    [product, selectedSize, hasColorOptions, declaredColors]
  );

  const orphanedColorsHint = useMemo(() => {
    if (!product || !hasColorOptions || declaredColors.length === 0) {
      return null;
    }
    const missing = declaredColors.filter(
      (color) => !product.variants.some((row) => row.color === color)
    );
    if (missing.length === 0) {
      return null;
    }
    return `برای ${missing.join(" / ")} هنوز واریانت Size×Color در Medusa Admin نساخته‌اید`;
  }, [product, hasColorOptions, declaredColors]);

  useEffect(() => {
    if (!product) {
      return;
    }
    if (!hasColorOptions) {
      setSelectedColor(DEFAULT_COLOR_SENTINEL);
      return;
    }
    if (selectedColor && !colors.includes(selectedColor)) {
      setSelectedColor(null);
    }
  }, [product, colors, selectedColor, hasColorOptions]);

  const cartState = useMemo(() => {
    if (!product) {
      return { disabled: true, label: "Add to Cart", stockLabel: null };
    }
    return getAddToCartState({
      productStatus: product.status,
      variants: product.variants,
      selectedSize,
      selectedColor,
      selectedHeight,
      selectedExtras,
      hasColorOptions,
      hasHeightOptions,
      extraOptions,
    });
  }, [
    product,
    selectedSize,
    selectedColor,
    selectedHeight,
    selectedExtras,
    hasColorOptions,
    hasHeightOptions,
    extraOptions,
  ]);

  const handleExtraChange = (title, value) => {
    setSelectedExtras((current) => ({
      ...current,
      [title]: value,
    }));
  };

  const selectedVariant = useMemo(() => {
    if (!product) {
      return null;
    }
    const effectiveColor = hasColorOptions
      ? selectedColor
      : selectedColor || DEFAULT_COLOR_SENTINEL;
    if (!selectedSize || (hasColorOptions && !effectiveColor)) {
      return null;
    }
    if (hasHeightOptions && !selectedHeight) {
      return null;
    }
    return (
      product.variants.find((item) => {
        if (item.size !== selectedSize || item.color !== effectiveColor) {
          return false;
        }
        if (
          hasHeightOptions &&
          String(item.height || "") !== String(selectedHeight || "")
        ) {
          return false;
        }
        for (const option of extraOptions) {
          const wanted = selectedExtras[option.title];
          if (wanted && item.extraOptions?.[option.title] !== wanted) {
            return false;
          }
        }
        return true;
      }) || null
    );
  }, [
    product,
    selectedSize,
    selectedColor,
    selectedHeight,
    selectedExtras,
    hasColorOptions,
    hasHeightOptions,
    extraOptions,
  ]);

  const displayPrice = useMemo(() => {
    if (!product) {
      return 0;
    }
    if (selectedVariant && Number(selectedVariant.price) > 0) {
      return selectedVariant.price;
    }
    return product.price;
  }, [product, selectedVariant]);

  const displayPriceLabel = useMemo(() => {
    if (!product) {
      return "";
    }
    if (selectedVariant && Number(selectedVariant.price) > 0) {
      return formatPrice(selectedVariant.price);
    }
    const max = Number(product.priceMax) || 0;
    const min = Number(product.price) || 0;
    if (max > min && min > 0) {
      return `از ${formatPrice(min)}`;
    }
    return formatPrice(min);
  }, [product, selectedVariant]);

  const displayAttributes = useMemo(() => {
    if (!product) {
      return null;
    }
    const variantAttrs = selectedVariant?.attributes;
    if (!variantAttrs) {
      return product.attributes;
    }
    const hasVariantPhysical = [
      variantAttrs.height,
      variantAttrs.width,
      variantAttrs.length,
      variantAttrs.weight,
    ].some((value) => value !== null && value !== undefined);
    const hasVariantCodes = Boolean(
      variantAttrs.hsCode || variantAttrs.midCode || variantAttrs.originCountry
    );
    if (!hasVariantPhysical && !hasVariantCodes) {
      return product.attributes;
    }
    return {
      height: variantAttrs.height ?? product.attributes?.height ?? null,
      width: variantAttrs.width ?? product.attributes?.width ?? null,
      length: variantAttrs.length ?? product.attributes?.length ?? null,
      weight: variantAttrs.weight ?? product.attributes?.weight ?? null,
      hsCode: variantAttrs.hsCode || product.attributes?.hsCode || "",
      midCode: variantAttrs.midCode || product.attributes?.midCode || "",
      originCountry:
        variantAttrs.originCountry || product.attributes?.originCountry || "",
    };
  }, [product, selectedVariant]);

  const handleAddToCart = async () => {
    if (!product || cartState.disabled || addingToCart) {
      return;
    }

    const effectiveColor = hasColorOptions
      ? selectedColor
      : selectedColor || DEFAULT_COLOR_SENTINEL;

    const variant = selectedVariant;

    if (!variant?.variantId) {
      setToast({ message: "Could not add — variant unavailable", variant: "error" });
      return;
    }

    setAddingToCart(true);
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        selectedSize: selectedSize ?? "",
        selectedHeight: selectedHeight ?? "",
        selectedColor: effectiveColor ?? "",
        name: product.name,
        price: variant?.price > 0 ? variant.price : displayPrice,
        slug: product.slug,
        imageUrl: product.images[0] ?? null,
        variantStock: variant?.stock,
        variantId: variant.variantId,
      });
      setToast({ message: "Added to cart", variant: "success" });
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1800);
    } catch {
      setToast({ message: "Could not add to cart — try again", variant: "error" });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page container">
        <Link to={backLink.to} className="back-link">
          {backLink.label}
        </Link>
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="product-detail-page container">
        <StateMessage
          variant="empty"
          message="Product not found — it may have been removed"
          actionLabel="Back to Products"
          onAction={() => navigate("/products")}
        />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page container">
        <StateMessage
          variant="error"
          message="Couldn't load this product"
          actionLabel="Try again"
          onAction={loadProduct}
        />
      </div>
    );
  }

  return (
    <div className="product-detail-page container">
      <Link to={backLink.to} className="back-link">
        {backLink.label}
      </Link>

      <div className="product-detail">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="product-info">
          <div className="product-info-header">
            <PersianText as="h1" variant="heading">
              {product.name}
            </PersianText>
          </div>
          <p className="product-price" aria-live="polite">
            {displayPriceLabel}
          </p>

          <VariantPicker
            sizes={sizes}
            heights={heights}
            colors={colors}
            extraOptions={extraOptions}
            selectedSize={selectedSize}
            selectedHeight={selectedHeight}
            selectedColor={
              hasColorOptions && selectedColor === DEFAULT_COLOR_SENTINEL
                ? null
                : selectedColor
            }
            selectedExtras={selectedExtras}
            onSizeChange={setSelectedSize}
            onHeightChange={setSelectedHeight}
            onColorChange={setSelectedColor}
            onExtraChange={handleExtraChange}
            showColorPicker={hasColorOptions}
            showHeightPicker={hasHeightOptions}
            isColorAvailable={(color) =>
              isColorAvailableForSize(product.variants, selectedSize, color)
            }
            orphanedColorsHint={orphanedColorsHint}
          />

          {cartState.stockLabel && (
            <p className={`stock-badge ${cartState.stockLabel === "Sold out" ? "sold-out" : ""}`}>
              {cartState.stockLabel}
            </p>
          )}

          <button
            type="button"
            className={`btn btn-primary add-to-cart-btn${justAdded ? " add-to-cart-btn--added" : ""}`}
            disabled={cartState.disabled || addingToCart}
            onClick={handleAddToCart}
          >
            {addingToCart ? (
              <>
                <SpinnerIcon />
                Adding…
              </>
            ) : justAdded ? (
              <>
                <CheckIcon />
                Added to Cart
              </>
            ) : (
              cartState.label
            )}
          </button>

          {product.description && (
            <PersianText as="p" className="product-desc">
              {product.description}
            </PersianText>
          )}

          <ProductAttributes attributes={displayAttributes} />
        </div>
      </div>

      <RelatedProducts productSlug={product.slug} />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
