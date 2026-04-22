import { useState } from 'react';
import { Calendar, ChevronDown, Filter, Download } from 'lucide-react';

const FilterBar = ({
  onDateRangeChange,
  onBranchChange,
  onCategoryChange,
  onExport,
  branches = [],
  categories = [],
  showBranch = true,
  showCategory = true,
  className = ''
}) => {
  const [dateRange, setDateRange] = useState('last30days');
  const [branch, setBranch] = useState('all');
  const [category, setCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' }
  ];

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    onDateRangeChange?.(value);
  };

  const handleBranchChange = (value) => {
    setBranch(value);
    onBranchChange?.(value);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    onCategoryChange?.(value);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Date Range */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="appearance-none bg-transparent text-sm text-gray-700 dark:text-gray-300 font-medium pr-6 focus:outline-none cursor-pointer"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 -ml-5" />
            </div>
          </div>

          {/* Branch */}
          {showBranch && (
            <>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
              <select
                value={branch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="appearance-none bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="all">All Branches</option>
                {branches.map(b => (
                  <option key={b.value || b} value={b.value || b}>{b.label || b}</option>
                ))}
              </select>
            </>
          )}

          {/* Category */}
          {showCategory && (
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="appearance-none bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.value || c} value={c.value || c}>{c.label || c}</option>
              ))}
            </select>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {/* Mobile Filters */}
      {showFilters && (
        <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
          {showBranch && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Branch</label>
              <select
                value={branch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Branches</option>
                {branches.map(b => (
                  <option key={b.value || b} value={b.value || b}>{b.label || b}</option>
                ))}
              </select>
            </div>
          )}
          {showCategory && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.value || c} value={c.value || c}>{c.label || c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
