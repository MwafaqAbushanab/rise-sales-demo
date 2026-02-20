import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], defaultPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);

  // Reset to page 1 when items change significantly
  useMemo(() => {
    if (page > totalPages) setPage(1);
  }, [items.length, totalPages, page]);

  return {
    page, totalPages, paginatedItems, pageSize,
    setPageSize: (size: number) => { setPageSize(size); setPage(1); },
    goToPage, nextPage, prevPage,
  };
}
