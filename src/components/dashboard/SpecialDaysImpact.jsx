import { useMemo } from 'react';
import { CalendarDays, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { getEventsInRange, describeDate } from '../../lib/saudiCalendar';

// "Sales around special days" panel for the Dashboard.
//
// Takes the same dailyRevenue array the chart already uses and computes,
// for each Saudi-calendar occasion that overlaps the window:
//   - avg daily revenue *during* the event (and its lead-up)
//   - avg daily revenue on all OTHER days in the window
//   - the % lift / drop the event represents
//
// It also captions the peak day in the window with the closest occasion
// — answering questions like "why was July 6 the top day?" without the
// manager having to look up the calendar.

const fmtSar = (n) => `${Math.round(n).toLocaleString('en-US')} SAR`;
const fmtPct = (n) => {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
};
const fmtDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric',
});

const phaseTone = {
  lead: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  event: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const SpecialDaysImpact = ({ dailyRevenue, startDate, endDate }) => {
  // Compute the analysis once per data change — this is pure data work
  // (no fetch). If the input is empty we render nothing rather than an
  // empty card.
  const analysis = useMemo(() => {
    const rows = (dailyRevenue || []).filter((r) => r && r.date && r.revenue != null);
    if (rows.length < 2) return null;

    // The chart's earliest/latest dates ARE the analysis window —
    // if the user filtered to "Hot Drinks · last 30 days" we want
    // to find events in those 30 days only.
    const first = startDate || rows[0].date;
    const last = endDate || rows[rows.length - 1].date;
    const events = getEventsInRange(first, last);

    // Index daily revenue by date for fast lookup
    const revByDate = new Map();
    for (const r of rows) revByDate.set(r.date, r.revenue || 0);

    // Mark which dates are part of which event (a date can fall in
    // more than one — e.g. the day before Eid that's also payday week —
    // we keep the first match, ordered by significance: Eid first, then
    // Ramadan, then national days, then payday)
    const eventDates = new Set();
    for (const ev of events) {
      for (const d of ev.daysInWindow) eventDates.add(d.date);
    }
    const baselineRevs = [];
    for (const r of rows) {
      if (!eventDates.has(r.date)) baselineRevs.push(r.revenue || 0);
    }
    const baselineAvg = baselineRevs.length
      ? baselineRevs.reduce((s, x) => s + x, 0) / baselineRevs.length
      : null;

    // Per-event impact
    const impacts = events.map((ev) => {
      const days = ev.daysInWindow.map((d) => ({
        ...d, revenue: revByDate.get(d.date) ?? null,
      })).filter((d) => d.revenue != null);
      if (!days.length) return null;
      const avg = days.reduce((s, d) => s + d.revenue, 0) / days.length;
      const liftPct = baselineAvg ? ((avg - baselineAvg) / baselineAvg) * 100 : 0;
      const peakDay = days.reduce((a, b) => (b.revenue > a.revenue ? b : a));
      return {
        event: ev,
        avg,
        baselineAvg,
        liftPct,
        peakDay,
        days: days.length,
      };
    }).filter(Boolean);

    // Top day in the entire window (regardless of event) — caption with
    // its occasion if there is one
    const peak = rows.reduce((a, b) => (b.revenue > a.revenue ? b : a));
    const peakContext = describeDate(peak.date);
    // Same for the slowest day
    const slow = rows.reduce((a, b) => (b.revenue < a.revenue ? b : a));
    const slowContext = describeDate(slow.date);

    return { events: impacts, baselineAvg, peak, peakContext, slow, slowContext };
  }, [dailyRevenue, startDate, endDate]);

  if (!analysis) return null;
  const { events, baselineAvg, peak, peakContext, slow, slowContext } = analysis;

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-5 h-5 text-primary-500" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Sales around special days
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        How each Saudi occasion in this window affected revenue compared with normal days.
      </p>

      {/* Peak / slow callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] uppercase tracking-wide font-semibold text-emerald-700 dark:text-emerald-400">
              Top day
            </span>
          </div>
          <div className="text-base font-bold text-gray-900 dark:text-white">
            {fmtDay(peak.date)} · {fmtSar(peak.revenue)}
          </div>
          {peakContext && (
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
              <span>
                <strong>{peakContext.phaseLabel}.</strong>
                {peakContext.event ? ` ${peakContext.event.blurb}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-gray-500" />
            <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
              Slowest day
            </span>
          </div>
          <div className="text-base font-bold text-gray-900 dark:text-white">
            {fmtDay(slow.date)} · {fmtSar(slow.revenue)}
          </div>
          {slowContext && (
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1.5">
              {slowContext.phaseLabel}{slowContext.event ? '.' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Per-event impact list */}
      {events.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No major Saudi occasions fell inside this window. The peak/slow days above are
          driven by weekday or payday patterns instead.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Compared to the average normal day in this window
            {baselineAvg != null ? ` (${fmtSar(baselineAvg)})` : ''}.
          </div>
          {events.map((it) => {
            const positive = it.liftPct >= 0;
            const dateLabel = it.event.start === it.event.end
              ? fmtDay(it.event.start)
              : `${fmtDay(it.event.start)} – ${fmtDay(it.event.end)}`;
            return (
              <div
                key={it.event.key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[60%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{it.event.emoji}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {it.event.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {dateLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {it.event.blurb}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold ${positive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'}`}>
                      {fmtPct(it.liftPct)}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      vs normal day
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      {fmtSar(it.avg)} avg · {it.days} day{it.days === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
                {it.peakDay && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    Best day during this period:{' '}
                    <strong className="text-gray-700 dark:text-gray-200">
                      {fmtDay(it.peakDay.date)} · {fmtSar(it.peakDay.revenue)}
                    </strong>
                    {it.peakDay.phase === 'lead' && (
                      <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${phaseTone.lead}`}>
                        Pre-event shopping
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpecialDaysImpact;
