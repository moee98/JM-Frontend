import Label from "../../components/form/Label.tsx";
import Select from "../../components/form/Select.tsx";
import DatePicker from "../../components/form/date-picker.tsx";
import TextArea from "../../components/form/input/TextArea.tsx";
import { useState } from "react";

// Type definitions
export interface JobDetailsData {
  date: Date | null;
  status: string;
  notes: string;
}

interface JobDetailsProps {
  onDataChange?: (data: JobDetailsData) => void;
  initialData?: Partial<JobDetailsData>;
}

interface SelectOption {
  value: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled' ;
  label: string;
}
  export const JobDetails: React.FC<JobDetailsProps> = ({ onDataChange, initialData = {} }) => {
  const [date, setDate] = useState<Date | null>(initialData.date || null);
  const [status, setStatus] = useState<string>(initialData.status || "Pending");
  const [notes, setNotes] = useState<string>(initialData.notes || "");

  const statusOptions: SelectOption[] = [
    { value: "Pending", label: "Pending" },
    { value: "In_Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const handleDateChange = (selectedDate: Date | null): void => {
    setDate(selectedDate);
    onDataChange?.({ date: selectedDate, status, notes });
  };

  const handleStatusChange = (newStatus: string): void => {
    setStatus(newStatus);
    onDataChange?.({ date, status: newStatus, notes });
  };

  const handleNotesChange = (newNotes: string): void => {
    setNotes(newNotes);
    onDataChange?.({ date, status, notes: newNotes });
  };

  return (
    
      <div className="space-y-6">
        {/* Date Picker */}
        <DatePicker
          id="date-picker"
          label="Date Picker Input"
          placeholder="Select a date"
          onChange={(dates) => handleDateChange(dates[0] || null)}
        />
        {/* Status */}
        <div>
          <Label>Status</Label>
          <Select
            id="status-select"
            options={statusOptions}
            placeholder="Select an option"
            onChange={handleStatusChange}
            defaultValue={status}
            className="dark:bg-gray-900"
          />
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <TextArea value={notes} onChange={handleNotesChange} rows={6} />
        </div>
      </div>
   
  );
};

