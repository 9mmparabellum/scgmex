import { forwardRef } from 'react';

export default forwardRef(function Input(
  { label, error, type = 'text', icon, className = '', id, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={[
            'block w-full rounded-lg border bg-bg-input text-text-primary text-sm px-3 py-2 placeholder:text-text-muted transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-hover',
            icon ? 'pl-10' : '',
            error
              ? 'border-danger focus:ring-danger/30 focus:border-danger'
              : 'border-border',
          ].join(' ')}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  );
});
