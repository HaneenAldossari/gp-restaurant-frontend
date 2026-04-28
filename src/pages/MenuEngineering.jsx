import { useState, useEffect, useMemo } from 'react';
import { Filter, Info, AlertCircle, Sparkles, RotateCcw, Database, Lightbulb, CheckCircle2, AlertTriangle, ThumbsDown } from 'lucide-react';
import ScatterPlotChart from '../components/charts/ScatterPlotChart';
import DataTable from '../components/ui/DataTable';
import { fetchMenuEngineering, simulateWhatIf, fetchDataRange } from '../lib/api';
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

  const [dataRange, setDataRange] = useState(null);

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

  // Separately fetch the dataset window so the simulator can phrase its
  // projections with a real timeframe instead of vague "than today".
  useEffect(() => {
    fetchDataRange().then(setDataRange).catch(() => {});
  }, []);

  const historyDays = dataRange?.totalDays || null;

  const targetItem = useMemo(
    () => data?.items?.find((i) => i.name === targetName) || null,
    [data, targetName]
  );

  // Reset the sliders whenever the manager selects a different item, so
  // each item starts at its own current price rather than inheriting the
  // previous item's slider position.
  useEffect(() => {
    setPriceDelta(0);
    setCostDelta(0);
  }, [targetName]);

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

  // Verdict rules.
  //
  // For Dog (Underperformer) and Puzzle (Hidden gem), the pure constant-
  // elasticity profit model is misleading in BOTH directions:
  //  - Raising the price: model often predicts higher profit (because
  //    demand is tiny, so the qty drop matters little), but in reality
  //    raising prices on a failing item accelerates its decline. → bad.
  //  - Discounting: model shows profit dipping because margin shrinks on
  //    already-low volume. But a discount is the recommended recovery
  //    strategy — menu-engineering theory says test price-cuts, promote,
  //    or replace. Short-term profit sacrifice is the cost of finding
  //    out whether the item can be saved. → good (aligned with strategy).
  //
  //   good    → profit goes up and fewer than 15% of customers walk away,
  //             OR a price cut on a Dog/Puzzle (strategic test)
  //   risky   → profit goes up but more than 15% fewer customers
  //   bad     → profit goes down, OR a price raise on a Dog/Puzzle
  function verdictFor(currentQty, newQty, currentProfit, newProfit, priceWentUp, priceWentDown, classification) {
    const isDogOrPuzzle = classification === 'Dog' || classification === 'Puzzle';
    if (priceWentUp && isDogOrPuzzle) return 'bad';
    if (priceWentDown && isDogOrPuzzle) return 'good';
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
          qtySold: item.qtySold,
          revenue: item.revenue,
          category: item.category,
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
                {targetItem.category} · {targetItem.qtySold.toLocaleString()} units sold {historyDays ? `over ${historyDays} days` : ''}
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
              const direction = op.direction || (suggestedInt > currentPriceInt ? 'raise' : suggestedInt < currentPriceInt ? 'lower' : 'hold');
              const sameAsCurrent = direction === 'hold';
              const changePct = op.priceChangePct;
              const transitionChanged = op.currentClassification && op.newClassification && op.currentClassification !== op.newClassification;
              const fromClass = op.currentClassification ? getClassification(op.currentClassification) : null;
              const toClass = op.newClassification ? getClassification(op.newClassification) : null;

              // Direction-aware styling so a "raise" reads green and a
              // "lower" reads as a deliberate discount, not a warning.
              const dirStyle = {
                raise: { tag: 'Raise the price', tagBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', arrow: '↑' },
                lower: { tag: 'Lower the price', tagBg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',           arrow: '↓' },
                hold:  { tag: 'Hold the price',  tagBg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',          arrow: '=' },
              }[direction];

              return (
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs font-medium text-primary-700 dark:text-primary-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-amber-500" />
                      Suggested price
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${dirStyle.tagBg}`}>
                      <span className="text-sm leading-none">{dirStyle.arrow}</span>
                      {op.directionLabel || dirStyle.tag}
                      {changePct != null && !sameAsCurrent && (
                        <span className="opacity-80">({changePct > 0 ? '+' : ''}{changePct}%)</span>
                      )}
                    </span>
                  </div>
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
                        {' '}
                        {direction === 'raise' ? <>(<span className="font-medium">a small price bump would likely raise profit</span>)</>
                          : direction === 'lower' ? <>(<span className="font-medium">a small discount could unlock more demand</span>)</>
                          : null}
                      </p>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-2">
                        {op.rationale}
                      </p>
                    </>
                  )}

                  {/* Classification transition — what category does this item move to? */}
                  {fromClass && toClass && (
                    <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-800/50">
                      <p className="text-[11px] font-medium text-primary-700 dark:text-primary-300 uppercase tracking-wide mb-2">
                        Item category
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${fromClass.bg} ${fromClass.text} border ${fromClass.border}`}>
                          {fromClass.emoji} {fromClass.label}
                        </span>
                        {transitionChanged ? (
                          <>
                            <span className="text-primary-600 dark:text-primary-400 font-bold">→</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${toClass.bg} ${toClass.text} border ${toClass.border}`}>
                              {toClass.emoji} {toClass.label}
                            </span>
                            <span className="text-xs text-primary-700 dark:text-primary-300 ml-1">
                              {direction === 'raise' && op.newClassification === 'Star' && 'profit lift moves it into the Hero band'}
                              {direction === 'lower' && op.newClassification === 'Star' && 'higher demand pushes it into the Hero band'}
                              {direction === 'lower' && op.newClassification === 'Plowhorse' && 'discount drives volume up at the cost of margin'}
                              {direction === 'raise' && op.newClassification === 'Puzzle' && 'higher margin offsets the smaller crowd'}
                              {op.newClassification === 'Dog' && 'watch it carefully — risk of slipping further'}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            stays in the same band — change is too small to reshape the item's role on the menu
                          </span>
                        )}
                      </div>
                    </div>
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
              const priceWentUp = priceDelta > 0;
              const priceWentDown = priceDelta < 0;
              const itemClass = targetItem?.classification;
              const verdict = verdictFor(currQty, newQty, sim.current.profit, sim.simulated.newProfit, priceWentUp, priceWentDown, itemClass);

              // Tailored body text for the two Dog/Puzzle cases where the
              // verdict overrides the pure profit math.
              const isDogOrPuzzle = itemClass === 'Dog' || itemClass === 'Puzzle';
              const dogPuzzleRaiseBody = itemClass === 'Dog'
                ? 'Wrong direction for an Underperformer. Discount or replace.'
                : 'Wrong direction for a Hidden gem. Discount to unlock demand.';
              const dogPuzzleDiscountBody = itemClass === 'Dog'
                ? 'Aligned with strategy — discounting an Underperformer is the recommended test. Short-term profit may dip, but that’s the cost of finding out if the item can recover.'
                : 'Aligned with strategy — a Hidden gem often picks up with a discount. Run this as a 2–4 week test and watch demand.';

              let goodBody = 'Profit up, demand holds. Safe to try.';
              let badBody = 'Profit drops. Try a different price.';
              if (priceWentDown && isDogOrPuzzle) goodBody = dogPuzzleDiscountBody;
              if (priceWentUp && isDogOrPuzzle)   badBody = dogPuzzleRaiseBody;

              const verdictStyles = {
                good:  { bg: 'bg-success-50 dark:bg-success-900/20',  border: 'border-success-200 dark:border-success-800',  text: 'text-success-700 dark:text-success-300', title: 'Good idea',       Icon: CheckCircle2,  body: goodBody },
                risky: { bg: 'bg-amber-50 dark:bg-amber-900/20',      border: 'border-amber-200 dark:border-amber-800',      text: 'text-amber-700 dark:text-amber-300',    title: 'Risky',           Icon: AlertTriangle, body: 'Profit up, but you lose noticeable demand. Monitor closely.' },
                bad:   { bg: 'bg-danger-50 dark:bg-danger-900/20',    border: 'border-danger-200 dark:border-danger-800',    text: 'text-danger-700 dark:text-danger-300',  title: 'Not recommended', Icon: ThumbsDown,    body: badBody },
              }[verdict];
              const VerdictIcon = verdictStyles.Icon;

              // Per-month projections so the numbers feel concrete. We
              // scale the whole-history totals to a 30-day equivalent using
              // the uploaded window length.
              const monthlyCurrQty  = historyDays ? Math.round(currQty / historyDays * 30) : null;
              const monthlyNewQty   = historyDays ? Math.round(newQty  / historyDays * 30) : null;
              const monthlyProfitDiff = historyDays
                ? Math.round((sim.simulated.newProfit - sim.current.profit) / historyDays * 30)
                : null;
              const qtyDeltaPct = currQty > 0 ? Math.round((newQty - currQty) / currQty * 100) : 0;
              return (
                <>
                  <div className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                      At SAR {Math.round(targetItem.price + priceDelta)} (vs actual)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Units sold</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                          {newQty.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {qtyDeltaPct >= 0 ? '+' : ''}{qtyDeltaPct}% vs {currQty.toLocaleString()} actual
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profit change</p>
                        <p className={`text-3xl font-bold leading-tight ${profitDiff >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                          {profitDiff >= 0 ? '+' : '−'}SAR {Math.abs(profitDiff).toLocaleString()}
                        </p>
                        {monthlyProfitDiff !== null && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            ≈ {monthlyProfitDiff >= 0 ? '+' : '−'}SAR {Math.abs(monthlyProfitDiff)} per month
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Classification transition for the slider-driven scenario */}
                    {(() => {
                      const oldKey = sim.current.classification;
                      const newKey = sim.simulated.newClassification;
                      const oldC = getClassification(oldKey);
                      const newC = getClassification(newKey);
                      const changed = oldKey !== newKey;
                      return (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Item category at this price
                          </p>
                          <div className="flex items-center gap-2 flex-wrap text-sm">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${oldC.bg} ${oldC.text} border ${oldC.border}`}>
                              {oldC.emoji} {oldC.label}
                            </span>
                            {changed ? (
                              <>
                                <span className="text-gray-500 dark:text-gray-400 font-bold">→</span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${newC.bg} ${newC.text} border ${newC.border}`}>
                                  {newC.emoji} {newC.label}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                stays in the same band
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className={`rounded-lg p-3 text-sm border flex items-start gap-2 ${verdictStyles.bg} ${verdictStyles.border} ${verdictStyles.text}`}>
                    <VerdictIcon size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{verdictStyles.title}.</span>{' '}
                      <span className="opacity-90">{verdictStyles.body}</span>
                    </div>
                  </div>
                </>
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
