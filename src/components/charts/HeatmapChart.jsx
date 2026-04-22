import { useMemo } from 'react';

const HeatmapChart = ({
  data = [],
  title = 'Peak Hours Heatmap',
  loading = false
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Hour labels match the backend shape (strings like "9AM", "12PM"). The
  // backend emits hours 9–22, so we iterate the same range here.
  const hours = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const h = i + 9;
      return `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`;
    });
  }, []);

  // Scale color intensity to the actual max in the dataset — the old fixed
  // thresholds (30/50/70/85) were tuned for a different data scale and made
  // every cell look "less" for smaller shops.
  const maxValue = useMemo(() => {
    return Math.max(1, ...data.map((d) => d.value || 0));
  }, [data]);

  const getColorIntensity = (value) => {
    if (value <= 0) return 'bg-gray-100 dark:bg-gray-700/40';
    const pct = value / maxValue;
    if (pct < 0.2) return 'bg-primary-100 dark:bg-primary-900/30';
    if (pct < 0.4) return 'bg-primary-200 dark:bg-primary-800/40';
    if (pct < 0.6) return 'bg-primary-300 dark:bg-primary-700/50';
    if (pct < 0.8) return 'bg-primary-400 dark:bg-primary-600/60';
    return 'bg-primary-500 dark:bg-primary-500/70';
  };

  const getValue = (day, hour) => {
    const entry = data.find((d) => d.day === day && d.hour === hour);
    return entry?.value || 0;
  };

  if (loading) {
    return (
      <div className="card dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-[320px] bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour Headers */}
          <div className="flex">
            <div className="w-12 shrink-0"></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 pb-2"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          {days.map((day) => (
            <div key={day} className="flex items-center">
              <div className="w-12 shrink-0 text-xs text-gray-500 dark:text-gray-400 font-medium">
                {day}
              </div>
              {hours.map((hour) => {
                const value = getValue(day, hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`flex-1 h-8 m-0.5 rounded transition-all duration-200 cursor-pointer hover:scale-105 ${getColorIntensity(value)}`}
                    title={`${day} ${hour}: ${value} orders`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 opacity-0 hover:opacity-100 transition-opacity">
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
            <div className="flex gap-1">
              <div className="w-6 h-4 rounded bg-primary-100 dark:bg-primary-900/30"></div>
              <div className="w-6 h-4 rounded bg-primary-200 dark:bg-primary-800/40"></div>
              <div className="w-6 h-4 rounded bg-primary-300 dark:bg-primary-700/50"></div>
              <div className="w-6 h-4 rounded bg-primary-400 dark:bg-primary-600/60"></div>
              <div className="w-6 h-4 rounded bg-primary-500 dark:bg-primary-500/70"></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
