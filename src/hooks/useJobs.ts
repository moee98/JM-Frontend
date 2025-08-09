import { useState, useEffect } from "react";
import { getAllJobs, getJobById } from "../services/jobService";

export function useAllJobs() {
  const [user, setJob] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const getJobs = async () => {
    try {
      const jobs = await getAllJobs();
      setJob(jobs);
      
    } catch (error) {
      setJob(null);
     
    }
  };

  useEffect(() => {
    if (!user) {
      getJobs();
    }
  }, []);

  return { user, setJob, getJobs };
}
export function useJob(jobId: string | null) {
  const [job, setJob] = useState<any>(null);

  const getJob = async () => {
    if (!jobId) {
      setJob(null);
      return;
    }
    try {
      const jobData = await getJobById(jobId);
      setJob(jobData);
    } catch (error) {
      setJob(null);
    }
  };

  useEffect(() => {
    getJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return { job, setJob, getJob };
}