import api from "./client";

export const aiApi = {
  createProjectPlan: (projectId, goal) =>
    api.post(
      "/ai/project-plan",
      { project_id: projectId, goal },
      {
        baseURL: import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api/v1"
      }
    )
};