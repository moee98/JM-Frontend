import type { AttachmentSummary } from "../types/attachment";
import type {
  VehicleInspection,
  VehicleInspectionInput,
} from "../types/vehicleInspection";
import api from "./apiService";

const ENDPOINT = "/VehicleInspections";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeAttachment = (value: unknown): AttachmentSummary | null => {
  if (!isRecord(value)) return null;

  const parsedId = Number(value.id);
  const fileSize = Number(value.fileSize);

  if (!Number.isFinite(parsedId) || parsedId <= 0) return null;

  return {
    id: parsedId,
    fileName: typeof value.fileName === "string" ? value.fileName : "Attachment",
    contentType:
      typeof value.contentType === "string"
        ? value.contentType
        : "application/octet-stream",
    fileSize: Number.isFinite(fileSize) ? fileSize : 0,
    uploadedAt:
      typeof value.uploadedAt === "string" && value.uploadedAt
        ? value.uploadedAt
        : new Date().toISOString(),
    downloadUrl: typeof value.downloadUrl === "string" ? value.downloadUrl : "",
  };
};

const normalizeVehicleInspection = (value: unknown): VehicleInspection | null => {
  if (!isRecord(value)) return null;

  const parsedId = Number(value.id);
  const parsedVehicleId = Number(value.vehicleId);

  if (!Number.isFinite(parsedId) || parsedId <= 0) return null;

  return {
    id: parsedId,
    vehicleId: Number.isFinite(parsedVehicleId) ? parsedVehicleId : 0,
    inspectionDate:
      typeof value.inspectionDate === "string" && value.inspectionDate
        ? value.inspectionDate
        : new Date().toISOString(),
    inspectionResult:
      typeof value.inspectionResult === "string" ? value.inspectionResult : "",
    comments: typeof value.comments === "string" ? value.comments : "",
    pathToImages: Array.isArray(value.pathToImages)
      ? value.pathToImages.filter((item): item is string => typeof item === "string")
      : [],
    attachments: Array.isArray(value.attachments)
      ? value.attachments
          .map((attachment) => normalizeAttachment(attachment))
          .filter((attachment): attachment is AttachmentSummary => attachment !== null)
      : [],
  };
};

export const VehicleInspectionService = {
  getAll: async (): Promise<VehicleInspection[]> => {
    const res = await api.get<unknown[]>(ENDPOINT);
    if (!Array.isArray(res.data)) return [];

    return res.data
      .map((item) => normalizeVehicleInspection(item))
      .filter((item): item is VehicleInspection => item !== null);
  },

  getById: async (id: number): Promise<VehicleInspection | null> => {
    const res = await api.get<unknown>(`${ENDPOINT}/${id}`);
    return normalizeVehicleInspection(res.data);
  },

  create: async (data: VehicleInspectionInput): Promise<VehicleInspection> => {
    const res = await api.post<unknown>(ENDPOINT, data);
    const inspection = normalizeVehicleInspection(res.data);

    if (!inspection) {
      throw new Error("Failed to parse created vehicle inspection.");
    }

    return inspection;
  },

  uploadAttachments: async (
    id: number,
    files: File[]
  ): Promise<AttachmentSummary[]> => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("Files", file, file.name);
    });

    const res = await api.post<unknown[]>(`${ENDPOINT}/${id}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!Array.isArray(res.data)) return [];

    return res.data
      .map((attachment) => normalizeAttachment(attachment))
      .filter((attachment): attachment is AttachmentSummary => attachment !== null);
  },

  getAttachmentBlob: async (downloadUrl: string): Promise<Blob> => {
    const normalizedPath = downloadUrl.startsWith("/api/")
      ? downloadUrl.slice(4)
      : downloadUrl;

    const res = await api.get<Blob>(normalizedPath, {
      responseType: "blob",
    });

    return res.data;
  },

  update: async (
    id: number,
    data: Partial<VehicleInspectionInput>
  ): Promise<VehicleInspection | null> => {
    const current = await VehicleInspectionService.getById(id);
    if (!current) return null;

    await api.put<void>(`${ENDPOINT}/${id}`, {
      id,
      vehicleId: data.vehicleId ?? current.vehicleId,
      inspectionDate: data.inspectionDate ?? current.inspectionDate,
      inspectionResult: data.inspectionResult ?? current.inspectionResult,
      comments: data.comments ?? current.comments,
      pathToImages: data.pathToImages ?? current.pathToImages,
    });

    return VehicleInspectionService.getById(id);
  },

  delete: async (id: number) => {
    await api.delete<void>(`${ENDPOINT}/${id}`);
  },
};
