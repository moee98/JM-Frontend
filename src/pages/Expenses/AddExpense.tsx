import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { useExpenses } from "../../hooks/useExpenses";
import { ExpenseService } from "../../services/expenseService";
import type { ExpenseItemCategory } from "../../types/expenseItemCategory";

type AddExpenseForm = {
  description: string;
  amount: string;
  dateIncurred: string;
  expenseCategoryId: string;
  isReimbursed: boolean;
  paymentMethod: string;
};

type ExpenseAttachmentDraft = {
  id: string;
  file: File;
  previewUrl: string | null;
};

const INITIAL_FORM: AddExpenseForm = {
  description: "",
  amount: "",
  dateIncurred: new Date().toISOString().slice(0, 10),
  expenseCategoryId: "",
  isReimbursed: false,
  paymentMethod: "",
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

export default function AddExpensePage() {
  const { addExpense } = useExpenses();
  const [form, setForm] = useState<AddExpenseForm>(INITIAL_FORM);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseItemCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [attachments, setAttachments] = useState<ExpenseAttachmentDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const attachmentsRef = useRef<ExpenseAttachmentDraft[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const categories = await ExpenseService.getAllCategories();
        setExpenseCategories(categories);
      } catch {
        setError("Failed to load expense categories.");
      } finally {
        setLoadingCategories(false);
      }
    };

    void loadCategories();
  }, []);

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

  const setField = <K extends keyof AddExpenseForm>(key: K, value: AddExpenseForm[K]) => {
    setError(null);
    setOk(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.description.trim()) return "Description is required.";
    if (!form.amount.trim()) return "Amount is required.";
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return "Amount must be greater than 0.";
    if (!form.dateIncurred) return "Date incurred is required.";
    if (!form.expenseCategoryId.trim()) return "Category is required.";
    if (!form.paymentMethod.trim()) return "Payment method is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const expenseCategoryId = Number(form.expenseCategoryId);
    if (!Number.isFinite(expenseCategoryId) || expenseCategoryId <= 0) {
      setError("Select a valid expense category.");
      return;
    }

    try {
      await addExpense(
        {
          description: form.description.trim(),
          amount: Number(form.amount),
          dateIncurred: new Date(`${form.dateIncurred}T00:00:00`).toISOString(),
          expenseCategoryId,
          isReimbursed: form.isReimbursed,
          paymentMethod: form.paymentMethod.trim(),
        },
        attachments.map((attachment) => attachment.file)
      );

      setOk("Expense added successfully.");
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
      setForm(INITIAL_FORM);
      setAttachments([]);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add expense."));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setOk(null);
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

  return (
    <>
      <PageMeta title="Expenses - Add Expense" description="Add an expense item" />
      <PageBreadcrumb
        pageTitle="Add Expense"
        items={[
          { label: "Home", to: "/" },
          { label: "Expenses" },
          { label: "Add Expense" },
        ]}
      />

      <div className="max-w-4xl space-y-6">
        {error ? <Alert variant="error" title="Validation error" message={error} showLink={false} /> : null}
        {ok ? <Alert variant="success" title="Saved" message={ok} showLink={false} /> : null}

        <ComponentCard title="Expense Details">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <input
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Incurred
              </label>
              <input
                type="date"
                value={form.dateIncurred}
                onChange={(e) => setField("dateIncurred", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={form.expenseCategoryId}
                onChange={(e) => setField("expenseCategoryId", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">{loadingCategories ? "Loading categories..." : "Select category"}</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Method
              </label>
              <input
                value={form.paymentMethod}
                onChange={(e) => setField("paymentMethod", e.target.value)}
                placeholder="e.g. Cash, Credit Card"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Receipt Attachments
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,image/*,application/pdf"
                multiple
                onChange={handleAttachmentChange}
                className="focus:border-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 hover:file:bg-gray-100 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-300 dark:hover:file:bg-white/[0.08]"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Images and PDFs are supported. Attachments upload after the expense record is created.
              </p>
              {attachments.length > 0 ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {attachments.length} attachment{attachments.length === 1 ? "" : "s"} ready to upload.
                </p>
              ) : null}
              {attachments.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 px-3 py-3 dark:border-gray-700"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {attachment.file.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {attachment.file.type || "Unknown file type"} | {formatFileSize(attachment.file.size)}
                        </p>
                        {attachment.previewUrl ? (
                          <img
                            src={attachment.previewUrl}
                            alt={attachment.file.name}
                            className="mt-3 h-28 w-full rounded-md object-cover"
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isReimbursed}
                  onChange={(e) => setField("isReimbursed", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                />
                Reimbursed
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button variant="primary" className="w-full md:w-auto">
                Add Expense
              </Button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
