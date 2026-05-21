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
  FileText,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

import { useJob } from "../../hooks/useJobs";
import {getUserNameById} from "../../hooks/useUsers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaymentMethodsCard, { PaymentPayload } from "../Forms/PaymentMethod";
import SquareTerminalPayment from "../../components/jobs/SquareTerminalPayment";
import JobStatusDropdown, { JobStatus } from "../../components/jobs/JobStatusDropdown";
import { updateJob as updateJobRequest, sendInvoice } from "../../services/jobService";
import { VehicleInspectionService } from "../../services/vehicleInspectionService";
import { Job } from "../../types/job";
import { PaymentMethodType } from "../../types/payment";
import type { AttachmentSummary } from "../../types/attachment";
import type { VehicleInspection } from "../../types/vehicleInspection";
import { formatFileSize } from "../../utils/errorUtils";

const isImageAttachment = (attachment: AttachmentSummary) =>
  attachment.contentType.startsWith("image/") ||
  /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.fileName);

const getLatestInspectionForVehicle = (
  inspections: VehicleInspection[],
  vehicleId: number
) =>
  inspections
    .filter((inspection) => inspection.vehicleId === vehicleId)
    .sort(
      (left, right) =>
        new Date(right.inspectionDate).getTime() -
        new Date(left.inspectionDate).getTime()
    )[0] ?? null;

export default function ViewJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const id = jobId ? Number(jobId) : undefined;

  const queryClient = useQueryClient();
  const { data:job, isLoading, isError, error } = useJob(id);
  const [showInspectionDetails, setShowInspectionDetails] = useState(false);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<
    Record<number, string>
  >({});

  const linkedInspectionId =
    job?.vehicleInspection?.id ?? job?.vehicleInspectionId ?? undefined;

  const { data: userName } = useQuery({
    queryKey: ["userName", job?.appUserId],
    queryFn: () => getUserNameById(job?.appUserId || ""),
  });

  const {
    data: completedInspection = null,
    isLoading: isInspectionLoading,
    isError: hasInspectionLookupError,
  } = useQuery({
    queryKey: ["vehicleInspectionForJob", linkedInspectionId, job?.vehicleId],
    enabled: Boolean(linkedInspectionId || job?.vehicleId),
    queryFn: async () => {
      if (linkedInspectionId) {
        return VehicleInspectionService.getById(linkedInspectionId);
      }

      if (!job?.vehicleId) {
        return null;
      }

      const inspections = await VehicleInspectionService.getAll();
      return getLatestInspectionForVehicle(inspections, job.vehicleId);
    },
  });

  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [invoiceSentOk, setInvoiceSentOk] = useState(false);
  const [invoiceSendError, setInvoiceSendError] = useState<string | null>(null);

  useEffect(() => {
    setShowInspectionDetails(false);
  }, [id]);

  useEffect(() => {
    return () => {
      Object.values(attachmentPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachmentPreviewUrls]);

  useEffect(() => {
    let isCancelled = false;

    const loadAttachmentPreviews = async () => {
      if (!completedInspection) {
        setAttachmentPreviewUrls((current) => {
          Object.values(current).forEach((url) => URL.revokeObjectURL(url));
          return {};
        });
        return;
      }

      const imageAttachments = completedInspection.attachments.filter(isImageAttachment);

      if (imageAttachments.length === 0) {
        setAttachmentPreviewUrls((current) => {
          Object.values(current).forEach((url) => URL.revokeObjectURL(url));
          return {};
        });
        return;
      }

      const previews = await Promise.all(
        imageAttachments.map(async (attachment) => {
          try {
            const blob = await VehicleInspectionService.getAttachmentBlob(
              attachment.downloadUrl
            );

            return [attachment.id, URL.createObjectURL(blob)] as const;
          } catch {
            return null;
          }
        })
      );

      if (isCancelled) {
        previews.forEach((preview) => {
          if (preview) {
            URL.revokeObjectURL(preview[1]);
          }
        });
        return;
      }

      setAttachmentPreviewUrls((current) => {
        Object.values(current).forEach((url) => URL.revokeObjectURL(url));

        return previews.reduce<Record<number, string>>((result, preview) => {
          if (preview) {
            result[preview[0]] = preview[1];
          }

          return result;
        }, {});
      });
    };

    void loadAttachmentPreviews();

    return () => {
      isCancelled = true;
    };
  }, [completedInspection]);

  const servicesTotalPence =
    job?.serviceCharge ??
    Math.round(
      (job?.jobServices ?? []).reduce((sum, js) => sum + ((js.price ?? 0) * 100), 0)
    );

  const handleSendInvoice = async () => {
    if (!id) return;
    setIsSendingInvoice(true);
    setInvoiceSentOk(false);
    setInvoiceSendError(null);
    try {
      await sendInvoice(id);
      setInvoiceSentOk(true);
    } catch (err) {
      setInvoiceSendError(
        err instanceof Error ? err.message : "Failed to send invoice."
      );
    } finally {
      setIsSendingInvoice(false);
    }
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

  const formatDateTime = (iso?: string) => {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "N/A";

    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVehicleInspectionAction = () => {
    if (completedInspection) {
      setShowInspectionDetails((current) => !current);
      return;
    }

    navigate(`/jobs/${jobId}/inspection/new`);
  };

  const handleOpenAttachment = async (attachment: AttachmentSummary) => {
    try {
      const blob = await VehicleInspectionService.getAttachmentBlob(
        attachment.downloadUrl
      );
      const objectUrl = URL.createObjectURL(blob);
      const newWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

      if (!newWindow) {
        const downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = attachment.fileName;
        downloadLink.rel = "noopener noreferrer";
        downloadLink.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (attachmentError) {
      console.error("Failed to open inspection attachment.", attachmentError);
    }
  };

  const vehicleInspectionButtonLabel = isInspectionLoading
    ? "Checking inspection..."
    : completedInspection
    ? showInspectionDetails
      ? "Hide Vehicle Inspection"
      : "View Vehicle Inspection"
    : "Vehicle Inspection";
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

  const handleSquarePaymentComplete = async (squarePaymentId: string) => {
    if (!job) return;
    const now = new Date().toISOString();
    await handlePaymentSubmit({
      isPaid: true,
      paymentMethods: [
        {
          isPaid: true,
          MethodName: "card",
          amount: servicesTotalPence,
          jobId: job.id,
          squarePaymentId,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
  };
  
const formatMoneyFromPence = (value?: number) => {
    if (!value || Number.isNaN(value)) return 0.00;
    return (value / 100).toFixed(2);
  };
  const handleServiceCompletedChange = (serviceId: number, completed: boolean) => {
  console.log(serviceId, completed);
};

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {job.description && (
                  <ComponentCard title="Description">
                    <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                      {job.description}
                    </p>
                  </ComponentCard>
                )}

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

                {showInspectionDetails && completedInspection && (
                  <ComponentCard
                    title="Vehicle Inspection"
                    desc={
                      linkedInspectionId
                        ? "Completed inspection linked to this job."
                        : "Showing the latest completed inspection recorded for this vehicle."
                    }
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-700 dark:bg-gray-900">
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Inspection Date
                        </div>
                        <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(completedInspection.inspectionDate)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-700 dark:bg-gray-900">
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Result
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                              completedInspection.inspectionResult === "Passed"
                                ? "bg-green-100 text-green-700 dark:bg-success-500/15 dark:text-success-300"
                                : "bg-red-100 text-red-700 dark:bg-error-500/15 dark:text-error-300"
                            }`}
                          >
                            {completedInspection.inspectionResult || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-700 dark:bg-gray-900">
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Attachments
                        </div>
                        <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          {completedInspection.attachments.length}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Inspector Notes
                      </div>
                      <p className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        {completedInspection.comments?.trim() || "No inspection notes were recorded."}
                      </p>
                    </div>

                    {completedInspection.attachments.length > 0 ? (
                      <div className="space-y-4 text-left">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Attached Files
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {completedInspection.attachments.map((attachment) =>
                            isImageAttachment(attachment) ? (
                              <button
                                key={attachment.id}
                                type="button"
                                onClick={() => void handleOpenAttachment(attachment)}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-brand-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
                              >
                                {attachmentPreviewUrls[attachment.id] ? (
                                  <img
                                    src={attachmentPreviewUrls[attachment.id]}
                                    alt={attachment.fileName}
                                    className="aspect-[4/3] w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                    Loading preview...
                                  </div>
                                )}
                                <div className="space-y-1 p-4">
                                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                    {attachment.fileName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(attachment.fileSize)} |{" "}
                                    {formatDateTime(attachment.uploadedAt)}
                                  </div>
                                </div>
                              </button>
                            ) : (
                              <button
                                key={attachment.id}
                                type="button"
                                onClick={() => void handleOpenAttachment(attachment)}
                                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-brand-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                      {attachment.fileName}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {attachment.contentType || "Attachment"} |{" "}
                                      {formatFileSize(attachment.fileSize)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-brand-600 dark:text-brand-300">
                                  Open attachment
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No images or PDFs were attached to this inspection.
                      </div>
                    )}
                  </ComponentCard>
                )}

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
                    <button
                      onClick={() => { void handleSendInvoice(); }}
                      disabled={isSendingInvoice}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                    >
                      {isSendingInvoice ? "Sending..." : "Send to Customer"}
                    </button>
                    {invoiceSentOk ? (
                      <p className="text-left text-xs text-green-600 dark:text-green-400">Invoice sent successfully.</p>
                    ) : null}
                    {invoiceSendError ? (
                      <p className="text-left text-xs text-red-600 dark:text-red-400">{invoiceSendError}</p>
                    ) : null}
                    <button
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-gray-800 transition-colors"
                      onClick={handleVehicleInspectionAction}
                      disabled={isInspectionLoading}
                    >
                      {vehicleInspectionButtonLabel}
                    </button>
                    {hasInspectionLookupError ? (
                      <p className="text-left text-xs text-amber-600 dark:text-amber-300">
                        Existing inspections could not be checked right now. You can still create a new one.
                      </p>
                    ) : null}
                  </div>
                </ComponentCard>
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
                  </div>
                </ComponentCard>

                {/* Manual payment recording */}
                <PaymentMethodsCard
                  jobId={job.id}
                  servicesTotalPence={servicesTotalPence}
                  onSubmit={handlePaymentSubmit}
                  initialIsPaid={!!job.paid}
                  initialPaymentMethod={normalizePaymentMethod(job.paymentMethod)}
                  initialPaymentMethods={job.paymentMethods ?? []}
                />

                {/* Square Terminal in-person payment */}
                <SquareTerminalPayment
                  jobId={job.id}
                  totalAmountPence={servicesTotalPence}
                  onPaymentComplete={handleSquarePaymentComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
