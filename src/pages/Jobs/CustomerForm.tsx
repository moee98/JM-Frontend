import { useState } from "react";
import RadioButtons from "../../components/form/form-elements/RadioButtons.tsx";
import { Customer } from "../../types/customer.tsx";
import NewCustomerForm from "../Forms/NewCustomerForm.tsx";
import SearchSelect from "../../components/form/form-elements/SearchSelect.tsx";
import { useCustomer } from "../../hooks/useCustomer.ts";

export interface CustomerFormData {
  customerType: 'existing' | 'new';
  customerId?: string;
  newCustomerData?: any; // Define proper type based on NewCustomerForm data
}

interface CustomerFormProps {
  onDataChange?: (data: CustomerFormData) => void;
  initialData?: Partial<CustomerFormData>;
  customer?: Customer;
}
interface SearchSelectOption {
  value: string;
  label: string;
}

 export const CustomerForm: React.FC<CustomerFormProps> = ({ onDataChange, initialData = {} }) => {
  const [selectedValue, setSelectedValue] = useState<'existing' | 'new'>(
    initialData.customerType || "existing"
  );
  const [customerId, setCustomerId] = useState<string>(initialData.customerId || "");
  const [newCustomerData, setNewCustomerData] = useState<any>(initialData.newCustomerData || null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Use the provided hook to get customer data
  const options: SearchSelectOption[] = useCustomer().data?.map((customer: Customer) => ({
    value: customer.id.toString(),
    label: customer.name,
  })) || [];

  const handleRadioChange = (value: string): void => {
    const customerType = value as 'existing' | 'new';
    setSelectedValue(customerType);
    
    // Reset data when switching types
    if (customerType === 'new') {
      setCustomerId("");
      onDataChange?.({ customerType, newCustomerData });
    } else {
      setNewCustomerData(null);
      onDataChange?.({ customerType, customerId });
    }
  };

  const handleSelectChange = (value: string): void => {
    setCustomerId(value);
    onDataChange?.({ customerType: selectedValue, customerId: value });
  };

  const handleNewCustomerChange = (data: any): void => {
    setNewCustomerData(data);
    onDataChange?.({ customerType: selectedValue, newCustomerData: data });
  };
   // Handle successful customer creation
  const handleCustomerCreated = (newCustomer: Customer) => {
    console.log("New customer created:", newCustomer);
    // Switch to existing customer tab
    setSelectedValue("existing");
    // Select the newly created customer
    setSelectedCustomerId(newCustomer.id.toString());
  };

  return (
   
      <div className="space-y-6">
        <div>
         
          
          <RadioButtons
            onChange={handleRadioChange}
            options={[
              { 
                value: "existing", 
                label: "Existing Customer", 
                name: "existing",
                checked: selectedValue === "existing"
              },
              { 
                value: "new", 
                label: "New Customer", 
                name: "new",
                checked: selectedValue === "new"
              },
            ]}
          />
          
          <br />
          
          {selectedValue === "new" && (
            <NewCustomerForm onCustomerCreated={handleCustomerCreated} />
          )}
          
          {selectedValue === "existing" && (
            <SearchSelect 
              options={options} 
              placeholder="Find Customer" 
              onChange={handleSelectChange}
              defaultValue={selectedCustomerId} 
            />
          )}
          
          <br />
        </div>
      </div>
   
  );
};

// Export the component
