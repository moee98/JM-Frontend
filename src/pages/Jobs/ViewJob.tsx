import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

import { useJob } from "../../hooks/useJobs";
import {getUserNameById} from "../../hooks/useUsers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaymentMethodsCard, { PaymentPayload } from "../Forms/PaymentMethod";
import JobStatusDropdown, { JobStatus } from "../../components/jobs/JobStatusDropdown";
import { updateJob as updateJobRequest } from "../../services/jobService";
import { Job } from "../../types/job";
import { PaymentMethodType } from "../../types/payment";

// ---- Local types for payment UI ----
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

export default function ViewJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const id = jobId ? Number(jobId) : undefined;

  const queryClient = useQueryClient();
  const { data:job, isLoading, isError, error } = useJob(id!);

  const { data: userName } = useQuery({
    queryKey: ["userName", job?.appUserId],
    queryFn: () => getUserNameById(job?.appUserId || ""),
  });

  // ---- Payment state derived from job ----
  const [paymentData, setPaymentData] = useState<PaymentData>({
    isPaid: false,
    paymentMethod: "",
    isSplit: false,
    parts: [{ method: "card", amount: 0 }],
  });

  useEffect(() => {
    if (!job) return;
    setPaymentData({
      isPaid: !!job.paid,
      paymentMethod: job.paymentMethod || "",
      isSplit:
        Array.isArray((job as any).paymentParts) &&
        (job as any).paymentParts.length > 0,
      parts:
        ((job as any).paymentParts as SplitPaymentPart[] | undefined) ?? [
          { method: "card", amount: 0 },
        ],
    });
  }, [job]);

  // Total in £ from backend pence value, or fallback to jobServices
  const servicesTotal =
    job?.serviceCharge != null
      ? job.serviceCharge / 100
      : (job?.jobServices ?? []).reduce(
          (sum, js) => sum + (js.price ?? 0),
          0
        );
  const servicesTotalPence =
    job?.serviceCharge ??
    Math.round(
      (job?.jobServices ?? []).reduce((sum, js) => sum + ((js.price ?? 0) * 100), 0)
    );

   const round2 = (n: number) => Math.round(n * 100) / 100;

const splitTotal = paymentData.parts.reduce((sum, p) => {
  const amt = typeof p.amount === "number" ? p.amount : 0;
  return sum + amt;
}, 0);

const isSplitSelected = paymentData.paymentMethod === "split";

const splitDiff = round2(servicesTotal - splitTotal);

// valid when equal (with 2dp rounding)
const isSplitValid = !isSplitSelected || round2(splitDiff) === 0;

// optional: only show message after user starts editing split
const shouldShowSplitValidation =
  isSplitSelected && paymentData.parts.length > 0;
     

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

  const submitPaymentMethod = () => {
    if(shouldShowSplitValidation && isSplitValid)
    {
      // Submit split payment
    }
    if(!isSplitSelected) {
      // Submit single payment
    }
    // Submit logic here
  };

const addPaymentPart = () => {
  setPaymentData((prev) => {
    const currentTotal = prev.parts.reduce(
      (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
      0
    );

    const remaining = Math.max(0, round2(servicesTotal - currentTotal));

    return {
      ...prev,
      parts: [...prev.parts, { method: "card", amount: remaining }],
    };
  });
};

  const removePaymentPart = (index: number) => {
    setPaymentData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };
  const setPaymentMethod = (method: string) => {
  setPaymentData((prev) => {
    if (method === "split") {
      return {
        ...prev,
        paymentMethod: "split",
        isSplit: true,
        parts:
          prev.parts.length > 0
            ? prev.parts
            : [{ method: "card", amount: 0 }],
      };
    }

    // switching back to single payment
    return {
      ...prev,
      paymentMethod: method,
      isSplit: false,
      parts: [{ method, amount: 0 }],
    };
  });
};

  const normalizeJobStatus = (status?: string): JobStatus => {
    if (!status) return "Pending";

    switch (status) {
      case "In Progress":
        return "In_Progress";
      case "Pending":
      case "In_Progress":
      case "Completed":
      case "Cancelled":
        return status;
      default:
        return "Pending";
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    return status === "In_Progress" ? "In Progress" : status;
  };
  const normalizePaymentMethod = (method?: string): PaymentMethodType => {
    switch (method) {
      case "cash":
      case "card":
      case "bank-transfer":
      case "online":
      case "split":
        return method;
      default:
        return "";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30";
      case "In_Progress":
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-warning-500/15 dark:text-warning-300 dark:border-warning-500/30";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-error-500/15 dark:text-error-300 dark:border-error-500/30";
      case "true":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30";
      case "false":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-error-500/15 dark:text-error-300 dark:border-error-500/30";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5" />;
      case "In_Progress":
      case "In Progress":
        return <Clock className="w-5 h-5" />;
      case "Pending":
        return <AlertCircle className="w-5 h-5" />;
      case "Cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "N/A";

    return d.toLocaleDateString("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
      
    });
  };
  const [selectedStatus, setSelectedStatus] = useState<JobStatus>("Pending");
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!job?.status) return;
    setSelectedStatus(normalizeJobStatus(job.status));
  }, [job?.status]);

  const updateStatusMutation = useMutation({
    mutationFn: (updatedJob: Job) => updateJobRequest(id!, updatedJob),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["Job", id] });
    },
  });
  const updatePaymentMutation = useMutation({
    mutationFn: (updatedJob: Job) => updateJobRequest(id!, updatedJob),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["Job", id] });
    },
  });

  const handleStatusChange = async (newStatus: JobStatus) => {
    const previousStatus = selectedStatus;
    setStatusUpdateError(null);
    setSelectedStatus(newStatus);

    try {
      if (!job) throw new Error("Job data is not loaded yet.");
      const updatedJob: Job = {
        ...job,
        status: newStatus,
      };

      await updateStatusMutation.mutateAsync(updatedJob);
    } catch (err) {
      setSelectedStatus(previousStatus);
      setStatusUpdateError("Failed to update job status.");
      console.error(err);
    }
  };
  const handlePaymentSubmit = async (payload: PaymentPayload) => {
    if (!job) throw new Error("Job data is not loaded yet.");

    const paymentMethods = payload.isPaid ? payload.paymentMethods : [];
    const primaryPaymentMethod =
      paymentMethods.length > 1
        ? "split"
        : paymentMethods.length === 1
        ? paymentMethods[0].MethodName
        : "";

    const updatedJob: Job = {
      ...job,
      paid: payload.isPaid,
      paymentMethod: primaryPaymentMethod,
      paymentMethods,
    };

    await updatePaymentMutation.mutateAsync(updatedJob);
  };
  
const formatMoneyFromPence = (value?: number) => {
    if (!value || Number.isNaN(value)) return 0.00;
    return (value / 100).toFixed(2);
  };
  const handleServiceCompletedChange = (serviceId: number, completed: boolean) => {
  // call your API here
  // e.g. updateServiceCompleted(serviceId, completed);
  
  console.log(serviceId, completed);
};

  // ---------- LOADING ----------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-brand-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading job details...</p>
        </div>
      </div>
    );
  }

  // ---------- ERROR ----------
  if (isError || !id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-800">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Job
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error?.message || "Failed to load job details."}
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  // ---------- NOT FOUND ----------
  if (!job) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-800">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Job Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The job you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  // ---------- MAIN RENDER ----------
  return (
    <div>
      <PageMeta
        title="Kaza Dashboard - View Job"
        description="View current job details and status"
      />
     
        <PageBreadcrumb pageTitle="View Job" items={[
    { label: "Home", to: "/" },
    { label: "View All Jobs", to: "/jobs" },
    { label: "Job"},
    
  ]}/>

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <div className="max-w-9xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Job #{job.id}
                  </h1>
                  
                </div>

                <button
                  onClick={() => navigate(`/jobs/${jobId}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit Job
                </button>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {job.description && (
                  <ComponentCard title="Description">
                    <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                      {job.description}
                    </p>
                  </ComponentCard>
                )}

                   {/* Job Details */}
                <ComponentCard title="Job Details">
                 <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 text-center">
                            Status
                          </div>

                          <div className="flex items-center justify-center mb-1 gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                                selectedStatus
                              )}`}
                            >
                              {getStatusIcon(selectedStatus)}
                              {getStatusLabel(selectedStatus)}
                            </span>

                            {job.isActive && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-success-500/20 dark:text-success-300 rounded-full text-sm font-medium">
                                Active
                              </span>
                            )}
                          </div>
</div>
                          <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 text-center">
                            Payment Status
                          </div>

                          <div className="flex items-center justify-center mb-1 gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                                job.paid.toString()
                              )}`}
                            >
                              {getStatusIcon(job.paid.toString())}
                              {job.paid ? "Paid" : "Unpaid"}
                            </span>

                            {job.isActive && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-success-500/20 dark:text-success-300 rounded-full text-sm font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          </div>
                        
                            
                            <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Created By
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                       { userName|| "Unassigned"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Due Date
                      </div>
                      <div className="flex items-center justify-center gap-2 text-center">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(job.dueDate)}
                        </span>
                      </div>

                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Created
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(job.createdAt)}
                      </div>
                    </div>
                    {job.updatedAt && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Last Updated
                        </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(job.updatedAt)}
                        </div>
                      </div>
                    )}
                  </div>
                </ComponentCard>

                {/* Services */}
                {job.jobServices && job.jobServices.length > 0 && (
                  <ComponentCard title="Services">
                    <div className="space-y-3">
                      {job.jobServices.map((js) => (
                        <div
                          key={js.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={js.completed}
                              onChange={(e) =>
                                handleServiceCompletedChange(js.id, e.target.checked)
                              }
                              className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                            />

                            <span className="font-medium text-gray-900 dark:text-white">
                              {js.service?.description}
                            </span>
                          </div>

                          <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                            £{(js.price ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-2xl text-gray-500 dark:text-gray-400 sm:text-base">
                        Total Service Charge
                      </span>
                      <span className="text-2xl text-gray-500 dark:text-gray-400">
                        {formatMoneyFromPence(job.serviceCharge)}
                      </span>
                    </div>
                  </ComponentCard>
                )}


                

                {/* Vehicle Info */}
                {job.vehicle && (
                  <ComponentCard title="Vehicle Information">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Make &amp; Model
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {job.vehicle.year} {job.vehicle.make}{" "}
                          {job.vehicle.model}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          License Plate
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {job.vehicle.licensePlate}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Colour
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {job.vehicle.colour}
                        </div>
                      </div>
                    </div>
                  </ComponentCard>
                )}

                {/* Notes */}
                {job.notes && (
                  <ComponentCard title="Notes">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {job.notes}
                    </p>
                  </ComponentCard>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                 {/* Actions */}
                <ComponentCard title="Actions">
                  <div className="space-y-2">
                    <div>
                      <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">Status</div>
                      <JobStatusDropdown
                        value={selectedStatus}
                        onChange={handleStatusChange}
                        disabled={updateStatusMutation.isPending}
                      />
                      {statusUpdateError ? (
                        <p className="mt-1 text-xs text-red-600">{statusUpdateError}</p>
                      ) : null}
                    </div>
                    <button onClick={() => navigate(`/invoice/${jobId}`)} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Print Invoice
                    </button>
                    <button className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Send to Customer
                    </button>
                    <button
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() =>
                        navigate(`/jobs/${jobId}/inspection/new`)
                      }
                    >
                      Vehicle Inspection
                    </button>
                  </div>
                </ComponentCard>
                 {/* Job Details */}
                <ComponentCard title="Job Details">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Created By
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                       { userName|| "Unassigned"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Due Date
                      </div>
                      <div className="flex items-center justify-center gap-2 text-center">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(job.dueDate)}
                        </span>
                      </div>

                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Created
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(job.createdAt)}
                      </div>
                    </div>
                    {job.updatedAt && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Last Updated
                        </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(job.updatedAt)}
                        </div>
                      </div>
                    )}
                  </div>
                </ComponentCard>
                {/* Customer Info */}
                {job.customer && (
                  <ComponentCard title="Customer Information">
                    <div className="space-y-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {job.customer.name}
                          </div>
                        </div>
                      </div>

                      {job.customer.email && (
                        <div className="flex flex-col items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {job.customer.email}
                            </div>
                          </div>
                        </div>
                      )}

                      {job.customer.phoneNumber && (
                        <div className="flex flex-col items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Phone</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {job.customer.phoneNumber}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ComponentCard>

                )}
                
                <ComponentCard title="Payment Summary">
                <div>
                    {/* Static info from backend */}
                    {job.invoiceId && (
                      <div className="pt-3 border-t dark:border-gray-800">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Invoice ID
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {job.invoiceId}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t dark:border-gray-800">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total Amount
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatMoneyFromPence(job.serviceCharge)}
                      </div>
                    </div>

                    {/* Hook this up to an update-job API when ready */}
                    {/* <button
                      type="button"
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      onClick={handleSavePayment}
                    >
                      Save Payment
                    </button> */}
                  </div>
                </ComponentCard>

                {/* Payment Info */}
                <PaymentMethodsCard
                  jobId={job.id}
                  servicesTotalPence={servicesTotalPence}
                  onSubmit={handlePaymentSubmit}
                  initialIsPaid={!!job.paid}
                  initialPaymentMethod={normalizePaymentMethod(job.paymentMethod)}
                  initialPaymentMethods={job.paymentMethods ?? []}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
