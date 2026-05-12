// src/services/JobService.ts

import api from "./apiService";
import type { Job, PaginatedResult } from "../types/job";

export interface GetJobsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  paid?: boolean;
}

export const getJobs = async (params?: GetJobsParams): Promise<PaginatedResult<Job>> => {
  const res = await api.get<PaginatedResult<Job>>("/job", { params });
  return res.data;
};

export const getOutstandingJobs = async (): Promise<Job[]> => {
  const res = await api.get<Job[]>("/job/outstanding");
  return res.data;
};

export const getJobById = async (id: number): Promise<Job> => {
  const res = await api.get<Job>(`/job/${id}`);
  return res.data;
};

// If you want to keep a `getJob` alias:
export const getJob = getJobById;

export const createJob = async (jobData: Job): Promise<Job> => {
  const res = await api.post<Job>("/job", jobData);
  return res.data;
};

// Prefer number id if your API expects number
export const updateJob = async (id: number, jobData: Partial<Job>): Promise<Job> => {
  const res = await api.put<Job>(`/job/${id}`, jobData);
  return res.data;
};

export const deleteJob = async (id: number): Promise<void> => {
  await api.delete<void>(`/job/${id}`);
};

export const sendInvoice = async (id: number): Promise<void> => {
  await api.post(`/job/${id}/send-invoice`);
};

export const sendReminder = async (id: number): Promise<void> => {
  await api.post(`/job/${id}/send-reminder`);
};
