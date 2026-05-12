import * as UserService from "../services/userService";
import { User } from "../types/user";
// Fetch single user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const response = await UserService.UserService.getById(id);
    return response.data;
    } catch (err) {
    console.error("Failed to fetch user by ID:", err);
    return null;
    }
}

// Fetch user name by ID
export async function getUserNameById(id: string): Promise<string | null> {
  try {
    const response = await UserService.UserService.getNameById(id);
    return response.data;
    } catch (err) {
    console.error("Failed to fetch user name by ID:", err);
    return null;
    }
}




  