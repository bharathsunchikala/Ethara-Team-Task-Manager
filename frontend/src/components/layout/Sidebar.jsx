import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  User,
  Users,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";
import Logo from "../ui/Logo";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Team", href: "/team", icon: Users },
  { label: "Profile", href: "/profile", icon: User }
];

const Sidebar = ({ mobileOpen, onClose }) => (
  <>
    {mobileOpen && (
      <button
        className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
        aria-label="Close sidebar overlay"
        onClick={onClose}
      />
    )}
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <NavLink to="/dashboard" className="min-w-0" onClick={onClose} aria-label="Ethara.AI dashboard">
          <Logo imageClassName="h-12 max-w-[210px]" />
        </NavLink>
        <Button className="lg:hidden" variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
          <X size={19} />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  </>
);

export default Sidebar;
