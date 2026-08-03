import { useEffect, useState } from "react";
import { getPublicPage } from "../api/adminClient";
import PersianText from "../components/PersianText";
import StateMessage from "../components/StateMessage";
import MarkdownContent from "../components/MarkdownContent";

/**
 * Generic CMS page by slug.
 * @param {{ slug: string, fallbackTitle: string }} props
 */
export default function CmsPage({ slug, fallbackTitle }) {
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const load = () => {
    getPublicPage(slug)
      .then((response) => {
        if (!response.ok) {
          setNotFound(true);
          return;
        }
        setPage(response.page);
      })
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (notFound) {
    return (
      <div className="container cms-page">
        <StateMessage variant="empty" message="Page not found" actionLabel="Home" onAction={() => { window.location.href = "/"; }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container cms-page">
        <StateMessage variant="error" message="Could not load page" actionLabel="Try again" onAction={load} />
      </div>
    );
  }

  if (!page) {
    return <div className="container cms-page"><p>Loading…</p></div>;
  }

  return (
    <div className="container cms-page">
      <PersianText as="h1" className="page-title" variant="heading">
        {page.title || fallbackTitle}
      </PersianText>
      <div className="cms-content">
        <MarkdownContent content={page.content} />
      </div>
    </div>
  );
}
