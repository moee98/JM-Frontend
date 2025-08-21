export interface Customer {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  address: string; // Could be expanded into a complex type if needed
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Additional properties can be added as needed
}
