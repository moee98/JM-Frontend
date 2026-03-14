import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { UserService } from "../services/userService";
import type { User } from "../types/user";

const readCurrentUserId = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed.id === "string") return parsed.id;
  } catch {
    // Fallback for existing non-JSON localStorage entries.
  }

  return raw;
};

export default function UserProfiles() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = readCurrentUserId();

    if (!userId) {
      setError("No logged in user found.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadUser = async () => {
      try {
        setIsLoading(true);
        const response = await UserService.getById(userId);
        if (isMounted) {
          setUser(response.data ?? null);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load your profile.");
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <PageMeta title="Kaza Dashboard - Profile" description="User profile" />
      <PageBreadcrumb pageTitle="Profile" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading profile...
          </p>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && user && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                User ID
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {user.id}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Name
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {user.name || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {user.email || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Role
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {user.role || "-"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
