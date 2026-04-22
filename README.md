# Smart Sales Analytics and Forecasting System

A professional, production-ready web dashboard for restaurants and cafes that transforms raw POS transaction data into actionable business intelligence through machine learning-powered analytics.

## Features

### Dashboard
- Real-time KPIs (Total Revenue, Orders, Average Order Value, Customers)
- Interactive sales trend charts
- Category distribution donut charts
- Peak hours heatmap
- Top/Bottom performing products

### Sales Analytics
- Comprehensive filtering by date range, branch, and category
- Revenue breakdown by category and branch
- Product performance tracking with profit margins
- Export functionality

### Menu Engineering
- 4-quadrant matrix classification (Stars, Puzzles, Plowhorses, Dogs)
- Interactive scatter plot visualization
- Strategic recommendations for each classification
- Filterable menu items table

### Sales Forecasting
- AI-powered sales predictions (Prophet + LSTM simulation)
- Confidence intervals visualization
- Peak and low demand day identification
- Model accuracy metrics

### Additional Features
- Role-based authentication (Admin, Manager, Cashier)
- Dark/Light mode toggle
- Responsive design for all devices
- Notification system
- Settings and user preferences

## Technology Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router v6
- **Icons**: Lucide React
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sales-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Cashier | cashier | cashier123 |

## Project Structure

```
sales-analytics/
├── public/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BarChart.jsx
│   │   │   ├── DonutChart.jsx
│   │   │   ├── ForecastChart.jsx
│   │   │   ├── HeatmapChart.jsx
│   │   │   ├── SalesLineChart.jsx
│   │   │   └── ScatterPlotChart.jsx
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopBar.jsx
│   │   ├── tables/
│   │   └── ui/
│   │       ├── Badge.jsx
│   │       ├── DataTable.jsx
│   │       ├── FilterBar.jsx
│   │       └── KPICard.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── data/
│   │   └── mockData.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Forecasting.jsx
│   │   ├── Login.jsx
│   │   ├── MenuEngineering.jsx
│   │   ├── SalesAnalytics.jsx
│   │   └── Settings.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Color Palette

### Primary Colors
- Primary: `#0ea5e9` (Sky Blue)
- Secondary: `#64748b` (Slate)
- Accent: `#d946ef` (Fuchsia)

### Status Colors
- Stars (Success): `#22c55e` (Green)
- Puzzles (Info): `#3b82f6` (Blue)
- Plowhorses (Warning): `#f59e0b` (Amber)
- Dogs (Danger): `#ef4444` (Red)

## Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- This is a **frontend-only** implementation with mock data
- No backend, database, or API connections required
- All data is realistic and demonstrates system capabilities
- Currency values are in Saudi Riyal (SAR)

## License

This project is developed as a graduation project for Prince Sattam Bin Abdulaziz University.

## Author

Smart Sales Analytics Team
