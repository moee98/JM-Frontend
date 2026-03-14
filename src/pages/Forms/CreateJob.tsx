import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

import { CustomerForm, CustomerFormData } from "../Jobs/CustomerForm";
import { VehicleForm, VehicleFormData } from "./VehicleForm";
import { JobDetails, JobDetailsData } from "./JobDetails";

import { Job } from "../../types/job";
import { Vehicle } from "../../types/vehicle";
import { JobService } from "../../types/jobService";
import { Service } from "../../types/service";

import { useCreateJob } from "../../hooks/useJobs";
import { useCreateService, useService } from "../../hooks/useServices";

type EditableServiceRow = {
  key: string;
  serviceId: number;
  name: string;
  price: number;
  completed: boolean;
};

type NewServiceDraft = {
  name: string;
  description: string;
  price: string;
};

const formatGBP = (value: number) => `GBP ${value.toFixed(2)}`;

const readCurrentUserId = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed.id === "string") return parsed.id;
  } catch {
    // Keep compatibility with existing string-only localStorage values.
  }

  return raw;
};

export default function CreateJob() {
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  const navigate = useNavigate();
  const createJobMutation = useCreateJob?.();
  const { data: allServices = [] } = useService();
  const createServiceMutation = useCreateService();

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

  const [services, setServices] = useState<EditableServiceRow[]>([]);
  const [newServiceId, setNewServiceId] = useState<string>("");
  const [createdServiceOptions, setCreatedServiceOptions] = useState<
    { id: number; label: string; price: number }[]
  >([]);
  const [showCreateService, setShowCreateService] = useState(false);
  const [serviceDraft, setServiceDraft] = useState<NewServiceDraft>({
    name: "",
    description: "",
    price: "",
  });
  const [serviceCreateError, setServiceCreateError] = useState<string | null>(null);
  const [serviceCreateOk, setServiceCreateOk] = useState<string | null>(null);

  const serviceOptions = useMemo(() => {
    const mergedMap = new Map<number, { id: number; label: string; price: number }>();

    allServices.forEach((service) => {
      mergedMap.set(service.id, {
        id: service.id,
        label: service.name || service.description || `Service ${service.id}`,
        price: Number(service.estimatedPrice ?? 0),
      });
    });

    createdServiceOptions.forEach((service) => {
      if (!mergedMap.has(service.id)) mergedMap.set(service.id, service);
    });

    return Array.from(mergedMap.values()).filter(
      (service) => !services.some((selected) => selected.serviceId === service.id)
    );
  }, [allServices, createdServiceOptions, services]);

  const servicesTotal = useMemo(
    () => services.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [services]
  );

  const formattedDueDate = jobData.date ? jobData.date.toLocaleDateString() : "Not set";

  const handleServicePriceChange = (key: string, value: string) => {
    const parsed = Number(value);
    setServices((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, price: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 } : s
      )
    );
  };

  const handleServiceCompletedChange = (key: string, completed: boolean) => {
    setServices((prev) => prev.map((s) => (s.key === key ? { ...s, completed } : s)));
  };

  const handleRemoveService = (key: string) => {
    setServices((prev) => prev.filter((s) => s.key !== key));
  };

  const handleAddService = () => {
    if (!newServiceId) return;
    const selected = serviceOptions.find((option) => option.id === Number(newServiceId));
    if (!selected) return;

    setServices((prev) => [
      ...prev,
      {
        key: `new-${selected.id}-${Date.now()}`,
        serviceId: selected.id,
        name: selected.label,
        price: selected.price,
        completed: false,
      },
    ]);

    setNewServiceId("");
    setServiceCreateError(null);
    setServiceCreateOk(null);
  };

  const handleServiceDraftChange = (field: keyof NewServiceDraft, value: string) => {
    setServiceCreateError(null);
    setServiceCreateOk(null);
    setServiceDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAndAddService = async (event: React.FormEvent) => {
    event.preventDefault();
    setServiceCreateError(null);
    setServiceCreateOk(null);

    const name = serviceDraft.name.trim();
    const description = serviceDraft.description.trim();
    const parsedPrice = Number(serviceDraft.price);

    if (!name) {
      setServiceCreateError("Service name is required.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setServiceCreateError("Service price must be a valid number.");
      return;
    }

    const nowIso = new Date().toISOString();
    const payload: Service = {
      id: 0,
      name,
      description,
      estimatedPrice: parsedPrice,
      createdAt: nowIso,
      updatedAt: nowIso,
      isActive: true,
    };

    try {
      const response = await createServiceMutation.mutateAsync(payload);
      const created: Service = (response as any)?.data ?? (response as any);
      const createdId = Number(created?.id);

      if (!Number.isFinite(createdId) || createdId <= 0) {
        setServiceCreateError("Service created but no valid ID was returned.");
        return;
      }

      const newOption = {
        id: createdId,
        label: created.name || name,
        price: Number(created.estimatedPrice ?? parsedPrice),
      };

      setCreatedServiceOptions((prev) =>
        prev.some((service) => service.id === newOption.id) ? prev : [...prev, newOption]
      );

      setServices((prev) => {
        if (prev.some((service) => service.serviceId === newOption.id)) return prev;
        return [
          ...prev,
          {
            key: `new-${newOption.id}-${Date.now()}`,
            serviceId: newOption.id,
            name: newOption.label,
            price: newOption.price,
            completed: false,
          },
        ];
      });

      setServiceDraft({ name: "", description: "", price: "" });
      setShowCreateService(false);
      setServiceCreateOk(`Created and added "${newOption.label}".`);
    } catch (error: any) {
      setServiceCreateError(
        error?.response?.data?.message ?? error?.message ?? "Failed to create service."
      );
    }
  };

  const validate = (): string | null => {
    if (!jobData.date) return "Due date is required.";
    if (!vehicleData.make.trim()) return "Vehicle make is required.";
    if (!vehicleData.model.trim()) return "Vehicle model is required.";
    if (!vehicleData.registration.trim()) return "Vehicle registration is required.";
    if (services.length === 0) return "At least one service is required.";
    if (services.some((service) => !Number.isFinite(service.price) || service.price < 0)) {
      return "Each service must have a valid price.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setAlert({
        show: true,
        variant: "error",
        title: "Cannot Create Job",
        message: validationError,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const vehicle: Vehicle = {
      id: 0,
      licensePlate: vehicleData.registration.trim().toUpperCase(),
      make: vehicleData.make.trim().toUpperCase(),
      model: vehicleData.model.trim().toUpperCase(),
      colour: vehicleData.colour.trim().toUpperCase(),
      year: "",
      createdAt: nowIso,
      updatedAt: nowIso,
      isActive: true,
    };

    const serviceList: JobService[] = services.map((service) => ({
      id: 0,
      jobId: 0,
      serviceId: service.serviceId,
      price: Number(service.price),
      completed: !!service.completed,
    }));

    const newJob: Job = {
      id: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      customerId: Number(customerData.customerId ?? "0"),
      vehicle,
      jobServices: serviceList,
      dueDate: jobData.date ? jobData.date.toISOString() : nowIso,
      status: jobData.status,
      notes: jobData.notes,
      appUserId: readCurrentUserId(),
      paid: false,
      serviceCharge: Math.round(
        serviceList.reduce((total, service) => total + Number(service.price || 0), 0) * 100
      ),
    };

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

          setTimeout(() => setAlert(null), 4000);
          navigate(`/view-job/${createdJob.id}`, { replace: true });
        },
        onError: (error: any) => {
          setAlert({
            show: true,
            variant: "error",
            title: "Failed to Create Job",
            message:
              error?.response?.data?.message || "An error occurred while creating the job.",
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
  };

  return (
    <>
      <PageMeta title="Kaza Dashboard - Create Job" description="Create a new job" />
      <PageBreadcrumb
        pageTitle="Create Job"
        items={[
          { label: "Home", to: "/" },
          { label: "View All Jobs", to: "/jobs" },
          { label: "Create Job" },
        ]}
      />

      <div className="space-y-6 pb-24">
        {alert && alert.show ? (
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            showLink={false}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <ComponentCard title="Job Fields">
              <JobDetails onDataChange={setJobData} />
            </ComponentCard>

            <ComponentCard title="Services and Prices">
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.key}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 p-3"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                          Service
                        </label>
                        <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {service.name}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                          Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={service.price}
                          onChange={(e) => handleServicePriceChange(service.key, e.target.value)}
                          className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={service.completed}
                            onChange={(e) =>
                              handleServiceCompletedChange(service.key, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                          />
                          Completed
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service.key)}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-900/40 dark:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:items-end">
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Add existing service
                    </label>
                    <select
                      value={newServiceId}
                      onChange={(e) => setNewServiceId(e.target.value)}
                      disabled={serviceOptions.length === 0}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value="">Select service</option>
                      {serviceOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label} ({formatGBP(option.price)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button variant="outline" onClick={handleAddService} disabled={!newServiceId} className="w-full">
                    Add Service
                  </Button>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        Create new service
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateService((prev) => !prev);
                          setServiceCreateError(null);
                          setServiceCreateOk(null);
                        }}
                        className="w-auto"
                      >
                        {showCreateService ? "Cancel" : "Create Service"}
                      </Button>
                    </div>

                    {showCreateService ? (
                      <form onSubmit={handleCreateAndAddService} className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              Service Name
                            </label>
                            <input
                              value={serviceDraft.name}
                              onChange={(e) => handleServiceDraftChange("name", e.target.value)}
                              disabled={createServiceMutation.isPending}
                              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              Price
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={serviceDraft.price}
                              onChange={(e) => handleServiceDraftChange("price", e.target.value)}
                              disabled={createServiceMutation.isPending}
                              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              Description
                            </label>
                            <textarea
                              value={serviceDraft.description}
                              onChange={(e) =>
                                handleServiceDraftChange("description", e.target.value)
                              }
                              disabled={createServiceMutation.isPending}
                              className="min-h-[84px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={createServiceMutation.isPending}
                            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {createServiceMutation.isPending
                              ? "Creating..."
                              : "Create and Add Service"}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {serviceCreateError ? (
                      <p className="text-sm text-red-600 dark:text-red-300">{serviceCreateError}</p>
                    ) : null}

                    {serviceCreateOk ? (
                      <p className="text-sm text-green-600 dark:text-green-300">{serviceCreateOk}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Services Total</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatGBP(servicesTotal)}
                  </p>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Customer Details">
              <CustomerForm onDataChange={setCustomerData} initialData={{ customerType: "new" }} />
            </ComponentCard>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <ComponentCard title="Vehicle">
              <VehicleForm onDataChange={setVehicleData} />
            </ComponentCard>

            <ComponentCard title="Summary">
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Due Date
                  </p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">{formattedDueDate}</p>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {jobData.status || "Pending"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Customer ID
                  </p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {customerData.customerId || "Not selected"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Vehicle
                  </p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {vehicleData.make || "-"} {vehicleData.model || ""}{" "}
                    {vehicleData.registration ? `(${vehicleData.registration})` : ""}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Services
                  </p>
                  <p className="mt-1 text-gray-900 dark:text-white">{services.length} selected</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatGBP(servicesTotal)}
                  </p>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto flex w-full max-w-6xl justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/jobs")} className="w-auto">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!!createJobMutation?.isPending}
              className="w-auto"
            >
              {createJobMutation?.isPending ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
