// src/hooks/useJobs.ts
import { useState, useEffect } from "react";
import * as JobService from "../services/jobService";

export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await JobService.getJobs();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const addJob = async (jobData: any) => {
    await JobService.createJob(jobData);
    await fetchJobs(); // Refresh list after creation
  };

  const editJob = async (id: string, jobData: any) => {
    await JobService.updateJob(id, jobData);
    await fetchJobs();
  };

  const removeJob = async (id: string) => {
    await JobService.deleteJob(id);
    await fetchJobs();
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return { jobs, loading, error, fetchJobs, addJob, editJob, removeJob };
}
