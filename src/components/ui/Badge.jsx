export default function Badge({
  children,
  variant = 'default',
  className = '',
}) {
  const variantClasses = {
    default: 'bg-[#e7e7e8] text-text-secondary',
    primary: 'bg-[#9D2449]/15 text-[#9D2449]',
    success: 'bg-[#71dd37]/15 text-[#56ca00]',
    warning: 'bg-[#ffab00]/15 text-[#e09600]',
    danger: 'bg-[#ff3e1d]/15 text-[#e0360a]',
    info: 'bg-[#03c3ec]/15 text-[#03a9ce]',
  };

  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold leading-4',
        variantClasses[variant] || variantClasses.default,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
