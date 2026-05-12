import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useJobsPaginated } from "../../hooks/useJobs";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import * as Icon from "../../icons";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "In_Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

export default function JobsTable() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const { data, isLoading } = useJobsPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status || undefined,
  });

  const jobs = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);

  const badgeColorForStatus = (s?: string) => {
    if (s === "Completed") return "success" as const;
    if (s === "Pending" || s === "In_Progress" || s === "In Progress") return "warning" as const;
    return "error" as const;
  };

  const vehicleLabel = (job: (typeof jobs)[0]) =>
    [job.vehicle?.make, job.vehicle?.model, job.vehicle?.licensePlate]
      .filter(Boolean)
      .join(" ");

  if (isLoading) {
    return (
      <p className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">
        Loading jobs...
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 border-b border-gray-100 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, plate, notes…"
            className="w-full rounded-lg border border-gray-200 bg-transparent py-2 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-transparent py-2 px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden max-w-full overflow-x-auto md:block">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">Job ID</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">Customer</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">Vehicle</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">Status</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                  No jobs found.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">#{job.id}</TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {job.customer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {vehicleLabel(job) || "No vehicle"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    <Badge size="sm" color={badgeColorForStatus(job.status)}>{job.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" startIcon={<Icon.EditIcon className="size-5" />} onClick={() => navigate(`/jobs/${job.id}/edit`)}>Edit</Button>
                      <Button size="sm" variant="outline" startIcon={<Icon.TaskIcon className="size-5" />} onClick={() => navigate(`/view-job/${job.id}`)}>View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-3 md:hidden">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Job #{job.id}</p>
              <Badge size="sm" color={badgeColorForStatus(job.status)}>{job.status}</Badge>
            </div>
            {job.customer?.name && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{job.customer.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{vehicleLabel(job) || "No vehicle"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" startIcon={<Icon.EditIcon className="size-4" />} onClick={() => navigate(`/jobs/${job.id}/edit`)} className="w-full">Edit</Button>
              <Button size="sm" variant="outline" startIcon={<Icon.TaskIcon className="size-4" />} onClick={() => navigate(`/view-job/${job.id}`)} className="w-full">View</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/[0.05]">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {totalCount === 0 ? "No results" : `${from}–${to} of ${totalCount} jobs`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Prev
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400">{page} / {totalPages || 1}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
