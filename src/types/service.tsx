export interface Service {
  id: number;
  name: string; // Name of the service
  description?: string; // Description of the service
  estimatedPrice: number; // Estimated price for the service
  createdAt?: string; // ISO timestamp when the service was created
  updatedAt?: string; // ISO timestamp when the service was last updated
  isActive?: boolean; // Indicates if the service is currently active
}
