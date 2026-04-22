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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [dataRange, setDataRange] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDashboard({ category: selectedCategory })
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e.message || 'Failed to load dashboard'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedCategory]);

  // Data range is independent of category filter — fetch once
  useEffect(() => {
    fetchDataRange().then(setDataRange).catch(() => {});
  }, []);

  // Map the backend daily revenue into the shape SalesAreaChart expects
  const dailySales = useMemo(() => (data?.dailyRevenue ?? []).map((d) => ({
    date: d.date,
    displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: d.revenue,
    orders: d.orders,
    avgOrderValue: d.orders ? Math.round((d.revenue / d.orders) * 100) / 100 : 0,
  })), [data]);

  const salesByCategory = useMemo(() => (data?.salesByCategory ?? []).map((c) => ({
    name: c.name,
    value: c.value,
    color: c.color,
    percentage: data?.salesByCategory?.length
      ? Math.round((c.value / data.salesByCategory.reduce((s, x) => s + x.value, 0)) * 1000) / 10
      : 0,
  })), [data]);

  const topByRevenue = useMemo(() => (data?.topByRevenue ?? []).map((p) => ({
    name: p.name,
    revenue: p.revenue,
  })), [data]);

  const topByQty = useMemo(() => (data?.topByQty ?? []).map((p) => ({
    name: p.name,
    sales: p.qtySold,
  })), [data]);

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

  const ordersByDayOfWeek = useMemo(() => {
    if (!data?.dailyRevenue?.length) return [];
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = Array(7).fill(0);
    for (const r of data.dailyRevenue) {
      const d = new Date(r.date + 'T00:00:00').getDay();
      totals[d] += r.orders || 0;
    }
    // Show Mon..Sun to match the Saudi-context weekend highlighting elsewhere
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((i) => ({ name: names[i], value: totals[i] }));
  }, [data]);

  const categoryBarData = useMemo(() => salesByCategory.map((c) => ({
    name: c.name,
    value: c.value,
  })), [salesByCategory]);

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

      {/* Category Filter */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          data={salesByCategory}
          title="Sales by Category"
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

      {/* Heatmap — or day-of-week fallback when the uploaded data has no
          time-of-day information (every hour would otherwise read as 0). */}
      {hasHourSignal ? (
        <HeatmapChart
          data={heatmapData}
          title="Orders by Day × Hour"
          loading={loading}
        />
      ) : (
        <BarChart
          data={ordersByDayOfWeek}
          title="Orders by Day of Week"
          dataKey="value"
          nameKey="name"
          fill="#6366f1"
          loading={loading}
        />
      )}

      {/* Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          data={topByRevenue}
          columns={[
            { key: 'name', label: 'Product' },
            { key: 'revenue', label: 'Revenue', render: (v) => `${v.toLocaleString()} SAR` },
          ]}
          title="Top 10 by Revenue"
          searchable={false}
          pagination={false}
          loading={loading}
        />
        <DataTable
          data={topByQty}
          columns={[
            { key: 'name', label: 'Product' },
            { key: 'sales', label: 'Quantity Sold', render: (v) => v.toLocaleString() },
          ]}
          title="Top 10 by Quantity"
          searchable={false}
          pagination={false}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
