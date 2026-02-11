import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

import { CustomerForm, CustomerFormData } from "../Jobs/CustomerForm";
import { VehicleForm, VehicleFormData } from "./VehicleForm";
import { JobDetails, JobDetailsData } from "./JobDetails";
import { ServiceForm, ServiceFormData } from "./ServicesForm";

import { Job } from "../../types/job";
import { Vehicle } from "../../types/vehicle";
import { JobService } from "../../types/jobService";
import { User as CurrentUser } from "../../types/user";

import { useCreateJob } from "../../hooks/useJobs";

export default function CreateJob() {
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  const navigate = useNavigate();
  const createJobMutation = useCreateJob?.();

  const [jobData, setJobData] = useState<JobDetailsData>({
    date: null,
    status: "Pending",
    notes: "",
  });

  const [customerData, setCustomerData] = useState<CustomerFormData>({
    customerType: "existing",
  });

  const [vehicleData, setVehicleData] = useState<VehicleFormData>({
    registration: "",
    make: "",
    model: "",
    colour: "",
  });

  const [serviceData, setServiceData] = useState<ServiceFormData>({
    serviceType: "existing",
    selectedServices: [],
  });

  // --------- Derived summary values --------- //
  const selectedServices = serviceData.selectedServices || [];
  const servicesCount = selectedServices.length;

  const servicesTotal = selectedServices.reduce((total, service) => {
    const price =
      (service as any).customPrice ??
      (service as any).estimatedPrice ??
      0;
    return total + price;
  }, 0);

  const formattedDueDate = jobData.date
    ? jobData.date.toLocaleDateString()
    : "Not set";

  const handleSubmit = async () => {
    const vehicle: Vehicle = {
      id: 0, // This would be set by the backend
      licensePlate: vehicleData.registration.toUpperCase(),
      make: vehicleData.make.toUpperCase(),
      model: vehicleData.model.toUpperCase(),
      colour: vehicleData.colour.toUpperCase(),
      year: "", // This would be set by the backend
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true, // This would be set by the backend
    };

    const serviceList: JobService[] =
      selectedServices.map((service: any) => ({
        id: 0, // This would be set by the backend
        jobId: 0, // This would be set by the backend
        serviceId: service.id,
        price: service.customPrice ?? service.estimatedPrice,
        completed: false,
      })) || [];

    const user: CurrentUser = {
      id: localStorage.getItem("user") || "",
    };

    console.log("Current User:", user);

    const newJob: Job = {
      id: 0, // This would be set by the backend
      createdAt: new Date().toISOString(),
      customerId: parseInt(customerData.customerId ?? "0"),
      vehicle: vehicle,
      jobServices: serviceList,
      dueDate: jobData.date
        ? jobData.date.toISOString()
        : new Date().toISOString(),
      status: jobData.status,
      notes: jobData.notes,
      appUserId: user.id,
      serviceCharge: Math.round(
        serviceList.reduce((total, service) => total + service.price, 0) * 100
      ),
    };

    console.log("New Job Data:", newJob);

    if (createJobMutation) {
      createJobMutation.mutate(newJob, {
        onSuccess: (response: any) => {
          const createdJob: Job = response?.data ?? response;

          setAlert({
            show: true,
            variant: "success",
            title: "Job Created Successfully",
            message: `Job #${createdJob.id} has been created.`,
          });

          console.log("Mutation successful:", response);

          setTimeout(() => setAlert(null), 4000);

          navigate(`/view-job/${createdJob.id}`, { replace: true });
        },
        onError: (error: any) => {
          console.log("Mutation called with:", error);
          setAlert({
            show: true,
            variant: "error",
            title: "Failed to Create Job",
            message:
              error.response?.data?.message ||
              "An error occurred while adding the job.",
          });
        },
      });
    } else {
      setAlert({
        show: true,
        variant: "error",
        title: "Mutation Not Available",
        message: "The create job function is not available at the moment.",
      });
    }

    const formData = { jobData, customerData, vehicleData, serviceData };
    console.log("Form submitted:", formData);
  };

  return (
    <>
      <PageMeta
        title="Forms - Create Job"
        description="Create a new job with services, customer, and vehicle details"
      />
               <PageBreadcrumb pageTitle="Create Job" items={[
    { label: "Home", to: "/" },
    { label: "View All Jobs", to: "/jobs" },
    { label: "Create Job",},
     
  ]}/>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page header / description */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">New Job</h1>
          <p className="text-sm text-gray-500">
            Fill in the job details, customer, vehicle, and services to create a
            new booking.
          </p>
        </div>

        {/* Alert banner */}
        {alert && alert.show && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            showLink={false}
          />
        )}

        {/* Main form grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            <ComponentCard title="Job Details">
              <div className="space-y-4">
                <JobDetails onDataChange={setJobData} />
              </div>
            </ComponentCard>

            <ComponentCard title="Vehicle">
              <div className="space-y-4">
                <VehicleForm onDataChange={setVehicleData} />
              </div>
            </ComponentCard>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <ComponentCard title="Services">
              <div className="space-y-4">
                <ServiceForm onDataChange={setServiceData} />
              </div>
            </ComponentCard>

            <ComponentCard title="Customer Details">
              <div className="space-y-4">
                <CustomerForm
                  onDataChange={setCustomerData}
                  initialData={{ customerType: "new" }}
                />
              </div>
            </ComponentCard>

            {/* Summary card */}
            <ComponentCard title="Summary">
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium mb-1">Job</h3>
                  <p className="text-gray-600">
                    <span className="font-semibold">Due date:</span>{" "}
                    {formattedDueDate}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Status:</span>{" "}
                    {jobData.status || "Pending"}
                  </p>
                </div>

                <hr />

                <div>
                  <h3 className="font-medium mb-1">Vehicle</h3>
                  <p className="text-gray-600">
                    <span className="font-semibold">Registration:</span>{" "}
                    {vehicleData.registration || "Not set"}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Make / Model:</span>{" "}
                    {vehicleData.make || "—"}{" "}
                    {vehicleData.model && "•"} {vehicleData.model || ""}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Colour:</span>{" "}
                    {vehicleData.colour || "Not set"}
                  </p>
                </div>

                <hr />

                <div>
                  <h3 className="font-medium mb-1">Customer</h3>
                  <p className="text-gray-600">
                    <span className="font-semibold">Type:</span>{" "}
                    {customerData.customerType || "Not set"}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Customer ID:</span>{" "}
                    {customerData.customerId || "Not selected"}
                  </p>
                </div>

                <hr />

                <div>
                  <h3 className="font-medium mb-1">Services</h3>
                  <p className="text-gray-600">
                    <span className="font-semibold">Selected:</span>{" "}
                    {servicesCount}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Estimated total:</span>{" "}
                    £{servicesTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end border-t pt-4 mt-2">
          <Button variant="primary" onClick={handleSubmit}>
            Create Job
          </Button>
        </div>
      </div>
    </>
  );
}
