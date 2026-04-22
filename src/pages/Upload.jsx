import { useRef, useState, useEffect } from 'react';
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Info,
  Trash2,
  RefreshCw,
  Database,
  FileText,
  Package,
  SkipForward,
} from 'lucide-react';
import { uploadFile, listUploads, deleteUpload, clearAllData } from '../lib/api';

const Upload = () => {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef(null);

  const refreshHistory = async () => {
    setLoadingHistory(true);
    try {
      const d = await listUploads();
      setUploads(d.uploads || []);
    } catch {
      setUploads([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { refreshHistory(); }, []);

  async function handleFile(file) {
    setBusy(true);
    setFileName(file.name);
    setResult(null);
    setError(null);
    try {
      const data = await uploadFile(file);
      setResult(data);
      refreshHistory();
    } catch (e) {
      setError({
        message: e.message || 'Upload failed',
        columnsFound: e.detail?.columnsFound,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id, filename) {
    if (!confirm(`Delete "${filename}"? This removes all its sales data.`)) return;
    setDeletingId(id);
    try {
      await deleteUpload(id);
      refreshHistory();
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'unknown error'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAll() {
    setConfirmClear(false);
    try {
      await clearAllData();
      refreshHistory();
      setResult(null);
    } catch (e) {
      alert('Clear failed: ' + (e.message || 'unknown error'));
    }
  }

  const hasData = uploads.length > 0;
  const totalItems = uploads.reduce((s, u) => s + u.items, 0);
  const totalRevenue = uploads.reduce((s, u) => s + u.revenue, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <UploadIcon size={12} />
        {hasData ? `${uploads.length} file${uploads.length > 1 ? 's' : ''} uploaded · ${totalItems.toLocaleString()} line items` : 'No data yet — upload a sales file to begin'}
      </div>

      {/* Drop zone */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`card cursor-pointer text-center transition-all duration-200 border-2 border-dashed ${
          dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
        }`}
      >
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            {busy ? (
              <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
            ) : (
              <UploadIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {busy ? `Uploading ${fileName}…` : hasData ? 'Add another file' : 'Drop your first sales file here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supports CSV and Excel (.xlsx) files
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="btn-primary disabled:opacity-50"
          >
            {busy ? 'Uploading…' : 'Browse files'}
          </button>
        </div>
      </div>

      {/* Success banner (most recent upload) */}
      {result?.success && (
        <div className="card bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success-600" />
            <h3 className="text-sm font-semibold text-success-700 dark:text-success-300">
              {result.fileName} uploaded successfully
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat Icon={FileText}    label="Rows in file"         value={result.rowsInFile?.toLocaleString() ?? '—'} />
            <Stat Icon={CheckCircle2} label="Rows imported"        value={result.rowsImported?.toLocaleString() ?? '—'} />
            <Stat Icon={Package}     label="Order items inserted" value={result.orderItemsInserted?.toLocaleString() ?? '—'} />
            <Stat Icon={SkipForward} label="Rows skipped"         value={result.rowsSkipped?.toLocaleString() ?? '—'} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-danger-600" />
            <h3 className="text-sm font-semibold text-danger-700 dark:text-danger-300">Upload failed</h3>
          </div>
          <p className="text-sm text-danger-700 dark:text-danger-400">{error.message}</p>
          {error.columnsFound && (
            <p className="text-xs text-danger-600 dark:text-danger-400 mt-2 font-mono break-words">
              Columns we found: {error.columnsFound.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Required columns hint */}
      {!hasData && (
        <div className="card bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                What your file should have
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                Order reference, item name (or SKU), quantity, unit price, unit cost, category, and a date. Season and occasion are optional — we'll figure them out from the date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload history */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Upload history</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshHistory}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Refresh"
            >
              <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
            {hasData && (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs font-medium text-danger-600 hover:text-danger-700 dark:text-danger-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-danger-50 dark:hover:bg-danger-900/20"
              >
                <Trash2 size={12} /> Clear all data
              </button>
            )}
          </div>
        </div>

        {loadingHistory ? (
          <div className="text-center py-6 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No uploads yet</p>
            <p className="text-xs mt-1">Drop a sales file above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left font-semibold py-2 px-3">File</th>
                  <th className="text-left font-semibold py-2 px-3">Uploaded</th>
                  <th className="text-right font-semibold py-2 px-3">Line items</th>
                  <th className="text-right font-semibold py-2 px-3">Revenue</th>
                  <th className="text-right font-semibold py-2 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {uploads.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{u.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(u.uploadedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-200">
                      {u.items.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-200">
                      {u.revenue > 0 ? `SAR ${Math.round(u.revenue).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(u.id, u.filename)}
                        disabled={deletingId === u.id}
                        className="text-danger-500 hover:text-danger-700 p-1.5 rounded hover:bg-danger-50 dark:hover:bg-danger-900/20 disabled:opacity-50"
                        title="Delete this upload and its data"
                      >
                        {deletingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {uploads.length > 1 && (
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-700/30 font-semibold text-sm text-gray-700 dark:text-gray-200 border-t-2 border-gray-200 dark:border-gray-600">
                    <td className="py-2.5 px-3" colSpan={2}>Total</td>
                    <td className="py-2.5 px-3 text-right">{totalItems.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">SAR {Math.round(totalRevenue).toLocaleString()}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Confirm clear modal — inline, no external library */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmClear(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Clear all data?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              This will remove every uploaded file, all orders, all items, products, and categories.
              Your user accounts are kept. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm rounded-lg bg-danger-600 hover:bg-danger-700 text-white font-medium"
              >
                Yes, clear everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ Icon, label, value }) => (
  <div className="p-3 rounded-lg bg-white dark:bg-gray-800 text-center">
    <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
      {Icon && <Icon size={11} />} {label}
    </p>
  </div>
);

export default Upload;
