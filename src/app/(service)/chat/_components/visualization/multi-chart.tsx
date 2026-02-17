'use client';

import { useState } from 'react';
import type { MultiChartVisualizationData } from '@/types/chart';
import { BarChart } from './bar-chart';
import { LineChart } from './line-chart';

interface MultiChartProps {
  data: MultiChartVisualizationData;
}

function SubChartRenderer({ visualization }: { visualization: MultiChartVisualizationData['data']['charts'][number]['visualization'] }) {
  if (visualization.type === 'bar_chart') {
    return <BarChart data={visualization} />;
  }
  if (visualization.type === 'line_chart') {
    return <LineChart data={visualization} />;
  }
  return null;
}

export function MultiChart({ data }: MultiChartProps) {
  const { charts, defaultIndex } = data.data;
  const [activeIndex, setActiveIndex] = useState(defaultIndex || 0);
  const useStack = charts.length <= 3;

  if (!charts || charts.length === 0) {
    return (
      <div className="text-neutral-500 text-sm py-4 text-center">
        표시할 차트 데이터가 없습니다.
      </div>
    );
  }

  if (useStack) {
    return (
      <div className="flex flex-col gap-4">
        {charts.map((chart, idx) => (
          <div key={idx}>
            <div className="text-xs font-medium text-neutral-600 mb-1">
              {chart.label}
            </div>
            <SubChartRenderer visualization={chart.visualization} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {charts.map((chart, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              idx === activeIndex
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {chart.label}
          </button>
        ))}
      </div>
      <SubChartRenderer visualization={charts[activeIndex].visualization} />
    </div>
  );
}
