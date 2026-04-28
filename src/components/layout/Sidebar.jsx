import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Utensils,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout, hasAccess } = useAuth();
  const { isDarkMode } = useTheme();

  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['Admin', 'Manager', 'Cashier']
    },
    {
      path: '/forecasting',
      icon: TrendingUp,
      label: 'Forecasting',
      roles: ['Admin', 'Manager']
    },
    {
      path: '/menu-engineering',
      icon: Utensils,
      label: 'Menu Insights',
      roles: ['Admin', 'Manager']
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      roles: ['Admin']
    }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-20'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center lg:w-full'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white text-sm">SmartSales</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Analytics</span>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className={`px-4 py-4 border-b border-gray-200 dark:border-gray-700 ${!isOpen && 'lg:flex lg:justify-center'}`}>
          <div className={`flex items-center gap-3 ${!isOpen && 'lg:flex-col'}`}>
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Guest'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Unknown'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Workspace switcher (testing-only, will be replaced by real auth) */}
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
          <WorkspaceSwitcher compact={!isOpen} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item) => {
              if (!hasAccess(item.roles)) return null;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                      ${!isOpen && 'lg:justify-center lg:px-2'}
                    `}
                    title={!isOpen ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {isOpen && <span className="text-sm">{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout & Toggle */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-gray-600 dark:text-gray-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 hover:text-danger-600 dark:hover:text-danger-400
              transition-all duration-200
              ${!isOpen && 'lg:justify-center lg:px-2'}
            `}
            title={!isOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isOpen && <span className="text-sm">Logout</span>}
          </button>

          {/* Desktop Toggle */}
          <button
            onClick={onToggle}
            className="hidden lg:flex w-full items-center justify-center gap-2 mt-2 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {isOpen ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
