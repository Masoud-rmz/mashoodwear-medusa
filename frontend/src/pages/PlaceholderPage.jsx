/**
 * Placeholder for routes shipping in later phases.
 * @param {{ title: string }} props
 */
export default function PlaceholderPage({ title }) {
  return (
    <div className="container placeholder-page">
      <h1 className="page-title">{title}</h1>
      <p className="placeholder-page__note">Coming in a later phase.</p>
    </div>
  );
}
