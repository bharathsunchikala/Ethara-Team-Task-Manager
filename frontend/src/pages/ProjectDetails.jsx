import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Plus, Trash2, Users } from "lucide-react";
import { authApi } from "../api/auth";
import { projectsApi } from "../api/projects";
import { tasksApi } from "../api/tasks";
import PageHeader from "../components/layout/PageHeader";
import KanbanBoard from "../components/tasks/KanbanBoard";
import TaskFormModal from "../components/tasks/TaskFormModal";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Select from "../components/ui/Select";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const ProjectDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const [projectResponse, taskResponse] = await Promise.all([
        projectsApi.get(id),
        tasksApi.list({ project: id, limit: 100, sortBy: "dueDate", sortOrder: "asc" })
      ]);
      setProject(projectResponse.data.data);
      setTasks(taskResponse.data.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async () => {
      const response = await authApi.users();
      setUsers(response.data.data);
    };

    loadUsers();
  }, [isAdmin]);

  const availableUsers = useMemo(() => {
    const memberIds = new Set((project?.members || []).map((member) => member._id));
    return users.filter((user) => !memberIds.has(user._id));
  }, [project, users]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      done: tasks.filter((task) => task.status === "Completed").length,
      open: tasks.filter((task) => task.status !== "Completed").length
    }),
    [tasks]
  );

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleTaskSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingTask) {
        await tasksApi.update(editingTask._id, payload);
        toast.success("Task updated");
      } else {
        await tasksApi.create(payload);
        toast.success("Task created");
      }

      setTaskModalOpen(false);
      await loadProject();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    if (task.status === status) return;
    const response = await tasksApi.updateStatus(task._id, status);
    setTasks((current) => current.map((item) => (item._id === task._id ? response.data.data : item)));
    toast.success("Task status updated");
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete ${task.title}?`)) return;

    await tasksApi.remove(task._id);
    toast.success("Task deleted");
    await loadProject();
  };

  const handleAddMember = async () => {
    if (!selectedMember) return;
    const response = await projectsApi.addMembers(project._id, { memberId: selectedMember });
    setProject(response.data.data);
    setSelectedMember("");
    toast.success("Member added");
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from ${project.name}?`)) return;

    const response = await projectsApi.removeMember(project._id, member._id);
    setProject(response.data.data);
    toast.success("Member removed");
  };

  if (loading) {
    return <LoadingSpinner label="Loading project" />;
  }

  if (!project) {
    return <EmptyState icon={CalendarDays} title="Project not found" />;
  }

  return (
    <div>
      <div className="mb-4">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950" to="/projects">
          <ArrowLeft size={16} />
          Projects
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={project.description || "No project description."}
        action={
          isAdmin && (
            <Button onClick={openCreateTask}>
              <Plus size={18} />
              New task
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard title="Project tasks" value={counts.total} icon={CalendarDays} accent="bg-slate-900" />
        <StatCard title="Open tasks" value={counts.open} icon={CalendarDays} accent="bg-sky-600" />
        <StatCard title="Completed" value={counts.done} icon={CalendarDays} accent="bg-emerald-600" />
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Members</h2>
            <p className="text-sm text-slate-500">Created {formatDate(project.createdAt)}</p>
          </div>
          {isAdmin && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-80 sm:flex-row">
              <Select
                value={selectedMember}
                onChange={(event) => setSelectedMember(event.target.value)}
                aria-label="Select member"
              >
                <option value="">Add member</option>
                {availableUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} · {user.role}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" onClick={handleAddMember} disabled={!selectedMember}>
                Add
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {project.members?.map((member) => (
            <div key={member._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                  {member.name?.charAt(0)?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">{member.name}</p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              {isAdmin && project.createdBy?._id !== member._id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                  onClick={() => handleRemoveMember(member)}
                  aria-label="Remove member"
                >
                  <Trash2 size={15} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tasks in this view"
          description={isAdmin ? "Create the first task for this project." : "You do not have assigned tasks in this project."}
          action={isAdmin && <Button onClick={openCreateTask}>Create task</Button>}
        />
      ) : (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          canManage={isAdmin}
          onEdit={openEditTask}
          onDelete={handleDeleteTask}
        />
      )}

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        projects={[project]}
        lockedProject={project}
        initialValue={editingTask}
        isSubmitting={submitting}
      />
    </div>
  );
};

export default ProjectDetails;
