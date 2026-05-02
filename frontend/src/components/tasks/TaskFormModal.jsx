import { useEffect, useMemo, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import { priorityOptions, statusOptions } from "../../utils/taskMeta";
import { todayInputValue } from "../../utils/format";

const blankForm = {
  title: "",
  description: "",
  status: "Todo",
  priority: "Medium",
  dueDate: todayInputValue(),
  project: "",
  assignedTo: ""
};

const toInputDate = (date) => {
  if (!date) return todayInputValue();
  return new Date(date).toISOString().split("T")[0];
};

const TaskFormModal = ({
  open,
  onClose,
  onSubmit,
  projects = [],
  initialValue,
  lockedProject,
  isSubmitting
}) => {
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    const projectId =
      lockedProject?._id ||
      initialValue?.project?._id ||
      initialValue?.project ||
      projects[0]?._id ||
      "";

    const assignedTo = initialValue?.assignedTo?._id || initialValue?.assignedTo || "";

    setForm({
      title: initialValue?.title || "",
      description: initialValue?.description || "",
      status: initialValue?.status || "Todo",
      priority: initialValue?.priority || "Medium",
      dueDate: toInputDate(initialValue?.dueDate),
      project: projectId,
      assignedTo
    });
    setErrors({});
  }, [initialValue, lockedProject, open, projects]);

  const selectedProject = useMemo(
    () => lockedProject || projects.find((project) => project._id === form.project),
    [form.project, lockedProject, projects]
  );

  const members = selectedProject?.members || [];

  useEffect(() => {
    if (!open || !selectedProject) return;

    if (!form.assignedTo && members[0]?._id) {
      setForm((current) => ({ ...current, assignedTo: members[0]._id }));
    }
  }, [form.assignedTo, members, open, selectedProject]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Task title is required";
    if (!form.project) nextErrors.project = "Project is required";
    if (!form.assignedTo) nextErrors.assignedTo = "Assignee is required";
    if (!form.dueDate) nextErrors.dueDate = "Due date is required";
    if (form.dueDate && form.dueDate < todayInputValue()) {
      nextErrors.dueDate = "Due date cannot be in the past";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
      project: form.project,
      assignedTo: form.assignedTo
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValue ? "Edit task" : "Create task"}
      description="Assign work to a project member with a clear due date."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          error={errors.title}
          placeholder="Prepare sprint plan"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Acceptance criteria, context, links"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            value={form.project}
            disabled={Boolean(lockedProject)}
            onChange={(event) =>
              setForm({ ...form, project: event.target.value, assignedTo: "" })
            }
            error={errors.project}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select
            label="Assignee"
            value={form.assignedTo}
            onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}
            error={errors.assignedTo}
          >
            <option value="">Select assignee</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            min={todayInputValue()}
            label="Due date"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            error={errors.dueDate}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
