import api from "./client";

export const tasksApi = {
  list: (params) => api.get("/tasks", { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (payload) => api.post("/tasks", payload),
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  remove: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  recommendAssignee: (id) =>
    api.post(`/tasks/${id}/recommend`, null, {
      baseURL: import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api/v1"
    })
};
