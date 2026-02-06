export default function EmptyState({ icon, title = 'Sin datos', description, action }) {
  return (
    <div className="text-center py-16">
      {/* Icon */}
      {icon ? (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
            {icon}
          </div>
        </div>
      ) : (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
        </div>
      )}
      {/* Title */}
      <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">{title}</h3>
      {/* Description */}
      {description && (
        <p className="text-sm text-text-muted max-w-sm mx-auto">{description}</p>
      )}
      {/* Action */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
