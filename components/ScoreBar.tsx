import { LAYER_META } from "@/lib/constants";
import type { ReportType } from "@/lib/types";

export function ScoreBar({
  label,
  value,
  layer
}: {
  label: string;
  value: number;
  layer?: ReportType;
}) {
  const color = layer ? LAYER_META[layer].color : "#F8FAFC";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-display text-base text-slate-50">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-slate-800">
        <div className="h-full rounded-sm" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
