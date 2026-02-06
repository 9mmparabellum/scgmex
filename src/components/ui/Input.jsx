import { forwardRef } from 'react';

export default forwardRef(function Input(
  { label, error, type = 'text', icon, className = '', id, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[14px] font-medium text-[#333] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#bbb]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={[
            'block w-full rounded-xl border bg-white text-[#333] text-[15px] px-4 py-3 placeholder:text-[#bbb] transition-all',
            'focus:outline-none focus:ring-2 focus:ring-guinda/15 focus:border-guinda/40',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f5f5f5]',
            icon ? 'pl-11' : '',
            error ? 'border-danger focus:ring-danger/15 focus:border-danger' : 'border-[#e0e0e0]',
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </div>
  );
});
