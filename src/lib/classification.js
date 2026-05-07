// Boston Matrix classifications used consistently across the system
// and the project report. Keys (Star / Plowhorse / Puzzle / Dog) match
// the backend's `classification` field so nothing about the data
// plumbing changes.

export const CLASSIFICATION_MAP = {
  Star: {
    label: 'Star',
    emoji: '⭐',
    advice: 'High popularity and high profit margin — keep featuring this item prominently.',
    tooltip: 'Star — high popularity and high profit margin.',
    color: 'emerald',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: '#10b981',
  },
  Plowhorse: {
    label: 'Plowhorse',
    emoji: '🔥',
    advice: 'High popularity but low profit margin — try a small price increase, or negotiate the unit cost down.',
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
    advice: 'Low popularity but high profit margin — feature it more in promotions to lift demand.',
    tooltip: 'Puzzle — low popularity but high profit margin.',
    color: 'sky',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-700 dark:text-sky-300',
    dot: '#0ea5e9',
  },
  Dog: {
    label: 'Dog',
    emoji: '⚠️',
    advice: 'Low popularity and low profit margin — rework the recipe or remove the item.',
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
