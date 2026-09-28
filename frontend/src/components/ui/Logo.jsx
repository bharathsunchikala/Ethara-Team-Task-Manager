import { ListTodo } from "lucide-react";
import { cn } from "../../utils/cn";

const Logo = ({ className, imageClassName }) => (
  <span className={cn("inline-flex items-center gap-2 font-semibold text-slate-950", className)}>
    <ListTodo className="h-6 w-6 shrink-0 text-cyan-700" aria-hidden="true" />
    <span className={cn("whitespace-nowrap text-base", imageClassName)}>Team Task Manager</span>
  </span>
);

export default Logo;
