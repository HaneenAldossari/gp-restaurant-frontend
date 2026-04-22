import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: 'admin@smartsales.sa',
    phone: '+966 50 123 4567',
    language: 'en'
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    lowStockAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    forecastAlerts: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Export', icon: Database }
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Profile Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account information</p>
                </div>

                <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <button className="btn-secondary text-sm">Change Photo</button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG or GIF. Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={profile.language}
                      onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Notification Preferences</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important alerts via email' },
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Get notified when inventory is low' },
                    { key: 'dailyReports', label: 'Daily Reports', desc: 'Receive daily sales summary' },
                    { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly performance reports' },
                    { key: 'forecastAlerts', label: 'Forecast Alerts', desc: 'Get notified about forecast updates' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                        className={`
                          relative w-12 h-6 rounded-full transition-colors duration-200
                          ${notifications[item.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                            ${notifications[item.key] ? 'translate-x-7' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the dashboard looks</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200
                        ${isDarkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
                      `}
                    >
                      <span
                        className={`
                          absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                          ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Security Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account security</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Data & Export</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Export your data and manage storage</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Sales Data</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Download your complete sales history</p>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-sm">Export as CSV</button>
                      <button className="btn-secondary text-sm">Export as Excel</button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Reports</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Download analytics reports as PDF</p>
                    <button className="btn-secondary text-sm">Generate Report</button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
