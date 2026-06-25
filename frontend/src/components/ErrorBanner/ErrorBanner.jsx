const ErrorBanner = ({ message, onRetry, onDismiss, variant = "error" }) => {
  const bg = variant === "warning" ? "bg-yellow-100 border-yellow-400 text-yellow-800" : "bg-red-100 border-red-400 text-red-800";

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-l-4 text-sm ${bg}`}>
      <span>{message}</span>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="underline font-medium hover:no-underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="font-bold text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;
