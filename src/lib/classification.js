// Two label conventions live side-by-side:
//   • Action-based labels (Hero item / Popular, tight margin / Hidden
//     gem / Underperformer) — used for the surface UI: summary tiles,
//     filter dropdowns, recommendations tab. They tell a manager what
//     to DO with the item without forcing them through Boston Matrix
//     vocabulary.
//   • Academic names (Star / Plowhorse / Puzzle / Dog) — kept on the
//     popularity-vs-margin scatter plot's legend and quadrant labels
//     so the chart stays defensible as Boston Matrix in the thesis.
// The keys below are still the academic names (matching the backend's
// `classification` field) so nothing about the data plumbing changes.

export const CLASSIFICATION_MAP = {
  Star: {
    label: 'Hero item',
    emoji: '⭐',
    advice: 'Keep featuring it prominently — this is a winner.',
    tooltip: 'Hero item (Boston Matrix: Star) — high popularity and high profit margin.',
    color: 'emerald',
    // Tailwind classes for each visual layer
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: '#10b981',
  },
  Plowhorse: {
    label: 'Popular, tight margin',
    emoji: '🔥',
    advice: 'High demand but low profit — try a small price increase, or negotiate the unit cost down.',
    tooltip: 'Popular, tight margin (Boston Matrix: Plowhorse) — high popularity but low profit margin.',
    color: 'amber',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    dot: '#f59e0b',
  },
  Puzzle: {
    label: 'Hidden gem',
    emoji: '🧩',
    advice: 'Great profit, low sales — feature it more in promotions.',
    tooltip: 'Hidden gem (Boston Matrix: Puzzle) — low popularity but high profit margin.',
    color: 'sky',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-700 dark:text-sky-300',
    dot: '#0ea5e9',
  },
  Dog: {
    label: 'Underperformer',
    emoji: '⚠️',
    advice: 'Low on both sales and profit — rework the recipe or remove it.',
    tooltip: 'Underperformer (Boston Matrix: Dog) — low popularity and low profit margin.',
    color: 'rose',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    dot: '#f43f5e',
  },
};

export function getClassification(key) {
  return CLASSIFICATION_MAP[key] || CLASSIFICATION_MAP.Dog;
}

// Helper for "Plowhorse → Star" style transition strings
export function describeTransition(oldKey, newKey) {
  const oldC = getClassification(oldKey);
  const newC = getClassification(newKey);
  if (oldKey === newKey) {
    return `Stays: ${oldC.emoji} ${oldC.label}`;
  }
  return `${oldC.emoji} ${oldC.label} → ${newC.emoji} ${newC.label}`;
}
