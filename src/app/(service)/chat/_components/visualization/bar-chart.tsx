'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { BarChartVisualizationData } from '@/types/chart';

interface BarChartProps {
  data: BarChartVisualizationData;
  height?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return value.toLocaleString('ko-KR');
  }
  return value.toFixed(2);
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { name: string; fill: string } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const name = item.payload?.name ?? '';
  const value = item.value ?? 0;
  const color = item.payload?.fill ?? DEFAULT_COLORS[0];

  return (
    <div className="bg-neutral-800 text-white text-xs rounded px-2 py-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: color }}
        />
        <span className="text-neutral-300">{name}</span>
      </div>
      <div className="font-medium">{formatValue(value)}</div>
    </div>
  );
}

export function BarChart({ data, height = 250 }: BarChartProps) {
  const { labels, datasets } = data.data;
  const dataset = datasets[0];

  if (!labels || labels.length === 0 || !dataset) {
    return (
      <div className="flex items-center justify-center h-[200px] text-neutral-500 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  // Determine colors
  const bgColor = dataset.backgroundColor;
  const colors: string[] = Array.isArray(bgColor)
    ? bgColor
    : labels.map((_, i) => bgColor || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);

  // Transform to recharts data format
  const chartData = labels.map((label, i) => ({
    name: label,
    value: dataset.data[i] ?? 0,
    fill: colors[i % colors.length],
  }));

  // Truncate long labels for x-axis
  const maxLabelLength = labels.length > 10 ? 4 : 6;
  const tickFormatter = (value: string) =>
    value.length > maxLabelLength ? value.slice(0, maxLabelLength) + '..' : value;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={tickFormatter}
            interval={0}
            angle={labels.length > 8 ? -45 : 0}
            textAnchor={labels.length > 8 ? 'end' : 'middle'}
            height={labels.length > 8 ? 60 : 30}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={formatValue}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
