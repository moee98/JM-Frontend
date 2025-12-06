// src/hooks/useService.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomerService } from "../services/customerService";
import { Customer } from "../types/customer";



export const useCustomer = () => {
    return useQuery<Customer[], Error>({
        queryKey: ["customers"],
        queryFn: async () => {
            const response = await CustomerService.getAll();
            return response.data;
        }
         
    });
}

export const useCustomerById = (id: number) => {
    return useQuery<Customer, Error>({
        queryKey: ["customers", id],
        queryFn: async () => {
            const response = await CustomerService.getById(id);
            return response.data;
        },
        enabled: !!id, // Only run if id exists
    });
}

export const useCustomerByJobId = (id: number) => {
    return useQuery<Customer, Error>({
        queryKey: ["customers", id],
        queryFn: async () => {
            const response = await CustomerService.getByJobId(id);
            return response.data;
        },
        enabled: !!id, // Only run if id exists
    });
}


export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CustomerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
    }
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      CustomerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CustomerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
