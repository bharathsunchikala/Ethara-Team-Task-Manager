const StatCard = ({ title, value, icon: Icon, accent = "bg-slate-900" }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950">{value ?? 0}</p>
      </div>
      {Icon && (
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-white ${accent}`}>
          <Icon size={21} />
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
