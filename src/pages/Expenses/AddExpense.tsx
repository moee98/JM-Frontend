import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { useExpenses } from "../../hooks/useExpenses";
import { buildExpenseReceiptImageName } from "../../services/expenseService";

const EXPENSE_CATEGORIES = [
  "Fuel",
  "Vehicle Maintenance",
  "Tools & Equipment",
  "Parts & Consumables",
  "PPE / Safety Gear",
  "Parking",
  "Tolls",
  "Travel & Mileage",
  "Public Transport",
  "Accommodation",
  "Meals",
  "Mobile / Data",
  "Software Subscriptions",
  "Insurance",
  "Office Supplies",
  "Marketing & Advertising",
  "Training / Certifications",
  "Utilities",
  "Rent / Premises",
  "Other",
];

type AddExpenseForm = {
  description: string;
  amount: string;
  dateIncurred: string;
  category: string;
  receiptImagePath: string;
  isReimbursed: boolean;
  paymentMethod: string;
};

const INITIAL_FORM: AddExpenseForm = {
  description: "",
  amount: "",
  dateIncurred: new Date().toISOString().slice(0, 10),
  category: "",
  receiptImagePath: "",
  isReimbursed: false,
  paymentMethod: "",
};

export default function AddExpensePage() {
  const { addExpense } = useExpenses();
  const [form, setForm] = useState<AddExpenseForm>(INITIAL_FORM);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [receiptPreview]);

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
    if (isCustomCategory) {
      if (!customCategory.trim()) return "Custom category is required.";
    } else if (!form.category.trim()) {
      return "Category is required.";
    }
    if (!form.receiptImagePath.trim()) return "Receipt image path is required.";
    if (!form.paymentMethod.trim()) return "Payment method is required.";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : form.category.trim();

    addExpense({
      description: form.description.trim(),
      amount: Number(form.amount),
      dateIncurred: new Date(`${form.dateIncurred}T00:00:00`).toISOString(),
      category: finalCategory,
      receiptImagePath: form.receiptImagePath.trim(),
      isReimbursed: form.isReimbursed,
      paymentMethod: form.paymentMethod.trim(),
    });

    setOk("Expense added successfully.");
    setForm(INITIAL_FORM);
    setIsCustomCategory(false);
    setCustomCategory("");
    setReceiptFileName("");
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const selected = e.target.files[0];
    const generatedName = buildExpenseReceiptImageName(form.dateIncurred, selected.name);

    if (receiptPreview) URL.revokeObjectURL(receiptPreview);

    setError(null);
    setOk(null);
    setReceiptFileName(generatedName);
    setReceiptPreview(URL.createObjectURL(selected));
    setField("receiptImagePath", `uploads/expenses/${generatedName}`);
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
                value={isCustomCategory ? "__custom__" : form.category}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setIsCustomCategory(true);
                    setField("category", "");
                    return;
                  }
                  setIsCustomCategory(false);
                  setCustomCategory("");
                  setField("category", e.target.value);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="__custom__">Custom...</option>
              </select>
            </div>

            {isCustomCategory ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Category
                </label>
                <input
                  value={customCategory}
                  onChange={(e) => {
                    setError(null);
                    setOk(null);
                    setCustomCategory(e.target.value);
                  }}
                  placeholder="Enter custom category"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
            ) : null}

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
                Import Receipt Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptFileChange}
                className="focus:border-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 hover:file:bg-gray-100 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-300 dark:hover:file:bg-white/[0.08]"
              />
              {receiptFileName ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  File prepared: {receiptFileName}
                </p>
              ) : null}
              {receiptPreview ? (
                <div className="mt-3 w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img src={receiptPreview} alt="Receipt preview" className="h-44 w-full object-cover" />
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Receipt Image Path
              </label>
              <input
                value={form.receiptImagePath}
                onChange={(e) => setField("receiptImagePath", e.target.value)}
                placeholder="e.g. /uploads/receipts/receipt-001.jpg"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              />
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
