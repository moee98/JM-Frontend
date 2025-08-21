import { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Radio from "../input/Radio";

interface RadioOption {
  value: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  name?: string;
}

interface RadioButtonsProps {
  options: RadioOption[];
  onChange?: (value: string) => void; // Notify parent
}

export default function RadioButtons({ options, onChange }: RadioButtonsProps) {
  const [selectedValue, setSelectedValue] = useState<string>(
    options.find(o => o.checked)?.value || options[0]?.value || ""
  );

  const handleRadioChange = (value: string) => {
    setSelectedValue(value);
    onChange?.(value); // Pass selection to parent
  };

  return (
    
      <div className="flex flex-wrap items-center gap-8">
        {options.map((option, index) => (
          <Radio
            key={index}
            id={`radio-${index}`}
            name={option.name || "group1"}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={handleRadioChange}
            label={option.label}
            disabled={option.disabled}
          />
        ))}
      </div>
    
  );
}
