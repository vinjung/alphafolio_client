'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Text } from '@/components/shared/text';
import { RebalancingInfoButton } from './rebalancingInfoModal';
import type { RebalancingReportData } from '@/lib/server/portfolio';

interface RebalancingReportSectionProps {
  portfolioId: string;
  planDate: string | null;
  report: RebalancingReportData | null;
}

/**
 * Get localStorage key for rebalancing report last seen date
 */
function getStorageKey(portfolioId: string): string {
  return `rebalancing:lastSeen:${portfolioId}`;
}

/**
 * Check if the report is new (not seen before)
 */
function isNewReport(portfolioId: string, planDate: string | null): boolean {
  if (!planDate) return false;

  if (typeof window === 'undefined') return false;

  const lastSeen = localStorage.getItem(getStorageKey(portfolioId));
  return lastSeen !== planDate;
}

/**
 * Mark the report as seen
 */
function markReportAsSeen(portfolioId: string, planDate: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(getStorageKey(portfolioId), planDate);
}

// Fields to hide from report (top-level)
const HIDDEN_FIELDS = [
  'report_generated_at',
  '_generation_metadata',
];

// English to Korean title mapping
const TITLE_MAP: Record<string, string> = {
  // Section titles
  'section_2_background': '리밸런싱 배경',
  'section_3_execution': '실행 내용',
  'section_4_result': '결과',
  // Executive summary fields
  'key_points': 'Key point',
  'bottom_line': 'Bottom line',
  'next_actions': 'Next actions',
  // Section 2 fields
  'before_state': '리밸런싱 전 상태',
  'trigger_type': '트리거 유형',
  'market_context': '시장 상황',
  'trigger_narrative': '트리거 설명',
  // Section 3 fields
  'summary': '요약',
  'trade_table': '거래 내역',
  'buy_decisions': '매수 결정',
  'sell_decisions': '매도 결정',
  // Section 4 fields
  'key_risks': '주요 리스크',
  'after_state': '리밸런싱 후 상태',
  'expected_impact': '예상 영향',
  'monitoring_points': '모니터링 포인트',
};

// Trigger type mapping
const TRIGGER_TYPE_MAP: Record<string, string> = {
  'GRADE_DROP': '퀀트 등급 하락',
  'STOP_LOSS': '고정 손절 임계값 도달',
  'TRAILING_STOP': '샹들리에 엑시트',
  'SCALE_OUT': '분할 익절',
  'MDD_LIMIT': 'MDD 한도 초과',
  'SUSPENDED': '거래정지 감지',
  'MARKET_CRASH': '벤치마크 일일 폭락',
  'VAR_LIMIT': 'VaR 60일 한도 초과',
  'CASH_DRAG': '유휴 현금 비율 한도 초과',
};

// Market sentiment mapping
const SENTIMENT_MAP: Record<string, string> = {
  'bullish': '강세',
  'neutral': '중립',
  'cautious': '신중',
  'bearish': '약세',
};

/**
 * Format camelCase or snake_case key to readable text with Korean translation
 */
function formatKeyName(key: string): string {
  // Check if there's a Korean translation
  if (TITLE_MAP[key]) {
    return TITLE_MAP[key];
  }

  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'boolean') {
    return value ? '예' : '아니오';
  }
  return String(value);
}

/**
 * Render executive summary section with headline as title, then key_points -> bottom_line -> next_actions
 */
function renderExecutiveSummary(data: Record<string, unknown>) {
  const headline = data.headline as string | undefined;
  const keyPoints = data.key_points as string[] | undefined;
  const bottomLine = data.bottom_line as string | undefined;
  const nextActions = data.next_actions as string[] | undefined;

  return (
    <div className="flex flex-col gap-2">
      {/* Use headline as section title */}
      {headline && <Text variant="s1" className="text-neutral-800">{headline}</Text>}
      <div className="bg-neutral-50 rounded-lg p-3 flex flex-col gap-3">
        {keyPoints && keyPoints.length > 0 && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['key_points']}</Text>
            <ul className="list-disc ml-6">
              {keyPoints.map((item, idx) => (
                <li key={idx}>
                  <Text variant="b2" className="text-neutral-600">{item}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
        {bottomLine && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['bottom_line']}</Text>
            <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{bottomLine}</Text>
          </div>
        )}
        {nextActions && nextActions.length > 0 && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['next_actions']}</Text>
            <ul className="list-disc ml-6">
              {nextActions.map((item, idx) => (
                <li key={idx}>
                  <Text variant="b2" className="text-neutral-600">{item}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render trade table with scrollable table format
 */
function renderTradeTable(data: { columns: string[]; rows: (string | number)[][] }) {
  const { columns, rows } = data;

  if (!columns || !rows || rows.length === 0) return null;

  // Format cell value (add commas to numbers)
  const formatCell = (value: string | number): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  // Get cell alignment based on column type
  const getCellAlign = (colIndex: number): string => {
    // First column (종목명) left-aligned, others center-aligned
    return colIndex === 0 ? 'text-left' : 'text-center';
  };

  // Get cell color for 거래구분 column
  const getCellColor = (value: string | number, colName: string): string => {
    if (colName === '거래구분' && typeof value === 'string') {
      if (value.includes('매수')) return 'text-red-600 font-semibold';
      if (value.includes('매도')) return 'text-blue-600 font-semibold';
    }
    return 'text-neutral-700';
  };

  return (
    <div className="flex flex-col gap-1">
      <Text variant="b2" className="text-neutral-700 font-semibold">리밸런싱 거래내역</Text>
      <div className="relative overflow-x-auto overflow-y-auto -webkit-overflow-scrolling-touch rounded-lg border border-neutral-200" style={{ maxHeight: '320px' }}>
        <table className="w-full border-collapse">
          <thead className="bg-neutral-100 sticky top-0 z-20">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`${idx === 0 ? 'sticky left-0 z-30 bg-neutral-100' : ''} px-3 py-2 border-b border-neutral-200 whitespace-nowrap ${getCellAlign(idx)}`}
                >
                  <Text variant="b2" className="text-neutral-700 font-semibold">{col}</Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="bg-white">
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`${cellIdx === 0 ? 'sticky left-0 z-10 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.05)]' : ''} px-3 py-2 border-b border-neutral-100 whitespace-nowrap ${getCellAlign(cellIdx)}`}
                  >
                    <Text variant="b2" className={getCellColor(cell, columns[cellIdx])}>
                      {formatCell(cell)}
                    </Text>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Render state object (before_state, after_state, market_context, summary, expected_impact)
 */
function renderStateObject(state: Record<string, unknown>) {
  const labelMap: Record<string, string> = {
    // before_state / after_state
    'stock_count': '종목 수',
    'total_value': '총 평가액',
    'problem_summary': '문제 요약',
    'max_drawdown_pct': '최대 낙폭',
    'cumulative_return_pct': '누적 수익률',
    'change_narrative': '변화 설명',
    // market_context
    'sentiment': '시장 심리',
    'key_factors': '주요 요인',
    'investor_flow': '투자자 동향',
    // summary (section_3_execution)
    'buy_count': '매수 종목 수',
    'sell_count': '매도 종목 수',
    'net_cashflow': '순 현금흐름',
    'total_trades': '총 거래 수',
    'total_buy_amount': '총 매수 금액',
    'total_sell_amount': '총 매도 금액',
    // expected_impact
    'risk_profile': '리스크 프로필',
    'return_outlook': '수익 전망',
  };

  return (
    <div className="flex flex-col gap-1">
      {Object.entries(state).map(([key, value]) => {
        // Handle array values (like key_factors)
        if (Array.isArray(value)) {
          return (
            <div key={key} className="flex flex-col gap-0.5 py-0.5">
              <Text variant="b2" className="text-neutral-600">{labelMap[key] || formatKeyName(key)}</Text>
              <ul className="list-disc ml-6">
                {value.map((item, idx) => (
                  <li key={idx}>
                    <Text variant="b2" className="text-neutral-800">{String(item)}</Text>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        // Handle long text values (like change_narrative, risk_profile, return_outlook)
        if (typeof value === 'string' && value.length > 50) {
          return (
            <div key={key} className="flex flex-col gap-0.5 py-0.5">
              <Text variant="b2" className="text-neutral-600">{labelMap[key] || formatKeyName(key)}</Text>
              <Text variant="b2" className="text-neutral-800 whitespace-pre-line">{value}</Text>
            </div>
          );
        }
        // Handle number and short string values
        return (
          <div key={key} className="flex justify-between py-0.5">
            <Text variant="b2" className="text-neutral-600">{labelMap[key] || formatKeyName(key)}</Text>
            <Text variant="b2" className="text-neutral-800">
              {typeof value === 'number'
                ? (key.includes('pct') ? `${value.toFixed(2)}%` : value.toLocaleString())
                : (key === 'sentiment' && typeof value === 'string' ? SENTIMENT_MAP[value] || value : String(value))}
            </Text>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Render buy decisions array with actual DB structure
 */
function renderBuyDecisions(decisions: Array<{
  symbol: string;
  stock_name: string;
  decision_narrative: string;
  key_factors?: string[];
  risk_note?: string;
  opportunity_analysis?: { why_now?: string; sector_fit?: string };
}>) {
  if (!decisions || decisions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {decisions.map((decision, idx) => (
        <div key={idx} className="bg-white rounded border border-neutral-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-600">매수</span>
            <Link href={`/stock-detail/${decision.symbol}`}>
              <Text variant="b2" className="font-semibold underline">{decision.stock_name}</Text>
            </Link>
            <Text variant="b2" className="text-neutral-400">({decision.symbol})</Text>
          </div>
          <Text variant="b2" className="text-neutral-700 whitespace-pre-line">{decision.decision_narrative}</Text>
          {decision.risk_note && (
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <Text variant="b2" className="text-yellow-700">{decision.risk_note}</Text>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Render sell decisions array with actual DB structure
 */
function renderSellDecisions(decisions: Array<{
  symbol: string;
  stock_name: string;
  decision_narrative: string;
  key_factors?: string[];
  entry_vs_current?: { entry_summary?: string; thesis_change?: string; current_summary?: string };
}>) {
  if (!decisions || decisions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {decisions.map((decision, idx) => (
        <div key={idx} className="bg-white rounded border border-neutral-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-600">매도</span>
            <Link href={`/stock-detail/${decision.symbol}`}>
              <Text variant="b2" className="font-semibold underline">{decision.stock_name}</Text>
            </Link>
            <Text variant="b2" className="text-neutral-400">({decision.symbol})</Text>
          </div>
          <Text variant="b2" className="text-neutral-700 whitespace-pre-line">{decision.decision_narrative}</Text>
        </div>
      ))}
    </div>
  );
}

/**
 * Render key risks array with risk/mitigation pairs
 */
function renderKeyRisks(risks: Array<{ risk: string; mitigation: string }>) {
  if (!risks || risks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {risks.map((item, idx) => (
        <div key={idx} className="bg-white rounded border border-neutral-200 p-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 shrink-0">Risk</span>
              <Text variant="b2" className="text-neutral-700">{item.risk}</Text>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 shrink-0">대응</span>
              <Text variant="b2" className="text-neutral-600">{item.mitigation}</Text>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Render section with filtered fields
 */
function renderSection(title: string, data: Record<string, unknown>, hiddenFields: string[]) {
  const filteredEntries = Object.entries(data).filter(
    ([key, value]) => !hiddenFields.includes(key) && value !== null && value !== undefined
  );

  if (filteredEntries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="s1" className="text-neutral-800">{title}</Text>
      <div className="bg-neutral-50 rounded-lg p-3 flex flex-col gap-2">
        {filteredEntries.map(([key, value]) => {
          if (typeof value === 'string') {
            return (
              <div key={key} className="flex flex-col gap-1">
                <Text variant="b2" className="text-neutral-700 font-semibold">{formatKeyName(key)}</Text>
                <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{value}</Text>
              </div>
            );
          }
          if (Array.isArray(value)) {
            return (
              <div key={key} className="flex flex-col gap-1">
                <Text variant="b2" className="text-neutral-700 font-semibold">{formatKeyName(key)}</Text>
                <ul className="list-disc ml-6">
                  {value.map((item, idx) => (
                    <li key={idx}>
                      <Text variant="b2" className="text-neutral-600">
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          if (typeof value === 'object' && value !== null) {
            // Special handling for trade_table
            if (key === 'trade_table') {
              const tableData = value as { columns: string[]; rows: (string | number)[][] };
              if (tableData.columns && tableData.rows) {
                return <div key={key}>{renderTradeTable(tableData)}</div>;
              }
            }
            // Default object rendering
            return (
              <div key={key} className="flex flex-col gap-1">
                <Text variant="b2" className="text-neutral-700 font-semibold">{formatKeyName(key)}</Text>
                <div className="ml-2">
                  {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                    <div key={subKey} className="flex justify-between py-1">
                      <Text variant="b2" className="text-neutral-600">{formatKeyName(subKey)}</Text>
                      <Text variant="b2" className="text-neutral-800">{formatValue(subValue)}</Text>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={key} className="flex justify-between py-1">
              <Text variant="b2" className="text-neutral-600">{formatKeyName(key)}</Text>
              <Text variant="b2" className="text-neutral-800">{formatValue(value)}</Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Render generic section for unknown fields
 */
function renderGenericSection(key: string, value: unknown) {
  if (typeof value === 'string') {
    return (
      <div key={key} className="flex flex-col gap-1">
        <Text variant="s1" className="text-neutral-800">{formatKeyName(key)}</Text>
        <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{value}</Text>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div key={key} className="flex flex-col gap-2">
        <Text variant="s1" className="text-neutral-800">{formatKeyName(key)}</Text>
        <ul className="list-disc ml-6">
          {value.map((item, idx) => (
            <li key={idx}>
              <Text variant="b2" className="text-neutral-600">
                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return renderSection(formatKeyName(key), value as Record<string, unknown>, []);
  }
  return (
    <div key={key} className="flex justify-between py-1">
      <Text variant="b2" className="text-neutral-600">{formatKeyName(key)}</Text>
      <Text variant="b2" className="text-neutral-800">{formatValue(value)}</Text>
    </div>
  );
}

/**
 * Render section_2_background with custom handling
 */
function renderSection2Background(data: Record<string, unknown>) {
  const beforeState = data.before_state;
  const triggerType = data.trigger_type as string | undefined;
  const marketContext = data.market_context;
  const triggerNarrative = data.trigger_narrative as string | undefined;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="s1" className="text-neutral-800">{TITLE_MAP['section_2_background']}</Text>
      <div className="bg-neutral-50 rounded-lg p-3 flex flex-col gap-3">
        {(typeof beforeState === 'string' || (typeof beforeState === 'object' && beforeState !== null)) && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['before_state']}</Text>
            {typeof beforeState === 'string' ? (
              <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{beforeState}</Text>
            ) : (
              renderStateObject(beforeState as Record<string, unknown>)
            )}
          </div>
        )}
        {triggerType && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['trigger_type']}</Text>
            <Text variant="b2" className="text-neutral-600">{TRIGGER_TYPE_MAP[triggerType] || triggerType}</Text>
          </div>
        )}
        {(typeof marketContext === 'string' || (typeof marketContext === 'object' && marketContext !== null)) && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['market_context']}</Text>
            {typeof marketContext === 'string' ? (
              <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{marketContext}</Text>
            ) : (
              renderStateObject(marketContext as Record<string, unknown>)
            )}
          </div>
        )}
        {triggerNarrative && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['trigger_narrative']}</Text>
            <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{triggerNarrative}</Text>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render section_3_execution with special handling for trade_table, buy_decisions, sell_decisions
 */
function renderSection3Execution(data: Record<string, unknown>) {
  const summary = data.summary;
  const tradeTable = data.trade_table as { columns: string[]; rows: (string | number)[][] } | undefined;
  const buyDecisions = data.buy_decisions as Array<{
    symbol: string;
    stock_name: string;
    decision_narrative: string;
    key_factors?: string[];
    risk_note?: string;
    opportunity_analysis?: { why_now?: string; sector_fit?: string };
  }> | undefined;
  const sellDecisions = data.sell_decisions as Array<{
    symbol: string;
    stock_name: string;
    decision_narrative: string;
    key_factors?: string[];
    entry_vs_current?: { entry_summary?: string; thesis_change?: string; current_summary?: string };
  }> | undefined;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="s1" className="text-neutral-800">{TITLE_MAP['section_3_execution']}</Text>
      <div className="bg-neutral-50 rounded-lg p-3 flex flex-col gap-3">
        {(typeof summary === 'string' || (typeof summary === 'object' && summary !== null)) && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['summary']}</Text>
            {typeof summary === 'string' ? (
              <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{summary}</Text>
            ) : (
              renderStateObject(summary as Record<string, unknown>)
            )}
          </div>
        )}
        {tradeTable && tradeTable.columns && tradeTable.rows && renderTradeTable(tradeTable)}
        {buyDecisions && buyDecisions.length > 0 && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['buy_decisions']}</Text>
            {renderBuyDecisions(buyDecisions)}
          </div>
        )}
        {sellDecisions && sellDecisions.length > 0 && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['sell_decisions']}</Text>
            {renderSellDecisions(sellDecisions)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render section_4_result with special handling for key_risks
 */
function renderSection4Result(data: Record<string, unknown>) {
  const keyRisks = data.key_risks as Array<{ risk: string; mitigation: string }> | undefined;
  const afterState = data.after_state;
  const expectedImpact = data.expected_impact;
  const monitoringPoints = data.monitoring_points as string[] | undefined;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="s1" className="text-neutral-800">{TITLE_MAP['section_4_result']}</Text>
      <div className="bg-neutral-50 rounded-lg p-3 flex flex-col gap-3">
        {(typeof afterState === 'string' || (typeof afterState === 'object' && afterState !== null)) && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['after_state']}</Text>
            {typeof afterState === 'string' ? (
              <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{afterState}</Text>
            ) : (
              renderStateObject(afterState as Record<string, unknown>)
            )}
          </div>
        )}
        {(typeof expectedImpact === 'string' || (typeof expectedImpact === 'object' && expectedImpact !== null)) && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['expected_impact']}</Text>
            {typeof expectedImpact === 'string' ? (
              <Text variant="b2" className="text-neutral-600 whitespace-pre-line">{expectedImpact}</Text>
            ) : (
              renderStateObject(expectedImpact as Record<string, unknown>)
            )}
          </div>
        )}
        {keyRisks && keyRisks.length > 0 && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['key_risks']}</Text>
            {renderKeyRisks(keyRisks)}
          </div>
        )}
        {monitoringPoints && monitoringPoints.length > 0 && (
          <div className="flex flex-col gap-1">
            <Text variant="b2" className="text-neutral-700 font-semibold">{TITLE_MAP['monitoring_points']}</Text>
            <ul className="list-disc ml-6">
              {monitoringPoints.map((item, idx) => (
                <li key={idx}>
                  <Text variant="b2" className="text-neutral-600">{item}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render report content from JSONB with specific field handling
 */
function ReportContent({ report }: { report: RebalancingReportData }) {
  if (!report || Object.keys(report).length === 0) {
    return (
      <Text variant="b2" className="text-neutral-500">
        리포트 데이터가 없습니다.
      </Text>
    );
  }

  // Extract sections in display order (new DB template)
  const executiveSummary = report.executive_summary as Record<string, unknown> | undefined;
  const section2Background = report.section_2_background as Record<string, unknown> | undefined;
  const section3Execution = report.section_3_execution as Record<string, unknown> | undefined;
  const section4Result = report.section_4_result as Record<string, unknown> | undefined;

  // Defined section keys (to exclude from "other sections")
  const definedSections = [
    'executive_summary',
    'section_2_background',
    'section_3_execution',
    'section_4_result',
    ...HIDDEN_FIELDS,
  ];

  // Get other sections not in the defined order
  const otherSections = Object.entries(report).filter(
    ([key, value]) => !definedSections.includes(key) && value !== null && value !== undefined
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Executive Summary - headline as title */}
      {executiveSummary && renderExecutiveSummary(executiveSummary)}

      {/* 2. section_2_background - 리밸런싱 배경 */}
      {section2Background && renderSection2Background(section2Background)}

      {/* 3. section_3_execution - 실행 내용 */}
      {section3Execution && renderSection3Execution(section3Execution)}

      {/* 4. section_4_result - 결과 */}
      {section4Result && renderSection4Result(section4Result)}

      {/* Other sections not in defined order */}
      {otherSections.map(([key, value]) => renderGenericSection(key, value))}
    </div>
  );
}

export function RebalancingReportSection({
  portfolioId,
  planDate,
  report,
}: RebalancingReportSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [showNewIcon, setShowNewIcon] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  // Check if report is new on mount
  useEffect(() => {
    setShowNewIcon(isNewReport(portfolioId, planDate));
  }, [portfolioId, planDate]);

  // IntersectionObserver to detect when section is visible
  useEffect(() => {
    if (!planDate || hasBeenSeen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenSeen) {
            // User has seen the report section
            markReportAsSeen(portfolioId, planDate);
            setShowNewIcon(false);
            setHasBeenSeen(true);
          }
        });
      },
      {
        threshold: 0.5, // 50% of section visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [portfolioId, planDate, hasBeenSeen]);

  return (
    <section ref={sectionRef} className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-1">
            <Text variant="s1">⚖️ 리밸런싱 리포트</Text>
            <RebalancingInfoButton />
          </div>
          <div className="flex flex-row justify-between gap-1 items-center">
            {showNewIcon && <Icon.new size={14} />}
            <Text variant="b3">
              <span className="text-neutral-600">업데이트 |</span>
              {planDate || '-'}
            </Text>
          </div>
        </div>
      </div>
      <div className="px-4 py-4">
        {report ? (
          <ReportContent report={report} />
        ) : (
          <Text variant="b2" className="text-neutral-500">
            아직 리밸런싱이 발생하지 않았습니다.
          </Text>
        )}
      </div>
    </section>
  );
}
