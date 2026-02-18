import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export type JobStatus = "Pending" | "In_Progress" | "Completed" | "Cancelled";

type JobStatusOption = {
  value: JobStatus;
  label: string;
  buttonClassName: string;
};

const STATUS_OPTIONS: JobStatusOption[] = [
  {
    value: "Pending",
    label: "Pending",
    buttonClassName: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    value: "In_Progress",
    label: "In Progress",
    buttonClassName: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "Completed",
    label: "Completed",
    buttonClassName: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "Cancelled",
    label: "Cancelled",
    buttonClassName: "bg-red-100 text-red-800 border-red-200",
  },
];

interface JobStatusDropdownProps {
  value: JobStatus;
  disabled?: boolean;
  onChange: (status: JobStatus) => void;
}

export default function JobStatusDropdown({
  value,
  onChange,
  disabled = false,
}: JobStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const current = useMemo(
    () => STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0],
    [value]
  );

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`dropdown-toggle relative w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
          current.buttonClassName
        } ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:opacity-90"
        }`}
      >
        <span className="block w-full text-center">{current.label}</span>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-full p-1">
        <div className="space-y-1">
          {STATUS_OPTIONS.map((option) => (
            <DropdownItem
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              baseClassName="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <span>{option.label}</span>
              {option.value === value ? <Check className="h-4 w-4" /> : null}
            </DropdownItem>
          ))}
        </div>
      </Dropdown>
    </div>
  );
}
