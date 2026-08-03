/** Words highlighted in maroon on the default hero headline. */
const ACCENT_WORDS = ["STREETS", "FEW"];

/**
 * Split hero headline into lines with optional accent spans.
 * @param {string} headline
 * @returns {Array<{ parts: Array<{ text: string, accent: boolean }> }>}
 */
export function parseHeroHeadline(headline) {
  const lines = headline.split(",").map((line) => line.trim()).filter(Boolean);

  if (lines.length === 0) {
    return [{ parts: [{ text: headline, accent: false }] }];
  }

  return lines.map((line) => {
    const words = line.split(/\s+/);
    const parts = words.map((word) => {
      const normalized = word.replace(/[^A-Za-z]/g, "").toUpperCase();
      return {
        text: word,
        accent: ACCENT_WORDS.includes(normalized),
      };
    });
    return { parts };
  });
}
