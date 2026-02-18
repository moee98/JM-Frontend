import React, { useEffect, useMemo, useState } from "react";

import { PaymentMethodType, PaymentMethod } from "../../types/payment";

type SplitPaymentPart = {
  method: Exclude<PaymentMethodType, "" | "split">;
  amountPence: number;
};

export type PaymentPayload =
  | {
      isPaid: false;
      paymentMethods: [];
    }
  | {
      isPaid: true;
      paymentMethods: PaymentMethod[];
    };

interface PaymentMethodsCardProps {
  jobId: number;
  servicesTotalPence: number;
  onSubmit: (payload: PaymentPayload) => Promise<void> | void;
  initialIsPaid?: boolean;
  initialPaymentMethod?: PaymentMethodType;
  initialPaymentMethods?: PaymentMethod[];
  className?: string;
}

const formatGBPFromPence = (pence: number) => `£${(pence / 100).toFixed(2)}`;

const poundsToPence = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.round(num * 100)) : 0;
};

const penceToPoundsInput = (pence: number) => (pence / 100).toFixed(2);

const methodLabel = (m: PaymentMethodType) => {
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

const PaymentMethodsCard: React.FC<PaymentMethodsCardProps> = ({
  jobId,
  servicesTotalPence,
  onSubmit,
  initialIsPaid = false,
  initialPaymentMethod = "",
  initialPaymentMethods = [],
  className,
}) => {
  const [isPaid, setIsPaid] = useState<boolean>(initialIsPaid);
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethodType>(
    initialIsPaid ? initialPaymentMethod : ""
  );
  const [parts, setParts] = useState<SplitPaymentPart[]>([
    { method: "card", amountPence: servicesTotalPence },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  useEffect(() => {
    setIsPaid(initialIsPaid);
    setPaymentMethodState(initialIsPaid ? initialPaymentMethod : "");
  }, [initialIsPaid, initialPaymentMethod]);

  useEffect(() => {
    if (initialPaymentMethods.length > 1) {
      setPaymentMethodState("split");
      setParts(
        initialPaymentMethods.map((p) => ({
          method: p.MethodName,
          amountPence: p.amount,
        }))
      );
      return;
    }

    if (initialPaymentMethods.length === 1) {
      setPaymentMethodState(initialPaymentMethods[0].MethodName);
      setParts([
        {
          method: initialPaymentMethods[0].MethodName,
          amountPence: initialPaymentMethods[0].amount,
        },
      ]);
    }
  }, [initialPaymentMethods]);

  const isSplitSelected = paymentMethod === "split";

  const splitTotalPence = useMemo(
    () => parts.reduce((sum, p) => sum + p.amountPence, 0),
    [parts]
  );

  const splitDiffPence = servicesTotalPence - splitTotalPence;
  const isSplitValid = !isSplitSelected || splitDiffPence === 0;

  const canSubmit = useMemo(() => {
    if (!isPaid) return false;
    if (paymentMethod === "") return false;
    if (paymentMethod === "split") return parts.length > 0 && isSplitValid;
    return true;
  }, [isPaid, paymentMethod, parts.length, isSplitValid]);

  const setPaymentMethod = (method: PaymentMethodType) => {
    setSubmitError(null);
    setSubmitOk(null);
    setPaymentMethodState(method);

    if (method === "split") {
      setParts((prev) => (prev.length > 0 ? prev : [{ method: "card", amountPence: 0 }]));
      return;
    }

    if (method) {
      setParts([{ method, amountPence: servicesTotalPence }]);
    } else {
      setParts([{ method: "card", amountPence: servicesTotalPence }]);
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

    if (!isPaid) return;
    if (paymentMethod === "") {
      setSubmitError("Please select a payment method.");
      return;
    }
    if (paymentMethod === "split" && !isSplitValid) {
      setSubmitError("Split amounts must add up to the total services amount.");
      return;
    }

    const now = new Date().toISOString();
    const paymentMethods: PaymentMethod[] =
      paymentMethod === "split"
        ? parts.map((part) => ({
            isPaid: true,
            MethodName: part.method,
            amount: part.amountPence,
            jobId,
            createdAt: now,
            updatedAt: now,
          }))
        : [
            {
              isPaid: true,
              MethodName: paymentMethod as Exclude<PaymentMethodType, "" | "split">,
              amount: servicesTotalPence,
              jobId,
              createdAt: now,
              updatedAt: now,
            },
          ];

    const payload: PaymentPayload = {
      isPaid: true,
      paymentMethods,
    };

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
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Payment</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Record how this job was paid.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            checked={isPaid}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsPaid(checked);
              if (checked && paymentMethod === "") setPaymentMethod("card");
              if (!checked) setPaymentMethod("");
            }}
          />
          <span>Paid</span>
        </label>
      </div>

      {isPaid && (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Payment method
            </label>

            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
            >
              <option value="">{methodLabel("")}</option>
              <option value="cash">{methodLabel("cash")}</option>
              <option value="card">{methodLabel("card")}</option>
              <option value="bank-transfer">{methodLabel("bank-transfer")}</option>
              <option value="online">{methodLabel("online")}</option>
              <option value="split">{methodLabel("split")}</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                checked={paymentMethod === "split"}
                onChange={(e) => setPaymentMethod(e.target.checked ? "split" : "")}
              />
              <span>Split payment between multiple methods</span>
            </label>
          </div>

          {isSplitSelected && (
            <div className="space-y-3 rounded-md bg-gray-50 p-3 dark:bg-gray-900">
              {parts.map((part, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
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
                    className="w-28 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                    value={penceToPoundsInput(part.amountPence)}
                    onChange={(e) => updatePaymentPart(index, "amountPence", e.target.value)}
                    placeholder="Amount"
                  />

                  {parts.length > 1 && (
                    <button
                      type="button"
                      className="px-2 text-xs text-red-600 dark:text-red-400"
                      onClick={() => removePaymentPart(index)}
                      title="Remove"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="text-xs font-medium underline text-gray-700 dark:text-gray-300"
                onClick={addPaymentPart}
              >
                + Add split
              </button>

              {!isSplitValid ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  Split total is <span className="font-semibold">{formatGBPFromPence(splitTotalPence)}</span> but
                  total services are{" "}
                  <span className="font-semibold">{formatGBPFromPence(servicesTotalPence)}</span>.
                </div>
              ) : (
                <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                  Split total matches the service total.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {formatGBPFromPence(servicesTotalPence)}
          </div>
        </div>

        {submitError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {submitError}
          </div>
        )}

        {submitOk && (
          <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
            {submitOk}
          </div>
        )}

        {isPaid ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Payment"}
          </button>
        ) : null}

        <div className="text-[11px] text-gray-400">
          {isPaid ? (
            <>
              Paid via{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {methodLabel(paymentMethod)}
              </span>
              {paymentMethod === "split" ? <> - Split total {formatGBPFromPence(splitTotalPence)}</> : null}
            </>
          ) : (
            <>Marked as unpaid</>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsCard;
