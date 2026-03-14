import type { AttachmentSummary } from "./attachment";
import type { Vehicle } from "./vehicle";

export interface VehicleInspectionInput {
  vehicleId: number;
  inspectionDate: string;
  inspectionResult: string;
  comments: string;
  pathToImages: string[];
}

export interface VehicleInspection extends VehicleInspectionInput {
  id: number;
  vehicle?: Vehicle;
  attachments: AttachmentSummary[];
}
