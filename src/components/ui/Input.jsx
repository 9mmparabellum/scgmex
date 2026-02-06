import { forwardRef } from 'react';

export default forwardRef(function Input(
  { label, error, type = 'text', icon, className = '', id, ...props },
  ref
) {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-heading mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={[
            'block w-full h-[40px] rounded-md border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5',
            'placeholder:text-text-muted transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:border-guinda',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-hover',
            icon ? 'pl-10' : '',
            error
              ? 'border-danger focus:ring-danger/25 focus:border-danger'
              : 'border-border focus:ring-guinda/25',
          ].join(' ')}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-[0.8125rem] text-danger">{error}</p>
      )}
    </div>
  );
});
