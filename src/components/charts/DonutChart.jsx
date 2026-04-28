import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, valueUnit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.value?.toLocaleString()} {valueUnit} ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => {
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <li key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-gray-600 dark:text-gray-400">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

const DonutChart = ({
  data = [],
  title = '',
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  loading = false,
  valueUnit = 'SAR',
}) => {
  if (loading) {
    return (
      <div className="card dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip valueUnit={valueUnit} />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DonutChart;
