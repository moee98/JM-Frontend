import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Job } from "../../types/job";

interface MonthlySalesChartProps {
  jobs: Job[];
}

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-GB", { month: "short" });

export default function MonthlySalesChart({ jobs }: MonthlySalesChartProps) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: monthLabel(d),
      count: 0,
    };
  });

  jobs.forEach((job) => {
    if (!job.createdAt) return;
    const created = new Date(job.createdAt);
    if (Number.isNaN(created.getTime())) return;

    const bucket = buckets.find(
      (b) => b.year === created.getFullYear() && b.month === created.getMonth()
    );
    if (bucket) bucket.count += 1;
  });

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 220,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: buckets.map((b) => b.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(Number(val))}`,
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} jobs`,
      },
    },
  };

  const series = [
    {
      name: "Jobs Created",
      data: buckets.map((b) => b.count),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Jobs Created (Last 6 Months)
        </h3>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[520px] xl:min-w-full">
          <Chart options={options} series={series} type="bar" height={220} />
        </div>
      </div>
    </div>
  );
}
