import { useMemo, useState } from 'react';

const pageSizes = [5, 10, 25, 50];

function DataTable({
  title,
  rows,
  columns,
  searchPlaceholder = 'Search records...',
  filters = ['All', 'Active', 'Pending', 'Archived'],
  showActions = true,
  addAction,
  onAction,
}) {
  const [viewMode, setViewMode] = useState('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [modalState, setModalState] = useState(null);

  const filteredRows = useMemo(() => {
    let result = rows;
    const normalized = query.trim().toLowerCase();

    if (normalized) {
      result = result.filter((row) => Object.values(row).join(' ').toLowerCase().includes(normalized));
    }

    if (activeFilter !== 'All') {
      result = result.filter((row) => row.status === activeFilter || row.role === activeFilter || row.type === activeFilter);
    }

    return result;
  }, [activeFilter, query, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = visibleRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, filteredRows.length);

  const updatePageSize = (event) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  const openModal = (type, row) => {
    if (onAction) {
      onAction(type, row);
      return;
    }
    setModalState({ type, row });
  };

  const closeModal = () => setModalState(null);

  const getDisplayTitle = (row) => {
    if (!row) return 'Record';
    const title = row.name || row.title || row.campaign || row.album || row.author || row.email;
    if (typeof title === 'object' && title !== null) return title.fr || title.en || 'Record';
    return title || 'Unnamed Record';
  };

  const modalTitle = modalState ? `${modalState.type} ${getDisplayTitle(modalState.row)}` : '';
  const modalEntries = modalState ? Object.entries(modalState.row).filter(([key]) => !['avatar', 'photo'].includes(key)) : [];

  const actionButton = (type, row, icon, tone) => (
    <button
      type="button"
      onClick={() => openModal(type, row)}
      className={`dashboard-action-tooltip inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-950/35 text-slate-400 transition hover:-translate-y-0.5 hover:bg-white/10 ${tone}`}
      data-tooltip={type === 'More' ? 'More actions' : type}
      aria-label={`${type === 'More' ? 'More actions' : `${type} record`}`}
    >
      <i className={icon} aria-hidden="true" />
    </button>
  );

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/40 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-blue-200">
              <i className="fa-solid fa-database" aria-hidden="true" />
              Data Registry
            </span>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Showing {filteredRows.length} records with live search, filters, pagination, and row actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-1.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition ${viewMode === 'table' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}
              >
                <i className="fa-solid fa-table-list mr-2" aria-hidden="true" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}
              >
                <i className="fa-solid fa-border-all mr-2" aria-hidden="true" />
                Grid
              </button>
            </div>

            {addAction && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                onClick={() => openModal('Create', null)}
              >
                <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
                {addAction}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-slate-950/35 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-400">
              Show
              <select
                value={pageSize}
                onChange={updatePageSize}
                className="h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-black text-white outline-none transition focus:border-blue-400/50"
              >
                {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              entries
            </label>

            <div className="hidden h-8 w-px bg-white/10 md:block" />

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => { setActiveFilter(filter); setPage(1); }}
                  className={`rounded-full border px-3 py-2 text-[0.65rem] font-black uppercase tracking-widest transition ${activeFilter === filter ? 'border-blue-400/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.03] text-slate-500 hover:bg-white/10 hover:text-white'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <label className="relative w-full max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07]"
            />
          </label>
        </div>
      </div>

      <div className="min-h-[480px] overflow-x-auto">
        {viewMode === 'table' ? (
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/80">
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      {column.header}
                      <i className="fa-solid fa-sort text-[0.58rem] text-slate-600" aria-hidden="true" />
                    </span>
                  </th>
                ))}
                {showActions && <th className="px-6 py-4 text-right text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {visibleRows.map((row, index) => (
                <tr key={`${getDisplayTitle(row)}-${index}`} className="group odd:bg-white/[0.018] even:bg-transparent transition hover:bg-blue-500/[0.055]">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 align-middle text-sm font-semibold text-slate-300">
                      {column.render ? column.render(row, index) : <span className="text-slate-200">{String(row[column.key] ?? '-')}</span>}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actionButton('View', row, 'fa-solid fa-eye', 'hover:text-blue-300 hover:border-blue-400/40')}
                        {actionButton('Edit', row, 'fa-solid fa-pen', 'hover:text-emerald-300 hover:border-emerald-400/40')}
                        {actionButton('Delete', row, 'fa-solid fa-trash', 'hover:text-red-300 hover:border-red-400/40')}
                        {actionButton('More', row, 'fa-solid fa-ellipsis', 'hover:text-violet-300 hover:border-violet-400/40')}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleRows.map((row, index) => (
              <article key={`${getDisplayTitle(row)}-${index}`} className="group overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-4">
                  {row.avatar ? (
                    <img src={row.avatar} alt="" className="h-14 w-14 rounded-2xl border border-white/10 object-cover shadow-xl" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-300">
                      <i className="fa-solid fa-cube" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    {actionButton('Edit', row, 'fa-solid fa-pen', 'hover:text-emerald-300 hover:border-emerald-400/40')}
                    {actionButton('Delete', row, 'fa-solid fa-trash', 'hover:text-red-300 hover:border-red-400/40')}
                  </div>
                </div>
                <h4 className="mt-5 line-clamp-2 text-lg font-black tracking-tight text-white transition group-hover:text-blue-200">{getDisplayTitle(row)}</h4>
                <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-500">
                  {row.email && <span className="truncate"><i className="fa-regular fa-envelope mr-2" aria-hidden="true" />{row.email}</span>}
                  {row.role && <span><i className="fa-solid fa-shield mr-2" aria-hidden="true" />{row.role}</span>}
                  {row.date && <span><i className="fa-regular fa-calendar mr-2" aria-hidden="true" />{row.date}</span>}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className={`rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] ${['Active', 'Published', 'active'].includes(row.status) ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                    {row.status || 'Ready'}
                  </span>
                  {actionButton('View', row, 'fa-solid fa-eye', 'hover:text-blue-300 hover:border-blue-400/40')}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-white/10 bg-slate-950/35 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          Showing <span className="font-black text-white">{from}</span> to <span className="font-black text-white">{to}</span> of <span className="font-black text-white">{filteredRows.length}</span> entries
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Previous
          </button>
          <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-blue-500 px-3 text-sm font-black text-white shadow-lg shadow-blue-500/20">{safePage}</span>
          <span className="px-1 text-xs font-black text-slate-600">of</span>
          <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-slate-300">{totalPages}</span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      {modalState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl" onMouseDown={closeModal}>
          <section className="w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0f172a] shadow-[0_40px_120px_rgba(0,0,0,0.55)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),rgba(255,255,255,0.035)] p-7">
              <button type="button" className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-400 transition hover:bg-white/10 hover:text-white" onClick={closeModal}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-5 pr-12">
                {modalState.row?.avatar ? (
                  <img src={modalState.row.avatar} alt="" className="h-20 w-20 rounded-3xl border border-white/10 object-cover shadow-xl" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/10 text-3xl text-blue-300">
                    <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-blue-200">{modalState.type} operation</span>
                  <h3 className="mt-3 truncate text-2xl font-black tracking-tight text-white">{modalTitle}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{modalState.type === 'Delete' ? 'Confirm before removing this record.' : 'Review and manage this administrative record.'}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-7">
              {modalState.type === 'Edit' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {modalEntries.map(([key, value]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <input defaultValue={String(value)} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60 focus:bg-white/[0.08]" />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {modalEntries.map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <strong className="mt-2 block break-words text-sm font-black text-white">{String(value)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-white/[0.025] p-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeModal} className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-black text-slate-400 transition hover:bg-white/10 hover:text-white">
                Cancel
              </button>
              <button type="button" className={`rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 ${modalState.type === 'Delete' ? 'bg-red-600 shadow-red-600/20 hover:bg-red-500' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-500'}`} onClick={closeModal}>
                {modalState.type === 'Delete' ? 'Delete Record' : modalState.type === 'Edit' ? 'Save Changes' : 'Done'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default DataTable;
