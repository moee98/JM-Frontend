import { useState } from "react";
import Label from "../../components/form/Label.tsx";
import Input from "../../components/form/input/InputField.tsx";
import { Vehicle } from "../../types/vehicle.tsx";

export interface VehicleFormData {
  registration: string;
  make: string;
  model: string;
  colour: string;
}

interface VehicleFormProps {
  onDataChange?: (data: VehicleFormData) => void;
  initialData?: Partial<VehicleFormData>;
  vehicle?: Vehicle;
}

// Main VehicleForm Component
export const VehicleForm: React.FC<VehicleFormProps> = ({ onDataChange, initialData = {} }) => {
  const [registration, setRegistration] = useState<string>(initialData.registration || "");
  const [make, setMake] = useState<string>(initialData.make || "");
  const [model, setModel] = useState<string>(initialData.model || "");
  const [colour, setColour] = useState<string>(initialData.colour || "");

  const handleFieldChange = (
    field: keyof VehicleFormData,
    value: string
  ): void => {
    const updatedData: VehicleFormData = {
      registration,
      make,
      model,
      colour,
      [field]: value,
    };

    // Update local state
    switch (field) {
      case "registration":
        setRegistration(value);
        break;
      case "make":
        setMake(value);
        break;
      case "model":
        setModel(value);
        break;
      case "colour":
        setColour(value);
        break;
    }

    // Notify parent component
    onDataChange?.(updatedData);
  };

  return (
   
      <div className="space-y-6">
        <div>
          <Label htmlFor="registration">Vehicle Registration</Label>
          <Input
            type="text"
            id="registration"
            placeholder="KA24 PFM"
            value={registration}
            onChange={(e) => handleFieldChange("registration", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="make">Make</Label>
          <Input
            type="text"
            id="make"
            placeholder="BMW"
            value={make}
            onChange={(e) => handleFieldChange("make", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            type="text"
            id="model"
            placeholder="M4"
            value={model}
            onChange={(e) => handleFieldChange("model", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="colour">Colour</Label>
          <Input
            type="text"
            id="colour"
            placeholder="Black"
            value={colour}
            onChange={(e) => handleFieldChange("colour", e.target.value)}
          />
        </div>
      </div>
    
  );
};

// Export the component


// Demo usage
export default function App() {
  const [vehicleData, setVehicleData] = useState<VehicleFormData>({
    registration: "",
    make: "",
    model: "",
    colour: "",
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <VehicleForm
          onDataChange={setVehicleData}
          initialData={{
            registration: "",
            make: "",
            model: "",
            colour: "",
          }}
        />

        {/* Display collected data */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Collected Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(vehicleData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
