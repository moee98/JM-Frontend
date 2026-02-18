import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Job } from "../../types/job";

interface StatisticsChartProps {
  jobs: Job[];
}

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-GB", { month: "short" });

export default function StatisticsChart({ jobs }: StatisticsChartProps) {
  const now = new Date();
  const buckets = Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: monthLabel(d),
      jobs: 0,
      revenuePence: 0,
    };
  });

  jobs.forEach((job) => {
    if (!job.createdAt) return;
    const created = new Date(job.createdAt);
    if (Number.isNaN(created.getTime())) return;

    const bucket = buckets.find(
      (b) => b.year === created.getFullYear() && b.month === created.getMonth()
    );
    if (!bucket) return;

    bucket.jobs += 1;
    bucket.revenuePence += job.serviceCharge ?? 0;
  });

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#12B76A"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 320,
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    dataLabels: { enabled: false },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      type: "category",
      categories: buckets.map((b) => b.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        title: { text: "Jobs" },
        min: 0,
      },
      {
        opposite: true,
        title: { text: "Revenue (GBP)" },
        labels: {
          formatter: (val) => `${Math.round(Number(val))}`,
        },
      },
    ],
    tooltip: {
      y: [
        { formatter: (val) => `${val} jobs` },
        { formatter: (val) => `GBP ${Number(val).toFixed(2)}` },
      ],
    },
  };

  const series = [
    {
      name: "Jobs",
      data: buckets.map((b) => b.jobs),
    },
    {
      name: "Revenue (GBP)",
      data: buckets.map((b) => Number((b.revenuePence / 100).toFixed(2))),
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Jobs and Revenue Trend
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Monthly job volume and billed value over the last 12 months
        </p>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px] xl:min-w-full">
          <Chart options={options} series={series} type="line" height={320} />
        </div>
      </div>
    </div>
  );
}
