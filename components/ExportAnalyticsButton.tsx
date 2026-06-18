"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export function ExportAnalyticsButton({
  cityId,
  apiKey,
  label = "Export analytics"
}: {
  cityId: string;
  apiKey: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function exportAnalytics() {
    setState("loading");
    try {
      const response = await fetch(`/api/analytics/${cityId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Export failed");

      const json = await response.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `stratum-${cityId}-analytics.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={exportAnalytics}
        disabled={state === "loading"}
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {state === "loading" ? "Exporting" : label}
      </button>
      {state === "error" && <p className="text-xs text-red-300">Export failed. Check API key configuration.</p>}
    </div>
  );
}
