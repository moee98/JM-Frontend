// src/services/JobService.ts
const API_BASE = "https://localhost:44377/api";

export async function getJobs() {
  const res = await fetch(`${API_BASE}/jobs`, {
    credentials: "include", // ✅ Needed for cookie auth
  });

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return res.json();
}

export async function getJobById(id: string) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }

  return res.json();
}

export async function createJob(jobData: any) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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
  });

  if (!res.ok) {
    throw new Error("Failed to delete job");
  }

  return true;
}
