"use client";

import { ArrowLeft, Check, LocateFixed, Send, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CITY_CONFIGS, LAYER_META, REPORT_SUBTYPES, REPORT_TYPES } from "@/lib/constants";
import { cn, titleize } from "@/lib/utils";
import type { CityId, ReportRecord, ReportType } from "@/lib/types";

type ReportModalProps = {
  open: boolean;
  onClose: () => void;
  cityId: CityId | string;
  location: { lat: number; lng: number };
  onSubmitted: (report: ReportRecord) => void;
};

export function ReportModal({ open, onClose, cityId, location, onSubmitted }: ReportModalProps) {
  const [step, setStep] = useState(0);
  const [reportType, setReportType] = useState<ReportType>("SAFETY");
  const [subType, setSubType] = useState(REPORT_SUBTYPES.SAFETY[0]);
  const [severity, setSeverity] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const city = CITY_CONFIGS[cityId as CityId] ?? CITY_CONFIGS.san_francisco;
  const steps = ["Type", "Subtype", "Severity", "Location"];

  const miniMapStyle = useMemo(() => {
    const [minLng, minLat, maxLng, maxLat] = city.bbox;
    const x = ((location.lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((location.lat - minLat) / (maxLat - minLat)) * 100;
    return {
      left: `${Math.max(8, Math.min(92, x))}%`,
      top: `${Math.max(10, Math.min(90, y))}%`
    };
  }, [city.bbox, location.lat, location.lng]);

  if (!open) return null;

  async function submitReport() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          sub_type: subType,
          lat: location.lat,
          lng: location.lng,
          severity,
          city_id: cityId
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to submit report");
      onSubmitted(json.report);
      setStep(0);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit report");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        data-testid="report-modal"
        className="w-full max-w-2xl rounded-t-lg border border-slate-700 bg-panel shadow-2xl sm:rounded-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Anonymous report</p>
            <h2 id="report-modal-title" className="font-display text-xl text-slate-50">
              Add neighborhood signal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
            aria-label="Close report modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 px-5 pt-5">
          {steps.map((label, index) => (
            <div key={label} className="h-1.5 rounded-sm bg-slate-800">
              <div
                className={cn("h-full rounded-sm", index <= step ? "bg-violet" : "bg-transparent")}
                style={{ width: index < step ? "100%" : index === step ? "70%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className="min-h-[390px] px-5 py-5">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {REPORT_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  data-testid={`report-type-${type}`}
                  onClick={() => {
                    setReportType(type);
                    setSubType(REPORT_SUBTYPES[type][0]);
                    setStep(1);
                  }}
                  className="focus-ring rounded-lg border border-slate-700 bg-slate-900/70 p-5 text-left hover:border-slate-500"
                >
                  <span className="mb-4 block h-3 w-12 rounded-sm" style={{ backgroundColor: LAYER_META[type].color }} />
                  <span className="block font-display text-2xl text-slate-50">{LAYER_META[type].label}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-400">{LAYER_META[type].description}</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{LAYER_META[reportType].label}</p>
                <h3 className="font-display text-2xl text-slate-50">Select a subtype</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {REPORT_SUBTYPES[reportType].map((option) => (
                  <button
                    type="button"
                    key={option}
                    data-testid={`report-subtype-${option}`}
                    onClick={() => {
                      setSubType(option);
                      setStep(2);
                    }}
                    className={cn(
                      "focus-ring rounded-lg border p-4 text-left text-lg text-slate-50",
                      subType === option ? "border-violet bg-violet/15" : "border-slate-700 bg-slate-900/70"
                    )}
                  >
                    {titleize(option)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{titleize(subType)}</p>
                <h3 className="font-display text-2xl text-slate-50">Set severity</h3>
              </div>
              <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-950/40 p-8">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    key={value}
                    data-testid={`report-severity-${value}`}
                    onClick={() => setSeverity(value)}
                    className="focus-ring p-1 text-amber-400"
                    aria-label={`Severity ${value}`}
                  >
                    <Star
                      className="h-10 w-10"
                      fill={value <= severity ? "currentColor" : "none"}
                      strokeWidth={1.8}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-violet px-5 py-3 font-semibold text-white hover:bg-violet/90"
              >
                <Check className="h-5 w-5" />
                Confirm severity
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{city.label}</p>
                <h3 className="font-display text-2xl text-slate-50">Confirm report location</h3>
              </div>
              <div className="city-grid relative h-56 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.28),transparent_58%)]" />
                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={miniMapStyle}>
                  <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet/50">
                    <span className="absolute inset-0 rounded-full border border-violet" style={{ animation: "pulse-dot 1.6s infinite" }} />
                  </span>
                  <LocateFixed className="relative h-7 w-7 text-violet-200" />
                </div>
              </div>
              <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                  Lat <span className="font-display text-slate-50">{location.lat.toFixed(5)}</span>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                  Lng <span className="font-display text-slate-50">{location.lng.toFixed(5)}</span>
                </div>
              </div>
              {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
              <button
                type="button"
                onClick={submitReport}
                data-testid="report-submit"
                disabled={isSubmitting}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-violet px-5 py-3 font-semibold text-white hover:bg-violet/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-5 w-5" />
                {isSubmitting ? "Submitting" : "Submit report"}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-700 px-5 py-4">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-sm text-slate-500">Step {step + 1} of 4</p>
        </div>
      </div>
    </div>
  );
}
