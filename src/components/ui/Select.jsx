import { forwardRef } from 'react';

export default forwardRef(function Select(
  { label, error, options = [], placeholder, className = '', id, ...props },
  ref
) {
  const selectId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text-heading mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={[
            'block w-full h-[40px] rounded-md border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5',
            'transition-all duration-150 appearance-none',
            'focus:outline-none focus:ring-2 focus:border-guinda',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-hover',
            'pr-10',
            error
              ? 'border-danger focus:ring-danger/25 focus:border-danger'
              : 'border-border focus:ring-guinda/25',
          ].join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-text-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-4 w-4 text-text-secondary"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-[0.8125rem] text-danger">{error}</p>
      )}
    </div>
  );
});
