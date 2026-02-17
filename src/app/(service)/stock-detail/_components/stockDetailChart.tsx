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
  ReferenceLine,
} from 'recharts';
import type {
  ChartDataPoint,
  CustomTooltipProps,
  CustomDotProps,
  TimeRange,
} from '@/types/chart';
import {
  formatPrice,
  formatPriceWithMarket,
  calculatePriceStats,
  calculateYAxisDomain,
  getXAxisTicks,
} from '@/lib/utils/chart-formatters';

/**
 * 커스텀 툴팁 컴포넌트
 */
const CustomTooltip: React.FC<CustomTooltipProps & { market?: 'KR' | 'US' }> = ({
  active,
  payload,
  label,
  market = 'KR',
}) => {
  if (active && payload && payload.length && payload[0].value) {
    return (
      <div className="bg-black text-white px-3 py-2 rounded text-xs font-semibold flex gap-3">
        <span>{label}</span>
        <span>{formatPriceWithMarket(payload[0].value, market)}</span>
      </div>
    );
  }
  return null;
};

/**
 * 커스텀 도트 컴포넌트 (마지막 포인트에만 레이블 표시)
 */
const _CustomDot: React.FC<CustomDotProps> = ({
  cx,
  cy,
  index,
  payload,
  dataLength,
}) => {
  if (cx === undefined || cy === undefined || index === undefined || !payload) {
    return null;
  }

  const _isLastPoint = index === dataLength - 1;

  return (
    <g>
      {/* 모든 포인트에 작은 원 */}
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#ef4444"
        stroke="white"
        strokeWidth={1.5}
      />

      {/* 일시적으로 마지막 포인트 레이블 숨김
      {isLastPoint && (
        <>
          <rect
            x={cx - 35}
            y={cy - 30}
            width={70}
            height={24}
            fill="#000000"
            rx={4}
          />
          <text
            x={cx}
            y={cy - 14}
            fill="white"
            fontSize={12}
            fontWeight="600"
            textAnchor="middle"
          >
            {formatPrice(payload.price)}
          </text>
          <line
            x1={cx}
            y1={cy - 6}
            x2={cx}
            y2={cy - 3}
            stroke="#000000"
            strokeWidth={2}
          />
        </>
      )}
      */}
    </g>
  );
};

/**
 * 캔들 차트 아이콘 SVG
 */
const CandleChartIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="6" y="8" width="3" height="8" fill="#10b981" />
    <line x1="7.5" y1="4" x2="7.5" y2="8" stroke="#10b981" strokeWidth="2" />
    <line x1="7.5" y1="16" x2="7.5" y2="20" stroke="#10b981" strokeWidth="2" />
    <rect x="15" y="6" width="3" height="12" fill="#ef4444" />
    <line x1="16.5" y1="2" x2="16.5" y2="6" stroke="#ef4444" strokeWidth="2" />
    <line
      x1="16.5"
      y1="18"
      x2="16.5"
      y2="22"
      stroke="#ef4444"
      strokeWidth="2"
    />
  </svg>
);

/**
 * 차트 Props
 */
interface StockDetailChartProps {
  stockId: string;
  market?: 'KR' | 'US';
  currentPrice?: number;
  previousClose?: number;
  height?: number;
  showTimeRangeSelector?: boolean;
  showCandleButton?: boolean;
}

/**
 * 날짜 포맷터 (X축용)
 */
function formatDateLabel(dateStr: string, range: TimeRange): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 1주, 1개월: MM/DD 형식
  if (range === '1주' || range === '1개월') {
    return `${month}/${day}`;
  }

  // 3개월, 6개월, 1년: YY/MM 형식
  const year = date.getFullYear().toString().slice(2);
  return `${year}/${month}`;
}

/**
 * 주가 차트 컴포넌트
 */
export const StockDetailChart: React.FC<StockDetailChartProps> = ({
  stockId,
  market = 'KR',
  currentPrice,
  previousClose,
  height = 300,
  showTimeRangeSelector = true,
  showCandleButton = false,
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1주');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 차트 데이터 fetch
  const fetchChartData = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/stock/chart?symbol=${encodeURIComponent(stockId)}&range=${encodeURIComponent(range)}&market=${market}`
      );
      if (response.ok) {
        const result = await response.json();
        setChartData(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [stockId, market]);

  // 초기 로드 및 범위 변경 시 데이터 fetch
  useEffect(() => {
    fetchChartData(selectedRange);
  }, [fetchChartData, selectedRange]);

  // 가격 통계 계산
  const stats = useMemo(
    () => calculatePriceStats(chartData, previousClose),
    [chartData, previousClose]
  );

  // Y축 범위 계산
  const yAxisDomain = useMemo(() => calculateYAxisDomain(chartData), [chartData]);

  // X축 틱 날짜 계산
  const xAxisTicks = useMemo(
    () => getXAxisTicks(chartData, selectedRange),
    [chartData, selectedRange]
  );

  // 현재가 (props 또는 계산값)
  const displayPrice = currentPrice ?? stats.current;

  // 시간 범위 변경 핸들러
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
  };

  // 시간 범위 옵션
  const timeRanges: TimeRange[] = ['1주', '1개월', '3개월', '6개월', '1년'];

  return (
    <div className="w-full">
      {/* 차트 */}
      <ResponsiveContainer width="100%" height={height}>
        {isLoading || chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-neutral-400 text-sm">
              {isLoading ? '차트 로딩중...' : '차트 데이터가 없습니다'}
            </span>
          </div>
        ) : (
          <LineChart
            data={chartData}
            margin={{ top: 40, right: 0, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />

            {/* 기준선 (현재가) */}
            <ReferenceLine
              y={displayPrice}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth={1}
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
              tickFormatter={formatPrice}
            />

            <Tooltip content={<CustomTooltip market={market} />} />

            <Line
              type="linear"
              dataKey="price"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444', stroke: 'white', strokeWidth: 1.5 }}
              fill="url(#lineGradient)"
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* 시간 범위 선택 탭 */}
      {showTimeRangeSelector && (
        <div className="grid grid-cols-5 gap-2 mt-4">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
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

          {/* 캔들 차트 아이콘 버튼 */}
          {showCandleButton && (
            <button
              className="px-3 py-2 bg-neutral-100 rounded-lg hover:bg-neutral-150 transition-colors"
              aria-label="캔들 차트로 전환"
            >
              <CandleChartIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
