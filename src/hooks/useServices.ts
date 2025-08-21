// src/hooks/useService.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceService } from "../services/serviceService";
import { Service } from "../types/service";



export const useService = () => {
    return useQuery<Service[], Error>({
        queryKey: ["service"],
        queryFn: async () => {
            const response = await ServiceService.getAll();
            return response.data;
        }
         
    });
}

export const useServiceById = (id: number) => {
    return useQuery<Service, Error>({
        queryKey: ["service", id],
        queryFn: async () => {
            const response = await ServiceService.getById(id);
            return response.data;
        },
        enabled: !!id, // Only run if id exists
    });
}

export const useServiceByJobId = (id: number) => {
    return useQuery<Service, Error>({
        queryKey: ["service", id],
        queryFn: async () => {
            const response = await ServiceService.getByJobId(id);
            return response.data;
        },
        enabled: !!id, // Only run if id exists
    });
}


export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ServiceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Service> }) =>
      ServiceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ServiceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};
