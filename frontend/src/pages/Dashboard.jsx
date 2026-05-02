import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FolderKanban, ListChecks, UserCheck } from "lucide-react";
import { dashboardApi } from "../api/dashboard";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import { formatDate, formatDateTime, isOverdue } from "../utils/format";
import { priorityStyles, statusStyles } from "../utils/taskMeta";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const response = await dashboardApi.get();
        setStats(response.data.data);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard" />;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live view of project load, progress, and overdue work."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total tasks" value={stats?.totalTasks} icon={ListChecks} accent="bg-slate-900" />
        <StatCard title="Completed" value={stats?.completedTasks} icon={CheckCircle2} accent="bg-emerald-600" />
        <StatCard title="Pending" value={stats?.pendingTasks} icon={Clock3} accent="bg-sky-600" />
        <StatCard title="Overdue" value={stats?.overdueTasks} icon={AlertTriangle} accent="bg-rose-600" />
        <StatCard title="Assigned to me" value={stats?.assignedToMe} icon={UserCheck} accent="bg-indigo-600" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Recent tasks</h2>
          </div>
          <div className="overflow-x-auto">
            {stats?.recentTasks?.length ? (
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Task</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50">
                      <td className="max-w-xs px-5 py-4">
                        <p className="truncate font-medium text-slate-950">{task.title}</p>
                        <p className="truncate text-xs text-slate-500">{task.project?.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={statusStyles[task.status]}>{task.status}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={priorityStyles[task.priority]}>{task.priority}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className={isOverdue(task.dueDate, task.status) ? "font-semibold text-rose-600" : "text-slate-600"}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{task.assignedTo?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <EmptyState icon={ListChecks} title="No task activity yet" />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Recent activity</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentActivity?.length ? (
              stats.recentActivity.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex gap-3 px-5 py-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <FolderKanban size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950">{activity.label}</p>
                    <p className="text-xs text-slate-500">
                      {activity.type} · {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5">
                <EmptyState icon={FolderKanban} title="No recent activity" />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
