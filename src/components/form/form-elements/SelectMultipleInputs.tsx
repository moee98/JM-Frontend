import { useState } from "react";
import MultiSelect from "../MultiSelect";

type options = {
  value: string;
  text: string;
  selected: boolean;
};

export default function SelectMultipleInputs({option, title}: { option: options[] , title: string }) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  
  return (
   
      
        <div>
          <MultiSelect
            label={title}
            options={option}
            // defaultSelected={["1", "3"]}
            onChange={(values) => setSelectedValues(values)}
          />
          <p className="sr-only col-auto">
            Selected Values: {selectedValues.join(", ") }
          </p>
        </div>
    
  );
}
