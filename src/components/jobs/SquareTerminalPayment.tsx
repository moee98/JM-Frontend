import { useState, useEffect } from "react";
import { CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  useSquareStatus,
  useSquareDevices,
  useCreateTerminalCheckout,
  useTerminalCheckoutStatus,
} from "../../hooks/useSquare";

interface Props {
  jobId: number;
  totalAmountPence: number;
  onPaymentComplete: (squarePaymentId: string) => Promise<void> | void;
}

type FlowState = "idle" | "selecting" | "waiting" | "complete" | "failed";

export default function SquareTerminalPayment({ jobId, totalAmountPence, onPaymentComplete }: Props) {
  const { data: status } = useSquareStatus();
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: devicesResult, isLoading: devicesLoading } = useSquareDevices(
    status?.connected === true && flowState === "selecting"
  );
  const createCheckout = useCreateTerminalCheckout();
  const { data: terminalStatus } = useTerminalCheckoutStatus(checkoutId, flowState === "waiting");

  useEffect(() => {
    if (flowState !== "waiting" || !terminalStatus) return;
    if (terminalStatus.status === "COMPLETED" && terminalStatus.squarePaymentId) {
      setFlowState("complete");
      void onPaymentComplete(terminalStatus.squarePaymentId);
    } else if (
      terminalStatus.status === "CANCELED" ||
      terminalStatus.status === "CANCEL_REQUESTED"
    ) {
      setFlowState("failed");
      setErrorMessage("Payment was cancelled on the device.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalStatus?.status]);

  if (status?.connected !== true) return null;

  const formatGBP = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const reset = () => {
    setFlowState("idle");
    setCheckoutId(null);
    setSelectedDeviceId("");
    setErrorMessage("");
  };

  if (flowState === "idle") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Pay with Square</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Send a payment request to a Square device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFlowState("selecting")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <CreditCard className="h-4 w-4" />
          Charge {formatGBP(totalAmountPence)}
        </button>
      </div>
    );
  }

  if (flowState === "selecting") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Select Device</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Charging {formatGBP(totalAmountPence)} — choose where to send the request.
          </p>
        </div>

        {devicesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading devices…
          </div>
        ) : (
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            <option value="">Select a device…</option>
            {devicesResult?.devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.id}{d.status ? ` (${d.status})` : ""}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedDeviceId || createCheckout.isPending}
            onClick={async () => {
              try {
                const result = await createCheckout.mutateAsync({
                  amountMoney: totalAmountPence,
                  deviceId: selectedDeviceId,
                  jobId,
                });
                setCheckoutId(result.checkoutId);
                setFlowState("waiting");
              } catch (e: unknown) {
                setErrorMessage(e instanceof Error ? e.message : "Failed to send to device.");
                setFlowState("failed");
              }
            }}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createCheckout.isPending ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Sending…
              </span>
            ) : "Send to Device"}
          </button>
        </div>
      </div>
    );
  }

  if (flowState === "waiting") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Waiting for payment…</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatGBP(totalAmountPence)} — customer should tap or insert card on the device.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel / Go Back
        </button>
      </div>
    );
  }

  if (flowState === "complete") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Payment complete</h3>
            <p className="text-xs text-green-700 dark:text-green-400">
              {formatGBP(totalAmountPence)} received via Square.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20 space-y-2">
      <div className="flex items-center gap-3">
        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Payment failed</h3>
          <p className="text-xs text-red-700 dark:text-red-400">{errorMessage}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={reset}
        className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:text-red-300"
      >
        Try Again
      </button>
    </div>
  );
}
