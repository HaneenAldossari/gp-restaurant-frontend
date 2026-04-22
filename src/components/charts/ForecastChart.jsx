import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          {data?.actual && (
            <p className="text-gray-600 dark:text-gray-400">
              Actual: <span className="font-medium text-gray-900 dark:text-white">{data.actual.toLocaleString()} SAR</span>
            </p>
          )}
          {data?.predicted && (
            <>
              <p className="text-gray-600 dark:text-gray-400">
                Predicted: <span className="font-medium text-primary-600">{data.predicted.toLocaleString()} SAR</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Range: <span className="font-medium text-gray-900 dark:text-white">
                  {data.lowerBound?.toLocaleString()} - {data.upperBound?.toLocaleString()} SAR
                </span>
              </p>
            </>
          )}
          {data?.notes && (
            <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
              {data.notes}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const ForecastChart = ({
  historicalData = [],
  forecastData = [],
  title = 'Sales Forecast',
  height = 400,
  loading = false
}) => {
  // Combine data for the chart
  const combinedData = [
    ...historicalData.map(d => ({ ...d, type: 'historical' })),
    ...forecastData.map(d => ({
      ...d,
      type: 'forecast',
      confidenceRange: [d.lowerBound, d.upperBound]
    }))
  ];

  // Find the transition point
  const todayIndex = historicalData.length > 0 ? historicalData.length - 1 : 0;

  if (loading) {
    return (
      <div className="card dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
          <div className="h-[380px] bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-gray-900 dark:bg-gray-300"></div>
            <span className="text-gray-500 dark:text-gray-400">Historical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-primary-500 border-dashed"></div>
            <span className="text-gray-500 dark:text-gray-400">Forecast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-primary-200 dark:bg-primary-800/30 rounded"></div>
            <span className="text-gray-500 dark:text-gray-400">95% CI</span>
          </div>
        </div>
      </div>

      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Today marker */}
            {todayIndex > 0 && (
              <ReferenceLine
                x={combinedData[todayIndex]?.displayDate}
                stroke="#94a3b8"
                strokeDasharray="5 5"
                label={{
                  value: 'Today',
                  position: 'top',
                  fill: '#6b7280',
                  fontSize: 10
                }}
              />
            )}

            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="confidenceRange"
              fill="#0ea5e9"
              fillOpacity={0.1}
              stroke="none"
            />

            {/* Historical line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Historical Sales"
              stroke="#1e293b"
              strokeWidth={2}
              dot={false}
              connectNulls
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted Sales"
              stroke="#0ea5e9"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#0ea5e9', r: 3 }}
              connectNulls
            />

            {/* Upper bound */}
            <Line
              type="monotone"
              dataKey="upperBound"
              name="Upper Bound"
              stroke="#0ea5e9"
              strokeWidth={1}
              strokeOpacity={0.4}
              dot={false}
              connectNulls
            />

            {/* Lower bound */}
            <Line
              type="monotone"
              dataKey="lowerBound"
              name="Lower Bound"
              stroke="#0ea5e9"
              strokeWidth={1}
              strokeOpacity={0.4}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForecastChart;
