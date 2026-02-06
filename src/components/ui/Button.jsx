export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    primary: 'bg-guinda text-white hover:bg-guinda-light active:scale-[0.98]',
    secondary: 'bg-[#111] text-white hover:bg-[#222] active:scale-[0.98]',
    danger: 'bg-danger text-white hover:bg-danger/80 active:scale-[0.98]',
    ghost: 'bg-transparent text-[#666] hover:bg-[#f5f5f5] hover:text-[#333]',
    outline: 'bg-white border border-[#e0e0e0] text-[#333] hover:bg-[#f5f5f5] active:scale-[0.98]',
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1',
    md: 'text-sm px-4 py-2 gap-1.5',
    lg: 'text-sm px-5 py-2.5 gap-2',
  };

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className,
  ].join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
