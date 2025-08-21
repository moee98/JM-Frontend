import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Label from "../../components/form/Label.tsx";
import Input from "../../components/form/input/InputField.tsx";
import { EnvelopeIcon, TimeIcon } from "../../icons/index.ts";
import DatePicker from "../../components/form/date-picker.tsx";
import Button from "../../components/ui/button/Button.tsx";
import { Customer } from "../../types/customer.tsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.tsx";
import {useCustomer, useCreateCustomer} from "../../hooks/useCustomer.ts";



export default function NewCustomerForm( ) {

  const handlePhoneNumberChange = (phoneNumber: string) => {
    console.log("Updated phone number:", phoneNumber);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted");
  } 

const countries = [
   
    { code: "GB", label: "+44" }
   
  ];

  return (
    <ComponentCard title="New Customer">
        <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <Label htmlFor="input">Customer Name</Label>
          <Input type="text" id="input" />
        </div>
        
        <Label>Email</Label>
          <div className="relative">
            <Input
              placeholder="info@gmail.com"
              type="text"
              className="pl-[62px]"
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
            onChange={handlePhoneNumberChange}
          />
        </div>{" "}
        
        <Button className="w-full" size="sm" onClick={()=>handleSubmit}>
                   Add Customer
        </Button>
          
        </form>
    
    </ComponentCard>
  );
}
