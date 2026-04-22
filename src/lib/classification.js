// Maps the Boston Matrix classifications (Star / Plowhorse / Puzzle / Dog)
// from the backend into action-based UX labels.
//
// UX principle (decided with the team): a non-MBA restaurant owner should
// never have to translate "Puzzle" or "Dog" in their head. The primary
// label is an action; the academic term only appears in a tooltip.

export const CLASSIFICATION_MAP = {
  Star: {
    label: 'Hero item',
    emoji: '⭐',
    advice: 'Keep featuring it prominently — this is a winner.',
    tooltip: 'Boston Matrix: Star — high popularity and high profit margin.',
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
    advice: 'High demand but low profit — consider a small price increase.',
    tooltip: 'Boston Matrix: Plowhorse — high popularity but low profit margin.',
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
    tooltip: 'Boston Matrix: Puzzle — low popularity but high profit margin.',
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
    tooltip: 'Boston Matrix: Dog — low popularity and low profit margin.',
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
