import { useState, useEffect, useMemo } from 'react';
import { Filter, Info, AlertCircle, Sparkles, RotateCcw, Database, Lightbulb, CheckCircle2, AlertTriangle, ThumbsDown } from 'lucide-react';
import ScatterPlotChart from '../components/charts/ScatterPlotChart';
import DataTable from '../components/ui/DataTable';
import { fetchMenuEngineering, simulateWhatIf } from '../lib/api';
import EmptyState from '../components/ui/EmptyState';
import { getClassification, describeTransition } from '../lib/classification';

const MenuEngineering = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  // What-If state
  const [targetName, setTargetName] = useState(null);
  const [priceDelta, setPriceDelta] = useState(0);
  const [costDelta, setCostDelta] = useState(0);
  const [sim, setSim] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Load menu engineering data
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMenuEngineering()
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e.message || 'Failed to load menu data'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const targetItem = useMemo(
    () => data?.items?.find((i) => i.name === targetName) || null,
    [data, targetName]
  );

  // Fetch simulation whenever item or sliders change. We always fetch (even
  // at priceDelta=0) so scenarios and advice are visible as soon as an item
  // is picked, not only after the manager moves a slider.
  useEffect(() => {
    if (!targetItem) { setSim(null); return; }
    let alive = true;
    setSimLoading(true);
    const newPrice = Math.max(0.01, targetItem.price + priceDelta);
    const newCost = costDelta !== 0 ? Math.max(0, targetItem.cost + costDelta) : null;
    simulateWhatIf({ target: targetItem.name, newPrice, newCost })
      .then((s) => { if (alive) setSim(s); })
      .catch(() => { if (alive) setSim(null); })
      .finally(() => { if (alive) setSimLoading(false); });
    return () => { alive = false; };
  }, [targetItem, priceDelta, costDelta]);

  const hasChange = priceDelta !== 0 || costDelta !== 0;

  // Simple verdict rules, translated to plain English:
  //   good    → profit goes up and fewer than 15% of customers walk away
  //   risky   → profit goes up but more than 15% fewer customers
  //   bad     → profit goes down
  function verdictFor(currentQty, newQty, currentProfit, newProfit) {
    if (newProfit <= currentProfit) return 'bad';
    if (newQty < currentQty * 0.85) return 'risky';
    return 'good';
  }

  const resetSim = () => {
    setPriceDelta(0);
    setCostDelta(0);
  };

  // Friendly upload prompt when there's no data yet
  if (error && /no data/i.test(error)) {
    return (
      <EmptyState
        emoji="🍽️"
        title="Menu insights will light up here"
        message="Upload your sales file and we'll classify your items into Hero products, Hidden gems, and more."
      />
    );
  }

  if (error) {
    return (
      <div className="card dark:bg-gray-800 dark:border-gray-700 border-danger-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-danger-700 dark:text-danger-400">Couldn't load menu engineering</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const categories = ['all', ...new Set(items.map((i) => i.category))];
  const classifications = ['all', 'Star', 'Plowhorse', 'Puzzle', 'Dog'];

  const filteredItems = items.filter((item) => {
    const catMatch = selectedCategory === 'all' || item.category === selectedCategory;
    const clsMatch = selectedClass === 'all' || item.classification === selectedClass;
    return catMatch && clsMatch;
  });

  // Summary tiles — one per action category
  const summaryTiles = ['Star', 'Plowhorse', 'Puzzle', 'Dog'].map((key) => {
    const c = getClassification(key);
    const q = data?.quadrants?.[key];
    return { key, ...c, count: q?.count ?? 0, revenue: q?.revenue ?? 0 };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Database size={12} />
        {loading ? 'Loading menu analysis…' : 'Live analysis'}
      </div>

      {/* Action-based summary tiles (no Boston Matrix jargon on the surface) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryTiles.map((t) => (
          <div
            key={t.key}
            className={`card border ${t.border} ${t.bg} dark:bg-gray-800 dark:border-gray-700`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${t.text}`}>
                  {t.emoji} {t.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{t.count} items</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.revenue.toLocaleString()} SAR revenue
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: t.dot + '30' }}
                title={t.tooltip}
              >
                <Info size={14} style={{ color: t.dot }} />
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{t.advice}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {classifications.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All recommendations' : `${getClassification(c).emoji} ${getClassification(c).label}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scatter plot — Popularity vs Margin */}
      <ScatterPlotChart
        data={filteredItems.map((item) => ({
          popularity: item.popularity,
          profitability: item.profitMargin,
          name: item.name,
          classification: item.classification,
        }))}
        title="Popularity vs Profit Margin"
        avgPopularity={data?.avgPopularity}
        avgProfitability={data?.avgMargin}
        loading={loading}
      />

      {/* Items table with action badges (no Star/Plowhorse/etc on the surface) */}
      <DataTable
        title={`Menu Items (${filteredItems.length})`}
        data={filteredItems}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (_, row) => (
              <button
                type="button"
                onClick={() => setTargetName(row.name)}
                className="text-left font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                {row.name}
              </button>
            ),
          },
          { key: 'category', label: 'Category' },
          { key: 'qtySold', label: 'Qty', render: (v) => v.toLocaleString() },
          { key: 'revenue', label: 'Revenue', render: (v) => `${v.toLocaleString()} SAR` },
          { key: 'profitMargin', label: 'Margin', render: (v) => `${v.toFixed(1)}%` },
          {
            key: 'classification',
            label: 'Recommendation',
            render: (v) => {
              const c = getClassification(v);
              return (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}
                  title={c.tooltip}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                </span>
              );
            },
          },
        ]}
        loading={loading}
        pageSize={12}
      />

      {/* Price Suggestions */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price Suggestions</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Click any item in the table above to see a suggested price and what happens if you try a different one.
        </p>

        {!targetItem ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Select an item in the table to start simulating.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Selected item header */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                {targetItem.name}
              </span>
              {(() => {
                const c = getClassification(targetItem.classification);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}
                    title={c.tooltip}
                  >
                    {c.emoji} {c.label}
                  </span>
                );
              })()}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {targetItem.category} · {targetItem.qtySold.toLocaleString()} sold
              </span>
              <button
                onClick={resetSim}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Hero suggestion card — the headline answer */}
            {sim?.recommendations?.optimalPrice && (() => {
              const op = sim.recommendations.optimalPrice;
              const currentPriceInt = Math.round(targetItem.price);
              const suggestedInt = op.price;
              const sameAsCurrent = suggestedInt === currentPriceInt;
              return (
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800">
                  <p className="text-xs font-medium text-primary-700 dark:text-primary-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-amber-500" />
                    Suggested price
                  </p>
                  {sameAsCurrent ? (
                    <>
                      <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1">
                        Keep the current price
                      </p>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-2">
                        Your current price of SAR {currentPriceInt} looks about right based on your sales history.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-bold text-primary-900 dark:text-primary-100 mt-1">
                        SAR {suggestedInt}
                      </p>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                        Current price: SAR {currentPriceInt}
                      </p>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-2">
                        {op.rationale}
                      </p>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price slider */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Current Price: SAR {Math.round(targetItem.price)}</span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    New: SAR {Math.round(targetItem.price + priceDelta)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-Math.floor(targetItem.price * 0.5)}
                  max={Math.ceil(targetItem.price * 1)}
                  step={1}
                  value={priceDelta}
                  onChange={(e) => setPriceDelta(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">Try a different selling price.</p>
              </div>

              {/* Cost slider */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Current Cost: SAR {Math.round(targetItem.cost)}</span>
                  <span className="text-sm font-bold text-accent-600 dark:text-accent-400">
                    New: SAR {Math.round(Math.max(0, targetItem.cost + costDelta))}
                  </span>
                </div>
                <input
                  type="range"
                  min={-Math.floor(targetItem.cost * 1)}
                  max={Math.ceil(targetItem.cost * 2)}
                  step={1}
                  value={costDelta}
                  onChange={(e) => setCostDelta(Number(e.target.value))}
                  className="w-full accent-accent-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">Cost changes affect margin only, not demand.</p>
              </div>
            </div>

            {/* What will happen — only when a slider has moved */}
            {sim && hasChange && (() => {
              const newQty = sim.simulated.projectedQty;
              const currQty = sim.current.qtySold;
              const profitDiff = Math.round(sim.simulated.newProfit - sim.current.profit);
              const verdict = verdictFor(currQty, newQty, sim.current.profit, sim.simulated.newProfit);

              const verdictStyles = {
                good:  { bg: 'bg-success-50 dark:bg-success-900/20',  border: 'border-success-200 dark:border-success-800',  text: 'text-success-700 dark:text-success-300', title: 'Good idea',           Icon: CheckCircle2,  body: 'Profit goes up and customers will still buy. This kind of change is usually safe to try.' },
                risky: { bg: 'bg-amber-50 dark:bg-amber-900/20',      border: 'border-amber-200 dark:border-amber-800',      text: 'text-amber-700 dark:text-amber-300',    title: 'Risky',              Icon: AlertTriangle, body: 'Profit goes up, but you may lose a noticeable number of customers. Watch closely if you try it.' },
                bad:   { bg: 'bg-danger-50 dark:bg-danger-900/20',    border: 'border-danger-200 dark:border-danger-800',    text: 'text-danger-700 dark:text-danger-300',  title: 'Not recommended',    Icon: ThumbsDown,    body: 'This change lowers your profit. Consider a different price.' },
              }[verdict];
              const VerdictIcon = verdictStyles.Icon;

              return (
                <>
                  <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      What will happen at this price
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                      <li>
                        About <strong>{newQty.toLocaleString()}</strong> customers will buy it
                        {' '}(currently {currQty.toLocaleString()}).
                      </li>
                      <li>
                        You'll earn{' '}
                        <strong className={profitDiff >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}>
                          {profitDiff >= 0 ? '+' : '−'}SAR {Math.abs(profitDiff).toLocaleString()}
                        </strong>
                        {' '}{profitDiff >= 0 ? 'more' : 'less'} profit than today.
                      </li>
                    </ul>
                  </div>

                  <div className={`rounded-lg p-3 text-sm border ${verdictStyles.bg} ${verdictStyles.border} ${verdictStyles.text}`}>
                    <p className="font-semibold mb-0.5 flex items-center gap-1.5">
                      <VerdictIcon size={14} />
                      {verdictStyles.title}
                    </p>
                    <p className="text-xs opacity-90">{verdictStyles.body}</p>
                  </div>
                </>
              );
            })()}

            {/* Compare a few prices side-by-side — always visible once an item is picked */}
            {sim && (() => {
              const presets = [
                { pct: -10, label: 'Small discount' },
                { pct: 10,  label: 'Small raise' },
                { pct: 20,  label: 'Bigger raise' },
              ];
              return (
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Compare prices
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {presets.map(({ pct, label }) => {
                      const sc = sim.scenarios.find((s) => s.priceChangePct === pct);
                      if (!sc) return null;
                      const v = verdictFor(sim.current.qtySold, sc.projectedQty, sim.current.profit, sc.newProfit);
                      const vStyles = {
                        good:  'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-400',
                        risky: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
                        bad:   'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400',
                      }[v];
                      const vConf = {
                        good:  { Icon: CheckCircle2,  label: 'Good' },
                        risky: { Icon: AlertTriangle, label: 'Risky' },
                        bad:   { Icon: ThumbsDown,    label: 'Avoid' },
                      }[v];
                      const VIcon = vConf.Icon;
                      const diff = Math.round(sc.newProfit - sim.current.profit);
                      return (
                        <div key={pct} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">SAR {Math.round(sc.newPrice)}</p>
                          <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                            <p>{sc.projectedQty.toLocaleString()} customers</p>
                            <p className={diff >= 0 ? 'text-success-600 dark:text-success-400 font-medium' : 'text-danger-600 dark:text-danger-400 font-medium'}>
                              {diff >= 0 ? '+' : '−'}SAR {Math.abs(diff).toLocaleString()} profit
                            </p>
                          </div>
                          <div className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${vStyles}`}>
                            <VIcon size={11} />
                            {vConf.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Honest note about how the estimates are made — collapsed by default */}
            {sim && (
              <details className="text-xs text-gray-500 dark:text-gray-400">
                <summary className="cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1.5">
                  <Info size={12} />
                  How are these numbers estimated?
                </summary>
                <div className="mt-2 pl-5 space-y-1.5">
                  <p>
                    Customer numbers at the current price come directly from your sales history — those are exact.
                  </p>
                  <p>
                    Numbers at a different price are <strong>estimates</strong>. We look at how your category (e.g. coffee vs desserts) typically responds to price changes and project what would happen.
                  </p>
                  <p>
                    Use these as guidance, not guarantees. Testing a small change in a real week is always more reliable than a prediction.
                  </p>
                </div>
              </details>
            )}

            {simLoading && (
              <p className="text-xs text-gray-400 text-center">Computing…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuEngineering;
