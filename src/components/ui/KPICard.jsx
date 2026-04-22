import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  trendValue = 0,
  prefix = '',
  suffix = '',
  comparisonText = 'vs last month',
  iconBgColor = 'bg-primary-100',
  iconColor = 'text-primary-600',
  loading = false
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('en-US', {
        minimumFractionDigits: val % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2
      });
    }
    return val;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600';
    if (trend === 'down') return 'text-danger-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card hover:shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="metric-value text-gray-900 dark:text-white">
            {prefix}{formatValue(value)}{suffix}
          </p>
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trendValue)}%</span>
            <span className="text-gray-400 font-normal dark:text-gray-500">{comparisonText}</span>
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBgColor} dark:bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
