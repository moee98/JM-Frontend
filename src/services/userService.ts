import api from "./apiService";
import { User } from "../types/user";

const endpoint = "/users";

export const UserService = {
  getAll: () => api.get<User[]>(endpoint),
   getNameById: (id: string) => api.get<string>(`${endpoint}/name/${id}`),
  getById: (id: string) => api.get<User>(`${endpoint}/${id}`),
}
;

