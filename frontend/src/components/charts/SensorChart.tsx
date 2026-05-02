'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { MetricPoint } from '@/types';

interface SensorChartProps {
  data: MetricPoint[];
  field: string;
  unit?: string;
  color?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function SensorChart({ data, field, unit = '', color = COLORS[0] }: SensorChartProps) {
  // Group by device_id for multi-series charts
  const seriesMap = new Map<string, { time: string; value: number }[]>();

  for (const point of data) {
    const key = point.device_id ?? 'value';
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key)!.push({
      time: new Date(point._time).toLocaleTimeString(),
      value: point._value,
    });
  }

  const deviceIds = [...seriesMap.keys()];
  const isSingle  = deviceIds.length <= 1;

  // Build unified time-indexed dataset
  const allTimes = [...new Set(data.map((p) => new Date(p._time).toLocaleTimeString()))].sort();
  const chartData = allTimes.map((time) => {
    const row: Record<string, string | number> = { time };
    for (const id of deviceIds) {
      const point = seriesMap.get(id)?.find((p) => p.time === time);
      if (point) row[id] = point.value;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}${unit}`}
          width={55}
        />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(v: number) => [`${v.toFixed(2)}${unit}`, field]}
        />
        {!isSingle && <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />}

        {deviceIds.map((id, i) => (
          <Line
            key={id}
            type="monotone"
            dataKey={id}
            stroke={COLORS[i % COLORS.length]}
            dot={false}
            strokeWidth={2}
            connectNulls
            name={isSingle ? field : id}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
