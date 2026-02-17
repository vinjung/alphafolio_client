'use client';

import { useMemo } from 'react';
import type { TableVisualizationData } from '@/types/chart';

interface DataTableProps {
  data: TableVisualizationData;
  maxHeight?: number;
}

/**
 * Format number with thousand separators
 */
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  return value.toLocaleString('ko-KR');
}

/**
 * Format cell value based on type and column name
 */
function formatCellValue(
  value: string | number | null,
  header: string
): { text: string; colorClass: string } {
  if (value === null || value === undefined) {
    return { text: '-', colorClass: 'text-neutral-400' };
  }

  const headerLower = header.toLowerCase();

  // Percentage columns (change_rate, etc.)
  if (
    headerLower.includes('rate') ||
    headerLower.includes('change') ||
    headerLower.includes('percent') ||
    headerLower.includes('yield') ||
    headerLower.includes('roe') ||
    headerLower.includes('roa')
  ) {
    if (typeof value === 'number') {
      const formatted = `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
      const colorClass =
        value > 0
          ? 'text-red-500'
          : value < 0
            ? 'text-blue-500'
            : 'text-neutral-600';
      return { text: formatted, colorClass };
    }
  }

  // Price columns (English and Korean headers with unit suffix)
  if (
    headerLower.includes('price') ||
    headerLower.includes('close') ||
    headerLower.includes('open') ||
    headerLower.includes('high') ||
    headerLower.includes('low') ||
    headerLower === 'current' ||
    headerLower === 'prev_close' ||
    headerLower.includes('종가') ||
    headerLower.includes('고가') ||
    headerLower.includes('저가') ||
    headerLower.includes('현재가') ||
    headerLower.includes('목표가') ||
    (headerLower.includes('시가') && !headerLower.includes('시가총액'))
  ) {
    if (typeof value === 'number') {
      return { text: formatNumber(value), colorClass: 'text-neutral-900' };
    }
  }

  // Volume and trading value columns
  if (
    headerLower.includes('volume') ||
    headerLower.includes('trading') ||
    headerLower.includes('amount') ||
    headerLower.includes('market_cap') ||
    headerLower.includes('cap') ||
    headerLower.includes('시가총액') ||
    headerLower.includes('거래량') ||
    headerLower.includes('거래대금')
  ) {
    if (typeof value === 'number') {
      return { text: formatNumber(value), colorClass: 'text-neutral-700' };
    }
  }

  // RSI column
  if (headerLower === 'rsi') {
    if (typeof value === 'number') {
      const colorClass =
        value <= 30
          ? 'text-blue-600 font-medium'
          : value >= 70
            ? 'text-red-600 font-medium'
            : 'text-neutral-700';
      return { text: value.toFixed(1), colorClass };
    }
  }

  // PER, PBR columns
  if (headerLower === 'per' || headerLower === 'pbr') {
    if (typeof value === 'number') {
      return { text: value.toFixed(2), colorClass: 'text-neutral-700' };
    }
  }

  // Generic number
  if (typeof value === 'number') {
    return {
      text: Number.isInteger(value) ? formatNumber(value) : value.toFixed(2),
      colorClass: 'text-neutral-700',
    };
  }

  // String value
  return { text: String(value), colorClass: 'text-neutral-900' };
}

/**
 * Check if column should be right-aligned (numeric columns)
 */
function isNumericColumn(header: string): boolean {
  const numericKeywords = [
    'price',
    'close',
    'open',
    'high',
    'low',
    'volume',
    'trading',
    'amount',
    'cap',
    'rate',
    'change',
    'percent',
    'yield',
    'per',
    'pbr',
    'roe',
    'roa',
    'rsi',
    'eps',
    'bps',
    'dps',
    'count',
    'rank',
    'score',
    '종가',
    '시가',
    '고가',
    '저가',
    '현재가',
    '목표가',
    '거래량',
    '거래대금',
    '시가총액',
  ];
  const headerLower = header.toLowerCase();
  return numericKeywords.some((keyword) => headerLower.includes(keyword));
}

/**
 * DataTable Component
 * - Horizontal scroll for wide tables
 * - First column sticky
 * - Number formatting
 * - Color coding for change rates
 */
export function DataTable({ data, maxHeight = 400 }: DataTableProps) {
  const { title, data: tableData } = data;
  const { headers, rows, total_count, displayed_count } = tableData;

  // Memoize column alignment
  const columnAlignments = useMemo(
    () => headers.map((h) => (isNumericColumn(h) ? 'text-right' : 'text-left')),
    [headers]
  );

  if (!rows || rows.length === 0) {
    return (
      <div className="mt-3 p-4 bg-neutral-50 rounded-lg text-center text-neutral-500 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-3 w-full">
      {/* Title */}
      {title && (
        <div className="mb-2 text-sm font-medium text-neutral-700">{title}</div>
      )}

      {/* Table Container with horizontal scroll */}
      <div
        className="relative overflow-x-auto border border-neutral-200 rounded-lg"
        style={{ maxHeight }}
      >
        <table className="w-full text-sm border-collapse">
          {/* Header */}
          <thead className="sticky top-0 z-20 bg-neutral-100">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`
                    px-3 py-2 font-medium text-neutral-700 whitespace-nowrap border-b border-neutral-200
                    ${columnAlignments[idx]}
                    ${idx === 0 ? 'sticky left-0 z-30 bg-neutral-100 min-w-[100px]' : ''}
                  `}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white">
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
              >
                {row.map((cell, cellIdx) => {
                  const { text, colorClass } = formatCellValue(
                    cell,
                    headers[cellIdx]
                  );
                  return (
                    <td
                      key={cellIdx}
                      className={`
                        px-3 py-2 whitespace-nowrap
                        ${columnAlignments[cellIdx]}
                        ${colorClass}
                        ${cellIdx === 0 ? 'sticky left-0 z-10 bg-white font-medium' : ''}
                      `}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      {total_count > displayed_count && (
        <div className="mt-2 text-xs text-neutral-500 text-right">
          {displayed_count}개 표시 / 전체 {total_count}개
        </div>
      )}
    </div>
  );
}
