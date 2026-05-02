import { Calendar, Pencil, Trash2 } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Select from "../ui/Select";
import { formatDate, isOverdue } from "../../utils/format";
import { priorityStyles, statusOptions, statusStyles } from "../../utils/taskMeta";

const TaskCard = ({ task, onStatusChange, canManage, onEdit, onDelete }) => {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">{task.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {task.description || "No description"}
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)} aria-label="Edit task">
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
              onClick={() => onDelete(task)}
              aria-label="Delete task"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className={priorityStyles[task.priority]}>{task.priority}</Badge>
        <Badge className={statusStyles[task.status]}>{task.status}</Badge>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Calendar size={14} />
        <span className={overdue ? "font-semibold text-rose-600" : ""}>
          {formatDate(task.dueDate)}
        </span>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{task.assignedTo?.name || "Unassigned"}</span>
        {task.project?.name && <span> · {task.project.name}</span>}
      </div>

      <div className="mt-4">
        <Select
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value)}
          aria-label="Update status"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>
    </article>
  );
};

const KanbanBoard = ({ tasks = [], onStatusChange, canManage, onEdit, onDelete }) => (
  <div className="grid gap-4 xl:grid-cols-3">
    {statusOptions.map((status) => {
      const columnTasks = tasks.filter((task) => task.status === status);

      return (
        <section key={status} className="min-h-80 rounded-lg border border-slate-200 bg-slate-100/60">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Badge className={statusStyles[status]}>{status}</Badge>
              <span className="text-sm font-medium text-slate-500">{columnTasks.length}</span>
            </div>
          </div>
          <div className="space-y-3 p-3">
            {columnTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                No tasks
              </div>
            ) : (
              columnTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={onStatusChange}
                  canManage={canManage}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </section>
      );
    })}
  </div>
);

export default KanbanBoard;
