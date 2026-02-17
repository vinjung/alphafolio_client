'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/shared/text';

type StockListItem = {
  symbol: string;
  stockName: string;
  stockNameKr?: string | null;
  market: 'KR' | 'US';
};

/**
 * Validate search query
 * - Korean: at least 1 complete character (consonant + vowel)
 * - English: at least 1 letter
 * - Numbers: at least 1 digit
 */
function isValidSearchQuery(query: string): boolean {
  if (!query || query.trim().length === 0) {
    return false;
  }

  const trimmed = query.trim();

  // Check for complete Korean character (has both consonant and vowel)
  const koreanCompleteChar = /[가-힣]/;
  // Check for English letter
  const englishLetter = /[a-zA-Z]/;
  // Check for digit
  const digit = /[0-9]/;

  return (
    koreanCompleteChar.test(trimmed) ||
    englishLetter.test(trimmed) ||
    digit.test(trimmed)
  );
}

/**
 * Filter stocks by query (client-side)
 */
function filterStocks(stocks: StockListItem[], query: string): StockListItem[] {
  if (!isValidSearchQuery(query)) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  const limit = 20;

  const filtered = stocks.filter((stock) => {
    const symbolMatch = stock.symbol.toLowerCase().includes(searchTerm);
    const nameMatch = stock.stockName.toLowerCase().includes(searchTerm);
    const nameKrMatch = stock.stockNameKr?.toLowerCase().includes(searchTerm);
    return symbolMatch || nameMatch || nameKrMatch;
  });

  // Sort: exact symbol match first, then by stockName
  filtered.sort((a, b) => {
    const queryUpper = query.toUpperCase();
    const aExact = a.symbol.toUpperCase() === queryUpper ? 0 : 1;
    const bExact = b.symbol.toUpperCase() === queryUpper ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return (a.stockName || '').localeCompare(b.stockName || '');
  });

  return filtered.slice(0, limit);
}

/**
 * Get display name for a stock
 * - KR: stockName
 * - US: stockNameKr (fallback to stockName)
 */
function getDisplayName(stock: StockListItem): string {
  if (stock.market === 'US') {
    return stock.stockNameKr || stock.stockName || stock.symbol;
  }
  return stock.stockName || stock.symbol;
}

interface StockSearchProps {
  placeholder?: string;
  className?: string;
}

export const StockSearch: React.FC<StockSearchProps> = ({
  placeholder = '종목명 또는 종목코드 검색',
  className = '',
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [allStocks, setAllStocks] = useState<StockListItem[]>([]);
  const [results, setResults] = useState<StockListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load all stocks on mount (for client-side filtering)
  useEffect(() => {
    const fetchAllStocks = async () => {
      try {
        const response = await fetch('/api/stock/list');
        if (response.ok) {
          const data = await response.json();
          setAllStocks(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load stock list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStocks();
  }, []);

  // Filter stocks on query change (client-side)
  useEffect(() => {
    if (query && allStocks.length > 0) {
      const filtered = filterStocks(allStocks, query);
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, allStocks]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setErrorMessage(null);
    setSelectedSymbol(null);
    setShowDropdown(true);
  };

  // Handle autocomplete item click
  const handleResultClick = (result: StockListItem) => {
    const displayName = getDisplayName(result);
    setQuery(displayName);
    setSelectedSymbol(result.symbol);
    setShowDropdown(false);
    setResults([]);
  };

  // Handle search button click
  const handleSearch = useCallback(async () => {
    const searchQuery = query.trim();

    if (!searchQuery) {
      setErrorMessage('정보가 없습니다 다시 입력해주세요');
      return;
    }

    // If a stock was selected from dropdown, use its symbol
    if (selectedSymbol) {
      router.push(`/stock-detail/${selectedSymbol}`);
      return;
    }

    // Otherwise, try to find by symbol or name
    const upperQuery = searchQuery.toUpperCase();

    // First, try exact symbol match
    const exactMatch = allStocks.find(
      (s) => s.symbol.toUpperCase() === upperQuery
    );

    if (exactMatch) {
      router.push(`/stock-detail/${exactMatch.symbol}`);
      return;
    }

    // Then, try exact name match
    const nameMatch = allStocks.find(
      (s) =>
        s.stockName.toLowerCase() === searchQuery.toLowerCase() ||
        s.stockNameKr?.toLowerCase() === searchQuery.toLowerCase()
    );

    if (nameMatch) {
      router.push(`/stock-detail/${nameMatch.symbol}`);
      return;
    }

    // No match found
    setErrorMessage('정보가 없습니다 다시 입력해주세요');
  }, [query, selectedSymbol, allStocks, router]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors"
        >
          검색
        </button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <Text variant="b3" className="text-red-500 mt-2">
          {errorMessage}
        </Text>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50"
        >
          {results.map((result, index) => (
            <button
              key={`${result.market}-${result.symbol}-${index}`}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 text-left hover:bg-neutral-100 border-b border-neutral-100 last:border-b-0 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Text variant="s1">{result.stockName}</Text>
                  {result.market === 'US' && result.stockNameKr && (
                    <Text variant="b3" className="text-neutral-500">
                      ({result.stockNameKr})
                    </Text>
                  )}
                </div>
                <Text variant="b3" className="text-neutral-500">
                  {result.symbol}
                </Text>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  result.market === 'KR'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {result.market}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;
