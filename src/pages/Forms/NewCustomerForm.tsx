import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Label from "../../components/form/Label.tsx";
import Input from "../../components/form/input/InputField.tsx";
import { EnvelopeIcon, TimeIcon } from "../../icons/index.ts";
import DatePicker from "../../components/form/date-picker.tsx";
import Button from "../../components/ui/button/Button.tsx";
import { Customer } from "../../types/customer.tsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.tsx";
import { useCreateCustomer } from "../../hooks/useCustomer.ts";


export interface NewCustomerFormData {
  name: string;
  email: string;
  phone: string;
} 

interface CustomerFormProps {
  onDataChange?: (data: NewCustomerFormData) => void;
  onCustomerCreated?: (customer: Customer) => void; // Add this prop
  customer?: Customer;
}


export default function NewCustomerForm({ onDataChange, onCustomerCreated }: CustomerFormProps) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // Move the hook to the top level of the component
  const createCustomerMutation = useCreateCustomer();

  const handleFieldChange = (
    field: keyof NewCustomerFormData,
    value: string
  ): void => {
    const updatedData: NewCustomerFormData = {
      name,
      email,
      phone,
      [field]: value,
    };

    switch (field) {
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "phone":
        setPhone(value);
        break; 
    }
    onDataChange?.(updatedData);
  };

  function createCustomer(data: NewCustomerFormData) {
    const newCustomer: Customer = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phone,
      address: "",
      id: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createCustomerMutation.mutate(newCustomer, {
      onSuccess: (createdCustomerResponse: any) => {
        const createdCustomer: Customer =
          createdCustomerResponse?.data ?? createdCustomerResponse;
        console.log("Customer created successfully:", createdCustomer);
        // Clear form fields
        setName("");
        setEmail("");
        setPhone("");
        // Notify parent component
        onCustomerCreated?.(createdCustomer);
      },
      onError: (error) => {
        console.error("Failed to create customer:", error);
      }
    });
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    console.log({ updatedData: { name, email, phone } });
    createCustomer({ name, email, phone });
  } 

  const countries = [
    { code: "GB", label: "+44" }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <Label htmlFor="input">Customer Name</Label>
          <Input 
            type="text" 
            id="input" 
            value={name}
            onChange={(e) => handleFieldChange("name", e.target.value)} 
          />
        </div>
        
        <div>
          <Label>Email</Label>
          <div className="relative">
            <Input
              placeholder="info@gmail.com"
              type="email"
              className="pl-[62px]"
              value={email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
            />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <EnvelopeIcon className="size-6" />
            </span>
          </div>
        </div>
        
        <div>
          <Label>Phone</Label>
          <PhoneInput
            selectPosition="start"
            countries={countries}
            placeholder="+44"
           
            onChange={(event) => handleFieldChange("phone", event.toString())}
          />
        </div>
        
        <Button 
          className="w-full" 
          size="sm" 
          onClick={()=>handleSubmit}
          disabled={createCustomerMutation.isPending}
        >
          {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
