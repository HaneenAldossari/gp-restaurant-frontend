// Mock Data for Smart Sales Analytics and Forecasting System
// All data is in Saudi Riyal (SAR)

// Dashboard KPIs
export const dashboardKPIs = {
  totalRevenue: 145230.50,
  totalOrders: 3245,
  avgOrderValue: 44.75,
  totalCustomers: 1892,
  trends: {
    revenueChange: 12.5,
    ordersChange: 8.3,
    avgOrderChange: -2.1,
    customersChange: 15.2
  }
};

// Generate daily sales data for the past 30 days
const generateDailySales = () => {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();

    // Weekend boost
    const weekendMultiplier = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.4 : 1;
    const baseSales = 3500 + Math.random() * 2000;
    const sales = Math.round(baseSales * weekendMultiplier);
    const orders = Math.round(sales / (40 + Math.random() * 15));

    data.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: sales,
      orders: orders,
      avgOrderValue: Math.round((sales / orders) * 100) / 100
    });
  }

  return data;
};

export const dailySalesData = generateDailySales();

// Sales by Category
export const salesByCategory = [
  { name: 'Sweets', value: 52350, percentage: 36, color: '#f59e0b' },
  { name: 'Drinks', value: 45045, percentage: 31, color: '#0ea5e9' },
  { name: 'Pastries', value: 21785, percentage: 15, color: '#ec4899' },
  { name: 'Cakes', value: 18920, percentage: 13, color: '#8b5cf6' },
  { name: 'Specials', value: 7130, percentage: 5, color: '#14b8a6' }
];

// Order Types Distribution
export const orderTypes = [
  { name: 'Dine-in', value: 45, color: '#0ea5e9' },
  { name: 'Takeaway', value: 30, color: '#22c55e' },
  { name: 'Delivery', value: 25, color: '#f59e0b' }
];

// Top Selling Products
export const topProducts = [
  { id: 1, name: 'Spanish Latte', category: 'Drinks', sales: 892, revenue: 17840, growth: 12.5 },
  { id: 2, name: 'Tiramisu', category: 'Sweets', sales: 456, revenue: 13680, growth: 8.3 },
  { id: 3, name: 'Caramel Mille Feuille', category: 'Sweets', sales: 378, revenue: 11340, growth: 15.2 },
  { id: 4, name: 'Espresso', category: 'Drinks', sales: 654, revenue: 9810, growth: -3.4 },
  { id: 5, name: 'Raspberry Mille Feuille', category: 'Sweets', sales: 298, revenue: 8940, growth: 22.1 }
];

// Bottom Performing Products
export const bottomProducts = [
  { id: 1, name: 'Green Tea', category: 'Drinks', sales: 45, revenue: 1125, growth: -18.5 },
  { id: 2, name: 'Vanilla Cupcake', category: 'Sweets', sales: 67, revenue: 1340, growth: -12.3 },
  { id: 3, name: 'Butter Croissant', category: 'Sweets', sales: 34, revenue: 680, growth: -25.4 },
  { id: 4, name: 'Hot Chocolate', category: 'Drinks', sales: 28, revenue: 560, growth: -8.7 },
  { id: 5, name: 'Fruit Tart', category: 'Sweets', sales: 56, revenue: 1120, growth: -5.2 }
];

// Peak Hours Heatmap Data
export const peakHoursData = [
  // Format: { day: 'Mon', hour: 12, value: 45 }
  // Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  // Hours: 8 AM - 11 PM
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8 AM to 11 PM

days.forEach((day, dayIndex) => {
  hours.forEach(hour => {
    let baseValue = 20;

    // Lunch peak (12-2 PM)
    if (hour >= 12 && hour <= 14) baseValue = 70 + Math.random() * 30;
    // Dinner peak (7-9 PM)
    else if (hour >= 19 && hour <= 21) baseValue = 80 + Math.random() * 20;
    // Weekend boost
    if (dayIndex >= 4) baseValue *= 1.3;
    // Friday special
    if (dayIndex === 4 && hour >= 13 && hour <= 15) baseValue *= 1.2;

    baseValue += Math.random() * 15;

    peakHoursData.push({
      day,
      hour,
      hourLabel: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
      value: Math.round(baseValue)
    });
  });
});

// Menu Engineering Data
export const menuItems = [
  // Stars (High Popularity, High Profitability)
  { id: 1, name: 'Spanish Latte', category: 'Drinks', popularity: 892, profitability: 72, revenue: 17840, cost: 4995, classification: 'Star' },
  { id: 2, name: 'Tiramisu', category: 'Sweets', popularity: 456, profitability: 65, revenue: 13680, cost: 4788, classification: 'Star' },
  { id: 3, name: 'Caramel Mille Feuille', category: 'Sweets', popularity: 378, profitability: 58, revenue: 11340, cost: 4763, classification: 'Star' },
  { id: 4, name: 'Espresso', category: 'Drinks', popularity: 654, profitability: 75, revenue: 9810, cost: 2453, classification: 'Star' },
  { id: 5, name: 'Raspberry Mille Feuille', category: 'Sweets', popularity: 345, profitability: 55, revenue: 10350, cost: 4658, classification: 'Star' },
  { id: 6, name: 'Cappuccino', category: 'Drinks', popularity: 567, profitability: 68, revenue: 7938, cost: 2540, classification: 'Star' },
  { id: 7, name: 'Tero Chocolate', category: 'Sweets', popularity: 534, profitability: 52, revenue: 16020, cost: 7690, classification: 'Star' },
  { id: 8, name: 'Pistachio Cake', category: 'Cakes', popularity: 298, profitability: 55, revenue: 8940, cost: 4023, classification: 'Star' },

  // Puzzles (Low Popularity, High Profitability)
  { id: 9, name: 'Matcha Latte', category: 'Drinks', popularity: 45, profitability: 62, revenue: 1350, cost: 513, classification: 'Puzzle' },
  { id: 10, name: 'Red Velvet Cake', category: 'Cakes', popularity: 38, profitability: 58, revenue: 1520, cost: 638, classification: 'Puzzle' },
  { id: 11, name: 'Affogato', category: 'Drinks', popularity: 67, profitability: 70, revenue: 2010, cost: 603, classification: 'Puzzle' },
  { id: 12, name: 'Chocolate Fondant', category: 'Sweets', popularity: 52, profitability: 60, revenue: 2080, cost: 832, classification: 'Puzzle' },
  { id: 13, name: 'Lotus Cheesecake', category: 'Cakes', popularity: 89, profitability: 65, revenue: 3560, cost: 1246, classification: 'Puzzle' },

  // Plowhorses (High Popularity, Low Profitability)
  { id: 14, name: 'Americano', category: 'Drinks', popularity: 678, profitability: 22, revenue: 6780, cost: 5289, classification: 'Plowhorse' },
  { id: 15, name: 'Iced Tea', category: 'Drinks', popularity: 1234, profitability: 18, revenue: 6170, cost: 5059, classification: 'Plowhorse' },
  { id: 16, name: 'Butter Croissant', category: 'Pastries', popularity: 567, profitability: 15, revenue: 2835, cost: 2410, classification: 'Plowhorse' },
  { id: 17, name: 'Plain Donut', category: 'Sweets', popularity: 445, profitability: 25, revenue: 2225, cost: 1669, classification: 'Plowhorse' },
  { id: 18, name: 'Chocolate Croissant', category: 'Pastries', popularity: 890, profitability: 20, revenue: 4450, cost: 3560, classification: 'Plowhorse' },
  { id: 19, name: 'Blueberry Muffin', category: 'Pastries', popularity: 389, profitability: 28, revenue: 2334, cost: 1680, classification: 'Plowhorse' },
  { id: 20, name: 'Iced Latte', category: 'Drinks', popularity: 456, profitability: 24, revenue: 5472, cost: 4159, classification: 'Plowhorse' },
  { id: 21, name: 'Vanilla Cupcake', category: 'Sweets', popularity: 312, profitability: 22, revenue: 1872, cost: 1460, classification: 'Plowhorse' },
  { id: 22, name: 'Lemonade', category: 'Drinks', popularity: 567, profitability: 22, revenue: 3969, cost: 3096, classification: 'Plowhorse' },
  { id: 23, name: 'Ice Cream Scoop', category: 'Sweets', popularity: 478, profitability: 19, revenue: 2390, cost: 1936, classification: 'Plowhorse' },

  // Dogs (Low Popularity, Low Profitability)
  { id: 24, name: 'Green Tea', category: 'Drinks', popularity: 45, profitability: 15, revenue: 675, cost: 574, classification: 'Dog' },
  { id: 25, name: 'Fruit Tart', category: 'Sweets', popularity: 34, profitability: 18, revenue: 1020, cost: 836, classification: 'Dog' },
  { id: 26, name: 'Hot Chocolate', category: 'Drinks', popularity: 28, profitability: 12, revenue: 560, cost: 493, classification: 'Dog' }
];

// Menu Engineering Summary
export const menuEngineeringSummary = {
  stars: menuItems.filter(i => i.classification === 'Star').length,
  puzzles: menuItems.filter(i => i.classification === 'Puzzle').length,
  plowhorses: menuItems.filter(i => i.classification === 'Plowhorse').length,
  dogs: menuItems.filter(i => i.classification === 'Dog').length,
  avgPopularity: 350,
  avgProfitability: 35
};

// Sales Forecast Data
const generateForecastData = () => {
  const historical = [];
  const forecast = [];
  const today = new Date();

  // Historical data (past 90 days)
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();

    let baseSales = 4200;
    // Seasonal adjustment
    const month = date.getMonth();
    if (month >= 5 && month <= 8) baseSales *= 0.85; // Summer slowdown
    if (month === 11) baseSales *= 1.15; // December boost

    // Weekend boost
    if (dayOfWeek === 5 || dayOfWeek === 6) baseSales *= 1.35;

    // Add noise
    baseSales += (Math.random() - 0.5) * 1500;

    historical.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: Math.round(baseSales),
      type: 'historical'
    });
  }

  // Forecast data (next 30 days)
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    let basePrediction = 4500;

    // Weekend boost
    if (dayOfWeek === 5 || dayOfWeek === 6) basePrediction *= 1.35;

    // Growth trend
    basePrediction *= (1 + (i * 0.002));

    const variance = basePrediction * 0.08;
    const lowerBound = Math.round(basePrediction - variance);
    const upperBound = Math.round(basePrediction + variance);

    let notes = '';
    if (dayOfWeek === 5) notes = 'Weekend peak expected';
    if (dayOfWeek === 6) notes = 'Weekend peak expected';
    if (i === 15) notes = 'Public Holiday';

    forecast.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayName: dayName,
      predicted: Math.round(basePrediction),
      lowerBound: lowerBound,
      upperBound: upperBound,
      confidence: 95,
      notes: notes,
      type: 'forecast'
    });
  }

  return { historical, forecast };
};

export const forecastData = generateForecastData();

// Forecast Summary
export const forecastSummary = {
  predictedRevenue: 142500,
  expectedGrowth: 8.5,
  modelAccuracy: 92.3,
  mape: 7.7,
  confidence: 95,
  lastUpdated: new Date().toISOString(),
  modelsUsed: ['Prophet', 'LSTM'],
  trainingPeriod: '12 months'
};

// Sales Analytics - Product Performance
export const productPerformance = [
  { id: 1, name: 'Spanish Latte', category: 'Drinks', salesQty: 892, revenue: 17840, profitMargin: 72, growth: 12.5 },
  { id: 2, name: 'Tiramisu', category: 'Sweets', salesQty: 456, revenue: 13680, profitMargin: 65, growth: 8.3 },
  { id: 3, name: 'Caramel Mille Feuille', category: 'Sweets', salesQty: 378, revenue: 11340, profitMargin: 58, growth: 15.2 },
  { id: 4, name: 'Espresso', category: 'Drinks', salesQty: 654, revenue: 9810, profitMargin: 75, growth: -3.4 },
  { id: 5, name: 'Raspberry Mille Feuille', category: 'Sweets', salesQty: 345, revenue: 10350, profitMargin: 55, growth: 22.1 },
  { id: 6, name: 'Tero Chocolate', category: 'Sweets', salesQty: 534, revenue: 16020, profitMargin: 52, growth: 18.7 },
  { id: 7, name: 'Cappuccino', category: 'Drinks', salesQty: 567, revenue: 7938, profitMargin: 68, growth: 11.8 },
  { id: 8, name: 'Pistachio Cake', category: 'Cakes', salesQty: 298, revenue: 8940, profitMargin: 55, growth: 5.2 },
  { id: 9, name: 'Americano', category: 'Drinks', salesQty: 678, revenue: 6780, profitMargin: 22, growth: -1.2 },
  { id: 10, name: 'Iced Tea', category: 'Drinks', salesQty: 1234, revenue: 6170, profitMargin: 18, growth: 2.4 },
  { id: 11, name: 'Butter Croissant', category: 'Pastries', salesQty: 567, revenue: 2835, profitMargin: 15, growth: 8.9 },
  { id: 12, name: 'Lotus Cheesecake', category: 'Cakes', salesQty: 89, revenue: 3560, profitMargin: 65, growth: 14.3 },
  { id: 13, name: 'Chocolate Croissant', category: 'Pastries', salesQty: 890, revenue: 4450, profitMargin: 20, growth: 6.7 },
  { id: 14, name: 'Blueberry Muffin', category: 'Pastries', salesQty: 389, revenue: 2334, profitMargin: 28, growth: -2.8 },
  { id: 15, name: 'Lemonade', category: 'Drinks', salesQty: 567, revenue: 3969, profitMargin: 22, growth: 4.5 }
];

// Revenue by Branch
export const branchRevenue = [
  { name: 'Main Branch - Riyadh', revenue: 58500, orders: 1250, percentage: 40 },
  { name: 'Mall Branch', revenue: 43675, orders: 980, percentage: 30 },
  { name: 'Airport Branch', revenue: 29115, orders: 645, percentage: 20 },
  { name: 'University Branch', revenue: 14540, orders: 370, percentage: 10 }
];

// User Roles
export const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'Admin', name: 'System Administrator', avatar: null },
  { id: 2, username: 'manager', password: 'manager123', role: 'Manager', name: 'Ahmed Al-Rashid', avatar: null },
  { id: 3, username: 'cashier', password: 'cashier123', role: 'Cashier', name: 'Fatima Hassan', avatar: null }
];

// Strategic Recommendations
export const recommendations = {
  stars: [
    'Maintain quality and availability of Star items',
    'Feature prominently on menu and marketing materials',
    'Consider slight price increase if demand allows',
    'Train staff to upsell these items'
  ],
  puzzles: [
    'Increase visibility through promotions and specials',
    'Bundle with popular items to boost sales',
    'Review portion sizes and presentation',
    'Consider limited-time offers to test demand'
  ],
  plowhorses: [
    'Analyze cost structure for reduction opportunities',
    'Consider portion size adjustments',
    'Use as combo items with higher-margin products',
    'Negotiate better supplier pricing'
  ],
  dogs: [
    'Evaluate for removal from menu',
    'Consider complete recipe/presentation overhaul',
    'Test limited promotions before discontinuing',
    'Replace with trending items'
  ]
};

// Weather Data for Forecasting
const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Hot', 'Mild', 'Windy'];
const weatherIcons = {
  'Sunny': '☀️',
  'Cloudy': '☁️',
  'Rainy': '🌧️',
  'Hot': '🔥',
  'Mild': '🌤️',
  'Windy': '💨'
};

// Generate weather data with sales impact
const generateWeatherData = () => {
  const data = [];
  const today = new Date();

  // Historical weather (past 30 days)
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Random weather with seasonal bias
    const month = date.getMonth();
    let weather;
    if (month >= 5 && month <= 8) {
      weather = Math.random() > 0.3 ? 'Hot' : (Math.random() > 0.5 ? 'Sunny' : 'Mild');
    } else if (month >= 11 || month <= 1) {
      weather = Math.random() > 0.4 ? 'Mild' : (Math.random() > 0.5 ? 'Rainy' : 'Cloudy');
    } else {
      weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    }

    const temp = weather === 'Hot' ? 38 + Math.floor(Math.random() * 8) :
                 weather === 'Sunny' ? 30 + Math.floor(Math.random() * 6) :
                 weather === 'Mild' ? 22 + Math.floor(Math.random() * 6) :
                 weather === 'Rainy' ? 18 + Math.floor(Math.random() * 5) :
                 weather === 'Cloudy' ? 20 + Math.floor(Math.random() * 8) :
                 25 + Math.floor(Math.random() * 5);

    // Weather impact on sales
    const weatherImpact = weather === 'Hot' ? -15 : // Hot weather reduces dine-in
                          weather === 'Rainy' ? -20 : // Rainy reduces foot traffic
                          weather === 'Sunny' ? 10 : // Good weather boosts sales
                          weather === 'Mild' ? 15 : // Perfect weather
                          0;

    data.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weather: weather,
      icon: weatherIcons[weather],
      temperature: temp,
      humidity: 30 + Math.floor(Math.random() * 50),
      salesImpact: weatherImpact,
      type: 'historical'
    });
  }

  // Forecast weather (next 14 days)
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const month = date.getMonth();
    let weather;
    if (month >= 5 && month <= 8) {
      weather = Math.random() > 0.3 ? 'Hot' : (Math.random() > 0.5 ? 'Sunny' : 'Mild');
    } else {
      weather = Math.random() > 0.5 ? 'Mild' : (Math.random() > 0.5 ? 'Sunny' : 'Cloudy');
    }

    const temp = weather === 'Hot' ? 38 + Math.floor(Math.random() * 8) :
                 weather === 'Sunny' ? 30 + Math.floor(Math.random() * 6) :
                 weather === 'Mild' ? 22 + Math.floor(Math.random() * 6) :
                 weather === 'Rainy' ? 18 + Math.floor(Math.random() * 5) :
                 weather === 'Cloudy' ? 20 + Math.floor(Math.random() * 8) :
                 25 + Math.floor(Math.random() * 5);

    const weatherImpact = weather === 'Hot' ? -15 :
                          weather === 'Rainy' ? -20 :
                          weather === 'Sunny' ? 10 :
                          weather === 'Mild' ? 15 :
                          0;

    data.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weather: weather,
      icon: weatherIcons[weather],
      temperature: temp,
      humidity: 30 + Math.floor(Math.random() * 50),
      salesImpact: weatherImpact,
      type: 'forecast'
    });
  }

  return data;
};

export const weatherData = generateWeatherData();

// Weather Impact Summary
export const weatherImpactSummary = {
  bestWeather: 'Mild',
  bestWeatherSalesBoost: '+15%',
  worstWeather: 'Rainy',
  worstWeatherSalesImpact: '-20%',
  hotWeatherTip: 'Promote cold beverages and delivery options',
  rainyWeatherTip: 'Focus on delivery promotions and comfort food',
  insights: [
    { weather: 'Hot (35°C+)', impact: '-15%', recommendation: 'Promote cold drinks, ice cream, delivery' },
    { weather: 'Rainy', impact: '-20%', recommendation: 'Push delivery, comfort food specials' },
    { weather: 'Sunny', impact: '+10%', recommendation: 'Outdoor seating, fresh salads' },
    { weather: 'Mild (22-28°C)', impact: '+15%', recommendation: 'Full menu promotion, dine-in focus' },
    { weather: 'Cloudy', impact: '0%', recommendation: 'Standard operations' },
    { weather: 'Windy', impact: '-5%', recommendation: 'Indoor seating priority' }
  ]
};

// Category Sales Data (for filtering)
export const categorySalesData = {
  'Sweets': {
    totalRevenue: 52350,
    totalOrders: 1245,
    avgOrderValue: 42.05,
    topItem: 'Tiramisu',
    growth: 14.2,
    dailySales: dailySalesData.map(d => ({
      ...d,
      sales: Math.round(d.sales * 0.36),
      orders: Math.round(d.orders * 0.35)
    }))
  },
  'Drinks': {
    totalRevenue: 45045,
    totalOrders: 2890,
    avgOrderValue: 15.59,
    topItem: 'Spanish Latte',
    growth: 8.5,
    dailySales: dailySalesData.map(d => ({
      ...d,
      sales: Math.round(d.sales * 0.31),
      orders: Math.round(d.orders * 0.40)
    }))
  },
  'Pastries': {
    totalRevenue: 21785,
    totalOrders: 1846,
    avgOrderValue: 11.80,
    topItem: 'Chocolate Croissant',
    growth: 18.3,
    dailySales: dailySalesData.map(d => ({
      ...d,
      sales: Math.round(d.sales * 0.15),
      orders: Math.round(d.orders * 0.20)
    }))
  },
  'Cakes': {
    totalRevenue: 18920,
    totalOrders: 425,
    avgOrderValue: 44.52,
    topItem: 'Pistachio Cake',
    growth: 12.7,
    dailySales: dailySalesData.map(d => ({
      ...d,
      sales: Math.round(d.sales * 0.13),
      orders: Math.round(d.orders * 0.08)
    }))
  },
  'Specials': {
    totalRevenue: 7130,
    totalOrders: 145,
    avgOrderValue: 49.17,
    topItem: 'Matcha Latte',
    growth: 22.8,
    dailySales: dailySalesData.map(d => ({
      ...d,
      sales: Math.round(d.sales * 0.05),
      orders: Math.round(d.orders * 0.03)
    }))
  }
};
