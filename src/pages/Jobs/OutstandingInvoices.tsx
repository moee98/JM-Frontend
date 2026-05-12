import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOutstandingJobs } from "../../hooks/useJobs";
import { sendReminder } from "../../services/jobService";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

type AgeFilter = "all" | "current" | "overdue";

function daysOverdue(dueDate?: string): number {
  if (!dueDate) return 0;
  const diff = (Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(diff));
}

function ageBadgeColor(days: number): "success" | "warning" | "error" {
  if (days <= 7) return "success";
  if (days <= 30) return "warning";
  return "error";
}

function ageLabel(days: number): string {
  if (days === 0) return "Due today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function jobTotal(job: { jobServices?: { price?: number }[]; serviceCharge?: number }): number {
  const servicesTotal = (job.jobServices ?? []).reduce((sum, s) => sum + (s.price ?? 0), 0);
  return servicesTotal + (job.serviceCharge ?? 0);
}

export default function OutstandingInvoicesPage() {
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useOutstandingJobs();
  const [filter, setFilter] = useState<AgeFilter>("all");
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; ok: boolean; msg: string } | null>(null);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const days = daysOverdue(job.dueDate);
      if (filter === "current" && days > 7) return false;
      if (filter === "overdue" && days <= 7) return false;
      if (search) {
        const term = search.toLowerCase();
        const match =
          job.customer?.name?.toLowerCase().includes(term) ||
          job.vehicle?.licensePlate?.toLowerCase().includes(term) ||
          String(job.id).includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [jobs, filter, search]);

  // Summary card totals
  const totalOutstanding = useMemo(() => jobs.reduce((s, j) => s + jobTotal(j), 0), [jobs]);
  const bucket030 = useMemo(() => jobs.filter((j) => daysOverdue(j.dueDate) <= 30).reduce((s, j) => s + jobTotal(j), 0), [jobs]);
  const bucket3160 = useMemo(() => jobs.filter((j) => { const d = daysOverdue(j.dueDate); return d > 30 && d <= 60; }).reduce((s, j) => s + jobTotal(j), 0), [jobs]);
  const bucket60plus = useMemo(() => jobs.filter((j) => daysOverdue(j.dueDate) > 60).reduce((s, j) => s + jobTotal(j), 0), [jobs]);

  const handleSendReminder = async (jobId: number) => {
    setSendingId(jobId);
    try {
      await sendReminder(jobId);
      setToast({ id: jobId, ok: true, msg: "Payment reminder sent." });
    } catch {
      setToast({ id: jobId, ok: false, msg: "Failed to send reminder." });
    } finally {
      setSendingId(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outstanding Invoices</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Unpaid jobs — send reminders and track overdue balances.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Outstanding", value: totalOutstanding, color: "text-gray-800 dark:text-white" },
          { label: "0–30 days", value: bucket030, color: "text-green-600" },
          { label: "31–60 days", value: bucket3160, color: "text-amber-600" },
          { label: "60+ days", value: bucket60plus, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-xl font-bold ${color}`}>£{value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["all", "current", "overdue"] as AgeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-brand-500 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {f === "current" ? "0–7 days" : f}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job, customer, plate…"
            className="w-full rounded-lg border border-gray-200 bg-transparent py-2 pl-8 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {["Job", "Customer", "Vehicle", "Due", "Amount", "Age", "Actions"].map((h) => (
                    <TableCell key={h} isHeader className="px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                      No outstanding invoices.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((job) => {
                    const days = daysOverdue(job.dueDate);
                    const total = jobTotal(job);
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="px-5 py-4 text-theme-sm font-medium text-gray-700 dark:text-gray-200">
                          <button onClick={() => navigate(`/view-job/${job.id}`)} className="hover:underline">
                            #{job.id}
                          </button>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {job.customer?.name ?? "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {[job.vehicle?.make, job.vehicle?.model, job.vehicle?.licensePlate].filter(Boolean).join(" ") || "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {job.dueDate ? new Date(job.dueDate).toLocaleDateString("en-GB") : "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm font-semibold text-gray-700 dark:text-gray-200">
                          £{total.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Badge size="sm" color={ageBadgeColor(days)}>{ageLabel(days)}</Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(job.id)}
                            disabled={sendingId === job.id}
                          >
                            {sendingId === job.id ? "Sending…" : "Send Reminder"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((job) => {
              const days = daysOverdue(job.dueDate);
              const total = jobTotal(job);
              return (
                <div key={job.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <button onClick={() => navigate(`/view-job/${job.id}`)} className="text-sm font-semibold text-gray-800 hover:underline dark:text-white/90">
                      Job #{job.id}
                    </button>
                    <Badge size="sm" color={ageBadgeColor(days)}>{ageLabel(days)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{job.customer?.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[job.vehicle?.make, job.vehicle?.model, job.vehicle?.licensePlate].filter(Boolean).join(" ") || "No vehicle"}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">£{total.toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendReminder(job.id)}
                      disabled={sendingId === job.id}
                    >
                      {sendingId === job.id ? "Sending…" : "Remind"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
