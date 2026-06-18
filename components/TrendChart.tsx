"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { LAYER_META } from "@/lib/constants";
import type { TrendPoint } from "@/lib/types";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#CBD5E1", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#CBD5E1", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#1E2433",
              border: "1px solid rgba(148, 163, 184, 0.24)",
              borderRadius: 8,
              color: "#F8FAFC"
            }}
          />
          <Line type="monotone" dataKey="SAFETY" stroke={LAYER_META.SAFETY.color} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="VIBE" stroke={LAYER_META.VIBE.color} strokeWidth={2} dot={false} />
          <Line
            type="monotone"
            dataKey="INFRASTRUCTURE"
            stroke={LAYER_META.INFRASTRUCTURE.color}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="OPPORTUNITY"
            stroke={LAYER_META.OPPORTUNITY.color}
            strokeWidth={2}
            dot={false}
          />
          <Line type="monotone" dataKey="overall" stroke="#F8FAFC" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
