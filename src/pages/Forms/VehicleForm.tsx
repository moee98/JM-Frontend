import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Label from "../../components/form/Label.tsx";
import Input from "../../components/form/input/InputField.tsx";
import Select from "../../components/form/Select.tsx";
import RadioButtons from "../../components/form/form-elements/RadioButtons.tsx";
import { EyeCloseIcon, EyeIcon, TimeIcon } from "../../icons/index.ts";
import DatePicker from "../../components/form/date-picker.tsx";
import { Vehicle } from "../../types/vehicle.tsx";


export default function VehicleForm(Vehicle: { vehicle?: Vehicle }) {
  


  return (
    <ComponentCard title="Vehicle">
      <div className="space-y-6">
        
        <div>
          <Label htmlFor="input">Vehicle Registration</Label>
          <Input type="text" id="input" placeholder="KA24 PFM" />
          
        </div>
         <div>
          <Label htmlFor="input">Make</Label>
          <Input type="text" id="input" placeholder="BMW" />
        </div>
         <div>
          <Label htmlFor="input">Model</Label>
          <Input type="text" id="input" placeholder="M4"/>
        </div>
         <div>
          <Label htmlFor="input">Colour</Label>
          <Input type="text" id="input" placeholder="Black"/>
        </div>
        </div>

    </ComponentCard>
  );
}
