import { useEffect } from "react";
import { CheckIcon, AlertIcon } from "./icons";

/**
 * Short-lived toast notification with success/error styling.
 * @param {{ message: string, onDismiss: () => void, durationMs?: number, variant?: "success" | "error" | "info" }} props
 */
export default function Toast({ message, onDismiss, durationMs = 2500, variant = "success" }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss, message]);

  return (
    <div className={`toast show toast--${variant}`} role="status" aria-live="polite">
      <span className="toast-icon" aria-hidden="true">
        {variant === "error" ? <AlertIcon /> : <CheckIcon />}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
}
