/**
 * 차트 데이터 포인트 타입
 */
export interface ChartDataPoint {
  time: string;
  price: number;
}

/**
 * 시간 범위 타입
 */
export type TimeRange = '1주' | '1개월' | '3개월' | '6개월' | '1년';

/**
 * 주가 차트 Props
 */
export interface StockPriceChartProps {
  /** 차트 데이터 */
  data: ChartDataPoint[];
  /** 종목명 (선택) */
  stockName?: string;
  /** 현재가 (선택, 데이터에서 자동 계산 가능) */
  currentPrice?: number;
  /** 이전 종가 (선택, 변동률 계산용) */
  previousClose?: number;
  /** 차트 높이 (px) */
  height?: number;
  /** 시간 범위 선택 활성화 여부 */
  showTimeRangeSelector?: boolean;
  /** 캔들 차트 전환 버튼 표시 여부 */
  showCandleButton?: boolean;
  /** 차트 클릭 이벤트 핸들러 */
  onChartClick?: (dataPoint: ChartDataPoint) => void;
  /** 시간 범위 변경 핸들러 */
  onTimeRangeChange?: (range: TimeRange) => void;
}

/**
 * 커스텀 툴팁 Props
 */
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: ChartDataPoint;
  }>;
  label?: string;
}

/**
 * 커스텀 도트 Props
 */
export interface CustomDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: ChartDataPoint;
  dataLength: number;
}

/**
 * 가격 통계 정보
 */
export interface PriceStats {
  current: number;
  min: number;
  max: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

/**
 * 테이블 시각화 데이터
 */
export interface TableVisualizationData {
  type: 'table';
  title: string;
  data: {
    headers: string[];
    rows: (string | number | null)[][];
    total_count: number;
    displayed_count: number;
  };
}

/**
 * 라인 차트 옵션
 */
export interface LineChartOptions {
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisMin?: number;
  yAxisMax?: number;
  yAxisTicks?: Record<string, string>;
  isQuantGrade?: boolean;
}

/**
 * 라인 차트 시각화 데이터
 */
export interface LineChartVisualizationData {
  type: 'line_chart';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: (number | null)[];
      borderColor?: string;
    }[];
  };
  options?: LineChartOptions;
}

/**
 * 캔들스틱 차트 시각화 데이터
 */
export interface CandlestickVisualizationData {
  type: 'candlestick';
  title: string;
  data: {
    labels: string[];
    datasets: {
      data: {
        open: number;
        high: number;
        low: number;
        close: number;
      }[];
    }[];
  };
  options?: {
    xAxisLabel?: string;
    yAxisLabel?: string;
  };
}

/**
 * 바 차트 시각화 데이터
 */
export interface BarChartVisualizationData {
  type: 'bar_chart';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: (number | null)[];
      backgroundColor?: string | string[];
    }[];
  };
  options?: {
    xAxisLabel?: string;
    yAxisLabel?: string;
  };
}

/**
 * 파이 차트 시각화 데이터
 */
export interface PieChartVisualizationData {
  type: 'pie_chart';
  title: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
    }[];
  };
  options?: {
    showPercentage?: boolean;
  };
}

/**
 * Multi-chart visualization data (individual charts per indicator)
 */
export interface MultiChartVisualizationData {
  type: 'multi_chart';
  title: string;
  data: {
    charts: {
      label: string;
      visualization: BarChartVisualizationData | LineChartVisualizationData;
    }[];
    defaultIndex: number;
  };
}

/**
 * 시각화 데이터 (통합 Union 타입)
 */
export type VisualizationData =
  | TableVisualizationData
  | LineChartVisualizationData
  | CandlestickVisualizationData
  | BarChartVisualizationData
  | PieChartVisualizationData
  | MultiChartVisualizationData;
