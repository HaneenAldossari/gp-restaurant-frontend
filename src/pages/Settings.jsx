import { useState } from 'react';
import {
  User,
  Palette,
  Database,
  Loader2,
  FileText,
  FileSpreadsheet,
  Upload as UploadIcon,
  Users as UsersIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  fetchDashboard,
  fetchForecastTotal,
  fetchMenuEngineering,
} from '../lib/api';
import {
  downloadCsv,
  openPrintableReport,
  fmtSar,
  fmtNum,
  fmtPct,
} from '../lib/reports';
import { getClassification } from '../lib/classification';
import Upload from './Upload';
import TeamManagement from '../components/TeamManagement';

// One combined report covering Dashboard + Forecast + Menu Insights.
// Pulls live data from the three primary endpoints and assembles a
// trimmed "executive summary" view — the goal is a one-page-feel
// document a manager can hand to a stakeholder, not an exhaustive
// data dump (each page has its own dedicated export for that).
const buildCombinedReport = async () => {
  const [dash, forecast, menu] = await Promise.all([
    fetchDashboard().catch(() => null),
    fetchForecastTotal(30).catch(() => null),
    fetchMenuEngineering().catch(() => null),
  ]);

  const sections = [];
  const meta = [
    { label: 'Coverage', value: 'Dashboard · Forecast · Menu Insights' },
    { label: 'Forecast horizon', value: '30 days' },
  ];

  // ── Dashboard summary ────────────────────────────────────────────
  if (dash?.kpis) {
    const k = dash.kpis;
    sections.push({
      name: 'Sales overview (current data)',
      kind: 'kv',
      rows: [
        ['Total revenue', fmtSar(k.totalRevenue)],
        ['Total orders', fmtNum(k.totalOrders)],
        ['Average order value', fmtSar(k.avgOrderValue)],
        ['Average daily revenue', fmtSar(k.avgDailyRevenue)],
        ['Best-selling product', `${k.bestSeller?.name || '—'} (${fmtNum(k.bestSeller?.qty)} units)`],
        ['Busiest day of week', `${k.busiestDay?.name || '—'} (avg ${fmtSar(k.busiestDay?.avgRevenue)})`],
        ['Revenue Δ (30d vs prev)', fmtPct(k.revenueChange)],
      ],
    });
  }

  if ((dash?.topByRevenue || []).length) {
    const top = dash.topByRevenue.slice(0, 5);
    sections.push({
      name: 'Top 5 products by revenue',
      kind: 'table',
      columns: ['#', 'Product', 'Revenue (SAR)'],
      rows: top.map((p, i) => [i + 1, p.name, fmtNum(p.revenue)]),
    });
  }

  // ── Forecast summary ─────────────────────────────────────────────
  if (forecast) {
    sections.push({
      name: 'Forecast — next 30 days',
      kind: 'kv',
      rows: [
        ['Expected revenue', fmtSar(forecast.totalPredictedRevenue)],
        ['Expected profit (after product cost)', fmtSar(forecast.totalPredictedProfit)],
        ['Expected units', fmtNum(forecast.totalPredictedQuantity)],
      ],
    });

    // Special days the manager should plan for
    if ((forecast.notableEvents || []).length) {
      const special = forecast.notableEvents.filter((e) => e.event !== 'Weekend');
      const byEvent = new Map();
      for (const e of special) {
        if (!byEvent.has(e.event)) byEvent.set(e.event, new Set());
        byEvent.get(e.event).add(e.date);
      }
      const fmtDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const eventRows = [];
      for (const [event, dateSet] of byEvent) {
        const sorted = [...dateSet].sort();
        eventRows.push([
          event,
          sorted.length === 1 ? fmtDay(sorted[0]) : `${fmtDay(sorted[0])} – ${fmtDay(sorted[sorted.length - 1])}`,
          `${sorted.length} day${sorted.length === 1 ? '' : 's'}`,
        ]);
      }
      if (eventRows.length) {
        sections.push({
          name: 'Special days to prepare for',
          kind: 'table',
          columns: ['Occasion', 'Dates', 'Days affected'],
          rows: eventRows,
        });
      }
    }

    if ((forecast.topItems || []).length) {
      sections.push({
        name: 'Top expected sellers (next 30 days)',
        kind: 'table',
        columns: ['#', 'Product', 'Expected units'],
        rows: forecast.topItems.slice(0, 5).map((row, i) => [
          i + 1, row.name, fmtNum(row.totalPredictedQuantity),
        ]),
      });
    }
  }

  // ── Menu Insights summary ────────────────────────────────────────
  if (menu?.items?.length) {
    const totalRev = menu.items.reduce((s, i) => s + (i.revenue || 0), 0);
    const grouped = { Star: [], Plowhorse: [], Puzzle: [], Dog: [] };
    for (const it of menu.items) {
      if (grouped[it.classification]) grouped[it.classification].push(it);
    }
    sections.push({
      name: 'Menu portfolio',
      kind: 'table',
      columns: ['Group', 'Items', 'Revenue (SAR)', 'Share', 'What to do'],
      rows: ['Star', 'Plowhorse', 'Puzzle', 'Dog'].map((key) => {
        const c = getClassification(key);
        const q = menu.quadrants?.[key] || { count: 0, revenue: 0 };
        const share = totalRev > 0 ? (q.revenue / totalRev) * 100 : 0;
        return [
          `${c.emoji} ${c.label}`,
          fmtNum(q.count),
          fmtNum(q.revenue),
          fmtPct(share),
          c.advice,
        ];
      }),
    });
  }

  return {
    title: 'Smart Sales — Combined Report',
    subtitle: 'Dashboard · Forecast · Menu Insights',
    meta,
    sections,
  };
};

const Settings = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  // Tab visibility per user type:
  //   Manager/Admin     → Profile, Team, Upload, Appearance, Data & Export
  //   Sub-user Viewer   → Profile, Appearance, Data & Export
  //   Sub-user Full     → Profile, Upload, Appearance, Data & Export
  //   Sub-user Cashier  → never reaches Settings (route guard bounces)
  //
  // Tabs we deliberately removed: Notifications and Security. Both were
  // placeholder UIs not wired to a backend — keeping them in the demo
  // would imply they work. We can re-add them if/when the endpoints
  // exist.
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';
  const canUpload = isManager || user?.permission === 'read_write';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(isManager ? [{ id: 'team', label: 'Team', icon: UsersIcon }] : []),
    ...(canUpload ? [{ id: 'upload', label: 'Upload Data', icon: UploadIcon }] : []),
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Export', icon: Database },
  ];

  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState(null);

  const handleCombinedReport = async (kind) => {
    setExporting(kind);
    setExportError(null);
    try {
      const report = await buildCombinedReport();
      if (kind === 'pdf') {
        openPrintableReport(report);
      } else {
        const today = new Date().toISOString().slice(0, 10);
        downloadCsv(report, `smart-sales-combined-report-${today}.csv`);
      }
    } catch (e) {
      setExportError(e.message || 'Could not build report. Make sure the backend is running and data is uploaded.');
    } finally {
      setExporting(null);
    }
  };

  // Friendly permission label for sub-users (we hide the technical
  // read_only / write_only / read_write strings from the UI).
  const permissionLabel = user?.permission
    ? ({ read_only: 'Viewer', write_only: 'Cashier', read_write: 'Full access' }[user.permission] || user.permission)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            {/* Team tab */}
            {activeTab === 'team' && <TeamManagement />}

            {/* Upload tab */}
            {activeTab === 'upload' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Import your sales files. Once your data is in, the Dashboard, Forecasting, and Menu Insights pages stay live.
                  </p>
                </div>
                <Upload />
              </div>
            )}

            {/* Profile — read-only summary. We show what we already know
                about the signed-in user (from the JWT) and stop there.
                Profile editing isn't wired to a backend, and surfacing
                editable fields that don't persist would mislead. */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your account information.</p>
                </div>

                <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      {user?.name || '—'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.email || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                      {user?.role === 'Cashier' ? 'Sub-user' : (user?.role || '—')}
                    </p>
                  </div>
                  {permissionLabel && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Permission</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                        {permissionLabel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appearance — single toggle, no Save button. The theme
                switch is applied immediately by ThemeContext, so a
                Save action would do nothing real and confuse the user. */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose how the dashboard looks. Changes apply immediately.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes.</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${isDarkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                    aria-label="Toggle dark mode"
                  >
                    <span
                      className={`
                        absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                        ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Data & Export — generate a combined report (Dashboard +
                Forecast + Menu Insights). The previous "Generate Report"
                button printed a screenshot of whatever was currently
                rendered; this fetches the actual data from all three
                endpoints and assembles a clean, brandable document. */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Reports & Export</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    A single overview report covering Dashboard, Forecast (next 30 days), and Menu Insights — basic information only, no per-day detail.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleCombinedReport('pdf')}
                    disabled={exporting !== null}
                    className="text-left p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        {exporting === 'pdf'
                          ? <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                          : <FileText className="w-5 h-5 text-primary-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">PDF report</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Opens a printable document — Save as PDF from your browser's print dialog.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCombinedReport('csv')}
                    disabled={exporting !== null}
                    className="text-left p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        {exporting === 'csv'
                          ? <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                          : <FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">CSV spreadsheet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Same content as the PDF, sectioned for Excel — opens cleanly with totals.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {exportError && (
                  <p className="text-sm text-danger-600 dark:text-danger-400">{exportError}</p>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                  Tip: each page (Dashboard, Forecasting, Menu Insights) also has its own Export button at the top-right with the active filters baked in.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
