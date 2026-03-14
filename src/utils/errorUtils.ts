/**
 * Extracts a human-readable error message from an unknown error value.
 * Checks for Axios-style response.data strings before falling back to Error.message.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: unknown } }).response?.data === "string"
  ) {
    return (
      (error as { response?: { data?: string } }).response?.data ?? fallback
    );
  }
  return error instanceof Error ? error.message : fallback;
};

/**
 * Formats a file size in bytes to a human-readable string.
 */
export const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
