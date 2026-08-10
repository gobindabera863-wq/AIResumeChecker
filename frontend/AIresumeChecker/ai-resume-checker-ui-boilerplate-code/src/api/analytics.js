import { apiClient } from "./client";

export const analyticsApi = {
  insights: () => apiClient.get("/insights").then((r) => r.data),
  versions: (params) => apiClient.get("/versions", { params }).then((r) => r.data),
  history: (params) => apiClient.get("/history", { params }).then((r) => r.data),
};
