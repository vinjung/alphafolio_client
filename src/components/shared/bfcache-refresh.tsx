'use client';

import { useEffect } from 'react';

/**
 * Component that detects bfcache restoration and refreshes the page
 * to ensure data is up-to-date after back/forward navigation
 */
export function BfcacheRefresh() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // event.persisted is true when the page is restored from bfcache
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return null;
}
