import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Layers,
  Tag,
  AlertCircle,
  Sun,
  Moon,
  Coffee,
  Sunset,
  Sparkles,
  Calendar,
  ChevronRight,
  Loader2,
  Award,
  Thermometer,
  CloudRain,
  CloudSun,
  Snowflake,
  TrendingDown,
  DollarSign,
  Gem,
  Package,
  Lightbulb,
  LineChart as LineChartIcon,
  Trophy,
  Clock,
  List as ListIcon,
  CalendarDays,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from 'recharts';
import KPICard from '../components/ui/KPICard';
import DataTable from '../components/ui/DataTable';
import {
  fetchForecastTotal,
  fetchForecastCategory,
  fetchForecastItem,
  fetchCategories,
  fetchProducts,
  fetchDataRange,
} from '../lib/api';
import EmptyState from '../components/ui/EmptyState';

const TIME_PERIOD_ICON = {
  morning: Coffee,
  Afternoon: Sun,
  Evening: Sunset,
  night: Moon,
};

const Forecasting = () => {
  // ── Configuration state ──
  const [scope, setScope] = useState('total');
  const [category, setCategory] = useState('');
  const [item, setItem] = useState('');

  // Period: preset "next N days" OR custom range
  const [periodMode, setPeriodMode] = useState('preset'); // 'preset' | 'custom'
  const [presetDays, setPresetDays] = useState(7);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Reference lists
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [dataRange, setDataRange] = useState(null);

  // Result state
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load reference lists once
  useEffect(() => {
    fetchCategories()
      .then((d) => setCategories((d.categories || []).filter((c) => c !== 'All')))
      .catch(() => {});
    fetchProducts()
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
    fetchDataRange()
      .then((d) => {
        setDataRange(d);
        // Default the custom range to the first 7 days of the forecast window
        if (d?.forecastStart && d?.forecastEndMax) {
          setCustomStart(d.forecastStart);
          const defaultEnd = new Date(d.forecastStart);
          defaultEnd.setDate(defaultEnd.getDate() + 6);
          const maxEnd = new Date(d.forecastEndMax);
          setCustomEnd((defaultEnd < maxEnd ? defaultEnd : maxEnd).toISOString().slice(0, 10));
        }
      })
      .catch(() => {});
  }, []);

  // Products filtered by the chosen category (for Item scope)
  const itemsInCategory = useMemo(
    () => products.filter((p) => !category || p.category === category),
    [products, category]
  );

  // Reset child selections when scope changes
  useEffect(() => {
    if (scope === 'total') { setCategory(''); setItem(''); }
    if (scope === 'category') setItem('');
  }, [scope]);

  // Compute effective period in days. No hard cap — the backend retrains
  // with a longer horizon on demand if the requested window goes beyond
  // what's currently cached, so the user can forecast any future date
  // even if the data is years old.
  const effectiveDays = useMemo(() => {
    if (periodMode === 'custom' && customStart && customEnd) {
      const diff = Math.ceil((new Date(customEnd) - new Date(customStart)) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diff);
    }
    return presetDays;
  }, [periodMode, presetDays, customStart, customEnd]);

  // Total distance from the dataset's last actual sale to the END of the
  // forecast window. This is what determines reliability — Prophet has no
  // data between data_end and today, so a "next 7 days" forecast against
  // a 2022 dataset opened in 2026 is really ~1225 days of extrapolation.
  const horizonFromDataEnd = useMemo(() => {
    if (!dataRange?.latest) return effectiveDays;
    const dataEnd = new Date(dataRange.latest + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSince = Math.max(0, Math.ceil((today - dataEnd) / (1000 * 60 * 60 * 24)));
    return effectiveDays + daysSince;
  }, [effectiveDays, dataRange]);

  // Is the form complete enough to generate?
  const canGenerate = useMemo(() => {
    if (scope === 'category' && !category) return false;
    if (scope === 'item' && (!category || !item)) return false;
    if (periodMode === 'custom' && (!customStart || !customEnd)) return false;
    return true;
  }, [scope, category, item, periodMode, customStart, customEnd]);

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const dateWindow = periodMode === 'custom' && customStart && customEnd
        ? { startDate: customStart, endDate: customEnd }
        : {};
      let data;
      if (scope === 'total') {
        data = await fetchForecastTotal(effectiveDays, dateWindow);
      } else if (scope === 'category') {
        data = await fetchForecastCategory(category, effectiveDays, dateWindow);
      } else {
        data = await fetchForecastItem(item, effectiveDays, dateWindow);
      }
      setForecast(data);
    } catch (e) {
      setError(e.message || 'Forecast failed');
    } finally {
      setLoading(false);
    }
  };

  // Chart data (works for all three scopes)
  const chartData = useMemo(() => {
    if (!forecast) return [];
    const rows = forecast.scope === 'item'
      ? forecast.dailyPredictions.map((p) => ({
          date: p.date,
          predicted: p.predicted_quantity,
          revenue: p.predicted_revenue ?? 0,
        }))
      : (forecast.chartData || []).map((p) => ({
          date: p.date,
          predicted: p.predicted,
          revenue: p.predicted_revenue ?? 0,
        }));
    return rows.map((r) => ({
      ...r,
      // short display label like "Nov 3"
      label: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayOfWeek: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' }),
    }));
  }, [forecast]);

  // Peak and slowest day
  const peakDay = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((a, b) => (b.predicted > a.predicted ? b : a));
  }, [chartData]);

  const slowestDay = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((a, b) => (b.predicted < a.predicted ? b : a));
  }, [chartData]);

  const avgDaily = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.round(chartData.reduce((s, r) => s + r.predicted, 0) / chartData.length);
  }, [chartData]);

  // Day-of-week pattern (aggregated across the forecast window)
  const dayOfWeekPattern = useMemo(() => {
    if (!chartData.length) return [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = {};
    for (const row of chartData) {
      totals[row.dayOfWeek] = (totals[row.dayOfWeek] || 0) + row.predicted;
    }
    return days.filter((d) => d in totals).map((d) => ({ day: d, qty: totals[d] }));
  }, [chartData]);

  // Best seller: top item (category scope) or top category (total scope)
  const bestSeller = useMemo(() => {
    if (!forecast) return null;
    if (forecast.scope === 'total' && forecast.categories?.length) {
      return { label: forecast.categories[0].name, qty: forecast.categories[0].totalPredictedQuantity, kind: 'category' };
    }
    if (forecast.scope === 'category' && forecast.items?.length) {
      return { label: forecast.items[0].name, qty: forecast.items[0].totalPredictedQuantity, kind: 'item' };
    }
    return null;
  }, [forecast]);

  // Weather context — one unified summary covering every season that
  // appears in the forecast window. Saudi-specific temps and concrete
  // sales implications. The season regressor already factors into the
  // Prophet forecast; this panel just surfaces the reasoning.
  const weatherContext = useMemo(() => {
    if (!forecast?.regressorsUsed?.length) return null;

    // Count days per season so we can identify the dominant one
    const counts = {};
    for (const r of forecast.regressorsUsed) {
      counts[r.season] = (counts[r.season] || 0) + 1;
    }
    const seasons = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (seasons.length === 0) return null;

    const info = {
      Winter: { emoji: '❄️', label: 'Cool winter',    temps: '10–20°C',
                advice: 'Hot drinks peak — push lattes, teas, and hot sweets. Cold drinks typically slow by 20–30%.' },
      Spring: { emoji: '🌤️', label: 'Warming spring', temps: '22–35°C',
                advice: 'By April, days already feel summer-like. Cold drinks start rising — expect iced coffee and cold beverages to climb.' },
      Summer: { emoji: '☀️', label: 'Hot summer',     temps: '35–45°C',
                advice: 'Cold drinks dominate — iced coffee, smoothies, and cold brews are your best sellers. Reduce hot-dish prep.' },
      Autumn: { emoji: '🍂', label: 'Cooling autumn', temps: '25–35°C',
                advice: 'Still warm most days — cold drinks remain strong. Hot drinks begin recovering later in the season.' },
    };

    const dominantSeason = seasons[0][0];
    const dominant = info[dominantSeason];
    if (!dominant) return null;

    if (seasons.length === 1) {
      return {
        kind: 'single',
        emoji: dominant.emoji,
        headline: `${dominant.label} · ${dominant.temps}`,
        advice: dominant.advice,
      };
    }

    // Multiple seasons — build a single bridging summary
    const seasonNames = seasons.map(([s]) => s);
    const seasonSummary = seasonNames
      .map((s) => `${info[s]?.emoji || ''} ${s}`)
      .join(' → ');
    return {
      kind: 'multi',
      emoji: dominant.emoji,
      headline: `Spans ${seasonSummary}`,
      advice: `Mostly ${dominant.label.toLowerCase()}. ${dominant.advice}`,
    };
  }, [forecast]);

  // Time-period aggregation for item scope
  const timePeriodTotals = useMemo(() => {
    if (forecast?.scope !== 'item' || !forecast.timePeriodBreakdown) return null;
    const buckets = { morning: 0, Afternoon: 0, Evening: 0, night: 0 };
    for (const row of forecast.timePeriodBreakdown) buckets[row.time_period] = (buckets[row.time_period] || 0) + row.predicted_quantity;
    return Object.entries(buckets).map(([tp, qty]) => ({ tp, qty }));
  }, [forecast]);


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Show the friendly upload prompt when there's no data yet */}
      {dataRange && dataRange.hasData === false && (
        <EmptyState
          emoji="🔮"
          title="Your forecasts will appear here"
          message="Upload your sales file and we'll predict daily demand, revenue, peaks and slow days for the weeks ahead."
        />
      )}

      {/* Compact data context — single line, secondary info */}
      {dataRange?.hasData && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <CalendarDays size={12} />
          <span>Based on your data from {fmtDate(dataRange.earliest)} to {fmtDate(dataRange.latest)} ({dataRange.totalDays} days)</span>
        </div>
      )}

      {/* Configuration panel — only when we have data to work with */}
      {dataRange?.hasData && (
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Generate a sales forecast</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              See how your sales will evolve over the coming days
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Step 1: scope */}
          <StepLabel n={1} label="What do you want to forecast?" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { key: 'total',    label: 'Whole menu',          icon: Target,  hint: 'Every product combined' },
              { key: 'category', label: 'One category',        icon: Layers,  hint: 'A group like Hot Drinks' },
              { key: 'item',     label: 'A specific item',     icon: Tag,     hint: 'One product like Latte' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setScope(s.key)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  scope === s.key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={16} className={scope === s.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
                  <span className={`text-sm font-semibold ${scope === s.key ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    {s.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.hint}</p>
              </button>
            ))}
          </div>

          {/* Step 2: category picker (if needed) */}
          {(scope === 'category' || scope === 'item') && (
            <>
              <StepLabel n={2} label="Pick a category" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">— Select a category —</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </>
          )}

          {/* Step 3: item picker (if needed) */}
          {scope === 'item' && category && (
            <>
              <StepLabel n={3} label={`Pick an item from ${category}`} />
              <select
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">— Select an item —</option>
                {itemsInCategory.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </>
          )}

          {/* Period — three primary options with inline reliability hint.
              Each button shows its actual date range (rolling from
              tomorrow) so the manager can see at a glance which week /
              month is being forecast, not just "7 days". */}
          <StepLabel n={scope === 'item' ? 4 : scope === 'category' ? 3 : 2} label="How far ahead?" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { days: 7,  label: 'Next week' },
              { days: 30, label: 'Next month' },
              { days: 90, label: 'Next 3 months' },
            ].map((p) => {
              const active = periodMode === 'preset' && presetDays === p.days;
              // Reliability is measured from the dataset's last actual
              // sale, not from the requested period — a 7-day forecast
              // against years-old data is still extrapolation.
              const horizon = (horizonFromDataEnd - effectiveDays) + p.days;
              const reliable = dataRange?.reliabilityTiers && horizon <= dataRange.reliabilityTiers.reliableDays;

              // Compute the actual date window each preset will cover.
              // Anchor on dataRange.forecastStart so the displayed dates
              // always match what the backend will slice (it's tomorrow,
              // or the day after data_end if data is in the future).
              let dateRange = `${p.days} days`;
              if (dataRange?.forecastStart) {
                const start = new Date(dataRange.forecastStart + 'T00:00:00');
                const end = new Date(start);
                end.setDate(start.getDate() + p.days - 1);
                const fmt = (d) => d.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric',
                  // Include year on the end date when it crosses a year boundary
                  year: d.getFullYear() !== start.getFullYear() ? 'numeric' : undefined,
                });
                dateRange = `${fmt(start)} – ${fmt(end)}`;
              }

              return (
                <button
                  key={p.days}
                  onClick={() => { setPeriodMode('preset'); setPresetDays(p.days); }}
                  className={`text-left p-3 rounded-xl border-2 transition ${
                    active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${active ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                      {p.label}
                    </span>
                    {reliable && <span className="text-[10px] text-success-600 dark:text-success-400" title="Reliable forecast">✓</span>}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{dateRange}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{p.days} days</p>
                </button>
              );
            })}
          </div>

          {/* Custom range — tucked as secondary option */}
          <details className="text-xs" open={periodMode === 'custom'}>
            <summary
              onClick={(e) => { e.preventDefault(); setPeriodMode(periodMode === 'custom' ? 'preset' : 'custom'); }}
              className={`cursor-pointer select-none inline-flex items-center gap-1.5 font-medium transition ${
                periodMode === 'custom' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Calendar size={12} />
              Need a different range?
            </summary>
            {periodMode === 'custom' && (
              <div className="mt-2 flex flex-wrap gap-2 items-center text-sm">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  min={dataRange?.forecastStart}
                  max={dataRange?.forecastEndMax}
                  className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                />
                <ChevronRight size={14} className="text-gray-400" />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart || dataRange?.forecastStart}
                  max={dataRange?.forecastEndMax}
                  className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  {customStart && customEnd ? `${effectiveDays} days` : 'Pick start and end dates'}
                </span>
              </div>
            )}
          </details>

          {/* One-line quality hint — only shown when the chosen window is long compared to the data */}
          {dataRange?.reliabilityTiers && horizonFromDataEnd > dataRange.reliabilityTiers.reliableDays && (() => {
            const isExtrapolation = horizonFromDataEnd > dataRange.reliabilityTiers.directionalDays;
            return (
              <p className={`text-[11px] flex items-center gap-1.5 ${
                isExtrapolation ? 'text-danger-600 dark:text-danger-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <AlertCircle size={12} />
                <span>
                  {isExtrapolation
                    ? `That's further ahead than your uploaded history — treat these numbers as a rough estimate only.`
                    : `Longer than your most reliable window — best used for direction, not exact numbers.`}
                </span>
              </p>
            );
          })()}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!canGenerate || loading}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <>Generate forecast <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-danger-200 dark:bg-gray-800 dark:border-gray-700 bg-danger-50 dark:bg-danger-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
            <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {forecast && (
        <>
          {/* Headline KPIs — focus on what a manager cares about most */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue — the hero number */}
            <div className="card bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/30 dark:to-gray-800 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  Revenue
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <span className="text-gray-400 dark:text-gray-500 font-normal mr-0.5" title="Forecast — approximate value">≈</span>
                SAR {Math.round(forecast.totalPredictedRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expected over {effectiveDays} days</p>
            </div>

            {/* Profit */}
            <div className="card bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Gem className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  Profit
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <span className="text-gray-400 dark:text-gray-500 font-normal mr-0.5" title="Forecast — approximate value">≈</span>
                SAR {Math.round(forecast.totalPredictedProfit ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">After product costs</p>
            </div>

            {/* Units */}
            <div className="card bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/30 dark:to-gray-800 border-indigo-200 dark:border-indigo-800">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                  Units
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <span className="text-gray-400 dark:text-gray-500 font-normal mr-0.5" title="Forecast — approximate value">≈</span>
                {forecast.totalPredictedQuantity.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Items expected to be sold</p>
            </div>

            {/* Period */}
            <div className="card bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/30 dark:to-gray-800 border-amber-200 dark:border-amber-800">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Period
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{effectiveDays} days</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {forecast.scope === 'item' ? forecast.target :
                 forecast.scope === 'category' ? forecast.target :
                 `${forecast.categoryCount} categories · ${forecast.itemCount} items`}
              </p>
            </div>
          </div>

          {/* Manager tips — the "what should I do?" section */}
          {forecast.managerTips?.length > 0 && (
            <div className="card bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800 border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-primary-900 dark:text-primary-100">What this means for you</h3>
              </div>
              <ul className="space-y-2">
                {forecast.managerTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-primary-900 dark:text-primary-100">
                    <span className="mt-0.5 text-primary-500">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notable events in the window — weekends collapse into one
              summary badge; rare events (Ramadan, Eid, National Day) are
              still listed individually with their dates. */}
          {forecast.notableEvents?.length > 0 && (() => {
            const weekends = forecast.notableEvents.filter((e) => e.event === 'Weekend');
            const special = forecast.notableEvents.filter((e) => e.event !== 'Weekend');
            if (weekends.length === 0 && special.length === 0) return null;
            const emoji = (ev) => ({
              'Ramadan':              '🌙',
              'Eid al-Fitr':          '🕌',
              'Eid al-Adha':          '🕌',
              'Saudi National Day':   '🇸🇦',
              'Payday':               '💰',
              'Post-payday spending': '🛍️',
            }[ev] || '📅');
            const color = (ev) =>
              ev === 'Ramadan'              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
              : ev.startsWith('Eid')        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : ev === 'Saudi National Day' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : ev === 'Payday'             ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';

            // Group consecutive same-event days into ranges. Without
            // this, a 9-day "Post-payday spending" window renders as
            // 9 identical pills cluttering the panel.
            const sortedSpecial = [...special].sort((a, b) => a.date.localeCompare(b.date));
            const groups = [];
            for (const e of sortedSpecial) {
              const last = groups[groups.length - 1];
              const eDate = new Date(e.date + 'T00:00:00');
              if (last && last.event === e.event) {
                const lastEnd = new Date(last.endDate + 'T00:00:00');
                const dayDiff = Math.round((eDate - lastEnd) / 86400000);
                if (dayDiff === 1) {
                  last.endDate = e.date;
                  last.count += 1;
                  continue;
                }
              }
              groups.push({ event: e.event, startDate: e.date, endDate: e.date, count: 1 });
            }
            const fmtDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-5 h-5 text-primary-500" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Special days in this period</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {weekends.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <span>🏖️</span>
                      <span>
                        {weekends.length} weekend day{weekends.length === 1 ? '' : 's'}
                        {' '}(Fri & Sat)
                      </span>
                    </span>
                  )}
                  {groups.map((g, i) => (
                    <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${color(g.event)}`}>
                      <span>{emoji(g.event)}</span>
                      <span>{g.event}</span>
                      <span className="opacity-70">
                        {' · '}
                        {g.count === 1
                          ? fmtDay(g.startDate)
                          : `${fmtDay(g.startDate)} – ${fmtDay(g.endDate)} (${g.count} days)`}
                      </span>
                    </span>
                  ))}
                  {groups.length === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center ml-1">
                      No Ramadan, Eid, payday, or national holidays in this window.
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Main chart — simple AreaChart driven by recharts directly */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-primary-500" />
                {forecast.scope === 'total' ? 'Daily forecast — whole menu' :
                 `Daily forecast — ${forecast.target}`}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {chartData.length} days · {forecast.totalPredictedQuantity.toLocaleString()} units
                {forecast.totalPredictedRevenue != null && (
                  <> · SAR {Math.round(forecast.totalPredictedRevenue).toLocaleString()}</>
                )}
              </span>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" width={40} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const { predicted = 0, revenue = 0, dayOfWeek } = payload[0].payload || {};
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white mb-1.5">
                            {dayOfWeek}, {label}
                          </p>
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-gray-500 dark:text-gray-400">Units</span>
                              <span className="font-semibold text-gray-900 dark:text-white">≈ {predicted.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-gray-500 dark:text-gray-400">Revenue</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                ≈ SAR {revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} fill="url(#forecastFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key moments — consolidated into a subtle inline row under the chart */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm px-1">
            {bestSeller && (
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-gray-500 dark:text-gray-400">
                  {bestSeller.kind === 'category' ? 'Top category:' : 'Top item:'}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{bestSeller.label}</span>
                <span className="text-xs text-gray-400">({bestSeller.qty.toLocaleString()} units)</span>
              </div>
            )}
            {peakDay && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success-500" />
                <span className="text-gray-500 dark:text-gray-400">Peak:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{peakDay.dayOfWeek}, {peakDay.label}</span>
              </div>
            )}
            {slowestDay && (
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Slowest:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{slowestDay.dayOfWeek}, {slowestDay.label}</span>
              </div>
            )}
          </div>

          {/* Day-of-week pattern */}
          {dayOfWeekPattern.length > 1 && (
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                Busiest days of the week
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Adds up every Sunday, Monday, etc. across your {effectiveDays}-day forecast so you can spot weekly patterns.
              </p>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={dayOfWeekPattern} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" width={40} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v.toLocaleString(), 'Predicted qty']} />
                    <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                      {dayOfWeekPattern.map((d, i) => (
                        <Cell key={i} fill={d.day === 'Fri' || d.day === 'Sat' ? '#f59e0b' : '#6366f1'} />
                      ))}
                      <LabelList dataKey="qty" position="top" style={{ fontSize: 10, fill: '#6b7280' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                Friday and Saturday are highlighted as the Saudi weekend (typically busier).
              </p>
            </div>
          )}

          {/* Top sellers — gives the manager a clear view of what will lead sales */}
          {forecast.scope !== 'item' && (() => {
            const rows = forecast.scope === 'total' ? (forecast.categories || []) : (forecast.items || []);
            if (rows.length === 0) return null;
            const top = rows.slice(0, 5);
            const maxQty = Math.max(...top.map((r) => r.totalPredictedQuantity));
            const title = forecast.scope === 'total' ? 'Top 5 categories this period' : 'Top 5 items in this category';
            return (
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Ranked by predicted units for the {effectiveDays}-day period.
                </p>
                <ol className="space-y-3">
                  {top.map((row, i) => {
                    const pct = maxQty > 0 ? (row.totalPredictedQuantity / maxQty) * 100 : 0;
                    const emoji = categoryEmoji(row.name);
                    return (
                      <li key={row.name} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-lg flex-shrink-0" aria-hidden>{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{row.name}</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white ml-2 flex-shrink-0">
                              {row.totalPredictedQuantity.toLocaleString()}
                              <span className="text-xs text-gray-400 font-normal"> units</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-primary-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {row.itemCount !== undefined && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {row.itemCount} {row.itemCount === 1 ? 'item' : 'items'} in this category
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {rows.length > 5 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 italic">
                    Plus {rows.length - 5} more below the top 5.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Whole-menu forecast: top 5 individual items + watch-list of
              slowest 5. Only for the "total" scope — category / item
              scopes already drill into item-level detail. */}
          {forecast.scope === 'total' && (forecast.topItems?.length > 0 || forecast.bottomItems?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {forecast.topItems?.length > 0 && (
                <div className="card dark:bg-gray-800 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success-500" />
                    Top 5 items forecast
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Best-selling individual products expected over the {effectiveDays}-day window.
                  </p>
                  <ol className="space-y-2">
                    {forecast.topItems.map((row, i) => (
                      <li key={row.name} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-[10px] font-bold text-success-700 dark:text-success-300 flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{row.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{row.category}</p>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white flex-shrink-0">
                          {row.totalPredictedQuantity.toLocaleString()}
                          <span className="text-xs text-gray-400 font-normal"> units</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {forecast.bottomItems?.length > 0 && (
                <div className="card dark:bg-gray-800 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-gray-400" />
                    Watch-list — slowest 5 items
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Lowest predicted demand. Candidates for a promotion, price adjustment, or menu removal.
                  </p>
                  <ol className="space-y-2">
                    {forecast.bottomItems.map((row, i) => (
                      <li key={row.name} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{row.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{row.category}</p>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white flex-shrink-0">
                          {row.totalPredictedQuantity.toLocaleString()}
                          <span className="text-xs text-gray-400 font-normal"> units</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Weather context — a single combined summary of the window's
              climate and what it means for sales */}
          {weatherContext && (
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="text-4xl leading-none flex-shrink-0" aria-hidden>
                  {weatherContext.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Weather context — {weatherContext.headline}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {weatherContext.advice}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 italic">
                    Already factored into the forecast — hot-month iced-drink spikes, winter hot-drink peaks, etc. are learned from your past sales.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time-of-day breakdown (item scope only) — only rendered when
              the uploaded data actually has multiple time-of-day buckets.
              Otherwise we show an honest note instead of a misleading chart. */}
          {forecast.scope === 'item' && (
            forecast.timeOfDayAvailable && timePeriodTotals ? (
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  Predicted quantity by time of day
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {timePeriodTotals.map(({ tp, qty }) => {
                    const Icon = TIME_PERIOD_ICON[tp] || Sun;
                    return (
                      <div key={tp} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                        <Icon className="w-5 h-5 mx-auto mb-2 text-primary-500" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{tp}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                          {qty.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card dark:bg-gray-800 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Time-of-day breakdown not available for this upload
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your uploaded file doesn't include order times — all orders land in a single bucket, so a morning / afternoon / evening / night split wouldn't reflect real customer behavior.
                      Upload a file with a <code className="px-1 rounded bg-gray-200 dark:bg-gray-700">time</code> column alongside <code className="px-1 rounded bg-gray-200 dark:bg-gray-700">date</code> to unlock this view.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Full rankings (visible only when there are more than the top 5 shown above) */}
          {(forecast.scope === 'total' || forecast.scope === 'category') && (() => {
            const rows = forecast.scope === 'total' ? (forecast.categories || []) : (forecast.items || []);
            if (rows.length <= 5) return null;
            return (
              <details className="card dark:bg-gray-800 dark:border-gray-700 group">
                <summary className="cursor-pointer select-none flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 list-none">
                  <span className="flex items-center gap-2">
                    <ListIcon size={16} className="text-gray-400" />
                    <span>See the full ranking ({rows.length} {forecast.scope === 'total' ? 'categories' : 'items'})</span>
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-4">
                  <DataTable
                    data={rows}
                    columns={
                      forecast.scope === 'total'
                        ? [
                            { key: 'name', label: 'Category' },
                            { key: 'itemCount', label: 'Items' },
                            { key: 'totalPredictedQuantity', label: 'Predicted qty', render: (v) => v.toLocaleString() },
                          ]
                        : [
                            { key: 'name', label: 'Item' },
                            { key: 'totalPredictedQuantity', label: 'Predicted qty', render: (v) => v.toLocaleString() },
                          ]
                    }
                    pageSize={15}
                  />
                </div>
              </details>
            );
          })()}
        </>
      )}

      {/* Prompt to generate — only shown when data IS uploaded but no forecast run yet */}
      {dataRange?.hasData && !forecast && !loading && !error && (
        <div className="card text-center py-10 dark:bg-gray-800 dark:border-gray-700">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pick what to forecast and click <strong>Generate forecast</strong> to see your predictions.
          </p>
        </div>
      )}
    </div>
  );
};

// Short date formatter for banners: "Jul 1, 2024"
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Emoji for each category — pattern-matched so it works for any upload's naming.
const categoryEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (/espresso|americano|hot coffee|latte/.test(n) && !/ice|cold/.test(n)) return '☕';
  if (/cold coffee|iced coffee|frappe/.test(n))                             return '🧊';
  if (/cold drink|cold beverage|juice|soda|soft drink|smoothie|water/.test(n)) return '🥤';
  if (/hot drink|tea|chocolate/.test(n))                                    return '☕';
  if (/bakery|bread|croissant|pastry|muffin|donut|bagel/.test(n))           return '🥐';
  if (/hot sweet|waffle|pancake|crepe/.test(n))                             return '🧇';
  if (/sweet|dessert|cake|cheesecake|ice cream|cookie/.test(n))             return '🍰';
  if (/savory|sandwich|burger|pizza|panini|wrap|salad/.test(n))             return '🥪';
  if (/seafood|fish|shrimp/.test(n))                                        return '🦐';
  if (/chicken|meat|beef|grill|bbq|steak/.test(n))                          return '🍗';
  return '🍽️';
};

const StepLabel = ({ n, label }) => (
  <div className="flex items-center gap-2 mt-1">
    <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[10px] font-bold flex items-center justify-center">{n}</span>
    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{label}</span>
  </div>
);

export default Forecasting;
