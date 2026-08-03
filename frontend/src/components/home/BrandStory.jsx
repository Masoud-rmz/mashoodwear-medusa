import { Link } from "react-router-dom";
import ScrollReveal from "../ScrollReveal";
import { useSite } from "../../context/SiteContext";

const DEFAULT_TEASER = "BUILT DIFFERENT.";
const DEFAULT_BODY =
  "Born from the streets — where identity, taste, and path differ for everyone. We don't design for the masses or chase fleeting trends.";

/**
 * Brand story teaser with Read more link to About.
 */
export default function BrandStory() {
  const { homeSettings } = useSite();
  const teaser = homeSettings?.brandStoryTeaser || DEFAULT_TEASER;
  const body = homeSettings?.brandStoryBody || DEFAULT_BODY;

  return (
    <ScrollReveal className="container brand-story-section">
      <div className="brand-story">
        <h2 className="brand-story-title">{teaser}</h2>
        <p className="brand-story-text">{body}</p>
        <Link to="/about" className="btn btn-secondary">
          Read more
        </Link>
      </div>
    </ScrollReveal>
  );
}
