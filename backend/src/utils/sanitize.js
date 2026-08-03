import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize Markdown/HTML content before storage.
 * @param {string} content
 * @returns {string}
 */
export function sanitizeMarkdown(content) {
  return DOMPurify.sanitize(content ?? "", {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "a",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "title", "target", "rel"],
  });
}
