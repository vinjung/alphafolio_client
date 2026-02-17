'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  AreaData,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
  AreaSeries,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';
import type { TimeRange } from '@/types/chart';

interface TradingViewChartProps {
  stockId: string;
  market?: 'KR' | 'US';
  height?: number;
  showTimeRangeSelector?: boolean;
}

interface ChartDataPoint {
  time: string;
  price: number;
}

interface OHLCDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorDataPoint {
  time: string;
  value: number;
}

interface MACDDataPoint {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}

interface StochasticDataPoint {
  time: string;
  slowk: number;
  slowd: number;
}

interface BollingerDataPoint {
  time: string;
  upper: number;
  middle: number;
  lower: number;
}

interface IndicatorData {
  rsi?: IndicatorDataPoint[];
  macd?: MACDDataPoint[];
  stochastic?: StochasticDataPoint[];
  bollinger?: BollingerDataPoint[];
  adx?: IndicatorDataPoint[];
  cci?: IndicatorDataPoint[];
  mfi?: IndicatorDataPoint[];
  obv?: IndicatorDataPoint[];
  atr?: IndicatorDataPoint[];
}

interface ChartApiResponse {
  data: ChartDataPoint[];
  ohlc: OHLCDataPoint[];
  indicators?: IndicatorData;
}

type ChartType = 'area' | 'candlestick';

interface TooltipData {
  visible: boolean;
  date: string;
  price: string;
  values: { label: string; value: string; color?: string }[];
  x: number;
  y: number;
}

interface IndicatorTooltipData {
  visible: boolean;
  date: string;
  values: { label: string; value: string; color?: string }[];
  x: number;
  y: number;
}

type IndicatorType =
  | 'none'
  | 'rsi'
  | 'macd'
  | 'stochastic'
  | 'bollinger'
  | 'adx'
  | 'cci'
  | 'mfi'
  | 'obv'
  | 'atr';

const INDICATOR_DESCRIPTIONS: Record<IndicatorType, string> = {
  none: '',
  rsi: 'RSI(상대강도지수): 70 이상 과매수, 30 이하 과매도',
  macd: 'MACD: 단기/장기 이동평균 차이로 추세 전환 포착',
  stochastic: '스토캐스틱: 현재가의 일정기간 고저 대비 위치 (0-100)',
  bollinger: '볼린저밴드: 이동평균 +/- 2표준편차, 변동성 시각화',
  adx: 'ADX(추세강도): 25 이상 추세 존재, 방향은 알려주지 않음',
  cci: 'CCI(상품채널): +/-100 초과 시 추세 강함',
  mfi: 'MFI(자금흐름): 거래량 가중 RSI, 80 이상 과매수',
  obv: 'OBV(거래량누적): 가격 상승 시 거래량 합산, 추세 확인용',
  atr: 'ATR(평균진폭): 변동성 측정, 손절/익절 기준 설정용',
};

/**
 * TradingView Lightweight Charts based stock chart component
 * Supports both Area (line) and Candlestick chart types
 */
export function TradingViewChart({
  stockId,
  market = 'KR',
  height = 300,
  showTimeRangeSelector = true,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area', Time> | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<'Line', Time> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line', Time> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<'Line', Time> | null>(null);

  // Indicator panel refs
  const indicatorContainerRef = useRef<HTMLDivElement>(null);
  const indicatorChartRef = useRef<IChartApi | null>(null);
  const indicatorSeriesRef = useRef<ISeriesApi<'Line', Time> | null>(null);
  const indicatorSeries2Ref = useRef<ISeriesApi<'Line', Time> | null>(null);
  const indicatorHistogramRef = useRef<ISeriesApi<'Histogram', Time> | null>(null);

  // Bollinger bands refs (overlay on main chart)
  const bollingerUpperRef = useRef<ISeriesApi<'Line', Time> | null>(null);
  const bollingerMiddleRef = useRef<ISeriesApi<'Line', Time> | null>(null);
  const bollingerLowerRef = useRef<ISeriesApi<'Line', Time> | null>(null);

  // Volume panel refs
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', Time> | null>(null);

  const [selectedRange, setSelectedRange] = useState<TimeRange>('1주');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [chartData, setChartData] = useState<ChartApiResponse | null>(null);
  const [showMA, setShowMA] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType>('none');
  const [tooltipData, setTooltipData] = useState<TooltipData>({
    visible: false,
    date: '',
    price: '',
    values: [],
    x: 0,
    y: 0,
  });
  const [indicatorTooltip, setIndicatorTooltip] = useState<IndicatorTooltipData>({
    visible: false,
    date: '',
    values: [],
    x: 0,
    y: 0,
  });
  const [volumeTooltip, setVolumeTooltip] = useState<IndicatorTooltipData>({
    visible: false,
    date: '',
    values: [],
    x: 0,
    y: 0,
  });

  // Calculate EMA (Exponential Moving Average)
  const calculateEMA = useCallback((data: number[], period: number): number[] => {
    const multiplier = 2 / (period + 1);
    const ema: number[] = [];
    let prevEMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ema.push(prevEMA);
      } else {
        const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
        ema.push(currentEMA);
        prevEMA = currentEMA;
      }
    }
    return ema;
  }, []);

  // Calculate RSI
  const calculateRSI = useCallback((ohlc: OHLCDataPoint[], period: number = 14): IndicatorDataPoint[] => {
    if (ohlc.length < period + 1) return [];

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < ohlc.length; i++) {
      const change = ohlc[i].close - ohlc[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    const result: IndicatorDataPoint[] = [];
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < ohlc.length; i++) {
      if (i > period) {
        avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      }
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push({ time: ohlc[i].time, value: rsi });
    }

    return result;
  }, []);

  // Calculate MACD
  const calculateMACD = useCallback((ohlc: OHLCDataPoint[]): MACDDataPoint[] => {
    if (ohlc.length < 26) return [];

    const closes = ohlc.map((d) => d.close);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);

    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = calculateEMA(macdLine.slice(25), 9);

    const result: MACDDataPoint[] = [];
    for (let i = 33; i < ohlc.length; i++) {
      const macd = macdLine[i];
      const signal = signalLine[i - 33];
      result.push({
        time: ohlc[i].time,
        macd,
        signal,
        histogram: macd - signal,
      });
    }

    return result;
  }, [calculateEMA]);

  // Calculate Stochastic
  const calculateStochastic = useCallback((ohlc: OHLCDataPoint[], kPeriod: number = 14, dPeriod: number = 3): StochasticDataPoint[] => {
    if (ohlc.length < kPeriod + dPeriod) return [];

    const kValues: number[] = [];

    for (let i = kPeriod - 1; i < ohlc.length; i++) {
      const slice = ohlc.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...slice.map((d) => d.high));
      const lowest = Math.min(...slice.map((d) => d.low));
      const k = highest === lowest ? 50 : ((ohlc[i].close - lowest) / (highest - lowest)) * 100;
      kValues.push(k);
    }

    const result: StochasticDataPoint[] = [];
    for (let i = dPeriod - 1; i < kValues.length; i++) {
      const slowk = kValues.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod;
      const slowdValues = [];
      for (let j = Math.max(0, i - dPeriod + 1); j <= i; j++) {
        const kSlice = kValues.slice(Math.max(0, j - dPeriod + 1), j + 1);
        slowdValues.push(kSlice.reduce((a, b) => a + b, 0) / kSlice.length);
      }
      const slowd = slowdValues.reduce((a, b) => a + b, 0) / slowdValues.length;
      result.push({ time: ohlc[i + kPeriod - 1].time, slowk, slowd });
    }

    return result;
  }, []);

  // Calculate Bollinger Bands
  const calculateBollinger = useCallback((ohlc: OHLCDataPoint[], period: number = 20, stdDev: number = 2): BollingerDataPoint[] => {
    if (ohlc.length < period) return [];

    const result: BollingerDataPoint[] = [];

    for (let i = period - 1; i < ohlc.length; i++) {
      const slice = ohlc.slice(i - period + 1, i + 1);
      const closes = slice.map((d) => d.close);
      const sma = closes.reduce((a, b) => a + b, 0) / period;
      const variance = closes.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
      const std = Math.sqrt(variance);

      result.push({
        time: ohlc[i].time,
        upper: sma + stdDev * std,
        middle: sma,
        lower: sma - stdDev * std,
      });
    }

    return result;
  }, []);

  // Calculate ATR
  const calculateATR = useCallback((ohlc: OHLCDataPoint[], period: number = 14): IndicatorDataPoint[] => {
    if (ohlc.length < period + 1) return [];

    const trueRanges: number[] = [];
    for (let i = 1; i < ohlc.length; i++) {
      const tr = Math.max(
        ohlc[i].high - ohlc[i].low,
        Math.abs(ohlc[i].high - ohlc[i - 1].close),
        Math.abs(ohlc[i].low - ohlc[i - 1].close)
      );
      trueRanges.push(tr);
    }

    const result: IndicatorDataPoint[] = [];
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < ohlc.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i - 1]) / period;
      result.push({ time: ohlc[i].time, value: atr });
    }

    return result;
  }, []);

  // Calculate OBV
  const calculateOBV = useCallback((ohlc: OHLCDataPoint[]): IndicatorDataPoint[] => {
    if (ohlc.length < 2) return [];

    const result: IndicatorDataPoint[] = [{ time: ohlc[0].time, value: 0 }];
    let obv = 0;

    for (let i = 1; i < ohlc.length; i++) {
      if (ohlc[i].close > ohlc[i - 1].close) {
        obv += ohlc[i].volume;
      } else if (ohlc[i].close < ohlc[i - 1].close) {
        obv -= ohlc[i].volume;
      }
      result.push({ time: ohlc[i].time, value: obv });
    }

    return result;
  }, []);

  // Calculate CCI
  const calculateCCI = useCallback((ohlc: OHLCDataPoint[], period: number = 20): IndicatorDataPoint[] => {
    if (ohlc.length < period) return [];

    const result: IndicatorDataPoint[] = [];

    for (let i = period - 1; i < ohlc.length; i++) {
      const slice = ohlc.slice(i - period + 1, i + 1);
      const typicalPrices = slice.map((d) => (d.high + d.low + d.close) / 3);
      const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
      const meanDeviation = typicalPrices.reduce((acc, tp) => acc + Math.abs(tp - sma), 0) / period;
      const tp = (ohlc[i].high + ohlc[i].low + ohlc[i].close) / 3;
      const cci = meanDeviation === 0 ? 0 : (tp - sma) / (0.015 * meanDeviation);
      result.push({ time: ohlc[i].time, value: cci });
    }

    return result;
  }, []);

  // Calculate MFI
  const calculateMFI = useCallback((ohlc: OHLCDataPoint[], period: number = 14): IndicatorDataPoint[] => {
    if (ohlc.length < period + 1) return [];

    const typicalPrices = ohlc.map((d) => (d.high + d.low + d.close) / 3);
    const moneyFlows = typicalPrices.map((tp, i) => tp * ohlc[i].volume);

    const result: IndicatorDataPoint[] = [];

    for (let i = period; i < ohlc.length; i++) {
      let positiveFlow = 0;
      let negativeFlow = 0;

      for (let j = i - period + 1; j <= i; j++) {
        if (typicalPrices[j] > typicalPrices[j - 1]) {
          positiveFlow += moneyFlows[j];
        } else {
          negativeFlow += moneyFlows[j];
        }
      }

      const mfi = negativeFlow === 0 ? 100 : 100 - 100 / (1 + positiveFlow / negativeFlow);
      result.push({ time: ohlc[i].time, value: mfi });
    }

    return result;
  }, []);

  // Calculate ADX
  const calculateADX = useCallback((ohlc: OHLCDataPoint[], period: number = 14): IndicatorDataPoint[] => {
    if (ohlc.length < period * 2) return [];

    const trueRanges: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];

    for (let i = 1; i < ohlc.length; i++) {
      const tr = Math.max(
        ohlc[i].high - ohlc[i].low,
        Math.abs(ohlc[i].high - ohlc[i - 1].close),
        Math.abs(ohlc[i].low - ohlc[i - 1].close)
      );
      trueRanges.push(tr);

      const upMove = ohlc[i].high - ohlc[i - 1].high;
      const downMove = ohlc[i - 1].low - ohlc[i].low;

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }

    const smoothTR: number[] = [];
    const smoothPlusDM: number[] = [];
    const smoothMinusDM: number[] = [];

    let sumTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    let sumPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let sumMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

    for (let i = period - 1; i < trueRanges.length; i++) {
      if (i === period - 1) {
        smoothTR.push(sumTR);
        smoothPlusDM.push(sumPlusDM);
        smoothMinusDM.push(sumMinusDM);
      } else {
        sumTR = sumTR - sumTR / period + trueRanges[i];
        sumPlusDM = sumPlusDM - sumPlusDM / period + plusDM[i];
        sumMinusDM = sumMinusDM - sumMinusDM / period + minusDM[i];
        smoothTR.push(sumTR);
        smoothPlusDM.push(sumPlusDM);
        smoothMinusDM.push(sumMinusDM);
      }
    }

    const dx: number[] = [];
    for (let i = 0; i < smoothTR.length; i++) {
      const plusDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
      const minusDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
      const dxVal = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
      dx.push(isNaN(dxVal) ? 0 : dxVal);
    }

    const result: IndicatorDataPoint[] = [];
    let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period - 1; i < dx.length; i++) {
      if (i >= period) {
        adx = (adx * (period - 1) + dx[i]) / period;
      }
      result.push({ time: ohlc[i + period].time, value: adx });
    }

    return result;
  }, []);

  // Calculate all indicators from OHLC data
  const calculateIndicators = useCallback((ohlc: OHLCDataPoint[], indicator: IndicatorType): IndicatorData => {
    switch (indicator) {
      case 'rsi':
        return { rsi: calculateRSI(ohlc) };
      case 'macd':
        return { macd: calculateMACD(ohlc) };
      case 'stochastic':
        return { stochastic: calculateStochastic(ohlc) };
      case 'bollinger':
        return { bollinger: calculateBollinger(ohlc) };
      case 'adx':
        return { adx: calculateADX(ohlc) };
      case 'cci':
        return { cci: calculateCCI(ohlc) };
      case 'mfi':
        return { mfi: calculateMFI(ohlc) };
      case 'obv':
        return { obv: calculateOBV(ohlc) };
      case 'atr':
        return { atr: calculateATR(ohlc) };
      default:
        return {};
    }
  }, [calculateRSI, calculateMACD, calculateStochastic, calculateBollinger, calculateADX, calculateCCI, calculateMFI, calculateOBV, calculateATR]);

  // Calculate moving average
  const calculateMA = useCallback(
    (data: OHLCDataPoint[], period: number): (number | null)[] => {
      return data.map((_, index) => {
        if (index < period - 1) return null;
        const sum = data
          .slice(index - period + 1, index + 1)
          .reduce((acc, d) => acc + d.close, 0);
        return sum / period;
      });
    },
    []
  );

  // Format price based on market
  const formatPrice = useCallback(
    (price: number): string => {
      if (market === 'KR') {
        return `${Math.round(price).toLocaleString('ko-KR')}`;
      }
      return `$${price.toFixed(2)}`;
    },
    [market]
  );

  // Fetch chart data from API
  const fetchChartData = useCallback(async (): Promise<ChartApiResponse> => {
    try {
      const indicatorParam = selectedIndicator !== 'none' ? `&indicator=${selectedIndicator}` : '';
      const response = await fetch(
        `/api/stock/chart?symbol=${encodeURIComponent(stockId)}&range=${encodeURIComponent(selectedRange)}&market=${market}${indicatorParam}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      const result = await response.json();
      return {
        data: result.data || [],
        ohlc: result.ohlc || [],
        indicators: result.indicators,
      };
    } catch (error) {
      console.error('Chart data fetch error:', error);
      throw error;
    }
  }, [stockId, selectedRange, market, selectedIndicator]);

  // Create or recreate chart with series
  const initializeChart = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;

    // Remove existing chart if any
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      areaSeriesRef.current = null;
      candlestickSeriesRef.current = null;
      ma5SeriesRef.current = null;
      ma20SeriesRef.current = null;
      ma60SeriesRef.current = null;
      bollingerUpperRef.current = null;
      bollingerMiddleRef.current = null;
      bollingerLowerRef.current = null;
    }

    // Create new chart
    chartRef.current = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#f3f4f6' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      handleScroll: false,
      handleScale: false,
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        tickMarkFormatter: (time: Time, tickMarkType: number) => {
          const date = new Date(time as string);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          if (selectedRange === '1주' || selectedRange === '1개월') {
            return `${month}/${day}`;
          }
          // For longer ranges, show year/month but use tickMarkType to reduce duplicates
          const year = date.getFullYear().toString().slice(2);
          // tickMarkType: 0=Year, 1=Month, 2=Day, 3=Time
          if (tickMarkType <= 1) {
            return `${year}/${month}`;
          }
          return `${day}`;
        },
      },
      crosshair: {
        horzLine: {
          visible: true,
          labelVisible: true,
        },
        vertLine: {
          visible: true,
          labelVisible: false,
        },
      },
      localization: {
        priceFormatter: formatPrice,
      },
    });

    // Create series based on chart type
    if (chartType === 'area') {
      areaSeriesRef.current = chartRef.current.addSeries(AreaSeries, {
        lineColor: '#ef4444',
        topColor: 'rgba(239, 68, 68, 0.3)',
        bottomColor: 'rgba(239, 68, 68, 0.05)',
        lineWidth: 2,
        priceFormat: {
          type: 'custom',
          formatter: formatPrice,
        },
      });
    } else {
      // Candlestick series with Korean style colors (red = up, blue = down)
      candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#ef4444',
        downColor: '#3b82f6',
        borderUpColor: '#ef4444',
        borderDownColor: '#3b82f6',
        wickUpColor: '#ef4444',
        wickDownColor: '#3b82f6',
        priceFormat: {
          type: 'custom',
          formatter: formatPrice,
        },
      });

      // Moving average series (only in candlestick mode)
      if (showMA) {
        ma5SeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#eab308',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ma20SeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#f97316',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ma60SeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#8b5cf6',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
      }

      // Bollinger bands (overlay on main chart)
      if (selectedIndicator === 'bollinger') {
        bollingerUpperRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#94a3b8',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bollingerMiddleRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#64748b',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bollingerLowerRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#94a3b8',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
      }
    }

    // Subscribe to crosshair move for custom tooltip
    chartRef.current.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setTooltipData((prev) => ({ ...prev, visible: false }));
        return;
      }

      const dateStr = param.time as string;
      const date = new Date(dateStr);
      const year = date.getFullYear().toString().slice(2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      let price = '';
      const values: { label: string; value: string; color?: string }[] = [];

      if (chartType === 'area' && areaSeriesRef.current) {
        const data = param.seriesData.get(areaSeriesRef.current) as AreaData<Time> | undefined;
        if (data && 'value' in data) {
          price = formatPrice(data.value);
        }
      } else if (chartType === 'candlestick' && candlestickSeriesRef.current) {
        const data = param.seriesData.get(candlestickSeriesRef.current) as CandlestickData<Time> | undefined;
        if (data && 'close' in data) {
          price = formatPrice(data.close);
        }
      }

      // Collect MA values if visible
      if (showMA) {
        if (ma5SeriesRef.current) {
          const ma5Data = param.seriesData.get(ma5SeriesRef.current) as LineData<Time> | undefined;
          if (ma5Data && 'value' in ma5Data) {
            values.push({ label: 'MA5', value: formatPrice(ma5Data.value), color: '#eab308' });
          }
        }
        if (ma20SeriesRef.current) {
          const ma20Data = param.seriesData.get(ma20SeriesRef.current) as LineData<Time> | undefined;
          if (ma20Data && 'value' in ma20Data) {
            values.push({ label: 'MA20', value: formatPrice(ma20Data.value), color: '#f97316' });
          }
        }
        if (ma60SeriesRef.current) {
          const ma60Data = param.seriesData.get(ma60SeriesRef.current) as LineData<Time> | undefined;
          if (ma60Data && 'value' in ma60Data) {
            values.push({ label: 'MA60', value: formatPrice(ma60Data.value), color: '#8b5cf6' });
          }
        }
      }

      // Collect Bollinger values if visible
      if (selectedIndicator === 'bollinger') {
        if (bollingerUpperRef.current) {
          const upperData = param.seriesData.get(bollingerUpperRef.current) as LineData<Time> | undefined;
          if (upperData && 'value' in upperData) {
            values.push({ label: '상단', value: formatPrice(upperData.value), color: '#94a3b8' });
          }
        }
        if (bollingerMiddleRef.current) {
          const middleData = param.seriesData.get(bollingerMiddleRef.current) as LineData<Time> | undefined;
          if (middleData && 'value' in middleData) {
            values.push({ label: '중심', value: formatPrice(middleData.value), color: '#64748b' });
          }
        }
        if (bollingerLowerRef.current) {
          const lowerData = param.seriesData.get(bollingerLowerRef.current) as LineData<Time> | undefined;
          if (lowerData && 'value' in lowerData) {
            values.push({ label: '하단', value: formatPrice(lowerData.value), color: '#94a3b8' });
          }
        }
      }

      setTooltipData({
        visible: true,
        date: formattedDate,
        price,
        values,
        x: param.point.x,
        y: param.point.y,
      });
    });
  }, [height, chartType, selectedRange, formatPrice, showMA, selectedIndicator]);

  // Indicators that need separate panel (not overlay)
  const PANEL_INDICATORS: IndicatorType[] = ['rsi', 'macd', 'stochastic', 'adx', 'cci', 'mfi', 'obv', 'atr'];
  const needsIndicatorPanel = PANEL_INDICATORS.includes(selectedIndicator);

  // Initialize indicator panel chart
  const initializeIndicatorChart = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!indicatorContainerRef.current) return;
    if (!needsIndicatorPanel) {
      // Remove indicator chart if not needed
      if (indicatorChartRef.current) {
        indicatorChartRef.current.remove();
        indicatorChartRef.current = null;
        indicatorSeriesRef.current = null;
        indicatorSeries2Ref.current = null;
        indicatorHistogramRef.current = null;
      }
      return;
    }

    // Remove existing indicator chart
    if (indicatorChartRef.current) {
      indicatorChartRef.current.remove();
      indicatorChartRef.current = null;
      indicatorSeriesRef.current = null;
      indicatorSeries2Ref.current = null;
      indicatorHistogramRef.current = null;
    }

    // Create indicator chart
    indicatorChartRef.current = createChart(indicatorContainerRef.current, {
      width: indicatorContainerRef.current.clientWidth,
      height: 100,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#f3f4f6' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        visible: false,
      },
      crosshair: {
        horzLine: { visible: true, labelVisible: true },
        vertLine: { visible: true, labelVisible: false },
      },
    });

    // Create series based on indicator type
    switch (selectedIndicator) {
      case 'rsi':
      case 'adx':
      case 'cci':
      case 'mfi':
      case 'atr':
      case 'obv':
        indicatorSeriesRef.current = indicatorChartRef.current.addSeries(LineSeries, {
          color: selectedIndicator === 'rsi' ? '#8b5cf6' :
                 selectedIndicator === 'adx' ? '#f59e0b' :
                 selectedIndicator === 'cci' ? '#06b6d4' :
                 selectedIndicator === 'mfi' ? '#10b981' :
                 selectedIndicator === 'obv' ? '#6366f1' : '#f97316',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        break;

      case 'macd':
        indicatorSeriesRef.current = indicatorChartRef.current.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        indicatorSeries2Ref.current = indicatorChartRef.current.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        indicatorHistogramRef.current = indicatorChartRef.current.addSeries(HistogramSeries, {
          priceLineVisible: false,
          lastValueVisible: false,
        });
        break;

      case 'stochastic':
        indicatorSeriesRef.current = indicatorChartRef.current.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        indicatorSeries2Ref.current = indicatorChartRef.current.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        break;
    }

    // Subscribe to crosshair move for indicator tooltip
    indicatorChartRef.current.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setIndicatorTooltip((prev) => ({ ...prev, visible: false }));
        return;
      }

      const dateStr = param.time as string;
      const date = new Date(dateStr);
      const year = date.getFullYear().toString().slice(2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const values: { label: string; value: string; color?: string }[] = [];

      // Collect indicator values based on type
      if (indicatorSeriesRef.current) {
        const data = param.seriesData.get(indicatorSeriesRef.current) as LineData<Time> | undefined;
        if (data && 'value' in data) {
          const label = selectedIndicator === 'macd' ? 'MACD' :
                       selectedIndicator === 'stochastic' ? '%K' :
                       selectedIndicator.toUpperCase();
          values.push({ label, value: data.value.toFixed(2) });
        }
      }
      if (indicatorSeries2Ref.current) {
        const data = param.seriesData.get(indicatorSeries2Ref.current) as LineData<Time> | undefined;
        if (data && 'value' in data) {
          const label = selectedIndicator === 'macd' ? 'Signal' : '%D';
          values.push({ label, value: data.value.toFixed(2) });
        }
      }
      if (indicatorHistogramRef.current) {
        const data = param.seriesData.get(indicatorHistogramRef.current) as HistogramData<Time> | undefined;
        if (data && 'value' in data) {
          values.push({ label: 'Hist', value: data.value.toFixed(2) });
        }
      }

      setIndicatorTooltip({
        visible: true,
        date: formattedDate,
        values,
        x: param.point.x,
        y: param.point.y,
      });
    });
  }, [selectedIndicator, needsIndicatorPanel]);

  // Initialize volume chart
  const initializeVolumeChart = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!volumeContainerRef.current) return;

    // Remove existing volume chart
    if (volumeChartRef.current) {
      volumeChartRef.current.remove();
      volumeChartRef.current = null;
      volumeSeriesRef.current = null;
    }

    // Create volume chart
    volumeChartRef.current = createChart(volumeContainerRef.current, {
      width: volumeContainerRef.current.clientWidth,
      height: 40,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        visible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
      timeScale: {
        visible: false,
      },
      crosshair: {
        horzLine: { visible: false },
        vertLine: { visible: true, labelVisible: false },
      },
    });

    // Create volume histogram series
    volumeSeriesRef.current = volumeChartRef.current.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: 'volume',
      },
    });

    // Subscribe to crosshair move for volume tooltip
    volumeChartRef.current.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setVolumeTooltip((prev) => ({ ...prev, visible: false }));
        return;
      }

      const dateStr = param.time as string;
      const date = new Date(dateStr);
      const year = date.getFullYear().toString().slice(2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const values: { label: string; value: string }[] = [];

      if (volumeSeriesRef.current) {
        const data = param.seriesData.get(volumeSeriesRef.current) as HistogramData<Time> | undefined;
        if (data && 'value' in data) {
          const volume = data.value;
          const formattedVolume = volume >= 1000000
            ? `${(volume / 1000000).toFixed(1)}M`
            : volume >= 1000
            ? `${(volume / 1000).toFixed(1)}K`
            : volume.toLocaleString();
          values.push({ label: '거래량', value: formattedVolume });
        }
      }

      setVolumeTooltip({
        visible: true,
        date: formattedDate,
        values,
        x: param.point.x,
        y: param.point.y,
      });
    });
  }, []);

  // Update volume data
  const updateVolumeData = useCallback(() => {
    if (!chartData?.ohlc || chartData.ohlc.length === 0) return;
    if (!volumeSeriesRef.current) return;

    const volumeData: HistogramData<Time>[] = chartData.ohlc.map((point, index) => {
      const prevClose = index > 0 ? chartData.ohlc[index - 1].close : point.open;
      const isUp = point.close >= prevClose;
      return {
        time: point.time as Time,
        value: point.volume,
        color: isUp ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
      };
    });

    volumeSeriesRef.current.setData(volumeData);
    volumeChartRef.current?.timeScale().fitContent();
  }, [chartData]);

  // Update chart data
  const updateChartData = useCallback(() => {
    if (!chartData) return;

    if (chartType === 'area' && areaSeriesRef.current) {
      const formattedData: AreaData<Time>[] = chartData.data.map((point) => ({
        time: point.time as Time,
        value: point.price,
      }));
      areaSeriesRef.current.setData(formattedData);
    } else if (chartType === 'candlestick' && candlestickSeriesRef.current) {
      const formattedData: CandlestickData<Time>[] = chartData.ohlc.map((point) => ({
        time: point.time as Time,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      }));
      candlestickSeriesRef.current.setData(formattedData);

      // Set moving average data
      if (showMA && chartData.ohlc.length > 0) {
        const ma5Values = calculateMA(chartData.ohlc, 5);
        const ma20Values = calculateMA(chartData.ohlc, 20);
        const ma60Values = calculateMA(chartData.ohlc, 60);

        const formatMAData = (values: (number | null)[]): LineData<Time>[] => {
          return chartData.ohlc
            .map((point, index) => ({
              time: point.time as Time,
              value: values[index],
            }))
            .filter((d): d is LineData<Time> => d.value !== null);
        };

        ma5SeriesRef.current?.setData(formatMAData(ma5Values));
        ma20SeriesRef.current?.setData(formatMAData(ma20Values));
        ma60SeriesRef.current?.setData(formatMAData(ma60Values));
      }
    }

    chartRef.current?.timeScale().fitContent();
  }, [chartData, chartType, showMA, calculateMA]);

  // Update indicator data
  const updateIndicatorData = useCallback(() => {
    if (!chartData?.ohlc || chartData.ohlc.length === 0) return;
    if (selectedIndicator === 'none') return;

    // Use API data if available, otherwise calculate from OHLC
    const indicators = chartData.indicators && Object.keys(chartData.indicators).length > 0
      ? chartData.indicators
      : calculateIndicators(chartData.ohlc, selectedIndicator);

    // Update Bollinger bands (overlay on main chart)
    if (selectedIndicator === 'bollinger' && indicators.bollinger) {
      const upperData: LineData<Time>[] = indicators.bollinger.map((d) => ({
        time: d.time as Time,
        value: d.upper,
      }));
      const middleData: LineData<Time>[] = indicators.bollinger.map((d) => ({
        time: d.time as Time,
        value: d.middle,
      }));
      const lowerData: LineData<Time>[] = indicators.bollinger.map((d) => ({
        time: d.time as Time,
        value: d.lower,
      }));
      bollingerUpperRef.current?.setData(upperData);
      bollingerMiddleRef.current?.setData(middleData);
      bollingerLowerRef.current?.setData(lowerData);
    }

    // Update panel indicators
    if (!needsIndicatorPanel) return;

    switch (selectedIndicator) {
      case 'rsi':
        if (indicators.rsi && indicatorSeriesRef.current) {
          const data: LineData<Time>[] = indicators.rsi.map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));
          indicatorSeriesRef.current.setData(data);
        }
        break;

      case 'macd':
        if (indicators.macd) {
          if (indicatorSeriesRef.current) {
            const macdData: LineData<Time>[] = indicators.macd.map((d) => ({
              time: d.time as Time,
              value: d.macd,
            }));
            indicatorSeriesRef.current.setData(macdData);
          }
          if (indicatorSeries2Ref.current) {
            const signalData: LineData<Time>[] = indicators.macd.map((d) => ({
              time: d.time as Time,
              value: d.signal,
            }));
            indicatorSeries2Ref.current.setData(signalData);
          }
          if (indicatorHistogramRef.current) {
            const histData: HistogramData<Time>[] = indicators.macd.map((d) => ({
              time: d.time as Time,
              value: d.histogram,
              color: d.histogram >= 0 ? '#ef4444' : '#3b82f6',
            }));
            indicatorHistogramRef.current.setData(histData);
          }
        }
        break;

      case 'stochastic':
        if (indicators.stochastic) {
          if (indicatorSeriesRef.current) {
            const slowkData: LineData<Time>[] = indicators.stochastic.map((d) => ({
              time: d.time as Time,
              value: d.slowk,
            }));
            indicatorSeriesRef.current.setData(slowkData);
          }
          if (indicatorSeries2Ref.current) {
            const slowdData: LineData<Time>[] = indicators.stochastic.map((d) => ({
              time: d.time as Time,
              value: d.slowd,
            }));
            indicatorSeries2Ref.current.setData(slowdData);
          }
        }
        break;

      case 'adx':
        if (indicators.adx && indicatorSeriesRef.current) {
          const data: LineData<Time>[] = indicators.adx.map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));
          indicatorSeriesRef.current.setData(data);
        }
        break;

      case 'cci':
        if (indicators.cci && indicatorSeriesRef.current) {
          const data: LineData<Time>[] = indicators.cci.map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));
          indicatorSeriesRef.current.setData(data);
        }
        break;

      case 'mfi':
        if (indicators.mfi && indicatorSeriesRef.current) {
          const data: LineData<Time>[] = indicators.mfi.map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));
          indicatorSeriesRef.current.setData(data);
        }
        break;

      case 'obv':
        if (indicators.obv && indicatorSeriesRef.current) {
          const data: LineData<Time>[] = indicators.obv.map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));
          indicatorSeriesRef.current.setData(data);
        }
        break;

      case 'atr':
        if (indicators.atr && indicatorSeriesRef.current) {
          const data: LineData<Time>[] = indicators.atr.map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));
          indicatorSeriesRef.current.setData(data);
        }
        break;
    }

    indicatorChartRef.current?.timeScale().fitContent();
  }, [chartData, selectedIndicator, needsIndicatorPanel, calculateIndicators]);

  // Fetch data when stockId, range, or market changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const data = await fetchChartData();
        setChartData(data);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchChartData]);

  // Initialize chart when chart type changes or data is loaded
  useEffect(() => {
    initializeChart();
  }, [initializeChart]);

  // Update data when chart is initialized or data changes
  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  // Initialize indicator chart when indicator changes
  useEffect(() => {
    initializeIndicatorChart();
  }, [initializeIndicatorChart]);

  // Update indicator data
  useEffect(() => {
    updateIndicatorData();
  }, [updateIndicatorData]);

  // Initialize volume chart
  useEffect(() => {
    initializeVolumeChart();
  }, [initializeVolumeChart]);

  // Update volume data
  useEffect(() => {
    updateVolumeData();
  }, [updateVolumeData]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && chartRef.current) {
        const { width } = entries[0].contentRect;
        chartRef.current.applyOptions({ width });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [chartType]);

  // Handle indicator panel resize
  useEffect(() => {
    if (!indicatorContainerRef.current || !indicatorChartRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && indicatorChartRef.current) {
        const { width } = entries[0].contentRect;
        indicatorChartRef.current.applyOptions({ width });
      }
    });

    resizeObserver.observe(indicatorContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedIndicator]);

  // Handle volume panel resize
  useEffect(() => {
    if (!volumeContainerRef.current || !volumeChartRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && volumeChartRef.current) {
        const { width } = entries[0].contentRect;
        volumeChartRef.current.applyOptions({ width });
      }
    });

    resizeObserver.observe(volumeContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        areaSeriesRef.current = null;
        candlestickSeriesRef.current = null;
        ma5SeriesRef.current = null;
        ma20SeriesRef.current = null;
        ma60SeriesRef.current = null;
        bollingerUpperRef.current = null;
        bollingerMiddleRef.current = null;
        bollingerLowerRef.current = null;
      }
      if (indicatorChartRef.current) {
        indicatorChartRef.current.remove();
        indicatorChartRef.current = null;
        indicatorSeriesRef.current = null;
        indicatorSeries2Ref.current = null;
        indicatorHistogramRef.current = null;
      }
      if (volumeChartRef.current) {
        volumeChartRef.current.remove();
        volumeChartRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, []);

  // Toggle chart type
  const toggleChartType = () => {
    setChartType((prev) => (prev === 'area' ? 'candlestick' : 'area'));
  };

  // Toggle moving average
  const toggleMA = () => {
    setShowMA((prev) => !prev);
  };

  // Time range options
  const timeRanges: TimeRange[] = ['1주', '1개월', '3개월', '6개월', '1년'];

  return (
    <div className="w-full">
      {/* Chart container */}
      <div className="relative">
        <div ref={containerRef} style={{ height }} />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <span className="text-neutral-400 text-sm">차트 로딩중...</span>
          </div>
        )}

        {/* Error overlay */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <span className="text-neutral-400 text-sm">차트 데이터를 불러올 수 없습니다</span>
          </div>
        )}

        {/* Custom tooltip */}
        {tooltipData.visible && (
          <div
            className="absolute pointer-events-none bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10"
            style={{
              left: Math.min(tooltipData.x + 10, (containerRef.current?.clientWidth || 300) - 120),
              top: Math.max(tooltipData.y - 30, 10),
            }}
          >
            <div className="text-neutral-300">{tooltipData.date}</div>
            <div className="font-medium">{tooltipData.price}</div>
            {tooltipData.values.length > 0 && (
              <div className="mt-1 pt-1 border-t border-neutral-600">
                {tooltipData.values.map((v, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span style={{ color: v.color || '#9ca3af' }}>{v.label}</span>
                    <span>{v.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Volume panel */}
      <div className="relative border-t border-neutral-100">
        <div
          ref={volumeContainerRef}
          style={{ height: 40 }}
        />
        <div className="absolute top-1 left-2">
          <span className="text-xs text-neutral-400">거래량</span>
        </div>
        {/* Volume tooltip */}
        {volumeTooltip.visible && (
          <div
            className="absolute pointer-events-none bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10"
            style={{
              left: Math.min(volumeTooltip.x + 10, (volumeContainerRef.current?.clientWidth || 300) - 80),
              top: Math.max(volumeTooltip.y - 20, 5),
            }}
          >
            <div className="text-neutral-300">{volumeTooltip.date}</div>
            {volumeTooltip.values.map((v, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="text-neutral-400">{v.label}</span>
                <span className="font-medium">{v.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indicator panel (for panel-type indicators) */}
      {needsIndicatorPanel && (
        <div className="relative mt-1 border-t border-neutral-100">
          <div
            ref={indicatorContainerRef}
            style={{ height: 100 }}
          />
          <div className="absolute top-1 left-2">
            <span className="text-xs text-neutral-500 font-medium uppercase">
              {selectedIndicator}
            </span>
          </div>
          {/* Indicator tooltip */}
          {indicatorTooltip.visible && (
            <div
              className="absolute pointer-events-none bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10"
              style={{
                left: Math.min(indicatorTooltip.x + 10, (indicatorContainerRef.current?.clientWidth || 300) - 100),
                top: Math.max(indicatorTooltip.y - 20, 5),
              }}
            >
              <div className="text-neutral-300">{indicatorTooltip.date}</div>
              {indicatorTooltip.values.map((v, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span className="text-neutral-400">{v.label}</span>
                  <span className="font-medium">{v.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Time range selector and chart type toggle */}
      {showTimeRangeSelector && (
        <div className="flex gap-2 mt-4">
          {/* Time range buttons */}
          <div className="grid grid-cols-5 gap-2 flex-1">
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

          {/* Chart type toggle button */}
          <button
            onClick={toggleChartType}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer min-w-[60px]
              ${
                chartType === 'candlestick'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-150'
              }
            `}
            aria-label={chartType === 'area' ? '캔들 차트로 전환' : '라인 차트로 전환'}
          >
            {chartType === 'area' ? '캔들' : '라인'}
          </button>

          {/* Moving average toggle button (only in candlestick mode) */}
          {chartType === 'candlestick' && (
            <button
              onClick={toggleMA}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer min-w-[60px]
                ${
                  showMA
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-150'
                }
              `}
              aria-label={showMA ? '이동평균선 숨기기' : '이동평균선 표시'}
            >
              이평선
            </button>
          )}
        </div>
      )}

      {/* Indicator dropdown */}
      {showTimeRangeSelector && (
        <div className="mt-2">
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value as IndicatorType)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white text-neutral-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-300"
            aria-label="기술적 지표 선택"
          >
            <option value="none">지표 선택</option>
            <optgroup label="추세">
              <option value="macd">MACD</option>
              <option value="adx">ADX (추세강도)</option>
              <option value="bollinger">볼린저밴드</option>
            </optgroup>
            <optgroup label="모멘텀">
              <option value="rsi">RSI</option>
              <option value="stochastic">스토캐스틱</option>
              <option value="cci">CCI</option>
            </optgroup>
            <optgroup label="거래량">
              <option value="obv">OBV (거래량누적)</option>
              <option value="mfi">MFI (자금흐름)</option>
            </optgroup>
            <optgroup label="변동성">
              <option value="atr">ATR (평균진폭)</option>
            </optgroup>
          </select>

          {/* Indicator description */}
          {selectedIndicator !== 'none' && (
            <p className="text-xs text-neutral-500 mt-1 px-1">
              {INDICATOR_DESCRIPTIONS[selectedIndicator]}
            </p>
          )}
        </div>
      )}

      {/* Copyright notice */}
      <div className="mt-2 text-right">
        <span className="text-xs text-neutral-400">
          Chart powered by{' '}
          <a
            href="https://www.tradingview.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600"
          >
            TradingView
          </a>
        </span>
      </div>
    </div>
  );
}
