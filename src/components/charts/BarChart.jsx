import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {entry.value.toLocaleString()} SAR
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const BarChart = ({
  data = [],
  title = '',
  dataKey = 'value',
  nameKey = 'name',
  fill = '#0ea5e9',
  height = 300,
  layout = 'vertical',
  loading = false,
  barSize = 20
}) => {
  if (loading) {
    return (
      <div className="card dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
          <div className="h-[280px] bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            layout={layout}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            {layout === 'vertical' ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey={nameKey} type="category" tick={{ fontSize: 12, fill: '#6b7280' }} width={100} />
              </>
            ) : (
              <>
                <XAxis dataKey={nameKey} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={dataKey}
              fill={fill}
              barSize={barSize}
              radius={[4, 4, 4, 4]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;
