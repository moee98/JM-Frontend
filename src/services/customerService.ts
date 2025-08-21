import api from "./apiService";
import { Customer } from "../types/customer";

const endpoint = "/customers";

export const CustomerService = {
  getAll: () => api.get<Customer[]>(endpoint),
   getById: (id: number) => api.get<Customer>(`${endpoint}/${id}`),
  getByJobId: (id: number) => api.get<Customer>(`${endpoint}/job/${id}`),
  create: (data: Customer) => api.post<Customer>(endpoint, data),
  update: (id: number, data: Partial<Customer>) =>
    api.put<Customer>(`${endpoint}/${id}`, data),
  delete: (id: number) => api.delete<void>(`${endpoint}/${id}`),
};