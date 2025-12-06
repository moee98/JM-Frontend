export interface Vehicle {
  id: number; // Unique identifier for the vehicle
  make: string; // Manufacturer of the vehicle (e.g., "Toyota", "Ford")
  model: string; // Model of the vehicle (e.g., "Camry", "F-150")
  year?: string; // Year of manufacture
  licensePlate: string; // Vehicle's license plate number
  colour: string; // Color of the vehicle
  createdAt: string; // ISO timestamp when the vehicle was added
  updatedAt: string; // ISO timestamp when the vehicle details were last updated
  isActive: boolean ; // Indicates if the vehicle is currently active or in use
}
