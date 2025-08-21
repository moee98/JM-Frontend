import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useState } from "react";
import {useJobs} from "../../hooks/useJobs";
import * as JobService from "../../services/jobService";



export default function EcommerceMetrics() {
  const { jobs, loading, error, fetchJobs } = useJobs();
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const handleSearch = async () => {
    if (!searchId.trim()) {
      setSearchResult(null);
      setSearchError("Please enter an ID");
      return;
    }

    try {
      const job = await JobService.getJobById(searchId.trim());
      setSearchResult(job);
      setSearchError(null);
      console.log("Job found:", job);
    } catch (err: any) {
      setSearchResult(null);
      setSearchError(err.message || "Job not found");
    }
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      {/* <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
             {jobs().getJobs()} Jobs
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              3,782
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div> */}
   

  
    <div>
      <h1>Jobs</h1>

      {/* Search by ID */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by job ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        <button
          onClick={() => {
            setSearchId("");
            setSearchResult(null);
            fetchJobs(); // reload all jobs
          }}
        >
          Reset
        </button>
      </div>

      {/* Search result */}
      {searchResult && (
        <div style={{ background: "#eef", padding: "0.5rem", marginBottom: "1rem" }}>
          <strong>Found Job:</strong> {searchResult.id} - {searchResult.description}
        </div>
      )}
      {searchError && <p style={{ color: "red" }}>{searchError}</p>}

      {/* All jobs */}
      {loading && <p>Loading jobs...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {/* {jobs.map((job) => (
          <li key={job.Id}>
            {job.id} - {job.description}
            
          </li>
        ))} */}
        {jobs.map(job => (
  <div key={job.id}>
    <h3>{job.serviceType}</h3>
    <p>{job.description}</p>
  </div>
))}
      </ul>
    </div>
  
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Orders
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              5,359
            </h4>
          </div>

          <Badge color="error">
            <ArrowDownIcon />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
