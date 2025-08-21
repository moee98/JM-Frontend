export interface UserRole {
  id: number; // Unique identifier for the user role
  roleName: string; // Name of the role (e.g., "Admin", "User", "Manager")
  description: string; // Description of the role
  createdAt: string; // ISO timestamp when the role was created
  updatedAt: string; // ISO timestamp when the role was last updated
  isActive: boolean; // Indicates if the role is currently active
}
