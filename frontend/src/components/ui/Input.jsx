import { cn } from "../../utils/cn";

const Input = ({ label, error, className, ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
    <input
      className={cn(
        "focus-ring h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
        error && "border-rose-300",
        className
      )}
      {...props}
    />
    {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
  </label>
);

export default Input;
