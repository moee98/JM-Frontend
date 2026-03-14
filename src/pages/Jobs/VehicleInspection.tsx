import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useJob } from "../../hooks/useJobs";
import { updateJob as updateJobRequest } from "../../services/jobService";
import { VehicleInspectionService } from "../../services/vehicleInspectionService";
import { Vehicle as VehicleType } from "../../types/vehicle";

type InspectionAttachmentDraft = {
  id: string;
  file: File;
  previewUrl: string | null;
};

const SUPPORTED_ATTACHMENT_EXTENSIONS = /\.(jpg|jpeg|png|gif|bmp|webp|pdf)$/i;

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: unknown } }).response?.data === "string"
  ) {
    return (error as { response?: { data?: string } }).response?.data ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export default function VehicleInspectionFormPage() {
  const { jobId } = useParams();
  const parsedJobId = Number(jobId);
  const navigate = useNavigate();

  const {
    data: job,
    isLoading,
    isError,
    error: jobError,
  } = useJob(Number.isFinite(parsedJobId) ? parsedJobId : undefined);

  const vehicle: VehicleType | undefined = job?.vehicle;

  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [inspectionResult, setInspectionResult] =
    useState<"Passed" | "Failed">("Passed");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState<InspectionAttachmentDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attachmentsRef = useRef<InspectionAttachmentDraft[]>([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const selectedFiles = Array.from(e.target.files);
    const invalidFiles = selectedFiles.filter(
      (file) => !SUPPORTED_ATTACHMENT_EXTENSIONS.test(file.name)
    );

    if (invalidFiles.length > 0) {
      setError(
        `Unsupported files: ${invalidFiles.map((file) => file.name).join(", ")}. Only images and PDFs are allowed.`
      );
    }

    const validFiles = selectedFiles.filter((file) =>
      SUPPORTED_ATTACHMENT_EXTENSIONS.test(file.name)
    );

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    setError(null);
    setAttachments((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    ]);

    e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((attachment) => attachment.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((attachment) => attachment.id !== id);
    });
  };

  const statusDotClass =
    inspectionResult === "Passed" ? "bg-green-500" : "bg-red-500";

  const fileInputClass =
    "focus:border-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 hover:file:bg-gray-100 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-300 dark:hover:file:bg-white/[0.08]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!Number.isFinite(parsedJobId)) {
      setError("Invalid job id.");
      return;
    }

    if (!inspectionDate) {
      setError("Inspection date is required.");
      return;
    }

    if (!vehicle?.id) {
      setError("This job does not have a vehicle linked yet.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdInspection = await VehicleInspectionService.create({
        vehicleId: vehicle.id,
        inspectionDate: new Date(`${inspectionDate}T00:00:00`).toISOString(),
        inspectionResult,
        comments: comments.trim(),
        pathToImages: [],
      });

      if (!job) {
        throw new Error("This job could not be refreshed after creating the inspection.");
      }

      await updateJobRequest(parsedJobId, {
        ...job,
        vehicleInspectionId: createdInspection.id,
      });

      if (attachments.length > 0) {
        await VehicleInspectionService.uploadAttachments(
          createdInspection.id,
          attachments.map((attachment) => attachment.file)
        );
      }

      navigate(`/view-job/${parsedJobId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong while saving the inspection."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading vehicle inspection...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-900 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-300">
            {jobError?.message || "Failed to load job for inspection."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Kaza Dashboard - Vehicle Inspection"
        description="Vehicle inspection form for job"
      />

      <PageBreadcrumb
        pageTitle="Vehicle Inspection"
        items={[
          { label: "Home", to: "/" },
          { label: "View All Jobs", to: "/jobs" },
          { label: `Job ${parsedJobId}`, to: `/view-job/${parsedJobId}` },
          { label: "Vehicle Inspection" },
        ]}
      />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 py-7 xl:px-10 xl:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Vehicle Inspection</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Record pre-job condition and damage notes.
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Job ID: <span className="font-medium text-gray-800 dark:text-white">{parsedJobId}</span>
            </div>
          </div>

          {vehicle && (
            <ComponentCard title="Vehicle Details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Registration</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {vehicle.licensePlate}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Make / Model</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {vehicle.make} {vehicle.model}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Year</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{vehicle.year || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Colour</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{vehicle.colour || "-"}</p>
                </div>
              </div>
            </ComponentCard>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <ComponentCard title="Inspection Details">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Inspection date
                  </label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Inspection result
                  </label>
                  <select
                    value={inspectionResult}
                    onChange={(e) => setInspectionResult(e.target.value as "Passed" | "Failed")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value="Passed">Passed - no concerning damage</option>
                    <option value="Failed">Failed - significant pre-existing damage</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className={`inline-block h-2 w-2 rounded-full ${statusDotClass}`} />
                    {inspectionResult === "Passed"
                      ? "Vehicle condition acceptable for job."
                      : "Review damage before proceeding."}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cosmetic damage notes
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Describe scratches, dents, scuffs, cracked lights, wheel damage, and location."
                  className="min-h-[120px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </ComponentCard>

            <ComponentCard
              title="Damage Attachments"
              desc="Upload pre-job photos or PDFs after the inspection record is created."
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Upload photos or PDFs
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,image/*,application/pdf"
                  multiple
                  onChange={handleFileChange}
                  className={fileInputClass}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: JPG, JPEG, PNG, GIF, BMP, WEBP, and PDF.
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {attachments.map((attachment, idx) => (
                    <div
                      key={attachment.id}
                      className="relative overflow-hidden rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {attachment.file.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            #{idx + 1} | {attachment.file.type || "Unknown file type"} |{" "}
                            {formatFileSize(attachment.file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-medium text-white"
                        >
                          Remove
                        </button>
                      </div>
                      {attachment.previewUrl ? (
                        <img
                          src={attachment.previewUrl}
                          alt={`Damage attachment ${idx + 1}`}
                          className="aspect-[4/3] w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                          PDF preview unavailable
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ComponentCard>

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save inspection"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
