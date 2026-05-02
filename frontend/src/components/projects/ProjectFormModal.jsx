import { useEffect, useMemo, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Textarea from "../ui/Textarea";

const blankForm = {
  name: "",
  description: "",
  members: []
};

const ProjectFormModal = ({ open, onClose, onSubmit, users = [], initialValue, isSubmitting }) => {
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    setForm({
      name: initialValue?.name || "",
      description: initialValue?.description || "",
      members: (initialValue?.members || []).map((member) => member._id || member)
    });
    setErrors({});
  }, [initialValue, open]);

  const userOptions = useMemo(() => users.filter(Boolean), [users]);

  const toggleMember = (userId) => {
    setForm((current) => ({
      ...current,
      members: current.members.includes(userId)
        ? current.members.filter((id) => id !== userId)
        : [...current.members, userId]
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Project name is required";
    if (form.name.length > 120) nextErrors.name = "Project name is too long";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      members: form.members
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValue ? "Edit project" : "Create project"}
      description="Set the project details and choose who can participate."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Project name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          error={errors.name}
          placeholder="Website redesign"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Scope, goals, milestones"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Project members</p>
          <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
            {userOptions.length === 0 ? (
              <p className="text-sm text-slate-500">No users available yet.</p>
            ) : (
              userOptions.map((user) => (
                <label
                  key={user._id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={form.members.includes(user._id)}
                    onChange={() => toggleMember(user._id)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800">{user.name}</span>
                    <span className="block truncate text-xs text-slate-500">{user.email}</span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
