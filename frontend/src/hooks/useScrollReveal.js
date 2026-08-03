import { useEffect, useRef } from "react";

/**
 * Fade-in sections on scroll; disabled when prefers-reduced-motion is set.
 * @param {React.RefObject<HTMLElement | null>} ref
 */
export function useScrollReveal(ref) {
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      element.classList.add("reveal", "visible");
      return undefined;
    }

    element.classList.add("reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}
