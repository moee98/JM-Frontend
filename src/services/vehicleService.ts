import api from "./apiService";
import { Vehicle } from "../types/vehicle";

const endpoint = "/vehicles";

export const VehicleService = {
  getAll: () => api.get<Vehicle[]>(endpoint),
   getById: (id: number) => api.get<Vehicle>(`${endpoint}/${id}`),
  getByJobId: (id: number) => api.get<Vehicle>(`${endpoint}/job/${id}`),
  create: (data: Vehicle) => api.post<Vehicle>(endpoint, data),
  update: (id: number, data: Partial<Vehicle>) =>
    api.put<Vehicle>(`${endpoint}/${id}`, data),
  delete: (id: number) => api.delete<void>(`${endpoint}/${id}`),
};