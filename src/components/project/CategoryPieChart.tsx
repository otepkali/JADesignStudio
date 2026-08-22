"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { colorForIndex, CHART_INK } from "@/lib/chartColors";
import { formatTenge } from "@/lib/format";
import type { CategoryBreakdown } from "@/lib/analytics";

export function CategoryPieChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        Нет данных для графика
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
          label={({ value }) => `${Math.round((Number(value) / total) * 100)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colorForIndex(index)} stroke="#fcfcfb" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatTenge(Number(value))}
          contentStyle={{ borderRadius: 8, borderColor: CHART_INK.grid, fontSize: 13 }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: 13, color: CHART_INK.secondary }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
