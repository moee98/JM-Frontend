// src/services/JobService.ts
const API_BASE = "https://localhost:44377/api";
import api from "./apiService"; // Assuming you have an axios instance set up
import {Job } from "../types/job";

export const getJobs = async (): Promise<Job[]> => {
  const res = await api.get<Job[]>("/job");
  return res.data;
};

export const getJobById = async (id: string): Promise<Job> => {
  const res = await api.get<Job>(`/job/${id}`);
  return res.data;
};


export async function createJob(jobData: any) {
  const res = await fetch(`${API_BASE}/job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" ,
         "Authorization": `Bearer ${localStorage.getItem("accessToken")}` // Include token if needed
    },
    credentials: "include",
    body: JSON.stringify(jobData),
  });

  if (!res.ok) {
    throw new Error("Failed to create job");
  }

  return res.json();
}

export async function updateJob(id: string, jobData: any) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json",
         "Authorization": `Bearer ${localStorage.getItem("token")}`
     },
    credentials: "include",
    body: JSON.stringify(jobData),
  });

  if (!res.ok) {
    throw new Error("Failed to update job");
  }

  return res.json();
}

export async function deleteJob(id: string) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json",
         "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to delete job");
  }

  return true;
}
