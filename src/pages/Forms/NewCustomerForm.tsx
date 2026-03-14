import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Label from "../../components/form/Label.tsx";
import Input from "../../components/form/input/InputField.tsx";
import { EnvelopeIcon } from "../../icons/index.ts";
import Button from "../../components/ui/button/Button.tsx";
import { Customer } from "../../types/customer.tsx";
import PhoneInput from "../../components/form/group-input/PhoneInput.tsx";
import { useCreateCustomer } from "../../hooks/useCustomer.ts";
import { getErrorMessage } from "../../utils/errorUtils.ts";


export interface NewCustomerFormData {
  name: string;
  email: string;
  phone: string;
}

interface CustomerFormProps {
  onDataChange?: (data: NewCustomerFormData) => void;
  onCustomerCreated?: (customer: Customer) => void;
  customer?: Customer;
}


export default function NewCustomerForm({ onDataChange, onCustomerCreated }: CustomerFormProps) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const createCustomerMutation = useCreateCustomer();

  const handleFieldChange = (
    field: keyof NewCustomerFormData,
    value: string
  ): void => {
    setFormError(null);
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
    setFormError(null);
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
      onSuccess: (createdCustomerResponse: unknown) => {
        const response = createdCustomerResponse as { data?: Customer } | Customer;
        const createdCustomer: Customer =
          (response as { data?: Customer }).data ?? (response as Customer);
        setName("");
        setEmail("");
        setPhone("");
        onCustomerCreated?.(createdCustomer);
      },
      onError: (error: unknown) => {
        setFormError(getErrorMessage(error, "Failed to create customer."));
      },
    });
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createCustomer({ name, email, phone });
  };

  const countries = [
    { code: "GB", label: "+44" }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div>
          <Label htmlFor="customer-name">Customer Name</Label>
          <Input
            type="text"
            id="customer-name"
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
          type="submit"
          className="w-full"
          size="sm"
          disabled={createCustomerMutation.isPending}
        >
          {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
