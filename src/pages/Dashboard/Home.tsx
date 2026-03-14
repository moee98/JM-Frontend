import { useMemo, useState } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { useJobs } from "../../hooks/useJobs";
import { useExpenses } from "../../hooks/useExpenses";

type DashboardTimeframe = "week" | "month" | "quarter" | "year";

const TIMEFRAME_OPTIONS: { value: DashboardTimeframe; label: string; days: number }[] = [
  { value: "week", label: "Past Week", days: 7 },
  { value: "month", label: "Past Month", days: 30 },
  { value: "quarter", label: "Past 3 Months", days: 90 },
  { value: "year", label: "Past Year", days: 365 },
];

const isOnOrAfter = (isoDate: string | undefined, cutoff: Date) => {
  if (!isoDate) return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= cutoff;
};

export default function Home() {
  const { jobs, loading, error } = useJobs();
  const { expenses, loading: expensesLoading, error: expensesError } = useExpenses();
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>("month");

  const cutoffDate = useMemo(() => {
    const selected = TIMEFRAME_OPTIONS.find((option) => option.value === timeframe);
    const days = selected?.days ?? 30;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return cutoff;
  }, [timeframe]);

  const filteredJobs = useMemo(
    () => jobs.filter((job) => isOnOrAfter(job.createdAt, cutoffDate)),
    [jobs, cutoffDate]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((expense) => isOnOrAfter(expense.dateIncurred, cutoffDate)),
    [expenses, cutoffDate]
  );

  return (
    <>
      <PageMeta title="Home Dashboard" description="Live job dashboard" />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">Dashboard Timeframe</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Choose the period used for summary cards.</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as DashboardTimeframe)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:w-56"
        >
          {TIMEFRAME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading || expensesLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading dashboard data...
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load jobs: {error}
        </div>
      ) : null}

      {expensesError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load expenses: {expensesError}
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <EcommerceMetrics jobs={filteredJobs} expenses={filteredExpenses} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget jobs={filteredJobs} />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <MonthlySalesChart jobs={jobs} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard jobs={jobs} />
        </div>

        <div className="col-span-12">
          <RecentOrders jobs={jobs} />
        </div>

        <div className="col-span-12">
          <StatisticsChart jobs={jobs} />
        </div>
      </div>
    </>
  );
}
