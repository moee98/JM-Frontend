import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { VehicleInspection } from "../../types/vehicleInspection";
import { Vehicle } from "../../types/vehicle";
import { useJob } from "../../hooks/useJobs";
import { Job } from "../../types/job";
import { Vehicle as VehicleType } from "../../types/vehicle";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

export type NewVehicleInspectionPayload = {
  inspection: Omit<VehicleInspection, "id" | "vehicle" | "pathToImages">;
  files: File[];
};


function onSave(
  payload: NewVehicleInspectionPayload
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Saved inspection:", payload);
      resolve();
    }, 1000);
  });
}

export default  function  VehicleInspectionFormPage() {
  const { jobId } = useParams();
  const {
    data: job,
    isLoading,
    isError,
    error: jobError,
  } = useJob(jobId ? Number(jobId) : undefined);
  
  const vehicle: VehicleType | undefined = job?.vehicle;
  const navigate = useNavigate();
  const onCancel = () => navigate(-1);


  // Mock current user ID
  
   const currentUserId = localStorage.getItem("user") || "";
  const parsedJobId = Number(jobId);

  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [inspectionResult, setInspectionResult] =
    useState<"Passed" | "Failed">("Passed");
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setPreviewUrls(selectedFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inspectionDate) {
      setError("Inspection date is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        inspection: {
          jobId: parsedJobId,
          inspectionDate,
          appUserId: currentUserId,
          inspectionResult,
          comments,
        },
        files,
      });

      // navigate back to job or inspections list
      navigate(`/view-job/${parsedJobId}`);
    } catch {
      setError("Something went wrong while saving the inspection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
        <PageMeta
          title="Kaza Dashboard - Vehicle Inspection"
          description="Vehicle inspection form for job"
        />
          <PageBreadcrumb pageTitle="Vehicle Inspection" items={[
    { label: "Home", to: "/" },
    { label: "View All Jobs", to: "/jobs" },
    { label: "Job", to: "/jobs/"+parsedJobId },
    { label: "Vehicle Inspection" }, // current page (no `to`)
  ]}/>
  <div className="max-w-4xl mx-auto p-6 space-y-6">
    {/* Header */}
   
      <div>
     
        <p className="text-sm text-gray-500">
          Pre-job cosmetic inspection to record any existing damage.
        </p>
      </div>

      <div className="text-right text-sm text-gray-500">
        <div>
          Job ID: <span className="font-medium">{jobId}</span>
        </div>
      </div>
    

    {/* Vehicle Summary */}
    {vehicle && (
      <section className="bg-white shadow rounded-2xl p-4 md:p-5 space-y-2 border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Vehicle details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Registration</div>
            <div className="font-medium">{vehicle.licensePlate}</div>
          </div>

          <div>
            <div className="text-gray-500">Make / Model</div>
            <div className="font-medium">
              {vehicle.make} {vehicle.model}
            </div>
          </div>

          {vehicle.year && (
            <div>
              <div className="text-gray-500">Year</div>
              <div className="font-medium">{vehicle.year}</div>
            </div>
          )}

          {vehicle.colour && (
            <div>
              <div className="text-gray-500">Colour</div>
              <div className="font-medium">{vehicle.colour}</div>
            </div>
          )}
        </div>
      </section>
    )}

    {/* Form */}
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-2xl p-4 md:p-6 space-y-6 border border-gray-100"
    >
      {/* Top row: date & result */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Inspection date
          </label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Inspection result
          </label>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            value={inspectionResult}
            onChange={(e) =>
              setInspectionResult(e.target.value as "Passed" | "Failed")
            }
          >
            <option value="Passed">
              Passed – no concerning damage
            </option>
            <option value="Failed">
              Failed – significant pre-existing damage
            </option>
          </select>

          <p className="text-xs text-gray-500">
            Use &quot;Failed&quot; if damage is serious enough to reconsider the
            job.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Quick status
          </label>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`inline-flex h-2 w-2 rounded-full ${
                inspectionResult === "Passed"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            {inspectionResult === "Passed"
              ? "Vehicle condition acceptable for job."
              : "Review damage before proceeding."}
          </div>
        </div>
      </div>

      {/* Damage comments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-gray-700">
            Cosmetic damage notes
          </label>
          <span className="text-xs text-gray-400">
            e.g. &quot;Small scratch N/S front wing, curb rash offside rear
            alloy&quot;
          </span>
        </div>

        <textarea
          className="border rounded-lg px-3 py-2 text-sm w-full min-h-[120px] resize-vertical focus:outline-none focus:ring-2 focus:ring-black/5"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Describe any scratches, dents, scuffs, cracked lights, alloy wheel damage, etc. Include location and severity."
        />
      </div>

      {/* Photos upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Photos of existing damage
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Take clear photos of all sides of the vehicle and any noticeable
          damage (panels, bumpers, wheels, interior if relevant).
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black/90"
        />

        {previewUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {previewUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative border rounded-lg overflow-hidden aspect-[4/3]"
              >
                <img
                  src={url}
                  alt={`Damage photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded-full">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-black/90 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save inspection"}
        </button>
      </div>
    </form>
   
  </div>
    </>
  
);
};

