import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Label from "../../components/form/Label.tsx";
import Input from "../../components/form/input/InputField.tsx";
import Select from "../../components/form/Select.tsx";
import RadioButtons from "../../components/form/form-elements/RadioButtons.tsx";
import { EyeCloseIcon, EyeIcon, TimeIcon } from "../../icons/index.ts";
import DatePicker from "../../components/form/date-picker.tsx";
import { Job } from "../../types/job.ts";
import Button from "../../components/ui/button/Button.tsx";

import TextArea from "../../components/form/input/TextArea.tsx";


export default function JobForm(Job: { job?: Job }) {
  const handleDateChange = (dates: Date[], currentDateString: string) => {
      
        console.log({ dates, currentDateString });
    };
  const [showPassword, setShowPassword] = useState(false);
  const options = [
    { value: "marketing", label: "Marketing" },
    { value: "template", label: "Template" },
    { value: "development", label: "Development" },
  ];
   const [selectedValue, setSelectedValue] = useState("existing");
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };
    
    const [showOtherComponent, setShowOtherComponent] = useState(false)

     const handleRadioChange = (value: string) => {
    setSelectedValue(value);
    console.log("Selected radio value:", value);

    // Control visibility based on selected value
    if (value === "new") {
      setShowOtherComponent(true);
    } else {
      setShowOtherComponent(false);
    }
  };

const [message, setMessage] = useState("");
  const [messageTwo, setMessageTwo] = useState("");

  return (
    <ComponentCard title="Job Form">
      <div className="space-y-6">
        <div>
          <DatePicker
            id="date-picker"
            label="Date Picker Input"
            placeholder="Select a date"
            onChange={(dates, currentDateString) => {
              // Handle your logic
              console.log({ dates, currentDateString });
            }}
          />
        </div>
      
        </div>
        <div>
          <Label>Select Input</Label>
          <Select
            options={options}
            placeholder="Select an option"
            onChange={handleSelectChange}
            className="dark:bg-dark-900"
          />
        
        <div>
            <br />
          <Label>Priority</Label>
          
          <RadioButtons
            options={[
              { value: "low", label: "Low" , name: "Low" },
              { value: "medium", label: "Medium", checked: true, name:"Medium" },
              { value: "high", label: "High", name: "High"}
            ]}
          />
          <br />
          </div>
           <div>
            <br />
          <Label>Status</Label>
          
          <RadioButtons
            options={[
              { value: "open", label: "Open" , checked: true, name: "open" },
              { value: "in-progress", label: "In Progress",  name:"in-progress" },
              { value: "suspended", label: "Suspended", name: "suspended"},
              { value: "completed", label: "Completed", name: "completed"}
            ]}
          />
          <br />
          </div>
          <div>
            <div>
          <Label>Notes</Label>
          <TextArea
            value={message}
            onChange={(value) => setMessage(value)}
            rows={6}
          />
        </div>
          </div>
      </div>
    </ComponentCard>
  );
}
