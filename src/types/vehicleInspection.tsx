import { Vehicle } from "./vehicle";
import { User } from "./user";

export interface VehicleInspection {
  id: number; // Unique identifier for the inspection
  vehicle?: Vehicle; // Vehicle being inspected
  inspectionDate: string; // ISO date of the inspection
  user?: User; // User who performed the inspection
  userId: number; // ID of the user who performed the inspection
  inspectionResult: string; // Result of the inspection (e.g., "Passed", "Failed")
  comments: string; // Additional comments or notes from the inspection
  pathToImages: string[]; // List of image paths related to the inspection
}
