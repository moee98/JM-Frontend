export interface Job {
  id: string;
  customerId: Int16Array;
 vehicleId: Int16Array;
  serviceType: 'wrap' | 'tint' | 'detailing' | 'repair' | 'custom';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string; // mechanic or technician ID
  scheduledDate: string; // ISO date
  createdAt: string;     // ISO timestamp
  updatedAt: string;
  price?: number;
  invoiceId?: string;
}
