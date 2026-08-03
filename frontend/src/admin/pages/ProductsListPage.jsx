import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { adminDeleteProduct, adminGetProducts } from "../../api/adminClient";
import ConfirmDialog from "../components/ConfirmDialog";

/**
 * Admin products table with search and pagination.
 */
export default function ProductsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    adminGetProducts({ search, page })
      .then((response) => {
        setItems(response.items);
        setTotal(response.total);
      })
      .catch((loadError) => {
        if (loadError.message === "session_expired") {
          navigate("/admin/login");
          return;
        }
        setError(loadError.message || "Could not load products");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await adminDeleteProduct(pendingDelete.id);
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

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          Add New Product
        </Link>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <form className="admin-search" onSubmit={handleSearch}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name"
        />
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No products yet — add one</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Featured</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.totalStock}</td>
                  <td>{product.status}</td>
                  <td>{product.isFeatured ? "Yes" : "No"}</td>
                  <td className="admin-table-actions">
                    <Link to={`/admin/products/${product.id}`} className="btn btn-secondary btn-sm">
                      Edit
                    </Link>
                    <a
                      href={`/products/${product.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-danger"
                      disabled={deleting && pendingDelete?.id === product.id}
                      onClick={() => setPendingDelete({ id: product.id, name: product.name })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete product?"
        message={
          pendingDelete
            ? `Remove "${pendingDelete.name}" from the site? This can't be undone.`
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
