import { cn } from "../../utils/cn";

const Badge = ({ children, className }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1",
      className
    )}
  >
    {children}
  </span>
);

export default Badge;
