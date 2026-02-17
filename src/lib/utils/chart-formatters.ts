import type { ChartDataPoint, PriceStats } from '@/types/chart';

/**
 * 가격을 포맷팅 (천 단위 쉼표)
 * @param price 가격
 * @returns 포맷된 가격 문자열 (예: "28,050")
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

/**
 * 가격을 원화로 포맷팅
 * @param price 가격
 * @returns 포맷된 가격 문자열 (예: "28,050원")
 */
export function formatPriceWithUnit(price: number): string {
  return `${formatPrice(price)}원`;
}

/**
 * 가격을 시장에 따라 포맷팅 (KR: 원, US: $)
 * @param price 가격
 * @param market 시장 ('KR' | 'US')
 * @returns 포맷된 가격 문자열 (예: KR: "28,050원", US: "$259.96")
 */
export function formatPriceWithMarket(price: number, market: 'KR' | 'US'): string {
  if (market === 'US') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${formatPrice(price)}원`;
}

/**
 * 변동률을 포맷팅
 * @param percent 변동률 (소수)
 * @param decimals 소수점 자릿수 (기본: 2)
 * @returns 포맷된 변동률 문자열 (예: "+29.97%")
 */
export function formatPercent(percent: number, decimals: number = 2): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}

/**
 * 시간을 포맷팅 (간결한 형식)
 * @param time 시간 문자열 (예: "09:00")
 * @returns 포맷된 시간 문자열
 */
export function formatTime(time: string): string {
  // 이미 "HH:MM" 형식이면 그대로 반환
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  // ISO 형식이면 시간만 추출
  try {
    const date = new Date(time);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return time;
  }
}

/**
 * 차트 데이터로부터 가격 통계 계산
 * @param data 차트 데이터 배열
 * @param previousClose 이전 종가 (선택)
 * @returns 가격 통계 정보
 */
export function calculatePriceStats(
  data: ChartDataPoint[],
  previousClose?: number
): PriceStats {
  if (data.length === 0) {
    return {
      current: 0,
      min: 0,
      max: 0,
      change: 0,
      changePercent: 0,
      isPositive: true,
    };
  }

  const prices = data.map((d) => d.price);
  const current = prices[prices.length - 1];
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  // 이전 종가가 제공되면 사용, 아니면 첫 데이터 포인트 사용
  const basePrice = previousClose ?? prices[0];
  const change = current - basePrice;
  const changePercent = (change / basePrice) * 100;
  const isPositive = change >= 0;

  return {
    current,
    min,
    max,
    change,
    changePercent,
    isPositive,
  };
}

/**
 * Y축 범위 계산 (패딩 포함)
 * @param data 차트 데이터 배열
 * @param paddingPercent 패딩 비율 (기본: 10%)
 * @returns [최소값, 최대값] 튜플
 */
export function calculateYAxisDomain(
  data: ChartDataPoint[],
  paddingPercent: number = 0.1
): [number, number] {
  if (data.length === 0) {
    return [0, 100];
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  const padding = range * paddingPercent;

  return [min - padding, max + padding];
}

/**
 * X축 틱 간격 계산
 * @param dataLength 데이터 개수
 * @param maxTicks 최대 틱 개수 (기본: 6)
 * @returns 틱 간격
 */
export function calculateXAxisInterval(
  dataLength: number,
  maxTicks: number = 6
): number {
  if (dataLength <= maxTicks) {
    return 0; // 모든 틱 표시
  }

  return Math.ceil(dataLength / maxTicks);
}

/**
 * 기간별 X축 틱 날짜 배열 생성
 * @param data 차트 데이터 배열
 * @param range 시간 범위
 * @returns 표시할 X축 날짜 배열
 */
export function getXAxisTicks(
  data: ChartDataPoint[],
  range: '1주' | '1개월' | '3개월' | '6개월' | '1년'
): string[] {
  if (data.length === 0) return [];

  const dates = data.map((d) => d.time);
  const lastDate = new Date(dates[dates.length - 1]);

  // 1주: 데이터가 있는 모든 날 표시
  if (range === '1주') {
    return dates;
  }

  // 1개월: 5개 (매주 간격)
  if (range === '1개월') {
    return generateTicksFromEnd(dates, lastDate, 5, 7);
  }

  // 3개월: 4개 (매월 간격)
  if (range === '3개월') {
    return generateTicksFromEnd(dates, lastDate, 4, 30);
  }

  // 6개월: 4개 (2개월 간격)
  if (range === '6개월') {
    return generateTicksFromEnd(dates, lastDate, 4, 60);
  }

  // 1년: 5개 (3개월 간격)
  if (range === '1년') {
    return generateTicksFromEnd(dates, lastDate, 5, 90);
  }

  return dates;
}

/**
 * 마지막 날짜 기준으로 일정 간격의 틱 생성
 * @param dates 전체 날짜 배열
 * @param lastDate 마지막 날짜
 * @param tickCount 틱 개수
 * @param dayInterval 일 간격
 * @returns 틱 날짜 배열
 */
function generateTicksFromEnd(
  dates: string[],
  lastDate: Date,
  tickCount: number,
  dayInterval: number
): string[] {
  const ticks: string[] = [];
  const dateSet = new Set(dates);

  for (let i = tickCount - 1; i >= 0; i--) {
    const targetDate = new Date(lastDate);
    targetDate.setDate(targetDate.getDate() - i * dayInterval);
    const targetStr = targetDate.toISOString().split('T')[0];

    // 정확한 날짜가 데이터에 있으면 사용, 없으면 가장 가까운 날짜 찾기
    if (dateSet.has(targetStr)) {
      ticks.push(targetStr);
    } else {
      const closest = findClosestDate(dates, targetStr);
      if (closest && !ticks.includes(closest)) {
        ticks.push(closest);
      }
    }
  }

  return ticks.sort();
}

/**
 * 가장 가까운 날짜 찾기
 */
function findClosestDate(dates: string[], target: string): string | null {
  if (dates.length === 0) return null;

  const targetTime = new Date(target).getTime();
  let closest = dates[0];
  let minDiff = Math.abs(new Date(dates[0]).getTime() - targetTime);

  for (const date of dates) {
    const diff = Math.abs(new Date(date).getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = date;
    }
  }

  return closest;
}
