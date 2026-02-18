import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Job } from "../../types/job";

interface MonthlyTargetProps {
  jobs: Job[];
}

const toGBP = (pence: number) => `GBP ${(pence / 100).toFixed(2)}`;

export default function MonthlyTarget({ jobs }: MonthlyTargetProps) {
  const paidJobs = jobs.filter((job) => job.paid).length;
  const unpaidJobs = jobs.length - paidJobs;
  const paidRate = jobs.length > 0 ? (paidJobs / jobs.length) * 100 : 0;

  const totalBilledPence = jobs.reduce(
    (sum, job) => sum + (job.serviceCharge ?? 0),
    0
  );
  const paidBilledPence = jobs
    .filter((job) => job.paid)
    .reduce((sum, job) => sum + (job.serviceCharge ?? 0), 0);
  const outstandingPence = totalBilledPence - paidBilledPence;

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 290,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "75%" },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
        },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "30px",
            fontWeight: "600",
            offsetY: -18,
            color: "#1D2939",
            formatter: (val) => `${val.toFixed(0)}%`,
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["Paid Rate"],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Payment Collection
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Share of jobs marked paid
        </p>
      </div>

      <div className="mt-3">
        <Chart options={options} series={[paidRate]} type="radialBar" height={290} />
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Paid Jobs</p>
          <p className="mt-1 font-semibold text-gray-900">
            {paidJobs} / {jobs.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Unpaid Jobs</p>
          <p className="mt-1 font-semibold text-gray-900">{unpaidJobs}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Collected Value</p>
          <p className="mt-1 font-semibold text-gray-900">{toGBP(paidBilledPence)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Outstanding Value</p>
          <p className="mt-1 font-semibold text-gray-900">{toGBP(outstandingPence)}</p>
        </div>
      </div>
    </div>
  );
}
