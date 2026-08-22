"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEQUENTIAL_BLUE, CHART_INK } from "@/lib/chartColors";
import { formatTenge } from "@/lib/format";
import type { WeeklyBreakdown } from "@/lib/analytics";

export function WeeklyBarChart({ data }: { data: WeeklyBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        Нет данных для графика
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
        <XAxis
          dataKey="weekLabel"
          tick={{ fontSize: 12, fill: CHART_INK.muted }}
          axisLine={{ stroke: CHART_INK.grid }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_INK.muted }}
          axisLine={false}
          tickLine={false}
          width={70}
          tickFormatter={(v) => formatTenge(Number(v))}
        />
        <Tooltip
          formatter={(value) => formatTenge(Number(value))}
          labelFormatter={(label) => `Неделя с ${label}`}
          contentStyle={{ borderRadius: 8, borderColor: CHART_INK.grid, fontSize: 13 }}
        />
        <Bar dataKey="total" fill={SEQUENTIAL_BLUE} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
