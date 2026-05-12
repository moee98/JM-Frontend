import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

import { CustomerForm, CustomerFormData } from "../Jobs/CustomerForm";
import { VehicleForm, VehicleFormData } from "../Forms/VehicleForm";
import { JobDetails, JobDetailsData } from "../Forms/JobDetails";
import { ServiceForm, ServiceFormData } from "../Forms/ServicesForm";

import { Job } from "../../types/job";
import { Vehicle } from "../../types/vehicle";
import { JobService } from "../../types/jobService";
import { User as CurrentUser } from "../../types/user";

import { useCreateJob } from "../../hooks/useJobs";

// --------- Local types for payment UI --------- //
type SplitPaymentPart = {
  method: string;
  amount: number | "";
};

type PaymentData = {
  isPaid: boolean;
  paymentMethod: string; // used when not split
  isSplit: boolean;
  parts: SplitPaymentPart[];
};

type ValidationState = {
  job: string[];
  customer: string[];
  vehicle: string[];
  services: string[];
  payment: string[];
};

export default function CreateJob() {
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [validationErrors, setValidationErrors] = useState<ValidationState>({
    job: [],
    customer: [],
    vehicle: [],
    services: [],
    payment: [],
  });

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

  const [paymentData, setPaymentData] = useState<PaymentData>({
    isPaid: false,
    paymentMethod: "",
    isSplit: false,
    parts: [
      {
        method: "card",
        amount: 0,
      },
    ],
  });

  // --------- Derived summary values --------- //
  const selectedServices = serviceData.selectedServices || [];

  const servicesTotal = selectedServices.reduce((total, service: any) => {
    const price = service.customPrice ?? service.estimatedPrice ?? 0;
    return total + price;
  }, 0);

  // --------- Payment helpers --------- //
  const updatePaymentPart = (
    index: number,
    field: keyof SplitPaymentPart,
    value: string
  ) => {
    setPaymentData((prev) => {
      const parts = [...prev.parts];
      if (field === "amount") {
        const num = value === "" ? 0 : Number(value);
        parts[index] = { ...parts[index], amount: isNaN(num) ? "" : num };
      } else {
        parts[index] = { ...parts[index], method: value };
      }
      return { ...prev, parts };
    });
  };

  const addPaymentPart = () => {
    setPaymentData((prev) => ({
      ...prev,
      parts: [...prev.parts, { method: "card", amount: 0 }],
    }));
  };

  const removePaymentPart = (index: number) => {
    setPaymentData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  // --------- Validation --------- //
  const validateForm = (): ValidationState => {
    const errors: ValidationState = {
      job: [],
      customer: [],
      vehicle: [],
      services: [],
      payment: [],
    };

    // Job
    if (!jobData.date) {
      errors.job.push("Due date is required.");
    }

    // Customer
    if (customerData.customerType === "existing") {
      if (!customerData.customerId) {
        errors.customer.push("Please select an existing customer.");
      }
    }
    // (If 'new' customers have required fields, you can add checks here later.)

    // Vehicle
    if (!vehicleData.registration?.trim()) {
      errors.vehicle.push("Vehicle registration is required.");
    }

    // Services
    if (selectedServices.length === 0) {
      errors.services.push("Please select at least one service.");
    }

    // Payment
    if (paymentData.isPaid) {
      if (!paymentData.isSplit) {
        if (!paymentData.paymentMethod) {
          errors.payment.push("Please select a payment method.");
        }
      } else {
        if (paymentData.parts.length === 0) {
          errors.payment.push(
            "Please add at least one split payment row."
          );
        }

        const splitTotal = paymentData.parts.reduce((sum, part) => {
          const value =
            typeof part.amount === "number" ? part.amount : 0;
          return sum + value;
        }, 0);

        if (Math.abs(splitTotal - servicesTotal) > 0.01) {
          errors.payment.push(
            "Split payment total should match the services total."
          );
        }
      }
    }

    return errors;
  };

  const hasAnyErrors = (errors: ValidationState) =>
    Object.values(errors).some((arr) => arr.length > 0);

  const handleSubmit = async () => {
    const errors = validateForm();
    setValidationErrors(errors);

    if (hasAnyErrors(errors)) {
      setAlert({
        show: true,
        variant: "error",
        title: "Please fix the highlighted issues",
        message: "Some sections of the form need your attention.",
      });
      return;
    }

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

    const baseJob: Job = {
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
      paid: false,
      serviceCharge: Math.round(
        serviceList.reduce((total, service) => total + service.price, 0) * 100
      ),
    };

    const newJob: Job & {
      isPaid?: boolean;
      paymentMethod?: string;
      isSplitPayment?: boolean;
      paymentParts?: SplitPaymentPart[];
    } = {
      ...baseJob,
      isPaid: paymentData.isPaid,
      paymentMethod: paymentData.isSplit
        ? undefined
        : paymentData.paymentMethod,
      isSplitPayment: paymentData.isSplit,
      paymentParts: paymentData.isSplit ? paymentData.parts.map(p => ({ ...p, amount: typeof p.amount === 'number' ? p.amount : 0 })) : undefined,
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

    const formData = {
      jobData,
      customerData,
      vehicleData,
      serviceData,
      paymentData,
    };
    console.log("Form submitted:", formData);
  };

  // Small helper to render card-level errors
  const ErrorList = ({ errors }: { errors: string[] }) =>
    errors.length ? (
      <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 space-y-1">
        {errors.map((err, idx) => (
          <p key={idx}>• {err}</p>
        ))}
      </div>
    ) : null;

  return (
    <>
      <PageMeta
        title="Forms - Create Job"
        description="Create a new job with services, customer, and vehicle details"
      />
      <PageBreadcrumb pageTitle="Create Job" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page header / description */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">New Job</h1>
          <p className="text-sm text-gray-500">
            Fill in the job details, services, customer, vehicle, and payment to
            create a new booking.
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
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* LEFT: wide column (Job + Services + Summary on desktop) */}
          <div className="space-y-6 xl:col-span-2">
            <ComponentCard title="Job Details">
              <ErrorList errors={validationErrors.job} />
              <div className="space-y-4">
                <JobDetails onDataChange={setJobData} />
              </div>
            </ComponentCard>

            <ComponentCard title="Services">
              <ErrorList errors={validationErrors.services} />
              <div className="space-y-4">
                <ServiceForm onDataChange={setServiceData} />
              </div>
            </ComponentCard>

           
          </div>

          {/* RIGHT: narrow column (Customer + Vehicle + Payment + Summary on mobile) */}
          <div className="space-y-6">
            <ComponentCard title="Customer Details">
              <ErrorList errors={validationErrors.customer} />
              <div className="space-y-4">
                <CustomerForm
                  onDataChange={setCustomerData}
                  initialData={{ customerType: "new" }}
                />
              </div>
            </ComponentCard>

            <ComponentCard title="Vehicle">
              <ErrorList errors={validationErrors.vehicle} />
              <div className="space-y-4">
                <VehicleForm onDataChange={setVehicleData} />
              </div>
            </ComponentCard>

            <ComponentCard title="Payment">
              <ErrorList errors={validationErrors.payment} />
              <div className="space-y-4 text-sm">
                {/* Mark as paid */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={paymentData.isPaid}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        isPaid: e.target.checked,
                        // reset when unchecking
                        ...(e.target.checked
                          ? {}
                          : {
                              paymentMethod: "",
                              isSplit: false,
                              parts: [{ method: "card", amount: 0 }],
                            }),
                      }))
                    }
                  />
                  <span>Mark this job as paid</span>
                </label>

                {/* Payment options only visible if isPaid */}
                {paymentData.isPaid && (
                  <>
                    {/* Single payment method */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase text-gray-500">
                        Payment method
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={paymentData.paymentMethod}
                        onChange={(e) =>
                          setPaymentData((prev) => ({
                            ...prev,
                            paymentMethod: e.target.value,
                          }))
                        }
                        disabled={paymentData.isSplit}
                      >
                        <option value="">Select method</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank-transfer">Bank Transfer</option>
                        <option value="online">Online</option>
                      </select>
                      <p className="text-xs text-gray-500">
                        Choose a single method or enable split payment below.
                      </p>
                    </div>

                    {/* Split payment */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={paymentData.isSplit}
                          onChange={(e) =>
                            setPaymentData((prev) => ({
                              ...prev,
                              isSplit: e.target.checked,
                            }))
                          }
                        />
                        <span>Split payment between multiple methods</span>
                      </label>

                      {paymentData.isSplit && (
                        <div className="space-y-3 rounded-md bg-gray-50 p-3">
                          {paymentData.parts.map((part, index) => (
                            <div key={index} className="flex gap-2">
                              <select
                                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={part.method}
                                onChange={(e) =>
                                  updatePaymentPart(
                                    index,
                                    "method",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="bank-transfer">
                                  Bank Transfer
                                </option>
                                <option value="online">Online</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-28 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={part.amount === "" ? "" : part.amount}
                                onChange={(e) =>
                                  updatePaymentPart(
                                    index,
                                    "amount",
                                    e.target.value
                                  )
                                }
                                placeholder="Amount"
                              />
                              {paymentData.parts.length > 1 && (
                                <button
                                  type="button"
                                  className="text-xs text-red-500 px-2"
                                  onClick={() => removePaymentPart(index)}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            className="text-xs font-medium underline"
                            onClick={addPaymentPart}
                          >
                            + Add split
                          </button>
                          <p className="text-xs text-gray-500">
                            Total services: £{servicesTotal.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
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
