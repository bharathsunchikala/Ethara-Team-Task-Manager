import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { authApi } from "../api/auth";
import { projectsApi } from "../api/projects";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const roleStyles = {
  Admin: "bg-slate-900 text-white ring-slate-900",
  Member: "bg-slate-100 text-slate-700 ring-slate-200"
};

const TeamMembers = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const projectRequest = projectsApi.list({ limit: 100, sortBy: "name", sortOrder: "asc" });
        const [projectResponse, userResponse] = await Promise.all([
          projectRequest,
          isAdmin ? authApi.users() : Promise.resolve(null)
        ]);

        setProjects(projectResponse.data.data);

        if (isAdmin) {
          setUsers(userResponse.data.data);
        } else {
          const memberMap = new Map();
          projectResponse.data.data.forEach((project) => {
            project.members?.forEach((member) => {
              memberMap.set(member._id, member);
            });
          });
          setUsers([...memberMap.values()]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  const projectCountByUser = useMemo(() => {
    const counts = new Map();
    projects.forEach((project) => {
      project.members?.forEach((member) => {
        counts.set(member._id, (counts.get(member._id) || 0) + 1);
      });
    });
    return counts;
  }, [projects]);

  if (loading) {
    return <LoadingSpinner label="Loading team" />;
  }

  return (
    <div>
      <PageHeader
        title="Team Members"
        description={isAdmin ? "User directory with project membership visibility." : "People you share assigned projects with."}
      />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No team members found" />
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Projects</th>
                  {isAdmin && <th className="px-5 py-3">Joined</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-semibold text-slate-700">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-950">{user.name}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={roleStyles[user.role] || roleStyles.Member}>
                        <ShieldCheck size={13} className="mr-1" />
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{projectCountByUser.get(user._id) || 0}</td>
                    {isAdmin && <td className="px-5 py-4 text-slate-600">{formatDate(user.createdAt)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamMembers;
