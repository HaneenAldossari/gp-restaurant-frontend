// Saudi-calendar helper for the Dashboard's "occasions impact" panel.
//
// We hardcode the major events year-by-year because:
//  1) The Hijri-to-Gregorian conversion needs a lunar-calendar library
//     and an extra MB of bundle for what amounts to ~5 dates per year.
//  2) Eid dates are *officially* announced by moon sighting, so even a
//     library is approximate. Hardcoding lets us match exactly what
//     happened locally in Riyadh.
//  3) The set of "events worth noticing" is small and stable.
//
// Each event has:
//   key       — stable id, used as React key
//   name      — display label
//   emoji     — visual marker
//   start     — ISO date 'YYYY-MM-DD' (inclusive)
//   end       — ISO date 'YYYY-MM-DD' (inclusive); single-day = same as start
//   blurb     — one-sentence why-it-matters for sales
//   leadDays  — optional; "pre-event window" days before `start` that
//               typically see lift (e.g. shopping before Eid)
//
// To extend a new year, add an entry to EVENTS_BY_YEAR.

const EVENTS_BY_YEAR = {
  2022: [
    { key: '2022-founding', name: 'Saudi Founding Day',
      emoji: '🇸🇦', start: '2022-02-22', end: '2022-02-22',
      blurb: 'National holiday since 2022. Cafes typically see a small lift from extended family outings.' },
    { key: '2022-ramadan', name: 'Ramadan',
      emoji: '🌙', start: '2022-04-02', end: '2022-05-01',
      blurb: 'Daytime fasting shifts demand to evenings (Iftar/Suhoor). Daily totals can stay flat or drop, but evening sales spike.' },
    { key: '2022-eid-fitr', name: 'Eid al-Fitr',
      emoji: '🕌', start: '2022-05-02', end: '2022-05-04', leadDays: 3,
      blurb: 'Three-day celebration after Ramadan. Day 1 is often quiet (family at home); days 2–3 bring big foot traffic.' },
    { key: '2022-eid-adha', name: 'Eid al-Adha',
      emoji: '🕌', start: '2022-07-09', end: '2022-07-12', leadDays: 4,
      blurb: 'Four-day holiday — the biggest commercial event of the year for cafes. Pre-Eid shopping days are usually the peak.' },
    { key: '2022-national', name: 'Saudi National Day',
      emoji: '🇸🇦', start: '2022-09-23', end: '2022-09-23',
      blurb: 'National holiday. Heavy foot traffic, themed promotions, often the year\'s second-busiest day.' },
  ],
  2023: [
    { key: '2023-founding', name: 'Saudi Founding Day',
      emoji: '🇸🇦', start: '2023-02-22', end: '2023-02-22',
      blurb: 'National holiday. Family outings drive a small lift.' },
    { key: '2023-ramadan', name: 'Ramadan',
      emoji: '🌙', start: '2023-03-22', end: '2023-04-20',
      blurb: 'Demand shifts to evenings; daily totals may dip but Iftar/Suhoor spikes are sharp.' },
    { key: '2023-eid-fitr', name: 'Eid al-Fitr',
      emoji: '🕌', start: '2023-04-21', end: '2023-04-23', leadDays: 3,
      blurb: 'End-of-Ramadan celebration. Day 1 quieter; days 2–3 peak.' },
    { key: '2023-eid-adha', name: 'Eid al-Adha',
      emoji: '🕌', start: '2023-06-28', end: '2023-07-01', leadDays: 4,
      blurb: 'Major commercial event. Pre-Eid days drive the biggest revenue.' },
    { key: '2023-national', name: 'Saudi National Day',
      emoji: '🇸🇦', start: '2023-09-23', end: '2023-09-23',
      blurb: 'National holiday — heavy foot traffic.' },
  ],
  2024: [
    { key: '2024-founding', name: 'Saudi Founding Day',
      emoji: '🇸🇦', start: '2024-02-22', end: '2024-02-22',
      blurb: 'National holiday — small but consistent lift.' },
    { key: '2024-ramadan', name: 'Ramadan',
      emoji: '🌙', start: '2024-03-11', end: '2024-04-09',
      blurb: 'Evening-skewed demand; daily totals depend on whether the cafe stays open during fasting hours.' },
    { key: '2024-eid-fitr', name: 'Eid al-Fitr',
      emoji: '🕌', start: '2024-04-10', end: '2024-04-12', leadDays: 3,
      blurb: 'Three-day celebration; day 1 quieter, days 2–3 peak.' },
    { key: '2024-eid-adha', name: 'Eid al-Adha',
      emoji: '🕌', start: '2024-06-16', end: '2024-06-19', leadDays: 4,
      blurb: 'Biggest commercial event of the year. Pre-Eid shopping days drive most of the lift.' },
    { key: '2024-national', name: 'Saudi National Day',
      emoji: '🇸🇦', start: '2024-09-23', end: '2024-09-23',
      blurb: 'National holiday — strong demand.' },
  ],
  2025: [
    { key: '2025-founding', name: 'Saudi Founding Day',
      emoji: '🇸🇦', start: '2025-02-22', end: '2025-02-22',
      blurb: 'National holiday — small lift expected.' },
    { key: '2025-ramadan', name: 'Ramadan',
      emoji: '🌙', start: '2025-03-01', end: '2025-03-30',
      blurb: 'Fasting month — demand shifts to evenings.' },
    { key: '2025-eid-fitr', name: 'Eid al-Fitr',
      emoji: '🕌', start: '2025-03-31', end: '2025-04-02', leadDays: 3,
      blurb: 'Three-day celebration after Ramadan.' },
    { key: '2025-eid-adha', name: 'Eid al-Adha',
      emoji: '🕌', start: '2025-06-06', end: '2025-06-09', leadDays: 4,
      blurb: 'Major holiday; biggest revenue event of the year for most cafes.' },
    { key: '2025-national', name: 'Saudi National Day',
      emoji: '🇸🇦', start: '2025-09-23', end: '2025-09-23',
      blurb: 'National holiday.' },
  ],
  2026: [
    { key: '2026-founding', name: 'Saudi Founding Day',
      emoji: '🇸🇦', start: '2026-02-22', end: '2026-02-22',
      blurb: 'National holiday.' },
    { key: '2026-ramadan', name: 'Ramadan',
      emoji: '🌙', start: '2026-02-18', end: '2026-03-19',
      blurb: 'Fasting month — daytime quieter, evenings spike.' },
    { key: '2026-eid-fitr', name: 'Eid al-Fitr',
      emoji: '🕌', start: '2026-03-20', end: '2026-03-22', leadDays: 3,
      blurb: 'End-of-Ramadan celebration.' },
    { key: '2026-eid-adha', name: 'Eid al-Adha',
      emoji: '🕌', start: '2026-05-26', end: '2026-05-29', leadDays: 4,
      blurb: 'Biggest holiday of the year — pre-Eid spike is the typical peak.' },
    { key: '2026-national', name: 'Saudi National Day',
      emoji: '🇸🇦', start: '2026-09-23', end: '2026-09-23',
      blurb: 'National holiday.' },
  ],
};

// Returns all events that intersect [startISO, endISO] (inclusive).
// Each returned event includes a derived `daysInWindow` array of every
// in-window date covered by either the event itself or its lead-up
// shopping window.
export const getEventsInRange = (startISO, endISO) => {
  if (!startISO || !endISO) return [];
  const startYear = parseInt(startISO.slice(0, 4), 10);
  const endYear = parseInt(endISO.slice(0, 4), 10);
  const out = [];
  for (let y = startYear; y <= endYear; y++) {
    for (const ev of (EVENTS_BY_YEAR[y] || [])) {
      // Compute the "extended" event window: leadDays before start
      // through end. Pre-event days are tagged as 'lead' phase so the
      // UI can label them ("Pre-Eid shopping") differently.
      const evStart = ev.start;
      const evEnd = ev.end;
      const leadStart = ev.leadDays ? addDays(evStart, -ev.leadDays) : evStart;
      // Skip if no overlap
      if (leadStart > endISO || evEnd < startISO) continue;

      const daysInWindow = [];
      for (let d = leadStart; d <= evEnd; d = addDays(d, 1)) {
        if (d < startISO || d > endISO) continue;
        const phase = d < evStart ? 'lead' : d <= evEnd ? 'event' : 'after';
        daysInWindow.push({ date: d, phase });
      }
      if (daysInWindow.length) {
        out.push({ ...ev, daysInWindow });
      }
    }
  }
  return out;
};

// Find the single most-relevant event for a given date — used to
// caption the peak day ("July 6 → 3 days before Eid al-Adha").
export const describeDate = (iso) => {
  if (!iso) return null;
  const year = parseInt(iso.slice(0, 4), 10);
  for (const ev of (EVENTS_BY_YEAR[year] || [])) {
    const leadStart = ev.leadDays ? addDays(ev.start, -ev.leadDays) : ev.start;
    if (iso >= leadStart && iso <= ev.end) {
      const dayNum = daysBetween(ev.start, iso);
      let phaseLabel;
      if (iso < ev.start) {
        const before = -dayNum;
        phaseLabel = before === 1
          ? `Day before ${ev.name}`
          : `${before} days before ${ev.name}`;
      } else if (iso > ev.start && iso <= ev.end) {
        const total = daysBetween(ev.start, ev.end) + 1;
        if (total > 1) phaseLabel = `Day ${dayNum + 1} of ${ev.name}`;
        else phaseLabel = ev.name;
      } else {
        phaseLabel = ev.name;
      }
      return { event: ev, phaseLabel };
    }
  }
  // Fall back to plain weekday/payday context
  const d = new Date(iso + 'T00:00:00');
  const dom = d.getDate();
  if (dom >= 25 && dom <= 31) return { phaseLabel: 'End-of-month payday week' };
  const dow = d.getDay();
  if (dow === 5 || dow === 6) return { phaseLabel: 'Weekend' };
  return null;
};

// ── Date arithmetic helpers (string-only, no timezone surprises) ─────

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round(
    (new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000
  );
}
