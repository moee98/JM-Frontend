// src/hooks/useService.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VehicleService } from "../services/vehicleService";
import { Vehicle } from "../types/vehicle";



export const useVehicles = () => {
    return useQuery<Vehicle[], Error>({
        queryKey: ["vehicles"],
        queryFn: async () => {
            const response = await VehicleService.getAll();
            return response.data;
        }
         
    });
}

export const useVehicleById = (id: number) => {
    return useQuery<Vehicle, Error>({
        queryKey: ["vehicles", id],
        queryFn: async () => {
            const response = await VehicleService.getById(id);
            return response.data;
        },
        enabled: !!id, // Only run if id exists
    });
}

export const useVehicleByJobId = (id: number) => {
    return useQuery<Vehicle, Error>({
        queryKey: ["vehicles", id],
        queryFn: async () => {
            const response = await VehicleService.getByJobId(id);
            return response.data;
        },
        enabled: !!id, // Only run if id exists
    });
}


export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: VehicleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Vehicle> }) =>
      VehicleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: VehicleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};
