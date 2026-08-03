import { persianTextClass } from "../utils/persianText";

/**
 * Minimal Markdown renderer for CMS pages (headings, lists, paragraphs, links).
 * @param {{ content: string }} props
 */
export default function MarkdownContent({ content }) {
  const lines = (content || "").split("\n");
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`}>
          {listItems.map((item, index) => (
            <li key={index} className={persianTextClass(item)} dir={persianTextClass(item) ? "auto" : undefined}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      const headingText = trimmed.slice(3);
      elements.push(
        <h2
          key={elements.length}
          className={persianTextClass(headingText, "heading")}
          dir={persianTextClass(headingText, "heading") ? "auto" : undefined}
        >
          {renderInline(headingText)}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      const headingText = trimmed.slice(2);
      elements.push(
        <h1
          key={elements.length}
          className={persianTextClass(headingText, "heading")}
          dir={persianTextClass(headingText, "heading") ? "auto" : undefined}
        >
          {renderInline(headingText)}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    flushList();
    elements.push(
      <p
        key={elements.length}
        className={persianTextClass(trimmed)}
        dir={persianTextClass(trimmed) ? "auto" : undefined}
      >
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  return <>{elements}</>;
}

/**
 * Render inline bold and links in a simple way.
 * @param {string} text
 */
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
