'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { LineChartVisualizationData } from '@/types/chart';

interface LineChartProps {
  data: LineChartVisualizationData;
  height?: number;
}

const DEFAULT_COLORS = [
  '#2563eb',
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

/**
 * Quant Grade Chart using Recharts (Y-axis with custom tick labels)
 */
function QuantGradeLineChart({ data, height = 250 }: LineChartProps) {
  const { labels, datasets } = data.data;
  const options = data.options;
  const yAxisTicks = options?.yAxisTicks ?? {};

  // Convert to Recharts data format
  const chartData = labels.map((label, index) => {
    const point: Record<string, string | number | null> = { name: label };
    datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index];
    });
    return point;
  });

  // Custom Y-axis tick component with color coding
  const renderYAxisTick = (props: { x: number; y: number; payload: { value: number } }) => {
    const { x, y, payload } = props;
    const value = payload.value;
    const label = yAxisTicks[value.toString()] || value.toString();

    // Color based on grade value
    let fill = '#6b7280'; // neutral (gray)
    if (value >= 2) {
      fill = '#dc2626'; // strong buy signal (red)
    } else if (value === 1) {
      fill = '#f87171'; // weak buy signal (light red)
    } else if (value === -1) {
      fill = '#60a5fa'; // weak sell signal (light blue)
    } else if (value <= -2) {
      fill = '#2563eb'; // strong sell signal (blue)
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill={fill}
          fontSize={11}
          fontWeight={Math.abs(value) >= 2 ? 600 : 400}
        >
          {label}
        </text>
      </g>
    );
  };

  // Custom tooltip for quant grade
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const value = payload[0].value;
    const gradeText = yAxisTicks[value?.toString()] || value?.toString() || '';

    // Background color based on grade
    let bgColor = '#f3f4f6'; // gray-100
    if (value >= 2) {
      bgColor = '#fef2f2'; // red-50
    } else if (value <= -2) {
      bgColor = '#eff6ff'; // blue-50
    }

    return (
      <div
        className="rounded px-2 py-1.5 text-xs border border-neutral-200"
        style={{ backgroundColor: bgColor }}
      >
        <p className="font-semibold text-neutral-700">{label}</p>
        <p className="mt-1" style={{ color: payload[0].color }}>
          {datasets[0]?.label || ''}: <strong>{gradeText}</strong>
        </p>
      </div>
    );
  };

  if (!labels || labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-neutral-500 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />

          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />

          <YAxis
            domain={[options?.yAxisMin ?? -3, options?.yAxisMax ?? 3]}
            ticks={[-3, -2, -1, 0, 1, 2, 3]}
            tick={renderYAxisTick}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            width={70}
          />

          {/* Neutral reference line at 0 */}
          <ReferenceLine
            y={0}
            stroke="#9ca3af"
            strokeDasharray="5 5"
          />

          <Tooltip content={<CustomTooltip />} />

          {datasets.map((dataset, idx) => (
            <Line
              key={dataset.label}
              type="monotone"
              dataKey={dataset.label}
              stroke={dataset.borderColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: dataset.borderColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * General Line Chart using Recharts (for time-series and general data)
 */
function GeneralLineChart({ data, height = 250 }: LineChartProps) {
  const { labels, datasets } = data.data;

  if (!labels || labels.length === 0 || !datasets || datasets.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-neutral-500 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  // Convert to Recharts data format
  const chartData = labels.map((label, index) => {
    const point: Record<string, string | number | null> = { name: label };
    datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index];
    });
    return point;
  });

  // Truncate labels for x-axis display
  const maxLabelLength = labels.length > 20 ? 5 : 8;
  const tickFormatter = (value: string) =>
    value.length > maxLabelLength ? value.slice(0, maxLabelLength) : value;

  // Show fewer ticks when many data points
  const tickInterval = labels.length > 30
    ? Math.floor(labels.length / 10)
    : labels.length > 15
      ? Math.floor(labels.length / 8)
      : 0;

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-neutral-800 text-white text-xs rounded px-2 py-1.5">
        <div className="text-neutral-300 mb-1">{label}</div>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.dataKey}:</span>
            <span className="font-medium">{formatValue(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={tickFormatter}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={formatValue}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          {datasets.map((dataset, idx) => (
            <Line
              key={dataset.label}
              type="monotone"
              dataKey={dataset.label}
              stroke={dataset.borderColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={labels.length <= 30}
              activeDot={{ r: 4 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * LineChart component with conditional rendering
 * - isQuantGrade: true -> Recharts (Y-axis custom tick labels)
 * - Otherwise -> TradingView (time-series optimized)
 */
export function LineChart({ data, height = 250 }: LineChartProps) {
  const isQuantGrade = data.options?.isQuantGrade ?? false;

  if (isQuantGrade) {
    return <QuantGradeLineChart data={data} height={height} />;
  }

  return <GeneralLineChart data={data} height={height} />;
}
