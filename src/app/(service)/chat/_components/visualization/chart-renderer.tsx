'use client';

import { Component, type ReactNode } from 'react';
import type {
  VisualizationData,
  TableVisualizationData,
  LineChartVisualizationData,
  CandlestickVisualizationData,
  BarChartVisualizationData,
  PieChartVisualizationData,
  MultiChartVisualizationData,
} from '@/types/chart';
import { DataTable } from '../data-table';
import { LineChart } from './line-chart';
import { CandlestickChart } from './candlestick-chart';
import { BarChart } from './bar-chart';
import { PieChart } from './pie-chart';
import { MultiChart } from './multi-chart';

class ChartErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ChartRenderer] Render error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-[200px] text-neutral-500 text-sm border border-neutral-200 rounded-lg">
          차트를 표시할 수 없습니다.
        </div>
      );
    }
    return this.props.children;
  }
}

interface ChartRendererProps {
  visualization: VisualizationData;
}

export function ChartRenderer({ visualization }: ChartRendererProps) {
  const { type, title } = visualization;

  const renderChart = () => {
    switch (type) {
      case 'table':
        return <DataTable data={visualization as TableVisualizationData} />;

      case 'line_chart':
        return <LineChart data={visualization as LineChartVisualizationData} />;

      case 'candlestick':
        return <CandlestickChart data={visualization as CandlestickVisualizationData} />;

      case 'bar_chart':
        return <BarChart data={visualization as BarChartVisualizationData} />;

      case 'pie_chart':
        return <PieChart data={visualization as PieChartVisualizationData} />;

      case 'multi_chart':
        return <MultiChart data={visualization as MultiChartVisualizationData} />;

      default:
        return (
          <div className="text-neutral-500 text-sm py-4 text-center">
            지원하지 않는 차트 타입입니다.
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {title && type !== 'table' && (
        <div className="mb-2 text-sm font-medium text-neutral-700">{title}</div>
      )}
      <ChartErrorBoundary>{renderChart()}</ChartErrorBoundary>
    </div>
  );
}
