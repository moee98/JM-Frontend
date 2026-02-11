import { Service } from "./service";
export interface JobService {
  id: number;
  jobId: number;
    serviceId: number;
    price: number;
    completed: boolean;
    service?:Service;
}
