import { Link } from "react-router-dom";
import { Job } from "../../types/job";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface RecentOrdersProps {
  jobs: Job[];
}

const normalizeStatus = (status?: string) => {
  if (!status) return "Pending";
  if (status === "In Progress") return "In_Progress";
  return status;
};

const statusBadgeColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "success" as const;
    case "In_Progress":
      return "primary" as const;
    case "Cancelled":
      return "error" as const;
    default:
      return "warning" as const;
  }
};

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatGBPFromPence = (pence?: number) => `GBP ${((pence ?? 0) / 100).toFixed(2)}`;

export default function RecentOrders({ jobs }: RecentOrdersProps) {
  const recentJobs = [...jobs]
    .sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 8);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Jobs
        </h3>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Job
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Due Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Value
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Payment
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentJobs.map((job) => {
              const normalizedStatus = normalizeStatus(job.status);
              return (
                <TableRow key={job.id}>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    <Link to={`/view-job/${job.id}`} className="font-medium hover:underline">
                      #{job.id}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {formatDate(job.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {formatDate(job.dueDate)}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {formatGBPFromPence(job.serviceCharge)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={statusBadgeColor(normalizedStatus)}>
                      {normalizedStatus === "In_Progress" ? "In Progress" : normalizedStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={job.paid ? "success" : "warning"}>
                      {job.paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
