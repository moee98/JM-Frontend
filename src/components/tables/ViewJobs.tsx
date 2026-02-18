import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Job } from "../../types/job";
import { useState, useEffect } from "react";
import * as JobService from "../../services/jobService";
import Button from "../../components/ui/button/Button";
import * as Icon from "../../icons";
import { useNavigate } from "react-router-dom";

export default function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await JobService.getJobs();
        setJobs(data);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <p className="x-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">
        Loading jobs...
      </p>
    );
  }

  const badgeColorForStatus = (status?: string) => {
    if (status === "Active" || status === "Completed") return "success" as const;
    if (status === "Pending" || status === "In_Progress" || status === "In Progress") {
      return "warning" as const;
    }
    return "error" as const;
  };

  const vehicleLabel = (job: Job) =>
    [job.vehicle?.make, job.vehicle?.model, job.vehicle?.licensePlate]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="hidden max-w-full overflow-x-auto md:block">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400"
              >
                Job ID
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400"
              >
                Vehicle
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                  {job.id}
                </TableCell>
                <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                  {vehicleLabel(job) || "No vehicle"}
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  <Badge size="sm" color={badgeColorForStatus(job.status)}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      startIcon={<Icon.EditIcon className="size-5" />}
                      onClick={() => navigate(`/jobs/${job.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => navigate(`/view-job/${job.id}`)}
                      size="sm"
                      variant="outline"
                      startIcon={<Icon.TaskIcon className="size-5" />}
                    >
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Job {job.id}
              </p>
              <Badge size="sm" color={badgeColorForStatus(job.status)}>
                {job.status}
              </Badge>
            </div>

            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              {vehicleLabel(job) || "No vehicle"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                startIcon={<Icon.EditIcon className="size-4" />}
                onClick={() => navigate(`/jobs/${job.id}/edit`)}
                className="w-full"
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                startIcon={<Icon.TaskIcon className="size-4" />}
                onClick={() => navigate(`/view-job/${job.id}`)}
                className="w-full"
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
