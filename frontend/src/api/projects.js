import api from "./client";

export const projectsApi = {
  list: (params) => api.get("/projects", { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (payload) => api.post("/projects", payload),
  update: (id, payload) => api.put(`/projects/${id}`, payload),
  remove: (id) => api.delete(`/projects/${id}`),
  addMembers: (id, payload) => api.post(`/projects/${id}/members`, payload),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`)
};
