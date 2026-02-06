import { useState, useMemo } from 'react';

export default function DataTable({
  columns,
  data = [],
  onRowClick,
  searchable = true,
  pageSize = 15,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  /* ---- Filtering ---- */
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, search, columns]);

  /* ---- Sorting ---- */
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'es', {
        sensitivity: 'base',
      });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  /* ---- Pagination ---- */
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedData = sortedData.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize
  );

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /* ---- Sort chevron icon ---- */
  const SortIcon = ({ columnKey }) => {
    const isActive = sortKey === columnKey;
    return (
      <span className="inline-flex flex-col ml-1.5 -space-y-1">
        <svg
          className={`w-3 h-3 ${isActive && sortDir === 'asc' ? 'text-guinda' : 'text-text-muted/40'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <svg
          className={`w-3 h-3 ${isActive && sortDir === 'desc' ? 'text-guinda' : 'text-text-muted/40'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* Search */}
      {searchable && (
        <div className="mb-4">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-[40px] pl-10 pr-3.5 py-2.5 bg-white border border-border rounded-md text-[0.9375rem] text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda transition-all duration-150"
            />
          </div>
        </div>
      )}

      {/* Table card */}
      <div
        className="bg-white rounded-lg border-0 overflow-hidden"
        style={{ boxShadow: '0 2px 6px 0 rgba(67,89,113,0.12)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      'text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5',
                      col.sortable !== false
                        ? 'cursor-pointer select-none hover:text-text-heading'
                        : '',
                    ].join(' ')}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() =>
                      col.sortable !== false && handleSort(col.key)
                    }
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      {col.sortable !== false && (
                        <SortIcon columnKey={col.key} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-16 text-text-muted"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-10 h-10 text-text-muted/50"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                      </svg>
                      <p className="text-[0.9375rem]">Sin resultados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedData.map((row, rowIdx) => (
                  <tr
                    key={row.id ?? rowIdx}
                    onClick={() => onRowClick?.(row)}
                    className={[
                      'border-b border-[#f0f0f0] last:border-0 transition-colors',
                      onRowClick
                        ? 'cursor-pointer hover:bg-[#f9fafb]'
                        : 'hover:bg-[#f9fafb]',
                    ].join(' ')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-5 py-3.5 text-[0.9375rem] text-text-primary"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? '\u2014')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sortedData.length > pageSize && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-[0.8125rem] text-text-muted">
            {safePage * pageSize + 1}&ndash;
            {Math.min((safePage + 1) * pageSize, sortedData.length)} de{' '}
            {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center h-[38px] px-3.5 rounded-md border border-border text-[0.8125rem] font-medium text-text-secondary hover:bg-bg-hover hover:text-text-heading disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Anterior
            </button>
            <span className="px-2 py-1 text-[0.8125rem] text-text-muted font-medium">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex items-center h-[38px] px-3.5 rounded-md border border-border text-[0.8125rem] font-medium text-text-secondary hover:bg-bg-hover hover:text-text-heading disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Siguiente
              <svg
                className="w-4 h-4 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
