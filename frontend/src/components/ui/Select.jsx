import { cn } from "../../utils/cn";

const Select = ({ label, error, children, className, ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
    <select
      className={cn(
        "focus-ring h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900",
        error && "border-rose-300",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
  </label>
);

export default Select;
