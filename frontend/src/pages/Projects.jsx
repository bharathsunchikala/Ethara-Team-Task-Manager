import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Eye, FolderPlus, Pencil, Search, Trash2 } from "lucide-react";
import { authApi } from "../api/auth";
import { projectsApi } from "../api/projects";
import PageHeader from "../components/layout/PageHeader";
import ProjectFormModal from "../components/projects/ProjectFormModal";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Pagination from "../components/ui/Pagination";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectsApi.list({ page, limit: 8, search });
      setProjects(response.data.data);
      setPagination(response.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async () => {
      const response = await authApi.users();
      setUsers(response.data.data);
    };

    loadUsers();
  }, [isAdmin]);

  const openCreate = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingProject) {
        await projectsApi.update(editingProject._id, payload);
        toast.success("Project updated");
      } else {
        await projectsApi.create(payload);
        toast.success("Project created");
      }

      setModalOpen(false);
      await loadProjects();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete ${project.name}? This also deletes its tasks.`)) return;

    await projectsApi.remove(project._id);
    toast.success("Project deleted");
    await loadProjects();
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description={isAdmin ? "Create, edit, and staff active projects." : "Projects where you are a member."}
        action={
          isAdmin && (
            <Button onClick={openCreate}>
              <FolderPlus size={18} />
              New project
            </Button>
          )
        }
      />

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
          />
        </div>
        <Button type="submit" variant="secondary">
          <Search size={17} />
          Search
        </Button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6">
            <LoadingSpinner label="Loading projects" />
          </div>
        ) : projects.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FolderPlus}
              title="No projects found"
              description={isAdmin ? "Create a project and add members to start assigning tasks." : "You have not been added to any projects yet."}
              action={isAdmin && <Button onClick={openCreate}>Create project</Button>}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Members</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((project) => (
                    <tr key={project._id} className="hover:bg-slate-50">
                      <td className="max-w-md px-5 py-4">
                        <p className="font-medium text-slate-950">{project.name}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">
                          {project.description || "No description"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {project.members?.slice(0, 4).map((member) => (
                            <span key={member._id} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              {member.name}
                            </span>
                          ))}
                          {project.members?.length > 4 && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              +{project.members.length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(project.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/projects/${project._id}`}
                            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50"
                            aria-label="View project"
                          >
                            <Eye size={16} />
                          </Link>
                          {isAdmin && (
                            <>
                              <Button variant="secondary" size="icon" onClick={() => openEdit(project)} aria-label="Edit project">
                                <Pencil size={16} />
                              </Button>
                              <Button variant="secondary" size="icon" onClick={() => handleDelete(project)} aria-label="Delete project">
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </section>

      <ProjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        users={users}
        initialValue={editingProject}
        isSubmitting={submitting}
      />
    </div>
  );
};

export default Projects;
