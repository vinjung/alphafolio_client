'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type TimeRange = '최대' | '1년' | '6개월' | '3개월' | '1개월';

interface ChartDataPoint {
  time: string;
  cumulativeReturn: number;
  benchmarkCumulativeReturn: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

/**
 * Custom tooltip component
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white px-3 py-2 rounded text-xs font-semibold">
        <div className="mb-1">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-3">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span>{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Format date label for X-axis
 */
function formatDateLabel(dateStr: string, range: TimeRange): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (range === '1개월') {
    return `${month}/${day}`;
  }

  // 최대, 1년, 6개월, 3개월: YY/MM 형식
  const year = date.getFullYear().toString().slice(2);
  return `${year}/${month}`;
}

/**
 * Calculate Y-axis domain with padding
 */
function calculateYAxisDomain(
  data: ChartDataPoint[],
  paddingPercent: number = 0.1
): [number, number] {
  if (data.length === 0) {
    return [-10, 10];
  }

  const allValues = data.flatMap((d) => [d.cumulativeReturn, d.benchmarkCumulativeReturn]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min;
  const padding = range * paddingPercent;

  return [min - padding, max + padding];
}

/**
 * Get X-axis ticks based on data and range
 */
function getXAxisTicks(data: ChartDataPoint[], range: TimeRange): string[] {
  if (data.length === 0) return [];

  const dates = data.map((d) => d.time);

  // Determine tick count based on range
  let tickCount: number;
  switch (range) {
    case '1개월':
      tickCount = 5;
      break;
    case '3개월':
      tickCount = 4;
      break;
    case '6개월':
      tickCount = 4;
      break;
    case '1년':
      tickCount = 5;
      break;
    case '최대':
      tickCount = 6;
      break;
    default:
      tickCount = 5;
  }

  const step = Math.max(1, Math.floor(dates.length / tickCount));

  const ticks: string[] = [];
  for (let i = 0; i < dates.length; i += step) {
    ticks.push(dates[i]);
  }

  // Always include last date
  if (ticks[ticks.length - 1] !== dates[dates.length - 1]) {
    ticks.push(dates[dates.length - 1]);
  }

  return ticks;
}

/**
 * Format percentage value
 */
function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

interface PortfolioChartProps {
  portfolioId: string;
  height?: number;
  initialData?: ChartDataPoint[];
}

export default function CustomChart({ portfolioId, height = 186, initialData = [] }: PortfolioChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('최대');
  const [chartData, setChartData] = useState<ChartDataPoint[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch chart data (only when range changes from initial)
  const fetchChartData = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/portfolio/chart?portfolioId=${encodeURIComponent(portfolioId)}&range=${encodeURIComponent(range)}`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const result = await response.json();
        setChartData(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio chart data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId]);

  // Fetch only when range changes (not on initial load if we have initialData)
  useEffect(() => {
    if (selectedRange === '최대' && initialData.length > 0) {
      setChartData(initialData);
      return;
    }
    fetchChartData(selectedRange);
  }, [fetchChartData, selectedRange, initialData]);

  // Y-axis domain
  const yAxisDomain = useMemo(() => calculateYAxisDomain(chartData), [chartData]);

  // X-axis ticks
  const xAxisTicks = useMemo(
    () => getXAxisTicks(chartData, selectedRange),
    [chartData, selectedRange]
  );

  // Time range options
  const timeRanges: TimeRange[] = ['최대', '1년', '6개월', '3개월', '1개월'];

  // Show loading or empty state
  if (isLoading || chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center" style={{ height }}>
          <span className="text-neutral-400 text-sm">
            {isLoading ? '차트 로딩중...' : '차트 데이터가 없습니다'}
          </span>
        </div>

        {/* Time range selector */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`
                py-2 rounded-lg text-sm font-medium transition-colors text-center cursor-pointer
                ${
                  selectedRange === range
                    ? 'bg-neutral-200 text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-150'
                }
              `}
              aria-label={`${range} 차트 보기`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="portfolioLineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="benchmarkLineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            ticks={xAxisTicks}
            tickFormatter={(value) => formatDateLabel(value, selectedRange)}
          />

          <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            domain={yAxisDomain}
            tickFormatter={formatPercent}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Total value line (red, front) */}
          <Line
            type="linear"
            dataKey="cumulativeReturn"
            name="총 평가액"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444', stroke: 'white', strokeWidth: 1.5 }}
          />

          {/* Benchmark line (gray, behind) */}
          <Line
            type="linear"
            dataKey="benchmarkCumulativeReturn"
            name="벤치마크"
            stroke="#9ca3af"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#9ca3af', stroke: 'white', strokeWidth: 1.5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Time range selector */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`
              py-2 rounded-lg text-sm font-medium transition-colors text-center cursor-pointer
              ${
                selectedRange === range
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-150'
              }
            `}
            aria-label={`${range} 차트 보기`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
