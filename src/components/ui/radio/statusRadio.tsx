import { useState } from "react";

const statuses = [
  { label: "Pending", value: "Pending", color: "bg-yellow-500" },
  { label: "In Progress", value: "In Progress", color: "bg-blue-500" },
  { label: "Completed", value: "Completed", color: "bg-green-600" },
  { label: "Cancelled", value: "Cancelled", color: "bg-red-600" },
];

export default function StatusRadioGroup() {
  const [status, setStatus] = useState("");

  return (
    <div className="space-y-2">
      {statuses.map((s) => (
        <label
          key={s.value}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
            ${
              status === s.value
                ? `${s.color} text-white`
                : "bg-gray-100 hover:bg-gray-200"
            }
          `}
        >
          <input
            type="radio"
            name="status"
            value={s.value}
            checked={status === s.value}
            onChange={() => {
              setStatus(s.value);
              console.log("Status updated:", s.value);
            }}
            className="hidden"
          />

          {/* Custom radio circle */}
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${
                status === s.value
                  ? "border-white"
                  : "border-gray-400"
              }
            `}
          >
            {status === s.value && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </span>

          <span className="font-medium">{s.label}</span>
        </label>
      ))}
    </div>
  );
}