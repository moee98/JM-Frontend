import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { useJobs } from "../../hooks/useJobs";

export default function Home() {
  const { jobs, loading, error } = useJobs();

  return (
    <>
      <PageMeta title="Home Dashboard" description="Live job dashboard" />

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading dashboard data...
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load jobs: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics jobs={jobs} />

          <MonthlySalesChart jobs={jobs} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget jobs={jobs} />
        </div>

        <div className="col-span-12">
          <StatisticsChart jobs={jobs} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard jobs={jobs} />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders jobs={jobs} />
        </div>
      </div>
    </>
  );
}
