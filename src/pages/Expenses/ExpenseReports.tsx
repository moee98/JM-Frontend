import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useExpenses } from "../../hooks/useExpenses";

const formatMoney = (value: number) => `GBP ${value.toFixed(2)}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ExpenseReportsPage() {
  const { expenses, loading } = useExpenses();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [reimbursedFilter, setReimbursedFilter] = useState<"all" | "yes" | "no">("all");

  const categories = useMemo(
    () => Array.from(new Set(expenses.map((x) => x.category))).sort(),
    [expenses]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const categoryMatch = categoryFilter === "all" || expense.category === categoryFilter;
        const reimbursedMatch =
          reimbursedFilter === "all" ||
          (reimbursedFilter === "yes" && expense.isReimbursed) ||
          (reimbursedFilter === "no" && !expense.isReimbursed);
        return categoryMatch && reimbursedMatch;
      }),
    [expenses, categoryFilter, reimbursedFilter]
  );

  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((sum, x) => sum + x.amount, 0);
    const reimbursed = filteredExpenses
      .filter((x) => x.isReimbursed)
      .reduce((sum, x) => sum + x.amount, 0);
    const outstanding = total - reimbursed;
    return { total, reimbursed, outstanding };
  }, [filteredExpenses]);

  return (
    <>
      <PageMeta title="Expenses - Reports" description="Expense reports and summary" />
      <PageBreadcrumb
        pageTitle="Expense Reports"
        items={[
          { label: "Home", to: "/" },
          { label: "Expenses" },
          { label: "Expense Reports" },
        ]}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ComponentCard title="Total">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatMoney(totals.total)}</p>
          </ComponentCard>
          <ComponentCard title="Reimbursed">
            <p className="text-2xl font-semibold text-green-700 dark:text-green-300">
              {formatMoney(totals.reimbursed)}
            </p>
          </ComponentCard>
          <ComponentCard title="Outstanding">
            <p className="text-2xl font-semibold text-red-700 dark:text-red-300">
              {formatMoney(totals.outstanding)}
            </p>
          </ComponentCard>
        </div>

        <ComponentCard title="Filters">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reimbursed
              </label>
              <select
                value={reimbursedFilter}
                onChange={(e) => setReimbursedFilter(e.target.value as "all" | "yes" | "no")}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="all">All</option>
                <option value="yes">Reimbursed</option>
                <option value="no">Not reimbursed</option>
              </select>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Expenses">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No expenses found.</p>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Payment</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Reimbursed</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {formatDate(expense.dateIncurred)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {expense.description}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200">{expense.category}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200">{expense.paymentMethod}</td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            expense.isReimbursed
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {expense.isReimbursed ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatMoney(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}

