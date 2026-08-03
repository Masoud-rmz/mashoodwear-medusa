import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { adminDeleteCollection, adminGetCollections } from "../../api/adminClient";
import ConfirmDialog from "../components/ConfirmDialog";

/**
 * Admin collections table.
 */
export default function CollectionsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setError("");
    adminGetCollections()
      .then((response) => setItems(response.items))
      .catch((loadError) => {
        if (loadError.message === "session_expired") {
          navigate("/admin/login");
          return;
        }
        setError(loadError.message || "Could not load collections");
      });
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await adminDeleteCollection(pendingDelete.id);
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
      <div className="admin-page-header">
        <h1 className="admin-page-title">Collections</h1>
        <Link to="/admin/collections/new" className="btn btn-primary">
          Add New Collection
        </Link>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Products</th>
              <th>Active</th>
              <th>Order</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((collection) => (
              <tr key={collection.id}>
                <td>{collection.name}</td>
                <td>{collection.productCount}</td>
                <td>{collection.isActive ? "Yes" : "No"}</td>
                <td>{collection.displayOrder}</td>
                <td className="admin-table-actions">
                  <Link to={`/admin/collections/${collection.id}`} className="btn btn-secondary btn-sm">
                    Edit
                  </Link>
                  <a
                    href={`/collections/${collection.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-danger"
                    disabled={deleting && pendingDelete?.id === collection.id}
                    onClick={() => setPendingDelete({ id: collection.id, name: collection.name })}
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
        title="Delete collection?"
        message={
          pendingDelete
            ? `Remove "${pendingDelete.name}"? Products stay on the site; only the collection is removed.`
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
