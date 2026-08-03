import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  adminCreateCategory,
  adminDeleteCategory,
  adminGetCategories,
  adminUpdateCategory,
} from "../../api/adminClient";
import ConfirmDialog from "../components/ConfirmDialog";

/**
 * Admin category CRUD list.
 */
export default function CategoriesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    adminGetCategories()
      .then((response) => setItems(response.items))
      .catch((loadError) => {
        if (loadError.message === "session_expired") {
          navigate("/admin/login");
          return;
        }
        setError(loadError.message || "Could not load categories");
      });
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDisplayOrder("0");
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const payload = { name, slug, displayOrder: Number(displayOrder) };

    try {
      if (editingId) {
        await adminUpdateCategory(editingId, payload);
      } else {
        await adminCreateCategory(payload);
      }
      resetForm();
      load();
    } catch (submitError) {
      if (submitError.message === "session_expired") {
        navigate("/admin/login");
        return;
      }
      setError(submitError.message || "Save failed");
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDisplayOrder(String(category.displayOrder));
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await adminDeleteCategory(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (deleteError) {
      if (deleteError.message === "session_expired") {
        navigate("/admin/login");
        return;
      }
      setError(deleteError.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">Categories</h1>
      {error && <p className="admin-error">{error}</p>}

      <form className="admin-form admin-form--inline" onSubmit={handleSubmit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
        <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Slug" />
        <input
          type="number"
          value={displayOrder}
          onChange={(event) => setDisplayOrder(event.target.value)}
          placeholder="Order"
        />
        <button type="submit" className="btn btn-primary">
          {editingId ? "Update" : "Add"}
        </button>
        {editingId && (
          <button type="button" className="btn btn-secondary" onClick={resetForm}>
            Cancel edit
          </button>
        )}
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Order</th>
              <th>Products</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.displayOrder}</td>
                <td>{category.productCount}</td>
                <td className="admin-table-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEdit(category)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-danger"
                    disabled={deleting && pendingDelete?.id === category.id}
                    onClick={() => setPendingDelete({ id: category.id, name: category.name })}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete category?"
        message={
          pendingDelete
            ? `Remove "${pendingDelete.name}"? You must move or delete its products first.`
            : ""
        }
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
