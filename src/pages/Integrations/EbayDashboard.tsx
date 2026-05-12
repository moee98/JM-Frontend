import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import { connectEbay } from "../../services/integrationService";
import {
  useEbayStatus,
  useEbaySummary,
  useEbayOrders,
  useEbayListings,
  useDisconnectEbay,
} from "../../hooks/useEbay";
import type { EbayOrder, EbayListing } from "../../types/integrations";

type Tab = "orders" | "listings" | "pending";

function formatGBP(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso));
}

function fulfillmentBadge(complete: boolean) {
  return complete ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Fulfilled
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      Pending
    </span>
  );
}

function OrdersTable({ orders }: { orders: EbayOrder[] }) {
  if (orders.length === 0)
    return <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No orders found.</p>;
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-100 dark:border-gray-800">
          {["Order ID", "Buyer", "Items", "Total", "Date", "Status"].map((h) => (
            <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.orderId} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
            <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate" title={order.orderId}>{order.orderId}</td>
            <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{order.buyerUsername ?? "—"}</td>
            <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
              {order.lineItems.map((li) => li.title).join(", ") || "—"}
            </td>
            <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{formatGBP(order.total, order.currency)}</td>
            <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(order.createdAt)}</td>
            <td className="px-5 py-3">{fulfillmentBadge(order.shipmentComplete)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ListingsTable({ listings }: { listings: EbayListing[] }) {
  if (listings.length === 0)
    return <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No active listings found.</p>;
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-100 dark:border-gray-800">
          {["Listing ID", "Title", "Price", "Qty", "Status"].map((h) => (
            <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {listings.map((listing) => (
          <tr key={listing.listingId} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
            <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate" title={listing.listingId}>{listing.listingId}</td>
            <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{listing.title || "—"}</td>
            <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{formatGBP(listing.price, listing.currency)}</td>
            <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{listing.quantity}</td>
            <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{listing.status || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function EbayDashboard() {
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  const { data: status, isLoading: statusLoading } = useEbayStatus();
  const { data: summary } = useEbaySummary();
  const { data: ordersResult } = useEbayOrders();
  const { data: listingsResult } = useEbayListings();
  const { mutate: disconnect, isPending: disconnecting } = useDisconnectEbay();

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setToast({ message: "eBay store connected successfully.", type: "success" });
      setTimeout(() => setToast(null), 4000);
    } else if (searchParams.get("error")) {
      setToast({ message: `Connection failed: ${searchParams.get("error")}`, type: "error" });
      setTimeout(() => setToast(null), 5000);
    }
  }, [searchParams]);

  const connected = status?.connected === true;
  const orders = ordersResult?.orders ?? [];
  const listings = listingsResult?.listings ?? [];
  const pendingOrders = orders.filter((o) => !o.shipmentComplete);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "orders", label: "Recent Orders", count: orders.length },
    { id: "listings", label: "Active Listings", count: listings.length },
    { id: "pending", label: "Pending Shipments", count: pendingOrders.length },
  ];

  return (
    <>
      <PageMeta title="eBay Store" description="View your eBay store data" />

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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">eBay Store</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Listings, orders, and revenue from your eBay store.</p>
        </div>
        {connected && (
          <button
            onClick={() => disconnect()}
            disabled={disconnecting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect eBay"}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21H5.25A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3H12M13.5 21l7.5-7.5M21 13.5V3h-10.5M21 13.5h-7.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connect your eBay store</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Link your eBay seller account to view active listings, recent orders, revenue summaries, and pending shipments in one place.
            </p>
          </div>
          <button
            onClick={connectEbay}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-600 transition-colors"
          >
            Connect eBay
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            You will be redirected to eBay to authorise access. Read-only permissions only.
          </p>
        </div>
      ) : (
        /* ── Connected ── */
        <div className="flex flex-col gap-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <span className="text-sm text-gray-500 dark:text-gray-400">Active Listings</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.activeListings ?? 0}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <span className="text-sm text-gray-500 dark:text-gray-400">Orders This Month</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.ordersThisMonth ?? 0}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <span className="text-sm text-gray-500 dark:text-gray-400">Revenue This Month</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatGBP(summary?.revenueThisMonth ?? 0)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <span className="text-sm text-gray-500 dark:text-gray-400">Pending Shipments</span>
              <span className={`text-2xl font-bold ${(summary?.pendingShipments ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>
                {summary?.pendingShipments ?? 0}
              </span>
            </div>
          </div>

          {/* Tabs + table */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex gap-1 border-b border-gray-100 px-4 pt-3 dark:border-gray-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      activeTab === tab.id
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              {activeTab === "orders" && <OrdersTable orders={orders} />}
              {activeTab === "listings" && <ListingsTable listings={listings} />}
              {activeTab === "pending" && <OrdersTable orders={pendingOrders} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
