import api from "./apiService";
import { VehicleInspection } from "../types/vehicleInspection";

const endpoint = "/vehicleinspection";

export type CreateVehicleInspectionPayload = Omit<
  VehicleInspection,
  "id" | "vehicle"
>;

export const buildVehicleInspectionImageName = (
  jobId: number,
  index: number,
  originalName: string
) => {
  const ext = originalName.includes(".")
    ? `.${originalName.split(".").pop()}`
    : "";
  const safeExt = ext.toLowerCase().replace(/[^.a-z0-9]/g, "") || ".jpg";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `job-${jobId}-inspection-${stamp}-${index + 1}${safeExt}`;
};

export const VehicleInspectionService = {
  getAll: () => api.get<VehicleInspection[]>(endpoint),
  getById: (id: number) => api.get<VehicleInspection>(`${endpoint}/${id}`),
  getByJobId: (id: number) => api.get<VehicleInspection>(`${endpoint}/job/${id}`),
  create: (data: VehicleInspection) => api.post<VehicleInspection>(endpoint, data),
  createWithImages: (
    inspection: CreateVehicleInspectionPayload,
    files: File[]
  ) => {
    const formData = new FormData();
    formData.append("inspection", JSON.stringify(inspection));

    files.forEach((file) => {
      formData.append("files", file, file.name);
    });

    return api.post<VehicleInspection>(`${endpoint}/with-images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  update: (id: number, data: Partial<VehicleInspection>) =>
    api.put<VehicleInspection>(`${endpoint}/${id}`, data),
  delete: (id: number) => api.delete<void>(`${endpoint}/${id}`),
};
