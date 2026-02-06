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
      const cmp = String(aVal).localeCompare(String(bVal), 'es', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedData = sortedData.slice(safePage * pageSize, (safePage + 1) * pageSize);

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

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full max-w-xs px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-guinda/40 focus:ring-1 focus:ring-guinda/10 transition-all"
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0f0f0]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    'text-left text-[11px] font-medium text-[#aaa] uppercase tracking-wider px-5 py-3',
                    col.sortable !== false ? 'cursor-pointer select-none hover:text-[#666]' : '',
                  ].join(' ')}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortKey === col.key && (
                      <svg className="w-3 h-3 text-guinda" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {sortDir === 'asc' ? <path d="M5 15l7-7 7 7" /> : <path d="M19 9l-7 7-7-7" />}
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-[#bbb]">
                  <p className="text-sm">Sin resultados</p>
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIdx) => (
                <tr
                  key={row.id ?? rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={[
                    'border-b border-[#f8f8f8] last:border-0 transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-[#fafafa]' : 'hover:bg-[#fcfcfc]',
                  ].join(' ')}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3 text-[#333]">
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedData.length > pageSize && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-xs text-[#aaa]">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sortedData.length)} de {sortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1.5 rounded-lg border border-[#e0e0e0] text-xs text-[#666] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 text-xs text-[#aaa]">
              {safePage + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-[#e0e0e0] text-xs text-[#666] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
