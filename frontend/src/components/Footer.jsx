import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useSite } from "../context/SiteContext";

/**
 * Three-column footer with shop/info links and social URLs from settings.
 */
export default function Footer() {
  const { homeSettings, checkoutSettings } = useSite();
  const telegramUrl = checkoutSettings
    ? `https://t.me/${checkoutSettings.telegramUsername}`
    : "#";

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Link to="/" className="footer-logo" aria-label="Mashoodwear home">
            <Logo
              logoUrl={homeSettings?.logoUrl}
              className="footer-logo"
              imageClassName="footer-logo-img"
              fallbackClassName="footer-logo-fallback"
            />
          </Link>
          <p className="footer-tagline">
            Independent streetwear. Clothing isn&apos;t just coverage — it&apos;s how you show who you are.
          </p>
        </div>

        <div>
          <p className="footer-heading">Shop</p>
          <ul className="footer-links">
            <li><Link to="/collections">Collections</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/how-to-buy">How to Buy</Link></li>
          </ul>
        </div>

        <div>
          <p className="footer-heading">Info</p>
          <ul className="footer-links">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Mashoodwear. All rights reserved.
        </p>
        <div className="social-links">
          {checkoutSettings && (
            <>
              <a
                href={checkoutSettings.instagramDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
