import { forwardRef } from 'react';

export default forwardRef(function Input(
  { label, error, type = 'text', icon, className = '', id, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-[#333] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#bbb]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={[
            'block w-full rounded-lg border bg-white text-[#333] text-sm px-3 py-2 placeholder:text-[#bbb] transition-all',
            'focus:outline-none focus:ring-1 focus:ring-guinda/20 focus:border-guinda/40',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f5f5f5]',
            icon ? 'pl-10' : '',
            error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-[#e0e0e0]',
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});
