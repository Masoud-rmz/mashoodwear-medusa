import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { getCheckoutSettings, getHomeSettings } from "../api/client";
import { SiteContext } from "../context/SiteContext";
import Header from "./Header";
import Footer from "./Footer";

const PARALLAX_SPEEDS = [0.14, -0.1, 0.2, -0.16];

/**
 * Storefront shell — loads site settings once and wraps all public pages.
 * Logo-bg marks float at slightly different scroll speeds for depth effect.
 */
export default function Layout() {
  const [homeSettings, setHomeSettings] = useState(null);
  const [checkoutSettings, setCheckoutSettings] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const markRefs = useRef([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getHomeSettings(), getCheckoutSettings()])
      .then(([home, checkout]) => {
        if (!cancelled) {
          setHomeSettings(home);
          setCheckoutSettings(checkout);
        }
      })
      .catch((error) => {
        console.error("Failed to load site settings:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let framePending = false;

    function applyParallax() {
      if (motionQuery.matches) {
        markRefs.current.forEach((mark) => {
          if (mark) mark.style.removeProperty("--mark-shift-y");
        });
        return;
      }
      const scrollY = window.scrollY;
      markRefs.current.forEach((mark, i) => {
        if (mark) {
          mark.style.setProperty("--mark-shift-y", scrollY * PARALLAX_SPEEDS[i] + "px");
        }
      });
    }

    function onScroll() {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(() => {
        applyParallax();
        framePending = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    motionQuery.addEventListener("change", applyParallax);
    applyParallax();

    return () => {
      window.removeEventListener("scroll", onScroll);
      motionQuery.removeEventListener("change", applyParallax);
    };
  }, []);

  return (
    <SiteContext.Provider value={{ homeSettings, checkoutSettings }}>
      <div className="logo-bg" aria-hidden="true">
        {PARALLAX_SPEEDS.map((_, i) => (
          <span
            key={i}
            className="logo-bg__mark"
            ref={(el) => { markRefs.current[i] = el; }}
          />
        ))}
      </div>
      <Header
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onMenuClose={() => setMenuOpen(false)}
      />
      <main id="app">
        <Outlet />
      </main>
      <Footer />
    </SiteContext.Provider>
  );
}
