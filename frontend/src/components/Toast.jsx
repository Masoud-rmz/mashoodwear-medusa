import { useEffect } from "react";

/**
 * Short-lived toast notification.
 * @param {{ message: string, onDismiss: () => void, durationMs?: number }} props
 */
export default function Toast({ message, onDismiss, durationMs = 2500 }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss, message]);

  return (
    <div className="toast show" role="status" aria-live="polite">
      {message}
    </div>
  );
}
