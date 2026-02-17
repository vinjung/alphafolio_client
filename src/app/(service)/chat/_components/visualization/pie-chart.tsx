'use client';

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, PieLabelRenderProps } from 'recharts';
import type { PieChartVisualizationData } from '@/types/chart';

interface PieChartProps {
  data: PieChartVisualizationData;
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
  '#f97316',
  '#6366f1',
];

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartDataItem;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const total = item.payload.value;

  return (
    <div className="bg-neutral-800 text-white text-xs rounded px-2 py-1">
      <div className="flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span>{item.name}</span>
      </div>
      <div className="font-medium mt-0.5">
        {total.toLocaleString('ko-KR')}
      </div>
    </div>
  );
}

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

  // Type guards for optional props
  if (typeof cx !== 'number' || typeof cy !== 'number' ||
      typeof midAngle !== 'number' || typeof innerRadius !== 'number' ||
      typeof outerRadius !== 'number' || typeof percent !== 'number') {
    return null;
  }

  if (percent < 0.05) return null; // Hide labels for small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PieChart({ data, height = 250 }: PieChartProps) {
  const { labels, datasets } = data.data;
  const dataset = datasets[0];
  const showPercentage = data.options?.showPercentage !== false;

  if (!labels || labels.length === 0 || !dataset || !dataset.data || dataset.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-neutral-500 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  const colors = dataset.backgroundColor || DEFAULT_COLORS;

  const chartData: ChartDataItem[] = labels.map((label, i) => ({
    name: label,
    value: dataset.data[i] ?? 0,
    color: colors[i % colors.length],
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentage ? renderCustomLabel : undefined}
            outerRadius={80}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value: string) => (
              <span className="text-neutral-700">{value}</span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
