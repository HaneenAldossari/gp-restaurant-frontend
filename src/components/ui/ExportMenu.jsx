import { useEffect, useRef, useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { downloadCsv, openPrintableReport } from '../../lib/reports';

// Drop-in export button used at the top-right of each page. The caller
// passes a function `buildReport()` that returns the {title, meta,
// sections} shape consumed by lib/reports.js — keeping all formatting
// logic inside the page (it knows the active filters) and all rendering
// logic inside the report library.
//
// The button is disabled while data is still loading so we don't generate
// an empty report.
const ExportMenu = ({ buildReport, baseFilename, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const today = new Date().toISOString().slice(0, 10);
  const csvName = `${baseFilename || 'report'}-${today}.csv`;

  const handleCsv = () => {
    const r = buildReport();
    if (!r) return;
    downloadCsv(r, csvName);
    setOpen(false);
  };

  const handlePdf = () => {
    const r = buildReport();
    if (!r) return;
    openPrintableReport(r);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                   border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                   text-sm font-medium text-gray-700 dark:text-gray-200
                   disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 z-50
                        rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-800 overflow-hidden">
          <button
            type="button"
            onClick={handlePdf}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700
                       flex items-start gap-3 transition"
          >
            <FileText className="w-4 h-4 mt-0.5 text-primary-500 shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">PDF Report</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Opens a printable report — Save as PDF from your browser.
              </div>
            </div>
          </button>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <button
            type="button"
            onClick={handleCsv}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700
                       flex items-start gap-3 transition"
          >
            <FileSpreadsheet className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">CSV Spreadsheet</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Sectioned CSV with totals — opens cleanly in Excel.
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
