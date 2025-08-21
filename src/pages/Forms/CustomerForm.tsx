import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Label from "../../components/form/Label.tsx";
import RadioButtons from "../../components/form/form-elements/RadioButtons.tsx";
import { Customer } from "../../types/customer.tsx";
import NewCustomerForm from "./NewCustomerForm.tsx";
import SearchSelect from "../../components/form/form-elements/SearchSelect.tsx";
import { useCustomer } from "../../hooks/useCustomer.ts";

export default function CustomerForm(Customer: { customer?: Customer }) {

    const options = useCustomer().data?.map((customer: Customer) => ({
        value: customer.id.toString(),
        label: customer.name,
    })) || [];
  
  
  
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



  return (
    <ComponentCard title="Customer">
      <div className="space-y-6">
        <div>
           <Label>Customer</Label>
          
          <RadioButtons
          onChange= {handleRadioChange}
            options={[
              { value: "existing", label: "Existing Customer",  name:"existing" },
              { value: "new", label: "New Customer" , name: "new" },
            ]}
            />
            
            <br />
              {selectedValue ==="new" && <NewCustomerForm/> }
              {selectedValue ==="existing"   && <SearchSelect options={options} placeholder="Find Customer" onChange={handleSelectChange} />}                                
            <br />
         
        </div>
        </div>
        </ComponentCard>
        )}