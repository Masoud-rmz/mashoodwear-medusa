import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminGetProducts, adminGetCollection, adminSaveCollection } from "../../api/adminClient";
import Toast from "../../components/Toast";

/**
 * Add/edit brand collection with cover upload and product picker.
 */
export default function CollectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [productIds, setProductIds] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminGetProducts({ limit: 100 }).then((response) => setProducts(response.items));

    if (isNew) {
      return;
    }

    const collectionId = Number(id);
    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      setError("Invalid collection id");
      return;
    }

    adminGetCollection(collectionId).then((response) => {
      const collection = response.collection;
      setName(collection.name);
      setSlug(collection.slug);
      setDescription(collection.description || "");
      setDisplayOrder(String(collection.displayOrder));
      setIsActive(collection.isActive);
      setProductIds(collection.productIds);
    });
  }, [id, isNew]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("description", description);
    formData.append("displayOrder", displayOrder);
    formData.append("isActive", String(isActive));
    formData.append("productIds", JSON.stringify(productIds));
    if (coverFile) {
      formData.append("coverImage", coverFile);
    }

    try {
      await adminSaveCollection(isNew ? null : id, formData);
      setToast("Saved");
      if (isNew) {
        navigate("/admin/collections");
      }
    } catch (submitError) {
      setError(submitError.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-page-header">
        <h1 className="admin-page-title">{isNew ? "Add Collection" : "Edit Collection"}</h1>
        <Link to="/admin/collections" className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Slug
        <input value={slug} onChange={(event) => setSlug(event.target.value)} />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
      </label>
      <label>
        Display order
        <input value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} />
      </label>
      <label className="admin-checkbox">
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
        Active
      </label>
      <label>
        Cover image {isNew && "(required)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
        />
      </label>

      <fieldset className="admin-fieldset">
        <legend>Products</legend>
        <div className="admin-checkbox-list">
          {products.map((product) => (
            <label key={product.id} className="admin-checkbox">
              <input
                type="checkbox"
                checked={productIds.includes(product.id)}
                onChange={(event) => {
                  setProductIds((current) =>
                    event.target.checked
                      ? [...current, product.id]
                      : current.filter((value) => value !== product.id)
                  );
                }}
              />
              {product.name}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </form>
  );
}
