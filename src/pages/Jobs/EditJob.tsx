import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Alert from "../../components/ui/alert/Alert";
import Button from "../../components/ui/button/Button";
import { useJob } from "../../hooks/useJobs";
import { updateJob } from "../../services/jobService";
import { Job } from "../../types/job";
import { Service } from "../../types/service";
import { useCreateService, useService } from "../../hooks/useServices";

type EditableFormState = {
  description: string;
  status: string;
  dueDate: string;
  notes: string;
  make: string;
  model: string;
  licensePlate: string;
  colour: string;
};

type EditableServiceRow = {
  key: string;
  jobServiceId?: number;
  serviceId: number;
  name: string;
  price: number;
  completed: boolean;
};

type ChangeRow = {
  field: string;
  before: string;
  after: string;
};

type NewServiceDraft = {
  name: string;
  description: string;
  price: string;
};

const formatISOToDateInput = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const normalizeStatus = (status?: string) => {
  if (!status) return "Pending";
  return status === "In Progress" ? "In_Progress" : status;
};

const toLabel = (value: string) => (value.trim() ? value.trim() : "Empty");

const buildFormState = (job?: Job): EditableFormState => ({
  description: job?.description ?? "",
  status: normalizeStatus(job?.status),
  dueDate: formatISOToDateInput(job?.dueDate),
  notes: job?.notes ?? "",
  make: job?.vehicle?.make ?? "",
  model: job?.vehicle?.model ?? "",
  licensePlate: job?.vehicle?.licensePlate ?? "",
  colour: job?.vehicle?.colour ?? "",
});

const buildServiceRows = (job?: Job): EditableServiceRow[] =>
  (job?.jobServices ?? []).map((js, idx) => {
    const derivedServiceId = Number(js.serviceId ?? js.service?.id ?? 0);
    return {
      key: `existing-${js.id ?? derivedServiceId ?? idx}`,
      jobServiceId: js.id,
      serviceId: derivedServiceId,
      name:
        js.service?.name ||
        js.service?.description ||
        `Service ${Number.isFinite(derivedServiceId) ? derivedServiceId : idx + 1}`,
      price: Number(js.price ?? 0),
      completed: !!js.completed,
    };
  });

const formatGBP = (value: number) => `GBP ${value.toFixed(2)}`;

export default function EditJobPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const parsedJobId = Number(jobId);
  const queryClient = useQueryClient();

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useJob(Number.isFinite(parsedJobId) ? parsedJobId : undefined);
  const { data: allServices = [] } = useService();
  const createServiceMutation = useCreateService();

  const [form, setForm] = useState<EditableFormState>(buildFormState());
  const [services, setServices] = useState<EditableServiceRow[]>([]);
  const [initialServices, setInitialServices] = useState<EditableServiceRow[]>([]);
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  useEffect(() => {
    setHasInitialized(false);
  }, [parsedJobId]);

  useEffect(() => {
    if (!job || hasInitialized) return;
    setForm(buildFormState(job));
    const rows = buildServiceRows(job);
    setServices(rows);
    setInitialServices(rows);
    setHasInitialized(true);
  }, [job, hasInitialized]);

  const isCompletedJob = normalizeStatus(job?.status) === "Completed";

  const baseChanges = useMemo<ChangeRow[]>(() => {
    const rows: ChangeRow[] = [];
    const add = (field: string, before: string, after: string) => {
      if (before !== after) rows.push({ field, before, after });
    };

    add("Description", job?.description ?? "", form.description);
    add("Status", normalizeStatus(job?.status), form.status);
    add("Due Date", formatISOToDateInput(job?.dueDate), form.dueDate);
    add("Notes", job?.notes ?? "", form.notes);
    add("Vehicle Make", job?.vehicle?.make ?? "", form.make);
    add("Vehicle Model", job?.vehicle?.model ?? "", form.model);
    add("Vehicle Registration", job?.vehicle?.licensePlate ?? "", form.licensePlate);
    add("Vehicle Colour", job?.vehicle?.colour ?? "", form.colour);

    return rows;
  }, [job, form]);

  const serviceChanges = useMemo<ChangeRow[]>(() => {
    const rows: ChangeRow[] = [];
    const initialById = new Map<number, EditableServiceRow>();
    initialServices.forEach((s) => {
      if (s.jobServiceId != null) initialById.set(s.jobServiceId, s);
    });

    const currentById = new Map<number, EditableServiceRow>();
    services.forEach((s) => {
      if (s.jobServiceId != null) currentById.set(s.jobServiceId, s);
    });

    initialById.forEach((beforeRow, id) => {
      const afterRow = currentById.get(id);
      if (!afterRow) {
        rows.push({
          field: `Service Removed (${beforeRow.name})`,
          before: `${formatGBP(beforeRow.price)} | ${beforeRow.completed ? "Completed" : "Pending"}`,
          after: "Removed",
        });
        return;
      }

      if (beforeRow.price !== afterRow.price) {
        rows.push({
          field: `Service Price (${beforeRow.name})`,
          before: formatGBP(beforeRow.price),
          after: formatGBP(afterRow.price),
        });
      }

      if (beforeRow.completed !== afterRow.completed) {
        rows.push({
          field: `Service Status (${beforeRow.name})`,
          before: beforeRow.completed ? "Completed" : "Pending",
          after: afterRow.completed ? "Completed" : "Pending",
        });
      }
    });

    services
      .filter((s) => s.jobServiceId == null)
      .forEach((added) => {
        rows.push({
          field: `Service Added (${added.name})`,
          before: "Not on job",
          after: `${formatGBP(added.price)} | ${added.completed ? "Completed" : "Pending"}`,
        });
      });

    return rows;
  }, [initialServices, services]);

  const changes = useMemo(() => [...baseChanges, ...serviceChanges], [baseChanges, serviceChanges]);

  const servicesTotal = useMemo(
    () => services.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [services]
  );

  const serviceOptions = useMemo(
    () => {
      const mergedMap = new Map<number, { id: number; label: string; price: number }>();

      allServices.forEach((service) => {
        mergedMap.set(service.id, {
          id: service.id,
          label: service.name || service.description || `Service ${service.id}`,
          price: Number(service.estimatedPrice ?? 0),
        });
      });

      createdServiceOptions.forEach((service) => {
        if (!mergedMap.has(service.id)) {
          mergedMap.set(service.id, service);
        }
      });

      return Array.from(mergedMap.values()).filter(
        (service) => !services.some((s) => s.serviceId === service.id)
      );
    },
    [allServices, createdServiceOptions, services]
  );

  const mutation = useMutation({
    mutationFn: (payload: Job) => updateJob(parsedJobId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["Job", parsedJobId] });
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setSubmitOk("Job updated successfully.");
      const destinationId = parsedJobId;
      setTimeout(() => navigate(`/view-job/${destinationId}`), 600);
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      setSubmitError(error?.message ?? "Failed to update job.");
    },
  });

  const handleChange = (field: keyof EditableFormState, value: string) => {
    setSubmitError(null);
    setSubmitOk(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleServicePriceChange = (key: string, value: string) => {
    setSubmitError(null);
    setSubmitOk(null);
    const parsed = Number(value);
    setServices((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, price: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 } : s
      )
    );
  };

  const handleServiceCompletedChange = (key: string, completed: boolean) => {
    setSubmitError(null);
    setSubmitOk(null);
    setServices((prev) => prev.map((s) => (s.key === key ? { ...s, completed } : s)));
  };

  const handleRemoveService = (key: string) => {
    setSubmitError(null);
    setSubmitOk(null);
    setServices((prev) => prev.filter((s) => s.key !== key));
  };

  const handleAddService = () => {
    if (!newServiceId) return;
    const selected = serviceOptions.find((option) => option.id === Number(newServiceId));
    if (!selected) return;

    setSubmitError(null);
    setSubmitOk(null);
    setServiceCreateError(null);
    setServiceCreateOk(null);
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
  };

  const handleServiceDraftChange = (field: keyof NewServiceDraft, value: string) => {
    setServiceCreateError(null);
    setServiceCreateOk(null);
    setServiceDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAndAddService = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isCompletedJob) return;

    setServiceCreateError(null);
    setServiceCreateOk(null);
    setSubmitError(null);
    setSubmitOk(null);

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
      const responseData = response as unknown;
      const created: Service =
        (responseData as { data?: Service })?.data ?? (responseData as Service);
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
      await queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setServiceCreateError(
        error?.response?.data?.message ?? error?.message ?? "Failed to create service."
      );
    }
  };

  const validate = () => {
    if (!job) return "Job was not loaded.";
    if (isCompletedJob) return "Completed jobs are locked and cannot be edited.";
    if (!form.status) return "Status is required.";
    if (!form.dueDate) return "Due date is required.";
    if (!form.make.trim()) return "Vehicle make is required.";
    if (!form.model.trim()) return "Vehicle model is required.";
    if (!form.licensePlate.trim()) return "Vehicle registration is required.";
    if (services.length === 0) return "At least one service is required.";
    if (services.some((service) => !Number.isFinite(service.price) || service.price < 0)) {
      return "Each service must have a valid price.";
    }
    if (services.some((service) => !Number.isFinite(service.serviceId) || service.serviceId <= 0)) {
      return "Each service must have a valid service ID.";
    }
    if (changes.length === 0) return "No changes detected. Update at least one field.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    if (!job) return;

    const dueDateIso = new Date(`${form.dueDate}T00:00:00`).toISOString();
    const nowIso = new Date().toISOString();

    const normalizedJobServices = services.map((service) => ({
      id: service.jobServiceId ?? 0,
      jobId: job.id,
      serviceId: Number(service.serviceId),
      price: Number(service.price),
      completed: service.completed,
    }));

    const servicesAlias: Service[] = services.map((service) => ({
      id: Number(service.serviceId),
      name: service.name,
      description: service.name,
      estimatedPrice: Number(service.price),
      isActive: true,
    }));

    const payload: Job & { services?: Service[] } = {
      id: job.id,
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      appUserId: job.appUserId,
      createdAt: job.createdAt,
      isActive: job.isActive,
      invoiceId: job.invoiceId,
      paid: job.paid,
      paymentMethod: job.paymentMethod,
      paymentMethods: job.paymentMethods,
      assignedTo: job.assignedTo,
      description: form.description.trim(),
      status: form.status,
      dueDate: dueDateIso,
      notes: form.notes.trim(),
      updatedAt: nowIso,
      serviceCharge: Math.round(servicesTotal * 100),
      vehicle: {
        ...(job.vehicle ?? {
          id: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
          isActive: true,
          year: "",
        }),
        make: form.make.trim().toUpperCase(),
        model: form.model.trim().toUpperCase(),
        licensePlate: form.licensePlate.trim().toUpperCase(),
        colour: form.colour.trim().toUpperCase(),
        updatedAt: nowIso,
      },
      jobServices: normalizedJobServices,
      Services: servicesAlias,
      services: servicesAlias,
    };

    await mutation.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading job...</p>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-lg border border-red-200 bg-white dark:bg-gray-900 dark:border-red-900/40 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-300">
            {error?.message || "Unable to load this job."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Kaza Dashboard - Edit Job" description="Edit an existing job" />
      <PageBreadcrumb
        pageTitle="Edit Job"
          items={[
            { label: "Home", to: "/" },
            { label: "View All Jobs", to: "/jobs" },
            { label: `Job ${parsedJobId}`, to: `/view-job/${parsedJobId}` },
            { label: "Edit" },
        ]}
      />

      <div className="space-y-6">
        {isCompletedJob ? (
          <Alert
            variant="warning"
            title="Job is completed"
            message="Completed jobs are locked. Reopen the job status first if edits are required."
            showLink={false}
          />
        ) : null}

        {submitError ? (
          <Alert variant="error" title="Cannot update job" message={submitError} showLink={false} />
        ) : null}

        {submitOk ? (
          <Alert variant="success" title="Updated" message={submitOk} showLink={false} />
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <ComponentCard title="Job Fields">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    disabled={isCompletedJob}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    disabled={isCompletedJob}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                    disabled={isCompletedJob}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    disabled={isCompletedJob}
                    className="min-h-[120px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Vehicle">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Make
                  </label>
                  <input
                    value={form.make}
                    onChange={(e) => handleChange("make", e.target.value)}
                    disabled={isCompletedJob}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Model
                  </label>
                  <input
                    value={form.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    disabled={isCompletedJob}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Registration
                  </label>
                  <input
                    value={form.licensePlate}
                    onChange={(e) => handleChange("licensePlate", e.target.value)}
                    disabled={isCompletedJob}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Colour
                  </label>
                  <input
                    value={form.colour}
                    onChange={(e) => handleChange("colour", e.target.value)}
                    disabled={isCompletedJob}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
              </div>
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
                          disabled={isCompletedJob}
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
                            disabled={isCompletedJob}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                          />
                          Completed
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service.key)}
                          disabled={isCompletedJob}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-50 dark:border-red-900/40 dark:text-red-300"
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
                      disabled={isCompletedJob || serviceOptions.length === 0}
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
                  <Button
                    variant="outline"
                    onClick={handleAddService}
                    disabled={isCompletedJob || !newServiceId}
                    className="w-full"
                  >
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
                        disabled={isCompletedJob}
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
                              disabled={isCompletedJob || createServiceMutation.isPending}
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
                              disabled={isCompletedJob || createServiceMutation.isPending}
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
                              disabled={isCompletedJob || createServiceMutation.isPending}
                              className="min-h-[84px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isCompletedJob || createServiceMutation.isPending}
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
          </div>

          <div className="space-y-6">
            <ComponentCard title="Changes Before Submit">
              {changes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No changes yet.</p>
              ) : (
                <div className="space-y-3">
                  {changes.map((change) => (
                    <div
                      key={`${change.field}-${change.before}-${change.after}`}
                      className="rounded-lg border border-gray-200 dark:border-gray-800 p-3"
                    >
                      <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        {change.field}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        From: <span className="font-medium">{toLabel(change.before)}</span>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        To: <span className="font-semibold">{toLabel(change.after)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ComponentCard>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/view-job/${parsedJobId}`)}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={mutation.isPending || isCompletedJob}
                className="w-full"
              >
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
