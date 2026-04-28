import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Filter,
  ShoppingBag,
  Award,
  Star,
  AlertCircle,
  Calendar,
  Clock,
  Database,
  CalendarRange,
} from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import SalesAreaChart from '../components/charts/SalesAreaChart';
import DonutChart from '../components/charts/DonutChart';
import HeatmapChart from '../components/charts/HeatmapChart';
import BarChart from '../components/charts/BarChart';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { fetchDashboard, fetchDataRange } from '../lib/api';
import EmptyState from '../components/ui/EmptyState';
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer as RechartsResponsive,
  Cell as RechartsCell,
} from 'recharts';

const DayOfWeekTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { orders = 0, units = 0, revenue = 0 } = payload[0].payload || {};
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1.5">{label}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Orders</span>
          <span className="font-semibold text-gray-900 dark:text-white">{orders.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Units sold</span>
          <span className="font-semibold text-gray-900 dark:text-white">{units.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Revenue</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            SAR {revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
};

// Top 10 / Show-all toggle wrapper around DataTable. Displays the first
// 10 rows by default, then switches to the full list when expanded. The
// header title, button label, and row count update to match the state.
const ExpandableRanking = ({ rows, columns, topTitle, fullTitle, defaultSortKey, expanded, onToggle, loading }) => {
  const displayRows = expanded ? rows : rows.slice(0, 10);
  const title = expanded ? `${fullTitle} (${rows.length})` : topTitle;
  const buttonLabel = expanded
    ? 'Show top 10 only'
    : rows.length > 10
      ? `Show all ${rows.length} products`
      : null;

  return (
    <div className="space-y-2">
      <DataTable
        data={displayRows}
        columns={columns}
        title={title}
        defaultSortKey={defaultSortKey}
        defaultSortDirection="desc"
        searchable={expanded}
        pagination={false}
        loading={loading}
      />
      {buttonLabel && !loading && (
        <button
          onClick={onToggle}
          className="w-full text-center py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

const DayOfWeekBar = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="card dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
          <div className="h-[280px] bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Orders by Day of Week</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Each bar is the sum across every occurrence of that weekday in your selected window (e.g. all 4 Sundays of a month).
        Hover for orders, units sold, and revenue.
      </p>
      <div style={{ height: 280 }}>
        <RechartsResponsive width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <RechartsGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
            <RechartsXAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <RechartsYAxis tick={{ fontSize: 11, fill: '#6b7280' }} width={40} tickFormatter={(v) => v.toLocaleString()} />
            <RechartsTooltip content={<DayOfWeekTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
            <RechartsBar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <RechartsCell key={i} fill={d.name === 'Fri' || d.name === 'Sat' ? '#f59e0b' : '#6366f1'} />
              ))}
            </RechartsBar>
          </RechartsBarChart>
        </RechartsResponsive>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [dataRange, setDataRange] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Date filter — null means "use the full dataset". Populated from
  // /api/data-range once it loads so inputs start at the true bounds.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDashboard({
      category: selectedCategory,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e.message || 'Failed to load dashboard'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedCategory, startDate, endDate]);

  // Data range is independent of filters — fetch once; seed the date
  // inputs to the full dataset window so the user sees the real bounds.
  useEffect(() => {
    fetchDataRange()
      .then((d) => {
        setDataRange(d);
        if (d?.hasData) {
          setStartDate(d.earliest);
          setEndDate(d.latest);
        }
      })
      .catch(() => {});
  }, []);

  const dateFilterActive = dataRange?.hasData && (
    startDate !== dataRange.earliest || endDate !== dataRange.latest
  );
  const resetDates = () => {
    if (dataRange?.hasData) {
      setStartDate(dataRange.earliest);
      setEndDate(dataRange.latest);
    }
  };

  // Map the backend daily revenue into the shape SalesAreaChart expects
  const dailySales = useMemo(() => (data?.dailyRevenue ?? []).map((d) => ({
    date: d.date,
    displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: d.revenue,
    orders: d.orders,
    avgOrderValue: d.orders ? Math.round((d.revenue / d.orders) * 100) / 100 : 0,
  })), [data]);

  // Sales by Category (donut) — now expresses each slice as units sold,
  // not revenue. The "Revenue by Category" bar chart further down still
  // uses SAR so the manager has both lenses side by side.
  const salesByCategory = useMemo(() => {
    const rows = data?.salesByCategory ?? [];
    const totalUnits = rows.reduce((s, x) => s + (x.units || 0), 0);
    return rows.map((c) => ({
      name: c.name,
      value: c.units || 0,
      color: c.color,
      percentage: totalUnits > 0
        ? Math.round((c.units / totalUnits) * 1000) / 10
        : 0,
    }));
  }, [data]);

  // Full ranked lists from the backend. "Top 10" is a display choice, not
  // a data cap — the tables below slice to 10 by default and expand when
  // the manager wants to see everything.
  const productsByRevenue = useMemo(() => (data?.topByRevenue ?? []).map((p) => ({
    name: p.name,
    revenue: p.revenue,
    category: p.category,
  })), [data]);

  const productsByQty = useMemo(() => (data?.topByQty ?? []).map((p) => ({
    name: p.name,
    sales: p.qtySold,
    category: p.category,
  })), [data]);

  const [showAllByRevenue, setShowAllByRevenue] = useState(false);
  const [showAllByQty, setShowAllByQty] = useState(false);

  const heatmapData = useMemo(() => {
    // Backend gives { day: 'Mon', hour: '9AM', value: 42 } rows.
    // HeatmapChart component may expect its own shape; pass through and let it handle.
    return data?.heatmapData ?? [];
  }, [data]);

  // Detect whether the uploaded data actually has time-of-day signal. If every
  // heatmap cell is 0, the uploaded file didn't include order times (every
  // order ends up at midnight → hour 0 → outside the 9AM–10PM window). In that
  // case the heatmap is useless; we degrade to a day-of-week orders bar chart
  // derived from the daily series, which is meaningful without time info.
  const hasHourSignal = useMemo(
    () => heatmapData.some((d) => (d.value || 0) > 0),
    [heatmapData]
  );

  // Prefer the backend's pre-aggregated stats (includes units + revenue).
  // Fall back to deriving from dailyRevenue for older backends.
  const ordersByDayOfWeek = useMemo(() => {
    if (data?.dayOfWeekStats?.length) {
      return data.dayOfWeekStats.map((d) => ({
        name: d.name,
        value: d.orders,
        orders: d.orders,
        units: d.units,
        revenue: d.revenue ?? 0,
      }));
    }
    if (!data?.dailyRevenue?.length) return [];
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const orders = Array(7).fill(0);
    const revenue = Array(7).fill(0);
    for (const r of data.dailyRevenue) {
      const d = new Date(r.date + 'T00:00:00').getDay();
      orders[d] += r.orders || 0;
      revenue[d] += r.revenue || 0;
    }
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((i) => ({ name: names[i], value: orders[i], orders: orders[i], units: 0, revenue: revenue[i] }));
  }, [data]);

  const categoryFilterActive = selectedCategory !== 'All' && selectedCategory !== 'all';

  // Revenue by Category (bar chart) pulls SAR directly from the raw
  // backend data — independent of the donut, which shows units sold.
  const categoryBarData = useMemo(() => (data?.salesByCategory ?? []).map((c) => ({
    name: c.name,
    value: c.value,
  })), [data]);

  const categories = data?.categories ?? ['All'];

  // If the backend says there's no data yet, show a friendly upload prompt
  // instead of a scary red error box.
  const noDataYet = dataRange && dataRange.hasData === false;
  if (noDataYet || (error && /no data/i.test(error))) {
    return (
      <EmptyState
        emoji="📊"
        title="Your dashboard is ready when you are"
        message="Upload your sales file and you'll see KPIs, trends, top sellers, and heatmaps here."
      />
    );
  }

  if (error) {
    return (
      <div className="card dark:bg-gray-800 dark:border-gray-700 border-danger-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-danger-700 dark:text-danger-400">Couldn't load dashboard</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
            <p className="text-xs text-gray-500 mt-2">Make sure the backend is running at http://localhost:8000.</p>
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Live data indicator + dataset range */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database size={12} />
          {loading ? 'Loading live data…' : 'Live data'}
        </div>
        {dataRange?.hasData && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            <CalendarRange size={12} />
            Data covers{' '}
            <strong>{new Date(dataRange.earliest + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            {' → '}
            <strong>{new Date(dataRange.latest + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            <span className="text-primary-400">· {dataRange.totalDays.toLocaleString()} days</span>
          </div>
        )}
      </div>

      {/* Filters — category + date range (bounded to the dataset) */}
      <div className="card dark:bg-gray-800 dark:border-gray-700 space-y-4">
        {/* Category row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filter by Category</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Date range row — bounded to the uploaded dataset */}
        {dataRange?.hasData && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Filter by Date Range</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                min={dataRange.earliest}
                max={endDate || dataRange.latest}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={endDate}
                min={startDate || dataRange.earliest}
                max={dataRange.latest}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {dateFilterActive && (
                <button
                  onClick={resetDates}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Help text — visible whenever a filter narrows the view */}
        {(dateFilterActive || categoryFilterActive) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Showing {categoryFilterActive ? <strong>{selectedCategory}</strong> : 'all categories'}
            {dateFilterActive && (
              <>
                {' '}from <strong>{new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                {' '}to <strong>{new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </>
            )}
            .
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          title={selectedCategory === 'All' ? 'Total Revenue' : `${selectedCategory} Revenue`}
          value={kpis?.totalRevenue ?? 0}
          icon={DollarSign}
          suffix=" SAR"
          iconBgColor="bg-success-100"
          iconColor="text-success-600"
          loading={loading}
        />
        <KPICard
          title="Total Orders"
          value={kpis?.totalOrders ?? 0}
          icon={ShoppingCart}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          loading={loading}
        />
        <KPICard
          title="Avg Order Value"
          value={kpis?.avgOrderValue ?? 0}
          icon={TrendingUp}
          suffix=" SAR"
          iconBgColor="bg-accent-100"
          iconColor="text-accent-600"
          loading={loading}
        />
        {/* Best seller card */}
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Best Seller</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{kpis?.bestSeller?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {kpis?.bestSeller?.qty?.toLocaleString()} sold
                </p>
              </div>
              <div className="p-3 bg-warning-100 dark:bg-warning-900/30 rounded-xl">
                <Award className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary KPI row */}
      {!loading && kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Daily Revenue</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {kpis.avgDailyRevenue?.toLocaleString()} SAR
                </p>
              </div>
              <Calendar className="w-5 h-5 text-primary-400" />
            </div>
          </div>
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Busiest Day</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{kpis.busiestDay?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Avg {kpis.busiestDay?.avgRevenue?.toLocaleString()} SAR
                </p>
              </div>
              <Clock className="w-5 h-5 text-accent-400" />
            </div>
          </div>
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Worst Seller</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{kpis.worstSeller?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {kpis.worstSeller?.qty?.toLocaleString()} sold
                </p>
              </div>
              <ShoppingBag className="w-5 h-5 text-danger-400" />
            </div>
          </div>
        </div>
      )}

      {/* Sales trend */}
      <SalesAreaChart
        data={dailySales}
        title="Daily Revenue"
        loading={loading}
        height={400}
      />

      {/* Charts row — only when viewing all categories; with a single
          category selected these two charts become trivially one-bar. */}
      {!categoryFilterActive && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutChart
            data={salesByCategory}
            title="Sales by Category (units sold)"
            valueUnit="units"
            loading={loading}
          />
          <BarChart
            data={categoryBarData}
            title="Revenue by Category"
            dataKey="value"
            nameKey="name"
            fill="#0ea5e9"
            layout="vertical"
            loading={loading}
          />
        </div>
      )}

      {/* Heatmap — or day-of-week fallback when the uploaded data has no
          time-of-day information (every hour would otherwise read as 0). */}
      {hasHourSignal ? (
        <HeatmapChart
          data={heatmapData}
          title="Orders by Day × Hour"
          loading={loading}
        />
      ) : (
        <DayOfWeekBar data={ordersByDayOfWeek} loading={loading} />
      )}

      {/* Top products — shows 10 by default, expand to reveal all */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpandableRanking
          rows={productsByRevenue}
          columns={[
            { key: 'name', label: 'Product' },
            { key: 'revenue', label: 'Revenue', render: (v) => `${v.toLocaleString()} SAR` },
          ]}
          defaultSortKey="revenue"
          topTitle="Top 10 by Revenue"
          fullTitle="All products by revenue"
          expanded={showAllByRevenue}
          onToggle={() => setShowAllByRevenue((v) => !v)}
          loading={loading}
        />
        <ExpandableRanking
          rows={productsByQty}
          columns={[
            { key: 'name', label: 'Product' },
            { key: 'sales', label: 'Quantity Sold', render: (v) => v.toLocaleString() },
          ]}
          defaultSortKey="sales"
          topTitle="Top 10 by Quantity"
          fullTitle="All products by quantity"
          expanded={showAllByQty}
          onToggle={() => setShowAllByQty((v) => !v)}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
