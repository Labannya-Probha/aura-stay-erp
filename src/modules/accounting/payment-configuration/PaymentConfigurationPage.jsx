import React from "react";

export default function PaymentConfigurationPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Payment Configuration
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Configure payment terminals, settlement accounts and payment
              gateway mappings.
            </p>
          </div>

          <button className="rounded-xl bg-slate-900 px-4 py-2 text-white">
            + New Terminal
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Card Terminals
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          No payment terminal configured yet.
        </p>
      </div>
    </div>
  );
}