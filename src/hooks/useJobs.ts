// src/hooks/useJobs.ts
import { useState, useEffect } from "react";
import * as JobService from "../services/jobService";
import { getUserNameById } from "./useUsers";
import { Job } from "../types/job";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

// ---------- CREATE JOB ----------
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation<Job, Error, Job>({
    mutationFn: (job: Job) => JobService.createJob(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

// ---------- LIST + BASIC JOB OPERATIONS ----------
export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await JobService.getJobs();
      setJobs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const addJob = async (jobData: Job) => {
    await JobService.createJob(jobData);
    await fetchJobs(); // Refresh list after creation
  };

  const editJob = async (id: number, jobData: Job) => {
    await JobService.updateJob(id, jobData);
    await fetchJobs();
  };

  const removeJob = async (id: number) => {
    await JobService.deleteJob(id);
    await fetchJobs();
  };

  const getJobById = async (id: number): Promise<Job | null> => {
    try {
      const job = await JobService.getJobById(id);
      if(!job) {
        setError("Job not found");
        return null;
      }
      const createdBy = await getUserNameById(job.appUserId || "");
      if(createdBy)
      job.createdBy = createdBy;
      return job;
    } catch (err) {
      setError("Failed to load job");
      return null;
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return { jobs, loading, error, fetchJobs, addJob, editJob, removeJob, getJobById };
}

// ---------- SINGLE JOB VIA REACT QUERY ----------
export  function useJob(id?: number) {
  return useQuery<Job, Error>({
    queryKey: ["Job", id],
    enabled: id != null,
    queryFn: () => {
      if (id == null) {
        throw new Error("No job id provided");
      }
      return  JobService.getJob(id);
    },
  });
}
