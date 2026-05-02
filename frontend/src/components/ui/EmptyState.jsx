const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
    {Icon && (
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon size={22} />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-950">{title}</h3>
    {description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
