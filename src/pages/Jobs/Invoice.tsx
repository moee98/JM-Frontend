import React, { useMemo,useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJob } from "../../hooks/useJobs";
import { Job } from "../../types/job";
import { useReactToPrint } from "react-to-print";
import {
  AlertCircle,
} from "lucide-react";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

type Invoice = {
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string; // ISO or yyyy-mm-dd
  dueDate: string;

  companyName: string;
  companyAddress: string;
  companyEmail?: string;
  companyPhone?: string;
  companyVatNumber?: string;

  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;

  jobId?: string;
  jobTitle?: string;

  vehicleReg?: string;
  vehicleMakeModel?: string;
  mileage?: string;

  vatRate: number; // e.g. 20
  notes?: string;
  paymentDetails?: string;

  lines: Job["jobServices"];
};

const money = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    Number.isFinite(n) ? n : 0
  );

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

const statusPillClass = (status: InvoiceStatus) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/80";
    case "Sent":
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200";
    case "Paid":
      return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200";
    case "Overdue":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/80";
  }
};

const KeyValue: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-4 py-1">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm text-gray-800 dark:text-white/90 text-right">
      {value ?? <span className="text-gray-400 dark:text-white/30">—</span>}
    </span>
  </div>
);



const InvoicePageReadOnly: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
const contentRef = useRef<HTMLDivElement>(null);


const reactToPrintFn = useReactToPrint({ contentRef });
  const id = jobId ? Number(jobId) : undefined;

  const {data: job }  = useJob(id);
console.log("Invoice job:", job);
  // ✅ Dummy data (replace later with DB data)
  const invoice: Invoice = {
    invoiceNumber: job ? `INV-000${job.id}` : "",
    status: "Sent",
    issueDate: job && job.createdAt ? job.createdAt : new Date().toISOString(),
    dueDate: job && job.dueDate ? job.dueDate : "UNKNOWN",

    companyName: "Kaza Performance Ltd",
    companyAddress: "Unit 13 Byrom St\nBlackburn\nBB2 2LE",
    companyEmail: "accounts@kazaperformance.co.uk",
    companyPhone: "01254 964888",
    companyVatNumber: "GB123456789",

    customerName: job && job.customer ? `${job.customer.name}` : "",
    customerEmail: job && job.customer ? `${job.customer.email}` : "",
    customerPhone: job && job.customer ? `${job.customer.phoneNumber}` : "",
    customerAddress: job && job.customer?.address ? `${job.customer.address}` : "United Kingdom",

    jobId: job ? `${job.id}` : "",
    jobTitle:"Vehicle Inspection",
    vehicleReg: job && job.vehicle ? job.vehicle.licensePlate : "LK19 XYZ",
    vehicleMakeModel: job && job.vehicle ? `${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.year})` : "",
    mileage: "61,240",
    vatRate: 20,
    notes:
      "Vehicle inspection completed. Advisory notes provided to the customer.\nPayment due within 7 days. Thank you for your business.",


    lines: job ? job.jobServices : [],
  };

  invoice.paymentDetails =
      `Bank transfer:\nAccount name: (${invoice.companyName})\nSort code: \nAccount number: \nReference: ${invoice.invoiceNumber}`;

  const totals = useMemo(() => {
    const subtotal =  invoice.lines? invoice.lines.reduce(
      (sum, l) => sum + (Number(l.price) || 0),
      0
    ) : 0;
    const vatAmount = subtotal * ((Number(invoice.vatRate) || 0) / 100);
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  }, [invoice.lines, invoice.vatRate]);

    // ---------- NOT FOUND ----------
  if (!job) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The job you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  } 

  return (
 
    <div  className="p-4 md:p-6 font-sans print:font-sans" >
     <style>{`
  @page {
    size: A4;
    margin: 0;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print {
      display: none !important;
    }

    /* 🔥 FORCE two-column layout in print */
    .print-grid-2 {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 16px !important;
    }

    .print-card {
      box-shadow: none !important;
    }
  }
`}</style>


      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Invoice {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Issued {formatDate(invoice.issueDate)} • Due {formatDate(invoice.dueDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusPillClass(
              invoice.status
            )}`}
          >
            {invoice.status}
          </span>

          <button
            onClick={reactToPrintFn}
            className="rounded-lg px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-500"
          >
            Print
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div ref={contentRef} className="bg-white dark:bg-gray-900/40 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-4 md:p-6 print-card">
        {/* Header */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 print-grid-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {invoice.companyName}
            </h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 mt-1">
              {invoice.companyAddress}
            </pre>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1">
              {invoice.companyEmail && <div>Email: {invoice.companyEmail}</div>}
              {invoice.companyPhone && <div>Phone: {invoice.companyPhone}</div>}
              {invoice.companyVatNumber && <div>VAT: {invoice.companyVatNumber}</div>}
            </div>
          </div>

          <div className="w-full md:w-[360px] rounded-xl border border-gray-200 dark:border-white/10 p-4 ">
          <KeyValue label="Invoice #" value={invoice.invoiceNumber} />
          <KeyValue label="Status" value={invoice.status} />
          <KeyValue label="Issue date" value={formatDate(invoice.issueDate)} />
          <KeyValue label="Due date" value={formatDate(invoice.dueDate)} />
          <KeyValue label="VAT rate" value={`${invoice.vatRate}%`} />
        </div>
        </div>

        {/* Customer + Job */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 print-grid-2">
          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Bill To
            </h3>

            <div className="mt-3 space-y-1">
              <KeyValue label="Name" value={invoice.customerName} />
              <KeyValue label="Email" value={invoice.customerEmail} />
              <KeyValue label="Phone" value={invoice.customerPhone} />
              <div className="pt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-white/90 mt-1">
                  {invoice.customerAddress ?? "—"}
                </pre>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 print:col-span-2 md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Job Details
            </h3>

            <div className="mt-3 space-y-1">
              <KeyValue label="Job ID" value={invoice.jobId} />
              <KeyValue label="Job title" value={invoice.jobTitle} />
              <KeyValue label="Vehicle reg" value={invoice.vehicleReg} />
              <KeyValue label="Make / model" value={invoice.vehicleMakeModel} />
              <KeyValue label="Mileage" value={invoice.mileage} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Items
          </h3>

          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">Description</th>
                  
                  <th className="text-right font-semibold px-3 py-2 w-36">Price</th>
                  
                </tr>
              </thead>
              <tbody>
                {invoice.lines ? invoice.lines.map((l) => {
                  
                  return (
                    <tr key={l.id} className="border-t border-gray-200 dark:border-white/10">
                      <td className="px-3 py-2 text-gray-800 dark:text-white/90">
                        {l.service?.description || "—"}
                      </td>
                     
                      <td className="px-3 py-2 text-right text-gray-800 dark:text-white/90">
                        {money(l.price)}
                      </td>
                      
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes + totals */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 print-grid-2">

          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Notes
            </h3>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {invoice.notes ?? "—"}
            </p>

            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mt-4">
              Payment details
            </h3>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {invoice.paymentDetails ?? "—"}
            </pre>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Totals
            </h3>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {money(totals.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  VAT ({invoice.vatRate}%)
                </span>
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {money(totals.vatAmount)}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-2 flex items-center justify-between">
                <span className="text-gray-800 dark:text-white/90 font-semibold">Total</span>
                <span className="text-gray-800 dark:text-white/90 font-semibold">
                  {money(totals.total)}
                </span>
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Amounts shown in GBP. VAT calculated from subtotal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePageReadOnly;
