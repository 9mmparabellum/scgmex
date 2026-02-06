export default function Badge({ children, variant = 'default', className = '' }) {
  const variantClasses = {
    default: 'bg-border text-text-secondary',
    primary: 'bg-guinda/10 text-guinda',
    success: 'bg-verde/10 text-verde',
    warning: 'bg-dorado/10 text-dorado-dark',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
  };

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-4',
        variantClasses[variant] || variantClasses.default,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
