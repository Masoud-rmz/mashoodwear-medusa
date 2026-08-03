import { useEffect, useState } from "react";
import { adminGetPages, adminUpdatePage } from "../../api/adminClient";
import Toast from "../../components/Toast";
import MarkdownContent from "../../components/MarkdownContent";

const PAGE_TABS = [
  { slug: "about", label: "About" },
  { slug: "contact", label: "Contact" },
  { slug: "how-to-buy", label: "How to Buy" },
];

/**
 * CMS page editor with Markdown preview (lookbook removed from storefront).
 */
export default function PagesEditorPage() {
  const [activeSlug, setActiveSlug] = useState("about");
  const [pages, setPages] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const loadPages = () => {
    adminGetPages()
      .then((response) => setPages(response.items))
      .catch((loadError) => setError(loadError.message || "Could not load pages"));
  };

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    const page = pages.find((item) => item.slug === activeSlug);
    setTitle(page?.title || "");
    setContent(page?.content || "");
    setPreview(false);
  }, [activeSlug, pages]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await adminUpdatePage(activeSlug, { title, content });
      setToast("Saved");
      loadPages();
    } catch (saveError) {
      setError(saveError.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">Pages</h1>
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-tabs">
        {PAGE_TABS.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            className={activeSlug === tab.slug ? "active" : undefined}
            onClick={() => setActiveSlug(tab.slug)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-form">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <div className="admin-page-toolbar">
          <button type="button" className="btn btn-secondary" onClick={() => setPreview((value) => !value)}>
            {preview ? "Edit" : "Preview"}
          </button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {preview ? (
          <div className="cms-content">
            <MarkdownContent content={content} />
          </div>
        ) : (
          <textarea
            className="admin-textarea"
            rows={16}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        )}
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
