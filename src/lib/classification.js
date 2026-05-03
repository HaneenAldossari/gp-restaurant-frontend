// Boston Matrix classifications (Star / Plowhorse / Puzzle / Dog)
// from the backend. Earlier versions wrapped these in friendlier labels
// ("Hero item", "Underperformer"), but the team decided the academic
// names are clearer for the thesis context and avoid the awkward
// situation where the dashboard says "Hero item" while the supervisor
// asks "what's a Star?". Tooltips still spell out the meaning.

export const CLASSIFICATION_MAP = {
  Star: {
    label: 'Star',
    emoji: '⭐',
    advice: 'Keep featuring it prominently — this is a winner.',
    tooltip: 'Star — high popularity and high profit margin.',
    color: 'emerald',
    // Tailwind classes for each visual layer
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: '#10b981',
  },
  Plowhorse: {
    label: 'Plowhorse',
    emoji: '🐎',
    advice: 'High demand but low profit — try a small price increase, or negotiate the unit cost down.',
    tooltip: 'Plowhorse — high popularity but low profit margin.',
    color: 'amber',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    dot: '#f59e0b',
  },
  Puzzle: {
    label: 'Puzzle',
    emoji: '🧩',
    advice: 'Great profit, low sales — feature it more in promotions.',
    tooltip: 'Puzzle — low popularity but high profit margin.',
    color: 'sky',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-700 dark:text-sky-300',
    dot: '#0ea5e9',
  },
  Dog: {
    label: 'Dog',
    emoji: '🐕',
    advice: 'Low on both sales and profit — rework the recipe or remove it.',
    tooltip: 'Dog — low popularity and low profit margin.',
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
