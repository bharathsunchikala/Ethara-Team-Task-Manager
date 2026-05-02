import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Filter, Plus } from "lucide-react";
import { projectsApi } from "../api/projects";
import { tasksApi } from "../api/tasks";
import PageHeader from "../components/layout/PageHeader";
import KanbanBoard from "../components/tasks/KanbanBoard";
import TaskFormModal from "../components/tasks/TaskFormModal";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Pagination from "../components/ui/Pagination";
import Select from "../components/ui/Select";
import { useAuth } from "../context/AuthContext";
import { priorityOptions, statusOptions } from "../utils/taskMeta";

const Tasks = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    project: "",
    overdue: "",
    sortBy: "dueDate",
    sortOrder: "asc"
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 18,
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""))
      };
      const response = await tasksApi.list(params);
      setTasks(response.data.data);
      setPagination(response.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const loadProjects = async () => {
      const response = await projectsApi.list({ limit: 100, sortBy: "name", sortOrder: "asc" });
      setProjects(response.data.data);
    };

    loadProjects();
  }, []);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

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
      await loadTasks();
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
    await loadTasks();
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={isAdmin ? "Search, assign, and track work across projects." : "Your assigned tasks and progress."}
        action={
          isAdmin && (
            <Button onClick={openCreateTask}>
              <Plus size={18} />
              New task
            </Button>
          )
        }
      />

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
          <Input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search tasks"
          />
          <Select value={filters.project} onChange={(event) => updateFilter("project", event.target.value)}>
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)}>
            <option value="">All priorities</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
          <Select value={filters.overdue} onChange={(event) => updateFilter("overdue", event.target.value)}>
            <option value="">Due filter</option>
            <option value="true">Overdue only</option>
          </Select>
          <Select value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(":");
            setFilters((current) => ({ ...current, sortBy, sortOrder }));
            setPage(1);
          }}>
            <option value="dueDate:asc">Due soon</option>
            <option value="createdAt:desc">Newest</option>
            <option value="priority:desc">Priority</option>
            <option value="title:asc">Title</option>
          </Select>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner label="Loading tasks" />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No tasks found"
          description={isAdmin ? "Create a task or adjust the current filters." : "No assigned tasks match these filters."}
          action={isAdmin && <Button onClick={openCreateTask}>Create task</Button>}
        />
      ) : (
        <section className="space-y-4">
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            canManage={isAdmin}
            onEdit={openEditTask}
            onDelete={handleDeleteTask}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </section>
      )}

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        projects={projects}
        initialValue={editingTask}
        isSubmitting={submitting}
      />
    </div>
  );
};

export default Tasks;
