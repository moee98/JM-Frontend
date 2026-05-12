export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

import { Vehicle } from "./vehicle";
import { Customer } from "./customer";
import { Service } from "./service";
import { JobService } from "./jobService";
import { PaymentMethod } from "./payment";
import type { VehicleInspection } from "./vehicleInspection";

export interface Job {
  id: number;
  customerId?: number;
  vehicleId?: number;
  description?: string;
  status?: string ;
  assignedTo?: string; // mechanic or technician ID
  dueDate?: string; // ISO date
  createdAt?: string;     // ISO timestamp
  updatedAt?: string;
  serviceCharge?: number;
  invoiceId?: string;
  notes?: string; // additional notes or instructions
  isActive?: boolean; // flag to indicate if the job is active
  paymentMethod?: string; // payment method used
  paymentMethods?: PaymentMethod[];
  paid : boolean ; // flag to indicate if the job has been paid
  vehicle?: Vehicle; // associated vehicle details
  vehicleInspectionId?: number;
  vehicleInspection?: VehicleInspection;
  appUserId?: string; // associated customer details
  createdBy?: string;
  customer? : Customer; // associated customer details
  Services?: Service[]; // associated services for the job (PascalCase from API)
  services?: Service[]; // associated services for the job (camelCase alias)
  jobServices?: JobService[]; // associated job services for the job
  paymentParts?: { method: string; amount: number }[]; // split payment parts
}
