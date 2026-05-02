import { LogOut, Menu } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Button className="lg:hidden" variant="ghost" size="icon" onClick={onOpenSidebar} aria-label="Open sidebar">
          <Menu size={20} />
        </Button>
        <div>
          <p className="text-sm text-slate-500">Workspace</p>
          <h1 className="text-base font-semibold text-slate-950 sm:text-lg">Project Management</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </span>
        <Button variant="secondary" size="icon" onClick={logout} aria-label="Log out">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
