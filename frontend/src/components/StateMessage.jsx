/**
 * Empty or error state with recovery action.
 * @param {{ message: string, actionLabel: string, onAction: () => void, variant?: 'empty' | 'error' }} props
 */
export default function StateMessage({
  message,
  actionLabel,
  onAction,
  variant = "empty",
}) {
  return (
    <div className={`state-message state-message--${variant}`} role="status">
      <p>{message}</p>
      <button type="button" className="btn btn-secondary" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
