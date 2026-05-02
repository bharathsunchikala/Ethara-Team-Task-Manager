import { Mail, ShieldCheck, User } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Profile" description="Your account and access level." />

      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-3xl font-semibold text-white">
            {user?.name?.charAt(0)?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold text-slate-950">{user?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Joined {formatDate(user?.createdAt)}</p>
            <div className="mt-3">
              <Badge className={user?.role === "Admin" ? "bg-slate-900 text-white ring-slate-900" : "bg-slate-100 text-slate-700 ring-slate-200"}>
                <ShieldCheck size={13} className="mr-1" />
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <User size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Name</span>
            <span className="ml-auto text-sm text-slate-950">{user?.name}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Email</span>
            <span className="ml-auto text-sm text-slate-950">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <ShieldCheck size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Role</span>
            <span className="ml-auto text-sm text-slate-950">{user?.role}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
