import { cn } from "../../utils/cn";

const variants = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  icon: "h-10 w-10 p-0"
};

const Button = ({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  isLoading = false,
  disabled,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    className={cn(
      "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {isLoading ? "Working..." : children}
  </button>
);

export default Button;
