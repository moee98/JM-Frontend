import { useState, useId } from "react";
import ComponentCard from "../../common/ComponentCard";
import Radio from "../input/Radio";

interface RadioOption {
  value: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  name?: string; // optional override
}

interface RadioButtonsProps {
  options: RadioOption[];
  onChange?: (value: string) => void;
}

export default function RadioButtons({ options, onChange }: RadioButtonsProps) {
  const [selectedValue, setSelectedValue] = useState<string>(
    options.find((o) => o.checked)?.value || options[0]?.value || ""
  );

  const uniqueGroupName = useId(); // 👈 unique per component instance

  const handleRadioChange = (value: string) => {
    setSelectedValue(value);
    onChange?.(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-8">
      {options.map((option, index) => (
        <Radio
          key={index}
          id={`radio-${uniqueGroupName}-${index}`} // 👈 unique id
          name={option.name || uniqueGroupName}   // 👈 unique group name
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
