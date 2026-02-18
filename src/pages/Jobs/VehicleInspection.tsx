import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useJob } from "../../hooks/useJobs";
import { Vehicle as VehicleType } from "../../types/vehicle";
import {
  VehicleInspectionService,
  buildVehicleInspectionImageName,
} from "../../services/vehicleInspectionService";

type InspectionImage = {
  id: string;
  file: File;
  previewUrl: string;
  selected: boolean;
};

const readCurrentUserId = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string") return parsed.id;
  } catch {
    // Keep fallback for existing string-only localStorage entries.
  }

  return raw;
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
  const currentUserId = readCurrentUserId();

  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [inspectionResult, setInspectionResult] =
    useState<"Passed" | "Failed">("Passed");
  const [comments, setComments] = useState("");
  const [images, setImages] = useState<InspectionImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    setImages((prev) => [
      ...prev,
      ...selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        selected: true,
      })),
    ]);

    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleToggleImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const setAllImageSelection = (selected: boolean) => {
    setImages((prev) => prev.map((img) => ({ ...img, selected })));
  };

  const statusDotClass =
    inspectionResult === "Passed" ? "bg-green-500" : "bg-red-500";

  const fileInputClass =
    "focus:border-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 hover:file:bg-gray-100 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-300 dark:hover:file:bg-white/[0.08]";

  const renamedFiles = useMemo(
    () =>
      images
        .filter((img) => img.selected)
        .map((img, idx) => {
          const name = buildVehicleInspectionImageName(parsedJobId, idx, img.file.name);
          return new File([img.file], name, {
            type: img.file.type,
            lastModified: img.file.lastModified,
          });
        }),
    [images, parsedJobId]
  );

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

    setIsSubmitting(true);
    try {
      await VehicleInspectionService.createWithImages(
        {
          jobId: parsedJobId,
          inspectionDate,
          appUserId: currentUserId,
          inspectionResult,
          comments,
          pathToImages: renamedFiles.map((file) => file.name),
        },
        renamedFiles
      );

      navigate(`/view-job/${parsedJobId}`);
    } catch {
      setError("Something went wrong while saving the inspection.");
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
              title="Damage Photos"
              desc="Uploaded files are named with the job id before saving."
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Upload photos
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className={fileInputClass}
                />
                {images.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllImageSelection(true)}
                      className="rounded-md border border-gray-300 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllImageSelection(false)}
                      className="rounded-md border border-gray-300 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Deselect all
                    </button>
                  </div>
                )}
                {renamedFiles.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Files will be saved as: {renamedFiles.map((f) => f.name).join(", ")}
                  </p>
                )}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.map((image, idx) => (
                    <div
                      key={image.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={image.previewUrl}
                        alt={`Damage photo ${idx + 1}`}
                        className={`h-full w-full object-cover ${
                          image.selected ? "" : "opacity-50"
                        }`}
                      />
                      <div className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        #{idx + 1}
                      </div>
                      <div className="absolute right-1 top-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleImage(image.id)}
                          className="rounded-md bg-white/90 dark:bg-gray-900/90 px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-200"
                        >
                          {image.selected ? "Included" : "Excluded"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image.id)}
                          className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-medium text-white"
                        >
                          Remove
                        </button>
                      </div>
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
