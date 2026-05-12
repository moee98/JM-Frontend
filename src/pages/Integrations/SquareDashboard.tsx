import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import { connectSquare } from "../../services/integrationService";
import {
  useSquareStatus,
  useSquareSummary,
  useSquareTransactions,
  useDisconnectSquare,
} from "../../hooks/useSquare";

function formatGBP(pounds: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pounds);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export default function SquareDashboard() {
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: status, isLoading: statusLoading } = useSquareStatus();
  const { data: summary } = useSquareSummary();
  const { data: txnResult } = useSquareTransactions();
  const { mutate: disconnect, isPending: disconnecting } = useDisconnectSquare();

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setToast({ message: "Square account connected successfully.", type: "success" });
      setTimeout(() => setToast(null), 4000);
    } else if (searchParams.get("error")) {
      setToast({ message: `Connection failed: ${searchParams.get("error")}`, type: "error" });
      setTimeout(() => setToast(null), 5000);
    }
  }, [searchParams]);

  const connected = status?.connected === true;

  return (
    <>
      <PageMeta title="Square Payments" description="View your Square transactions and revenue" />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg ${
          toast.type === "success"
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        }`}>
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Square Payments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Recent transactions and revenue from your Square account.</p>
        </div>
        {connected && (
          <button
            onClick={() => disconnect()}
            disabled={disconnecting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect Square"}
          </button>
        )}
      </div>

      {statusLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
          Checking connection…
        </div>
      ) : !connected ? (
        /* ── Not connected ── */
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connect your Square account</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Link your Square account to view recent transactions, revenue summaries, and payment history directly in your dashboard.
            </p>
          </div>
          <button
            onClick={connectSquare}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-600 transition-colors"
          >
            Connect Square
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            You will be redirected to Square to authorise access. No payment data is stored on this server.
          </p>
        </div>
      ) : (
        /* ── Connected ── */
        <div className="flex flex-col gap-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Today", data: summary?.today },
              { label: "This Week", data: summary?.thisWeek },
              { label: "This Month", data: summary?.thisMonth },
            ].map(({ label, data }) => (
              <div key={label} className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatGBP(data?.amount ?? 0)}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {data?.count ?? 0} transaction{(data?.count ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>

          {/* Transactions table */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              {!txnResult || txnResult.transactions.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No transactions found.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["Date", "Reference", "Amount", "Card", "Status"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txnResult.transactions.map((txn) => {
                      const statusColour =
                        txn.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : txn.status === "FAILED"  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        :                            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
                      return (
                        <tr key={txn.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                          <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(txn.createdAt)}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[140px] truncate" title={txn.id}>{txn.id}</td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{formatGBP(txn.amountMoney / 100)}</td>
                          <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {txn.cardBrand ? `${txn.cardBrand} ···· ${txn.last4 ?? ""}` : "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColour}`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
