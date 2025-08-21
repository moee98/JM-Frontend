import api from "./apiService";
import { VehicleInspection } from "../types/vehicleInspection";

const endpoint = "/services";

export const VehicleInspectionService = {
  getAll: () => api.get<VehicleInspection[]>(endpoint),
   getById: (id: number) => api.get<VehicleInspection>(`${endpoint}/${id}`),
  getByJobId: (id: number) => api.get<VehicleInspection>(`${endpoint}/job/${id}`),
  create: (data: VehicleInspection) => api.post<VehicleInspection>(endpoint, data),
  update: (id: number, data: Partial<VehicleInspection>) =>
    api.put<VehicleInspection>(`${endpoint}/${id}`, data),
  delete: (id: number) => api.delete<void>(`${endpoint}/${id}`),
};