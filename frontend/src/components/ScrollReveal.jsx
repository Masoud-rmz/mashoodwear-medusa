import { useRef } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

/**
 * Wrapper that fades in when scrolled into view.
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export default function ScrollReveal({ children, className = "" }) {
  const ref = useRef(null);
  useScrollReveal(ref);

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}
