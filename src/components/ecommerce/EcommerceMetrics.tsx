import { Job } from "../../types/job";
import Badge from "../ui/badge/Badge";

interface EcommerceMetricsProps {
  jobs: Job[];
}

const formatGBPFromPence = (pence: number) => `GBP ${(pence / 100).toFixed(2)}`;

const normalizeStatus = (status?: string) => {
  if (!status) return "Pending";
  if (status === "In Progress") return "In_Progress";
  return status;
};

const amountPence = (job: Job) => job.serviceCharge ?? 0;

export default function EcommerceMetrics({ jobs }: EcommerceMetricsProps) {
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(
    (job) => normalizeStatus(job.status) === "Completed"
  ).length;
  const inProgressJobs = jobs.filter(
    (job) => normalizeStatus(job.status) === "In_Progress"
  ).length;
  const unpaidValuePence = jobs
    .filter((job) => !job.paid)
    .reduce((sum, job) => sum + amountPence(job), 0);

  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const inProgressRate = totalJobs > 0 ? (inProgressJobs / totalJobs) * 100 : 0;
  const paidJobs = jobs.filter((job) => job.paid).length;
  const paidRate = totalJobs > 0 ? (paidJobs / totalJobs) * 100 : 0;

  const cards = [
    {
      title: "Total Jobs",
      value: totalJobs.toLocaleString(),
      badgeColor: "primary" as const,
      badgeText: `${completionRate.toFixed(0)}% completed`,
    },
    {
      title: "In Progress",
      value: inProgressJobs.toLocaleString(),
      badgeColor: "warning" as const,
      badgeText: `${inProgressRate.toFixed(0)}% of all jobs`,
    },
    {
      title: "Unpaid Value",
      value: formatGBPFromPence(unpaidValuePence),
      badgeColor: unpaidValuePence > 0 ? ("error" as const) : ("success" as const),
      badgeText: unpaidValuePence > 0 ? "Outstanding balance" : "No unpaid balance",
    },
    {
      title: "Paid Jobs",
      value: paidJobs.toLocaleString(),
      badgeColor: "success" as const,
      badgeText: `${paidRate.toFixed(0)}% paid`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
          <h4 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {card.value}
          </h4>
          <div className="mt-4">
            <Badge color={card.badgeColor}>{card.badgeText}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
