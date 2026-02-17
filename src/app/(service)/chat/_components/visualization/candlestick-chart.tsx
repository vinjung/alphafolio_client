'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import type { CandlestickVisualizationData } from '@/types/chart';

interface CandlestickChartProps {
  data: CandlestickVisualizationData;
  height?: number;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  isUp: boolean;
}

function formatPrice(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return value.toLocaleString('ko-KR');
  }
  if (value < 1) {
    return value.toFixed(4);
  }
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

export function CandlestickChart({ data, height = 250 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    open: '',
    high: '',
    low: '',
    close: '',
    isUp: true,
  });

  const { labels, datasets } = data.data;
  const ohlcData = useMemo(() => datasets[0]?.data || [], [datasets]);

  useEffect(() => {
    if (!containerRef.current || !labels || labels.length === 0 || ohlcData.length === 0) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#94a3b8', width: 1, style: 2 },
        horzLine: { color: '#94a3b8', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
      },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    const seriesData: CandlestickData<Time>[] = labels.map((label, i) => ({
      time: label as Time,
      open: ohlcData[i]?.open ?? 0,
      high: ohlcData[i]?.high ?? 0,
      low: ohlcData[i]?.low ?? 0,
      close: ohlcData[i]?.close ?? 0,
    }));

    series.setData(seriesData);
    seriesRef.current = series;

    chart.timeScale().fitContent();

    // Subscribe to crosshair move for tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setTooltip((prev) => ({ ...prev, visible: false }));
        return;
      }

      const dateStr = String(param.time);
      const candleData = param.seriesData.get(series) as CandlestickData<Time> | undefined;

      if (candleData && 'close' in candleData) {
        const isUp = candleData.close >= candleData.open;
        setTooltip({
          visible: true,
          x: param.point.x,
          y: param.point.y,
          date: dateStr,
          open: formatPrice(candleData.open),
          high: formatPrice(candleData.high),
          low: formatPrice(candleData.low),
          close: formatPrice(candleData.close),
          isUp,
        });
      }
    });

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [labels, ohlcData, height]);

  if (!labels || labels.length === 0 || ohlcData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-neutral-500 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="w-full" />
      {tooltip.visible && (
        <div
          className="absolute z-10 bg-neutral-800 text-white text-xs rounded px-2 py-1 pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 10, (containerRef.current?.clientWidth || 300) - 100),
            top: Math.max(tooltip.y - 70, 10),
          }}
        >
          <div className="text-neutral-300 mb-1">{tooltip.date}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span className="text-neutral-400">시가</span>
            <span className="text-right">{tooltip.open}</span>
            <span className="text-neutral-400">고가</span>
            <span className="text-right text-red-400">{tooltip.high}</span>
            <span className="text-neutral-400">저가</span>
            <span className="text-right text-blue-400">{tooltip.low}</span>
            <span className="text-neutral-400">종가</span>
            <span className={`text-right font-medium ${tooltip.isUp ? 'text-red-400' : 'text-blue-400'}`}>
              {tooltip.close}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
