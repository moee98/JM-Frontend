// src/hooks/useService.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceService } from "../services/serviceService";
import { Service } from "../types/service";

const SERVICES_QUERY_KEY = ["services"] as const;


export const useService = () => {
    return useQuery<Service[], Error>({
        queryKey: SERVICES_QUERY_KEY,
        queryFn: async () => {
            const response = await ServiceService.getAll();
            return response.data;
        }
         
    });
}

export const useServiceById = (id: number) => {
    return useQuery<Service, Error>({
        queryKey: ["services", id],
        queryFn: async () => {
            const response = await ServiceService.getById(id);
            return response.data;
        },
        enabled: !!id, // Only run if id exists
    });
}

export const useServiceByJobId = (id: number) => {
    return useQuery<Service, Error>({
        queryKey: ["services", "job", id],
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
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Service> }) =>
      ServiceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ServiceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
};
