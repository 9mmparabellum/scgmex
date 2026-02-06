import { forwardRef } from 'react';

export default forwardRef(function Select(
  { label, error, options = [], placeholder, className = '', id, ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-[14px] font-medium text-[#333] mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={[
          'block w-full rounded-xl border bg-white text-[#333] text-[15px] px-4 py-3 transition-all appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-guinda/15 focus:border-guinda/40',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f5f5f5]',
          'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27%23999%27%3E%3Cpath%20fill-rule%3D%27evenodd%27%20d%3D%27M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%27%20clip-rule%3D%27evenodd%27/%3E%3C/svg%3E")] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-11',
          error ? 'border-danger focus:ring-danger/15 focus:border-danger' : 'border-[#e0e0e0]',
        ].join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </div>
  );
});
