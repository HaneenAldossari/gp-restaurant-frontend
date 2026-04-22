import { Link } from 'react-router-dom';
import { Upload as UploadIcon, ArrowRight } from 'lucide-react';

/**
 * Friendly "no data yet" prompt shown on pages that need uploaded sales
 * data before they can show anything useful. Intentionally upbeat and
 * welcoming — not a red error box.
 */
const EmptyState = ({
  emoji = '📊',
  title = 'No data yet',
  message = 'Upload your sales file to start seeing insights.',
  ctaLabel = 'Go to Upload',
  ctaTo = '/upload',
}) => (
  <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-12 px-6 bg-gradient-to-br from-primary-50/60 to-white dark:from-primary-900/10 dark:to-gray-800 border-primary-100 dark:border-primary-900/40">
    <div className="text-5xl mb-3" aria-hidden>{emoji}</div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
      {message}
    </p>
    <Link
      to={ctaTo}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold transition shadow-sm"
    >
      <UploadIcon size={16} />
      {ctaLabel}
      <ArrowRight size={16} />
    </Link>
  </div>
);

export default EmptyState;
