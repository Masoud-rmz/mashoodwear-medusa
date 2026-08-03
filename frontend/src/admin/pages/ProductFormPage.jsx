import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { getCategories } from "../../api/client";

import {

  adminGetCollections,

  adminGetProduct,

  adminDeleteProduct,

  adminSaveProduct,

} from "../../api/adminClient";

import ColorSwatchPicker from "../components/ColorSwatchPicker";

import ConfirmDialog from "../components/ConfirmDialog";

import Toast from "../../components/Toast";

import { PRODUCT_COLORS } from "../../constants/filters";



const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL"];

const DEFAULT_COLORS = PRODUCT_COLORS.map((color) => color.name);



/**

 * Build variant grid from sizes and colors.

 * @param {string[]} sizes

 * @param {string[]} colors

 * @param {Array<{ size: string, color: string, stock: number }>} existing

 */

function buildVariantGrid(sizes, colors, existing = []) {

  const rows = [];

  for (const size of sizes) {

    for (const color of colors) {

      const match = existing.find((item) => item.size === size && item.color === color);

      rows.push({ size, color, stock: match?.stock ?? 0 });

    }

  }

  return rows;

}



/**

 * Add/edit product with variant stock grid.

 */

export default function ProductFormPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const isNew = !id || id === "new";



  const [categories, setCategories] = useState([]);

  const [collections, setCollections] = useState([]);

  const [loading, setLoading] = useState(!isNew);

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const [error, setError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deleting, setDeleting] = useState(false);



  const [name, setName] = useState("");

  const [slug, setSlug] = useState("");

  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [status, setStatus] = useState("active");

  const [isFeatured, setIsFeatured] = useState(false);

  const [featuredOrder, setFeaturedOrder] = useState("");

  const [sizesText, setSizesText] = useState(DEFAULT_SIZES.join(", "));

  const [selectedColors, setSelectedColors] = useState([...DEFAULT_COLORS]);

  const [variants, setVariants] = useState([]);

  const [collectionIds, setCollectionIds] = useState([]);

  const [images, setImages] = useState([]);

  const [removedImageIds, setRemovedImageIds] = useState([]);

  const [newImages, setNewImages] = useState([]);

  const [newImagePreviews, setNewImagePreviews] = useState([]);



  useEffect(() => {

    const previews = newImages.map((file) => URL.createObjectURL(file));

    setNewImagePreviews(previews);

    return () => {

      for (const preview of previews) {

        URL.revokeObjectURL(preview);

      }

    };

  }, [newImages]);



  const sizes = useMemo(

    () => sizesText.split(",").map((item) => item.trim()).filter(Boolean),

    [sizesText]

  );



  const rebuildVariantGrid = (nextSizes, nextColors, existing = variants) => {

    setVariants(buildVariantGrid(nextSizes, nextColors, existing));

  };



  const handleColorsChange = (nextColors) => {

    setSelectedColors(nextColors);

    rebuildVariantGrid(sizes, nextColors);

  };



  useEffect(() => {

    getCategories().then((response) => setCategories(response.items));

    adminGetCollections().then((response) => setCollections(response.items));



    if (isNew) {

      setVariants(buildVariantGrid(DEFAULT_SIZES, DEFAULT_COLORS));

      return;

    }



    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {

      setError("Invalid product id");

      setLoading(false);

      return;

    }



    adminGetProduct(productId)

      .then((response) => {

        const product = response.product;

        setName(product.name);

        setSlug(product.slug);

        setDescription(product.description);

        setPrice(String(product.price));

        setCategoryId(String(product.categoryId));

        setStatus(product.status);

        setIsFeatured(product.isFeatured);

        setFeaturedOrder(product.featuredOrder ?? "");

        setSizesText(product.sizes.join(", "));

        setSelectedColors(product.colors);

        setVariants(product.variants);

        setCollectionIds(product.collectionIds);

        setImages(product.images);

      })

      .catch(() => setError("Could not load product"))

      .finally(() => setLoading(false));

  }, [id, isNew]);



  const handleVariantStockChange = (index, stock) => {

    setVariants((current) =>

      current.map((variant, variantIndex) =>

        variantIndex === index ? { ...variant, stock: Number(stock) || 0 } : variant

      )

    );

  };



  const handleRemoveExistingImage = (imageId) => {

    const remainingCount = images.length - 1 + newImages.length;

    if (remainingCount <= 0) {

      setError("At least one image must remain.");

      return;

    }

    setError("");

    setImages((current) => current.filter((image) => image.id !== imageId));

    setRemovedImageIds((current) => [...current, imageId]);

  };



  const handleRemoveNewImage = (index) => {

    setNewImages((current) => current.filter((_, imageIndex) => imageIndex !== index));

  };



  const handleDeleteProduct = async () => {

    setDeleting(true);

    setError("");

    try {

      await adminDeleteProduct(id);

      navigate("/admin/products");

    } catch (deleteError) {

      if (deleteError.message === "session_expired") {

        navigate("/admin/login");

        return;

      }

      setError(deleteError.message || "Delete failed");

      setShowDeleteConfirm(false);

    } finally {

      setDeleting(false);

    }

  };



  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");



    if (selectedColors.length === 0) {

      setError("Select at least one color.");

      return;

    }

    if (isNew && newImages.length === 0) {

      setError("At least one image is required (JPG, PNG, or WebP, max 5 MB each).");

      return;

    }

    const remainingImages = images.length + newImages.length;

    if (!isNew && remainingImages === 0) {

      setError("At least one image must remain.");

      return;

    }

    if (remainingImages > 5) {

      setError("Maximum 5 images per product.");

      return;

    }



    const nextVariants = buildVariantGrid(sizes, selectedColors, variants);



    setSaving(true);



    const formData = new FormData();

    formData.append("name", name);

    formData.append("slug", slug);

    formData.append("description", description);

    formData.append("price", price);

    formData.append("categoryId", categoryId);

    formData.append("status", status);

    formData.append("isFeatured", String(isFeatured));

    formData.append("featuredOrder", featuredOrder);

    formData.append("sizes", JSON.stringify(sizes));

    formData.append("colors", JSON.stringify(selectedColors));

    formData.append("variants", JSON.stringify(nextVariants));

    formData.append("collectionIds", JSON.stringify(collectionIds.map(Number)));

    formData.append("imageOrder", JSON.stringify(images.map((image) => image.id)));

    if (removedImageIds.length > 0) {

      formData.append("removeImageIds", JSON.stringify(removedImageIds));

    }



    for (const file of newImages) {

      formData.append("images", file);

    }



    try {

      await adminSaveProduct(isNew ? null : id, formData);

      setVariants(nextVariants);

      setToast("Saved");

      setRemovedImageIds([]);

      if (isNew) {

        navigate("/admin/products");

      }

    } catch (submitError) {

      setError(submitError.message || "Save failed");

    } finally {

      setSaving(false);

    }

  };



  if (loading) {

    return <p>Loading product…</p>;

  }



  return (

    <form className="admin-form" onSubmit={handleSubmit}>

      <div className="admin-page-header">

        <h1 className="admin-page-title">{isNew ? "Add New Product" : "Edit Product"}</h1>

        <div className="admin-page-header-actions">

          {!isNew && (

            <button

              type="button"

              className="btn btn-secondary btn-danger"

              onClick={() => setShowDeleteConfirm(true)}

            >

              Delete product

            </button>

          )}

          <Link to="/admin/products" className="btn btn-secondary">

            Cancel

          </Link>

        </div>

      </div>



      {error && <p className="admin-error">{error}</p>}



      <div className="admin-form-grid">

        <label>

          Name

          <input value={name} onChange={(event) => setName(event.target.value)} required />

        </label>

        <label>

          Slug

          <input value={slug} onChange={(event) => setSlug(event.target.value)} />

        </label>

        <label>

          Price (Toman)

          <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} required />

        </label>

        <label>

          Category

          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>

            <option value="">Select category</option>

            {categories.map((category) => (

              <option key={category.id} value={category.id}>

                {category.name}

              </option>

            ))}

          </select>

        </label>

        <label>

          Status

          <select value={status} onChange={(event) => setStatus(event.target.value)}>

            <option value="active">active</option>

            <option value="inactive">inactive</option>

            <option value="out_of_stock">out_of_stock</option>

          </select>

        </label>

        <label className="admin-checkbox">

          <input

            type="checkbox"

            checked={isFeatured}

            onChange={(event) => setIsFeatured(event.target.checked)}

          />

          Featured

        </label>

        <label>

          Featured order

          <input value={featuredOrder} onChange={(event) => setFeaturedOrder(event.target.value)} />

        </label>

      </div>



      <label>

        Description

        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />

      </label>



      <label>

        Sizes (comma separated)

        <input
          value={sizesText}
          onChange={(event) => {
            const nextText = event.target.value;
            setSizesText(nextText);
            const nextSizes = nextText.split(",").map((item) => item.trim()).filter(Boolean);
            rebuildVariantGrid(nextSizes, selectedColors);
          }}
        />

      </label>



      <fieldset className="admin-fieldset">

        <legend>Colors</legend>

        <ColorSwatchPicker selectedColors={selectedColors} onChange={handleColorsChange} />

      </fieldset>



      <fieldset className="admin-fieldset">

        <legend>Variant stock</legend>

        <div className="admin-variant-grid">

          {variants.map((variant, index) => (

            <label key={`${variant.size}-${variant.color}`}>

              {variant.size} / {variant.color}

              <input

                type="number"

                min="0"

                value={variant.stock}

                onChange={(event) => handleVariantStockChange(index, event.target.value)}

              />

            </label>

          ))}

        </div>

      </fieldset>



      <fieldset className="admin-fieldset">

        <legend>Collections</legend>

        <div className="admin-checkbox-list">

          {collections.map((collection) => (

            <label key={collection.id} className="admin-checkbox">

              <input

                type="checkbox"

                checked={collectionIds.includes(collection.id)}

                onChange={(event) => {

                  setCollectionIds((current) =>

                    event.target.checked

                      ? [...current, collection.id]

                      : current.filter((value) => value !== collection.id)

                  );

                }}

              />

              {collection.name}

            </label>

          ))}

        </div>

      </fieldset>



      <fieldset className="admin-fieldset">

        <legend>{isNew ? "Images (required, max 5)" : "Images (max 5)"}</legend>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={(event) => {
            const picked = Array.from(event.target.files || []);
            setNewImages((current) => [...current, ...picked].slice(0, 5));
            event.target.value = "";
          }}
        />

        <p className="admin-hint">JPG, PNG, or WebP only. iPhone HEIC is not supported — convert first.</p>

        {newImages.length > 0 && (

          <ul className="admin-file-list">

            {newImages.map((file) => (

              <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>

            ))}

          </ul>

        )}

        {(images.length > 0 || newImages.length > 0) && (

          <div className="admin-image-list">

            {images.map((image) => (

              <div key={image.id} className="admin-image-thumb">

                <img src={image.url} alt="" />

                <button

                  type="button"

                  className="admin-image-remove btn btn-secondary btn-sm btn-danger"

                  onClick={() => handleRemoveExistingImage(image.id)}

                >

                  Remove

                </button>

              </div>

            ))}

            {newImages.map((file, index) => (

              <div key={`preview-${file.name}-${file.lastModified}`} className="admin-image-thumb">

                <img src={newImagePreviews[index]} alt="" />

                <button

                  type="button"

                  className="admin-image-remove btn btn-secondary btn-sm btn-danger"

                  onClick={() => handleRemoveNewImage(index)}

                >

                  Remove

                </button>

              </div>

            ))}

          </div>

        )}

      </fieldset>



      <button type="submit" className="btn btn-primary" disabled={saving}>

        {saving ? "Saving…" : "Save"}

      </button>



      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}



      <ConfirmDialog

        open={showDeleteConfirm}

        title="Delete product?"

        message="Remove this product from the site? This can't be undone."

        loading={deleting}

        onCancel={() => {

          if (!deleting) {

            setShowDeleteConfirm(false);

          }

        }}

        onConfirm={handleDeleteProduct}

      />

    </form>

  );

}


