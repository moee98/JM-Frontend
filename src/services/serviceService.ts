import api from "./apiService";
import { Service } from "../types/service";

const endpoint = "/services";

export const ServiceService = {
  getAll: () => api.get<Service[]>(endpoint),
   getById: (id: number) => api.get<Service>(`${endpoint}/${id}`),
  getByJobId: (id: number) => api.get<Service>(`${endpoint}/job/${id}`),
  create: (data: Service) => api.post<Service>(endpoint, data),
  update: (id: number, data: Partial<Service>) =>
    api.put<Service>(`${endpoint}/${id}`, data),
  delete: (id: number) => api.delete<void>(`${endpoint}/${id}`),
};