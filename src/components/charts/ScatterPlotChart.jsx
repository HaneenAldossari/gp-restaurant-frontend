import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis
} from 'recharts';

const classificationColors = {
  Star: '#22c55e',
  Puzzle: '#3b82f6',
  Plowhorse: '#f59e0b',
  Dog: '#ef4444'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Category: <span className="font-medium text-gray-900 dark:text-white">{data.category}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Sales: <span className="font-medium text-gray-900 dark:text-white">{data.popularity} units</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Profit Margin: <span className="font-medium text-gray-900 dark:text-white">{data.profitability}%</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Revenue: <span className="font-medium text-gray-900 dark:text-white">{data.revenue?.toLocaleString()} SAR</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Class: <span
              className="font-medium px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${classificationColors[data.classification]}20`,
                color: classificationColors[data.classification]
              }}
            >
              {data.classification}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const ScatterPlotChart = ({
  data = [],
  avgPopularity = 350,
  avgProfitability = 35,
  title = 'Menu Engineering Matrix',
  loading = false
}) => {
  // Group data by classification
  const groupedData = {
    Star: data.filter(d => d.classification === 'Star'),
    Puzzle: data.filter(d => d.classification === 'Puzzle'),
    Plowhorse: data.filter(d => d.classification === 'Plowhorse'),
    Dog: data.filter(d => d.classification === 'Dog')
  };

  if (loading) {
    return (
      <div className="card dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>

      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="popularity"
              name="Popularity"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{
                value: 'Popularity (Sales Volume)',
                position: 'bottom',
                offset: 40,
                fill: '#6b7280',
                fontSize: 12
              }}
            />
            <YAxis
              type="number"
              dataKey="profitability"
              name="Profitability"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{
                value: 'Profitability (%)',
                angle: -90,
                position: 'insideLeft',
                fill: '#6b7280',
                fontSize: 12
              }}
            />
            <ZAxis range={[60, 400]} />

            {/* Quadrant dividing lines */}
            <ReferenceLine
              x={avgPopularity}
              stroke="#94a3b8"
              strokeDasharray="5 5"
            />
            <ReferenceLine
              y={avgProfitability}
              stroke="#94a3b8"
              strokeDasharray="5 5"
            />

            <Tooltip content={<CustomTooltip />} />

            {Object.entries(groupedData).map(([classification, items]) => (
              <Scatter
                key={classification}
                name={classification}
                data={items}
                fill={classificationColors[classification]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {Object.entries(classificationColors).map(([name, color]) => (
          <div key={name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
          </div>
        ))}
      </div>

      {/* Quadrant Labels */}
      <div className="grid grid-cols-2 gap-4 mt-4 text-center text-xs">
        <div className="p-2 bg-info-50 dark:bg-info-900/20 rounded">
          <span className="font-medium text-info-700 dark:text-info-400">PUZZLE</span>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Low Sales, High Profit</p>
        </div>
        <div className="p-2 bg-success-50 dark:bg-success-900/20 rounded">
          <span className="font-medium text-success-700 dark:text-success-400">STAR</span>
          <p className="text-gray-500 dark:text-gray-400 mt-1">High Sales, High Profit</p>
        </div>
        <div className="p-2 bg-danger-50 dark:bg-danger-900/20 rounded">
          <span className="font-medium text-danger-700 dark:text-danger-400">DOG</span>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Low Sales, Low Profit</p>
        </div>
        <div className="p-2 bg-warning-50 dark:bg-warning-900/20 rounded">
          <span className="font-medium text-warning-700 dark:text-warning-400">PLOWHORSE</span>
          <p className="text-gray-500 dark:text-gray-400 mt-1">High Sales, Low Profit</p>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlotChart;
