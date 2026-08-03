import { useEffect, useState } from "react";
import { getPublicPage } from "../api/adminClient";
import { useSite } from "../context/SiteContext";
import StateMessage from "../components/StateMessage";
import MarkdownContent from "../components/MarkdownContent";

/**
 * Contact page with CMS body and purchase links from settings.
 */
export default function ContactPage() {
  const { checkoutSettings } = useSite();
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPublicPage("contact")
      .then((response) => {
        if (response.ok) {
          setPage(response.page);
        }
      })
      .catch(() => setError(true));
  }, []);

  const instagramUrl = checkoutSettings?.instagramDirectUrl;
  const telegramUrl = checkoutSettings?.telegramUsername
    ? `https://t.me/${checkoutSettings.telegramUsername}`
    : null;

  return (
    <div className="container cms-page">
      <h1 className="page-title">{page?.title || "Contact"}</h1>

      {error && (
        <StateMessage variant="error" message="Could not load page" actionLabel="Refresh" onAction={() => window.location.reload()} />
      )}

      {page && (
        <div className="cms-content">
          <MarkdownContent content={page.content} />
        </div>
      )}

      <div className="contact-links">
        {instagramUrl && (
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram: @mashood.wear
          </a>
        )}
        {telegramUrl && (
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
            Telegram
          </a>
        )}
      </div>
    </div>
  );
}
