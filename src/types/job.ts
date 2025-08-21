import { Vehicle } from "./vehicle";
import { User } from "./user";
import { Customer } from "./customer";
import { Service } from "./service";

export interface Job {
  id: number;
  customerId: number;
  vehicleId: number;

  serviceType: 'wrap' | 'tint' | 'detailing' | 'repair' | 'custom';
  description: string;
  status: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled' | 'Active';
  assignedTo?: string; // mechanic or technician ID
  dueDate: string; // ISO date
  createdAt: string;     // ISO timestamp
  updatedAt: string;
  serviceCharge?: number;
  invoiceId?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string; // additional notes or instructions
  isActive?: boolean; // flag to indicate if the job is active
  paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer'; // payment method used
  paid ?: boolean; // flag to indicate if the job has been paid
  vehicle?: Vehicle; // associated vehicle details
  User?: User; // associated customer details
  Customer? : Customer; // associated customer details
  Services?: Service[]; // associated services for the job

}
