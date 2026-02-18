import { Job } from "../../types/job";

interface DemographicCardProps {
  jobs: Job[];
}

const normalizeStatus = (status?: string) => {
  if (!status) return "Pending";
  if (status === "In Progress") return "In_Progress";
  return status;
};

export default function DemographicCard({ jobs }: DemographicCardProps) {
  const groups = [
    { key: "Pending", label: "Pending", color: "bg-warning-500" },
    { key: "In_Progress", label: "In Progress", color: "bg-brand-500" },
    { key: "Completed", label: "Completed", color: "bg-success-500" },
    { key: "Cancelled", label: "Cancelled", color: "bg-error-500" },
  ];

  const total = jobs.length;
  const counts = groups.map((group) => {
    const count = jobs.filter((job) => normalizeStatus(job.status) === group.key).length;
    const percent = total > 0 ? (count / total) * 100 : 0;
    return { ...group, count, percent };
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Job Status Breakdown
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Distribution by current status
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {counts.map((item) => (
          <div key={item.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <p className="font-medium text-gray-800 dark:text-white/90">{item.label}</p>
              <p className="text-gray-500 dark:text-gray-400">
                {item.count} ({item.percent.toFixed(0)}%)
              </p>
            </div>
            <div className="h-2 rounded-sm bg-gray-200 dark:bg-gray-800">
              <div
                className={`h-2 rounded-sm ${item.color}`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
