import { Link } from "react-router-dom";
import { parseHeroHeadline } from "../../utils/heroHeadline";
import { persianTextClass } from "../../utils/persianText";
import { useSite } from "../../context/SiteContext";

const DEFAULTS = {
  heroEyebrow: "Independent streetwear",
  heroHeadline: "FROM THE STREETS, FOR THE FEW",
  heroSubtitle:
    "Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.",
};

/**
 * Hero image slot — shows uploaded image or placeholder label.
 * @param {{ imageUrl?: string, label: string }} props
 */
function HeroImageSlot({ imageUrl, label }) {
  if (imageUrl) {
    return (
      <div className="hero-image-slot hero-image-slot--filled">
        <img src={imageUrl} alt="" />
      </div>
    );
  }

  return <div className="hero-image-slot">{label}</div>;
}

/**
 * Two-column hero — black base with maroon glow; content from home settings.
 */
export default function Hero() {
  const { homeSettings, checkoutSettings } = useSite();

  const eyebrow = homeSettings?.heroEyebrow ?? DEFAULTS.heroEyebrow;
  const headline = homeSettings?.heroHeadline ?? DEFAULTS.heroHeadline;
  const subtitle = homeSettings?.heroSubtitle ?? DEFAULTS.heroSubtitle;
  const headlineLines = parseHeroHeadline(headline);
  const instagramUrl = checkoutSettings?.instagramDirectUrl ?? "#";
  const videoEnabled = homeSettings?.heroVideoEnabled && homeSettings?.heroVideoUrl;

  return (
    <section className={`hero${videoEnabled ? " hero--video" : ""}`}>
      {videoEnabled && (
        <video
          className="hero-video"
          src={homeSettings.heroVideoUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className="hero-text">
        {eyebrow ? (
          <p className={["hero-eyebrow", persianTextClass(eyebrow)].filter(Boolean).join(" ")}>
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={["hero-title", persianTextClass(headline, "heading")].filter(Boolean).join(" ")}
        >
          {headlineLines.map((line, lineIndex) => (
            <span
              key={`line-${lineIndex}`}
              className={`hero-title-line${
                lineIndex === headlineLines.length - 1 ? " hero-title-line--bottom" : ""
              }`}
            >
              {line.parts.map((part, partIndex) => (
                <span key={`part-${partIndex}`}>
                  {partIndex > 0 ? " " : ""}
                  {part.accent ? (
                    <span className="accent">{part.text}</span>
                  ) : (
                    part.text
                  )}
                </span>
              ))}
              {lineIndex < headlineLines.length - 1 ? "," : ""}
            </span>
          ))}
        </h1>
        <p className={["hero-subtitle", persianTextClass(subtitle)].filter(Boolean).join(" ")}>
          {subtitle}
        </p>
        <div className="hero-ctas">
          <Link to="/products" className="btn btn-primary">
            View Products
          </Link>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Order on Instagram
          </a>
        </div>
      </div>

      <div className="hero-images">
        <HeroImageSlot
          imageUrl={homeSettings?.heroImage1Url}
          label="Model image 1"
        />
        <HeroImageSlot
          imageUrl={homeSettings?.heroImage2Url}
          label="Model image 2"
        />
      </div>
    </section>
  );
}
