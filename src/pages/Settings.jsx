import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  Check,
  Loader2,
  Upload as UploadIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchDashboard } from '../lib/api';
import Upload from './Upload';

// Turn a 2D array of rows into CSV text. Values with commas, quotes, or
// newlines are quoted; quotes are doubled per RFC 4180.
const toCsv = (rows) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? '' : String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');

const downloadBlob = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Build a multi-section sales report as a single CSV. The sections are
// separated by blank rows so Excel displays them as distinct tables when
// the file is opened.
const buildReportCsv = (d) => {
  const k = d.kpis || {};
  const today = new Date().toISOString().slice(0, 10);
  const sections = [];

  sections.push([['Smart Sales Analytics — Sales Report'], [`Generated: ${today}`], []]);
  sections.push([
    ['KPI', 'Value'],
    ['Total Revenue (SAR)', k.totalRevenue ?? 0],
    ['Total Orders', k.totalOrders ?? 0],
    ['Avg Order Value (SAR)', k.avgOrderValue ?? 0],
    ['Avg Daily Revenue (SAR)', k.avgDailyRevenue ?? 0],
    ['Best Seller', k.bestSeller?.name ?? ''],
    ['Best Seller Qty', k.bestSeller?.qty ?? 0],
    ['Worst Seller', k.worstSeller?.name ?? ''],
    ['Worst Seller Qty', k.worstSeller?.qty ?? 0],
    ['Busiest Day', k.busiestDay?.name ?? ''],
    ['Busiest Day Avg Revenue (SAR)', k.busiestDay?.avgRevenue ?? 0],
    ['Revenue Change (30d vs prev)', `${k.revenueChange ?? 0}%`],
    ['Orders Change (30d vs prev)', `${k.ordersChange ?? 0}%`],
    ['AOV Change (30d vs prev)', `${k.avgOrderChange ?? 0}%`],
    [],
  ]);
  sections.push([
    ['Top 10 by Revenue'],
    ['Product', 'Revenue (SAR)'],
    ...(d.topByRevenue || []).map((p) => [p.name, p.revenue]),
    [],
  ]);
  sections.push([
    ['Top 10 by Quantity'],
    ['Product', 'Quantity'],
    ...(d.topByQty || []).map((p) => [p.name, p.qtySold]),
    [],
  ]);
  sections.push([
    ['Sales by Category'],
    ['Category', 'Revenue (SAR)'],
    ...(d.salesByCategory || []).map((c) => [c.name, c.value]),
    [],
  ]);
  sections.push([
    ['Daily Revenue'],
    ['Date', 'Revenue (SAR)', 'Orders'],
    ...(d.dailyRevenue || []).map((r) => [r.date, r.revenue, r.orders]),
  ]);

  return toCsv(sections.flat());
};

const Settings = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: 'admin@smartsales.sa',
    phone: '+966 50 123 4567',
    language: 'en'
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    lowStockAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    forecastAlerts: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'upload', label: 'Upload Data', icon: UploadIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Export', icon: Database }
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [exporting, setExporting] = useState(null); // 'csv' | 'excel' | 'report' | null
  const [exportError, setExportError] = useState(null);

  const handleExport = async (kind) => {
    setExporting(kind);
    setExportError(null);
    try {
      const data = await fetchDashboard();
      const csv = buildReportCsv(data);
      const today = new Date().toISOString().slice(0, 10);
      if (kind === 'csv') {
        downloadBlob(csv, `smart-sales-report-${today}.csv`, 'text/csv;charset=utf-8');
      } else if (kind === 'excel') {
        // Excel opens .csv natively. Writing with .xls extension and the
        // right MIME type tells Excel to open it directly, skipping the
        // "text file import" wizard.
        downloadBlob(csv, `smart-sales-report-${today}.xls`, 'application/vnd.ms-excel');
      }
    } catch (e) {
      setExportError(e.message || 'Export failed. Upload data first if this workspace is empty.');
    } finally {
      setExporting(null);
    }
  };

  const handleReport = () => {
    // Native browser "Save as PDF" via the print dialog. Zero deps, works
    // on every browser, and the current page layout is used as-is.
    window.print();
  };

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
            {/* Upload Data Tab — embeds the standalone Upload page so all its
                logic (drag-and-drop, history, delete, clear) carries over. */}
            {activeTab === 'upload' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Import your sales files. Uploads are typically a one-time or occasional task — once your data is in, the Dashboard, Forecasting, and Menu Insights pages stay live.
                  </p>
                </div>
                <Upload />
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Profile Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account information</p>
                </div>

                <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <button className="btn-secondary text-sm">Change Photo</button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG or GIF. Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={profile.language}
                      onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Notification Preferences</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important alerts via email' },
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Get notified when inventory is low' },
                    { key: 'dailyReports', label: 'Daily Reports', desc: 'Receive daily sales summary' },
                    { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly performance reports' },
                    { key: 'forecastAlerts', label: 'Forecast Alerts', desc: 'Get notified about forecast updates' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                        className={`
                          relative w-12 h-6 rounded-full transition-colors duration-200
                          ${notifications[item.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                            ${notifications[item.key] ? 'translate-x-7' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the dashboard looks</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200
                        ${isDarkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
                      `}
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
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Security Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account security</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Data & Export</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Export your data and manage storage</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Sales Data</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Downloads your current dashboard as a multi-section spreadsheet:
                      KPIs, top products, category breakdown, and the daily revenue series.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleExport('csv')}
                        disabled={exporting !== null}
                        className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {exporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : null}
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        disabled={exporting !== null}
                        className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : null}
                        Export as Excel
                      </button>
                    </div>
                    {exportError && (
                      <p className="text-xs text-danger-600 dark:text-danger-400 mt-2">{exportError}</p>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Reports</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Opens your browser's print dialog — pick "Save as PDF" as the destination.
                    </p>
                    <button
                      onClick={handleReport}
                      className="btn-secondary text-sm"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button — hidden on Upload tab since the Upload page
                handles its own actions (drag-and-drop, browse, history). */}
            {activeTab !== 'upload' && (
              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
