import { useState } from "react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import DropzoneComponent from "../../components/form/form-elements/DropZone";
import SearchMultiSelect from "../../components/form/form-elements/SearchMultiSelect";
import {CustomerForm, CustomerFormData} from "./CustomerForm";
import {VehicleForm, VehicleFormData} from "./VehicleForm";
import {JobDetails, JobDetailsData} from "../Jobs/CreateJob";
import { ServiceForm, ServiceFormData } from "./ServicesForm";
import Alert from "../../components/ui/alert/Alert";
import { Service } from "../../types/service";
import { Job } from "../../types/job";
import { Customer } from "../../types/customer";
import { Vehicle } from "../../types/vehicle";
import { useCreateJob } from "../../hooks/useJobs";
import { getCurrentUser } from "../../services/authService";
import { JobService } from "../../types/jobService";
import {User as CurrentUser} from "../../types/user";
import { redirect } from "react-router";

// ---------------- CUSTOM HOOKS ---------------- //



export default  function CreateJob() {

   const [alert, setAlert] = useState<{
    show: boolean;
    variant: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

 
  const createJobMutation = useCreateJob?.();

   const [jobData, setJobData] = useState<JobDetailsData>({
    date: null,
    status: 'Pending',
    notes: ''
  });

   const [customerData, setCustomerData] = useState<CustomerFormData>({
    customerType: 'existing',
  });

  const [vehicleData, setVehicleData] = useState<VehicleFormData>({
    registration: '',
    make: '',
    model: '',
    colour: ''
  });

  const [serviceData, setServiceData] = useState<ServiceFormData>({
    serviceType: 'existing',
    selectedServices: []
  });
  ;

  const  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle: Vehicle ={
      id: 0, // This would be set by the backend
      licensePlate: vehicleData.registration,
      make: vehicleData.make,
      model: vehicleData.model,
      colour: vehicleData.colour,
      year: '', // This would be set by the backend
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true // This would be set by the backend
    }

    const serviceList: JobService[] = serviceData.selectedServices?.map((service) => ({
      Id: 0, // This would be set by the backend
      JobId: 0, // This would be set by the backend
      ServiceId: service.id,
      Price: service.customPrice ?? service.estimatedPrice,
    })) || [];

    const getCurrentUser  = localStorage.getItem('user');

    const user: CurrentUser = {
      id: getCurrentUser ? JSON.parse(getCurrentUser).id : 0,
      
      };


    const newJob: Job = {
      id: 0, // This would be set by the backend
      createdAt:  new Date().toISOString(),
      customerId:   parseInt(customerData.customerId ?? '0'), 
      vehicle: vehicle,
      JobServices: serviceList,
      dueDate: jobData.date ? jobData.date.toISOString() : new Date().toISOString(),
      status: jobData.status,
      notes: jobData.notes,
      User:  user,
      ServiceCharge: Math.round(serviceList.reduce((total, service) => total + service.Price, 0) * 100)
  };
console.log("New Job Data:", newJob);
 if (createJobMutation) {
      await createJobMutation.mutate(newJob, {
        onSuccess: (response: any) => {
          // response may be an AxiosResponse or the created service directly depending on the implementation
          const createdService: Service = response?.data ?? response;

          setAlert({
            show: true,
            variant: 'success',
            title: 'Service Created Successfully',
            message: `${createdService.name} has been added to your services.`
          });
          
         
          setTimeout(() => setAlert(null), 4000);
          redirect('/view-job/' + response.data.id);
        },
        onError: (error: any) => {
          setAlert({
            show: true,
            variant: 'error',
            title: 'Failed to Create Service',
            message: `${error.response?.data?.message || 'An error occurred while adding the service.'}`
          });
        }
      });
    } else {
      setAlert({
        show: true,
        variant: 'error',
        title: 'Mutation Not Available',
        message: 'The create job function is not available at the moment.'
      });
    }

    
    const formData = { jobData, customerData,vehicleData, serviceData };
    console.log("Form submitted:", formData);
  };


  return (
    <div>
      <PageMeta
        title="Forms - Create Job"
        description="Create a new job with services, customer, and vehicle details"
      />
      <PageBreadcrumb pageTitle="Create Job" />
     
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <ComponentCard title="Job Details">
         
          <JobDetails onDataChange={setJobData} />
        </ComponentCard>
        </div>

        <div className="space-y-6">
        <ComponentCard title="Customer Details">
          {/* Customer */}
          <CustomerForm onDataChange={setCustomerData}
          initialData={{customerType:"new"}}  />
        </ComponentCard>
        </div>
        <div className="space-y-6">
          
         {/* Vehicle */}
          <ComponentCard title="Vehicle">
            <VehicleForm onDataChange={setVehicleData} />
          </ComponentCard>
        </div>
        <div className="space-y-6">
          {/* Services */}
          <ComponentCard title="Services">
            <div className="space-y-6">
              <ServiceForm onDataChange={setServiceData}  />
            </div>
          </ComponentCard>
         </div>
       

      

           <div className="col-span-2 flex justify-end">
          <Button variant="primary" onClick={() => handleSubmit(new Event('submit') as any)}>
            Create Job
          </Button>
           {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          message={alert.message}
          showLink={false}
        />
      )}
        </div>
        
      </div>
    </div>
  );
}
