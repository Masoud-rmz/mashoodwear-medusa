/**
 * Product search input — submits on Enter or search button.
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   onSearch: (value: string) => void
 * }} props
 */
export default function ProductSearchBar({ value, onChange, onSearch }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(value);
  };

  return (
    <form className="product-search" onSubmit={handleSubmit}>
      <input
        className="search-input"
        type="search"
        placeholder="Search products…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search products"
      />
      <button type="submit" className="btn btn-secondary product-search-btn" aria-label="Search">
        Search
      </button>
    </form>
  );
}
