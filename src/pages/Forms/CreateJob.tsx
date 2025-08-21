import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DefaultInputs from "../../components/form/form-elements/DefaultInputs";
import InputGroup from "../../components/form/form-elements/InputGroup";
import DropzoneComponent from "../../components/form/form-elements/DropZone";
import CheckboxComponents from "../../components/form/form-elements/CheckboxComponents";
import RadioButtons from "../../components/form/form-elements/RadioButtons";
import ToggleSwitch from "../../components/form/form-elements/ToggleSwitch";
import FileInputExample from "../../components/form/form-elements/FileInputExample";
import SelectInputs from "../../components/form/form-elements/SelectInputs";
import TextAreaInput from "../../components/form/form-elements/TextAreaInput";
import InputStates from "../../components/form/form-elements/InputStates";
import PageMeta from "../../components/common/PageMeta";
import JobForm from "./JobForm.tsx";
import SelectMultipleInputs from "../../components/form/form-elements/SelectMultipleInputs";
import ComponentCard from "../../components/common/ComponentCard";
import { useState } from "react";
import { Job } from "../../types/job.ts";
import { Service } from "../../types/service.ts";
import Button from "../../components/ui/button/Button";
import { useServiceById, useService } from "../../hooks/useServices";
import {useVehicles, useCreateVehicle} from "../../hooks/useVehicle";
import { Vehicle } from "../../types/vehicle.ts";
import {Customer} from "../../types/customer.ts";
import {useCustomer, useCreateCustomer} from "../../hooks/useCustomer";

import CustomerForm from "./CustomerForm.tsx";
import VehicleForm from "./VehicleForm.tsx";
import SearchMultiSelect from "../../components/form/form-elements/SearchMultiSelect.tsx";


export function getServices() {
  const { data: services } = useService();
  console.log("Services data:", services);
   
  if (!services) return [];

      return services.map((service: Service) => ({
        value: service.id.toString(),
        text: service.name,
        selected: false, // default selection state
      }));
  
 
}

export function getVehicles() {
  const { data: vehicles } = useVehicles();
  
   
  if (!vehicles) return [];

      return vehicles.map((vehicle: Vehicle) => ({
        value: vehicle.id.toString(),
        text: vehicle.licensePlate,
        selected: false, // default selection state
      }));
}

export function addVehicle(newVehicle: Vehicle) {
  const { mutate: createVehicle } = useCreateVehicle();
  createVehicle(newVehicle);
}
export function getCustomers() {
  const { data: customers } = useCustomer();
  
   
  if (!customers) return [];

      return customers.map((customer: Customer) => ({
        value: customer.id.toString(),
        text: customer.name,
        selected: false, // default selection state
      }));
  
 
}
export function addCustomer(newCustomer: Customer) {
  const { mutate: createCustomer } = useCreateCustomer();
  createCustomer(newCustomer);
}



export default function CreateJob() {
  const [newJob, setJob] = useState<Job>();
  
  return (
    <div>
      <PageMeta
        title="Forms - Form Elements"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="From Elements" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
            <JobForm  job={newJob} />
         <CustomerForm></CustomerForm>
                    <ComponentCard title="Services">
      <div className="space-y-6">
          <SearchMultiSelect label="Services"   options={getServices()} /> 
          </div>
          <div className="space-y-6">
          <Button size="sm" variant="primary">
            Add new service
             </Button>
          </div>

          </ComponentCard>
        
    
          
        </div>
        <div className="space-y-6">
         
          <VehicleForm  />
    
           <DropzoneComponent />
          
        </div>
      </div>
    </div>
  );
}
