import React, { useMemo, useState } from "react";

/**
 * READ ME:
 * - servicesTotal is in PENCE (integer), e.g. 12345 = £123.45
 * - Split parts are stored in PENCE (integer) to avoid float rounding issues
 * - UI inputs show pounds (e.g. 12.34) but are converted to pence internally
 */

type PaymentMethod = "" | "cash" | "card" | "bank-transfer" | "online" | "split";

type SplitPaymentPart = {
  method: Exclude<PaymentMethod, "" | "split">;
  amountPence: number; // integer pence
};

type PaymentPayload =
  | {
      isPaid: false;
      paymentMethod: "";
      amountPence: number;
    }
  | {
      isPaid: true;
      paymentMethod: Exclude<PaymentMethod, "" | "split">;
      amountPence: number;
    }
  | {
      isPaid: true;
      paymentMethod: "split";
      amountPence: number;
      parts: SplitPaymentPart[];
    };

const formatGBPFromPence = (pence: number) => `£${(pence / 100).toFixed(2)}`;

const poundsToPence = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.round(num * 100)) : 0;
};

const penceToPoundsInput = (pence: number) => (pence / 100).toFixed(2);

const methodLabel = (m: PaymentMethod) => {
  switch (m) {
    case "cash":
      return "Cash";
    case "card":
      return "Card";
    case "bank-transfer":
      return "Bank Transfer";
    case "online":
      return "Online";
    case "split":
      return "Split";
    default:
      return "Select method";
  }
};

const PaymentMethodsCard: React.FC<{
  servicesTotalPence: number;
  onSubmit: (payload: PaymentPayload) => Promise<void> | void;
  className?: string;
}> = ({ servicesTotalPence, onSubmit, className }) => {
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>("");

  const [parts, setParts] = useState<SplitPaymentPart[]>([
    { method: "card", amountPence: 0 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const isSplitSelected = paymentMethod === "split";

  const splitTotalPence = useMemo(
    () => parts.reduce((sum, p) => sum + p.amountPence, 0),
    [parts]
  );

  const splitDiffPence = servicesTotalPence - splitTotalPence;
  const isSplitValid = !isSplitSelected || splitDiffPence === 0;

  const canSubmit = useMemo(() => {
    if (!isPaid) return true; // allow saving "unpaid"
    if (paymentMethod === "") return false;
    if (paymentMethod === "split") return parts.length > 0 && isSplitValid;
    return true;
  }, [isPaid, paymentMethod, parts.length, isSplitValid]);

  const setPaymentMethod = (method: PaymentMethod) => {
    setSubmitError(null);
    setSubmitOk(null);

    setPaymentMethodState(method);

    if (method === "split") {
      setParts((prev) => (prev.length > 0 ? prev : [{ method: "card", amountPence: 0 }]));
      return;
    }

    // Switching to a single method:
    if (method) {
      setParts([{ method, amountPence: servicesTotalPence }]);
    }

    // Clearing selection:
    if (method === "") {
      setParts([{ method: "card", amountPence: 0 }]);
    }
  };

  const updatePaymentPart = (
    index: number,
    field: keyof SplitPaymentPart,
    value: string
  ) => {
    setSubmitError(null);
    setSubmitOk(null);

    setParts((prev) => {
      const next = [...prev];

      if (field === "amountPence") {
        next[index] = { ...next[index], amountPence: poundsToPence(value) };
      } else {
        next[index] = { ...next[index], method: value as SplitPaymentPart["method"] };
      }

      return next;
    });
  };

  const addPaymentPart = () => {
    setSubmitError(null);
    setSubmitOk(null);

    setParts((prev) => {
      const allocated = prev.reduce((s, p) => s + p.amountPence, 0);
      const remaining = Math.max(0, servicesTotalPence - allocated);

      return [...prev, { method: "card", amountPence: remaining }];
    });
  };

  const removePaymentPart = (index: number) => {
    setSubmitError(null);
    setSubmitOk(null);

    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitOk(null);

    if (isPaid && paymentMethod === "") {
      setSubmitError("Please select a payment method.");
      return;
    }

    if (isPaid && paymentMethod === "split" && !isSplitValid) {
      setSubmitError("Split amounts must add up to the total services amount.");
      return;
    }

    let payload: PaymentPayload;

    if (!isPaid) {
      payload = { isPaid: false, paymentMethod: "", amountPence: servicesTotalPence };
    } else if (paymentMethod === "split") {
      payload = {
        isPaid: true,
        paymentMethod: "split",
        amountPence: servicesTotalPence,
        parts,
      };
    } else {
      payload = {
        isPaid: true,
        paymentMethod: paymentMethod as Exclude<PaymentMethod, "" | "split">,
        amountPence: servicesTotalPence,
      };
    }

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
      setSubmitOk("Payment saved successfully.");
    } catch (e: any) {
      setSubmitError(e?.message ?? "Failed to submit payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Payment</h3>
          <p className="text-xs text-gray-500 mt-1">
            Record how this job was paid.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={isPaid}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsPaid(checked);

              // when marking as paid, default a method
              if (checked && paymentMethod === "") setPaymentMethod("card");

              // when unmarking, clear selection
              if (!checked) setPaymentMethod("");
            }}
          />
          <span>Paid</span>
        </label>
      </div>

      {isPaid && (
        <div className="mt-4 space-y-3">
          {/* Payment method */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Payment method
            </label>

            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="">{methodLabel("")}</option>
              <option value="cash">{methodLabel("cash")}</option>
              <option value="card">{methodLabel("card")}</option>
              <option value="bank-transfer">{methodLabel("bank-transfer")}</option>
              <option value="online">{methodLabel("online")}</option>
              <option value="split">{methodLabel("split")}</option>
            </select>

            <p className="text-xs text-gray-500">
              Choose a single method or select split to use multiple methods.
            </p>

            {/* Optional checkbox mirror */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={paymentMethod === "split"}
                onChange={(e) => setPaymentMethod(e.target.checked ? "split" : "")}
              />
              <span>Split payment between multiple methods</span>
            </label>
          </div>

          {/* Split UI */}
          {isSplitSelected && (
            <div className="space-y-3 rounded-md bg-gray-50 p-3">
              {parts.map((part, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={part.method}
                    onChange={(e) => updatePaymentPart(index, "method", e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={penceToPoundsInput(part.amountPence)}
                    onChange={(e) => updatePaymentPart(index, "amountPence", e.target.value)}
                    placeholder="Amount"
                  />

                  {parts.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-red-500 px-2"
                      onClick={() => removePaymentPart(index)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="text-xs font-medium underline"
                onClick={addPaymentPart}
              >
                + Add split
              </button>

              <div className="text-xs text-gray-500">
                Total services: {formatGBPFromPence(servicesTotalPence)}
              </div>

              {!isSplitValid ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  Split total is{" "}
                  <span className="font-semibold">
                    {formatGBPFromPence(splitTotalPence)}
                  </span>{" "}
                  but total services are{" "}
                  <span className="font-semibold">
                    {formatGBPFromPence(servicesTotalPence)}
                  </span>
                  .
                  <br />
                  {splitDiffPence > 0 ? (
                    <>
                      You still need to allocate{" "}
                      <span className="font-semibold">
                        {formatGBPFromPence(splitDiffPence)}
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      You’ve allocated{" "}
                      <span className="font-semibold">
                        {formatGBPFromPence(Math.abs(splitDiffPence))}
                      </span>{" "}
                      too much.
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                  Split total matches the service total.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Total + Submit */}
      <div className="mt-4 border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Total Amount</div>
          <div className="text-xl font-bold text-gray-900">
            {formatGBPFromPence(servicesTotalPence)}
          </div>
        </div>

        {submitError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {submitError}
          </div>
        )}

        {submitOk && (
          <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
            {submitOk}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Payment"}
        </button>

        <div className="text-[11px] text-gray-400">
          {isPaid ? (
            <>
              Paid via{" "}
              <span className="font-medium text-gray-600">
                {methodLabel(paymentMethod)}
              </span>
              {paymentMethod === "split" ? (
                <> • Split total {formatGBPFromPence(splitTotalPence)}</>
              ) : null}
            </>
          ) : (
            <>Marked as unpaid</>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * FULL PAGE EXAMPLE (dummy job + payment card)
 * Replace the dummy job later and wire onSubmit to your API.
 */
const ViewJobPaymentPage: React.FC = () => {
  // Dummy job data (serviceCharge is in pence)
  const job = {
    id: 492,
    title: "Vehicle Inspection",
    invoiceId: "INV-000128",
    serviceCharge: 10450, // £104.50 (PENCE)
    customer: {
      name: "Aisha Khan",
      email: "aisha.khan@email.com",
      phoneNumber: "07400 123456",
    },
    dueDate: "2025-12-25",
  };

  const handleSubmitPayment = async (payload: PaymentPayload) => {
    // Replace with: await JobService.updateJobPayment(job.id, payload)
    console.log("Submitting payment payload:", payload);

    // simulate latency
    await new Promise((r) => setTimeout(r, 400));
  };

  const formatDateOnly = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PaymentMethodsCard
        servicesTotalPence={job.serviceCharge}
        onSubmit={handleSubmitPayment}
      />
    </div>
  );
};

export default ViewJobPaymentPage;
