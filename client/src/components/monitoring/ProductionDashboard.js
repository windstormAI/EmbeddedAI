/**
 * Production Dashboard Component
 * Comprehensive monitoring and analytics for the platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Users,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Monitor,
  Server,
  Database,
  Globe,
  Zap,
  Clock,
  RefreshCw,
  Download,
  Settings,
  Bell,
  Shield,
  Eye,
  Target
} from 'lucide-react';

const ProductionDashboard = () => {
  const [metrics, setMetrics] = useState({
    system: {},
    users: {},
    performance: {},
    errors: {},
    security: {}
  });
  const [alerts, setAlerts] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data for demonstration
  const mockMetrics = {
    system: {
      cpu: 45,
      memory: 67,
      disk: 23,
      network: 12,
      uptime: '7d 14h 32m',
      responseTime: 245
    },
    users: {
      total: 1250,
      active: 89,
      newToday: 23,
      retention: 78.5,
      sessions: 156
    },
    performance: {
      pageLoad: 1.2,
      apiResponse: 89,
      errorRate: 0.02,
      throughput: 1250
    },
    errors: {
      total: 12,
      critical: 2,
      warnings: 5,
      resolved: 8
    },
    security: {
      threats: 0,
      blocked: 45,
      suspicious: 3,
      compliance: 98.5
    }
  };

  const mockAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'High CPU Usage',
      message: 'Server CPU usage is above 80% for the last 5 minutes',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      resolved: false
    },
    {
      id: 2,
      type: 'info',
      title: 'New User Milestone',
      message: 'Platform reached 1,000 registered users',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      resolved: true
    },
    {
      id: 3,
      type: 'error',
      title: 'API Timeout',
      message: 'Circuit simulation API is experiencing timeouts',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      resolved: false
    }
  ];

  // Fetch metrics (mock implementation)
  const fetchMetrics = useCallback(async () => {
    // In production, this would fetch from monitoring APIs
    setMetrics(mockMetrics);
    setAlerts(mockAlerts);
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, autoRefresh]);

  // Metric cards component
  const MetricCard = ({ title, value, unit, icon: Icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(trend)}% from last period
          </span>
        </div>
      )}
    </div>
  );

  // Chart component (simplified)
  const SimpleChart = ({ data, title, color = 'blue' }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 flex items-end justify-between space-x-2">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-full bg-${color}-500 rounded-t`}
              style={{ height: `${(value / Math.max(...data)) * 100}%` }}
            />
            <span className="text-xs text-gray-500 mt-2">{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Alert component
  const AlertItem = ({ alert }) => (
    <div className={`p-4 rounded-lg border ${
      alert.type === 'error' ? 'bg-red-50 border-red-200' :
      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
      'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
          {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
          {alert.type === 'info' && <Info className="h-5 w-5 text-blue-500 mt-0.5" />}

          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!alert.resolved && (
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded">
              Resolve
            </button>
          )}
          {alert.resolved && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Monitor className="h-6 w-6 text-blue-600" />
              <span>Production Dashboard</span>
            </h2>

            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600">
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                autoRefresh
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <RefreshCw className={`h-4 w-4 inline mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Stop' : 'Start'} Auto-refresh
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'system', label: 'System', icon: Server },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'alerts', label: 'Alerts', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Active Users"
                value={metrics.users.active}
                icon={Users}
                trend={12}
                color="blue"
              />
              <MetricCard
                title="Response Time"
                value={metrics.performance.apiResponse}
                unit="ms"
                icon={Zap}
                trend={-5}
                color="green"
              />
              <MetricCard
                title="Error Rate"
                value={metrics.performance.errorRate}
                unit="%"
                icon={AlertTriangle}
                trend={-2}
                color="red"
              />
              <MetricCard
                title="Uptime"
                value={metrics.system.uptime}
                icon={CheckCircle}
                color="green"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="User Activity (Last 24h)"
                data={[23, 45, 67, 89, 78, 95, 87, 76, 98, 87, 76, 89, 67, 54, 78, 89, 76, 98, 87, 95, 78, 89, 67, 54]}
                color="blue"
              />
              <SimpleChart
                title="API Response Times"
                data={[120, 145, 98, 167, 134, 89, 156, 123, 145, 98, 134, 167, 89, 123, 145, 98, 167, 134, 89, 156]}
                color="green"
              />
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="CPU Usage"
                value={metrics.system.cpu}
                unit="%"
                icon={Cpu}
                color="blue"
              />
              <MetricCard
                title="Memory Usage"
                value={metrics.system.memory}
                unit="%"
                icon={HardDrive}
                color="purple"
              />
              <MetricCard
                title="Network I/O"
                value={metrics.system.network}
                unit="MB/s"
                icon={Wifi}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU</span>
                      <span>{metrics.system.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${metrics.system.cpu}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory</span>
                      <span>{metrics.system.memory}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${metrics.system.memory}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disk</span>
                      <span>{metrics.system.disk}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${metrics.system.disk}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{metrics.system.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Load Average:</span>
                    <span className="font-medium">1.23, 1.45, 1.67</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Processes:</span>
                    <span className="font-medium">234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database Connections:</span>
                    <span className="font-medium">12/50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Users"
                value={metrics.users.total}
                icon={Users}
                trend={8}
                color="blue"
              />
              <MetricCard
                title="Active Users"
                value={metrics.users.active}
                icon={Activity}
                trend={15}
                color="green"
              />
              <MetricCard
                title="New Today"
                value={metrics.users.newToday}
                icon={TrendingUp}
                trend={23}
                color="purple"
              />
              <MetricCard
                title="Retention Rate"
                value={metrics.users.retention}
                unit="%"
                icon={Target}
                trend={5}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="User Growth (Last 30 Days)"
                data={[1200, 1220, 1245, 1260, 1280, 1295, 1310, 1325, 1340, 1355, 1370, 1385, 1400, 1415, 1430, 1445, 1460, 1475, 1490, 1505, 1520, 1535, 1550, 1565, 1580, 1595, 1610, 1625, 1640, 1655]}
                color="blue"
              />
              <SimpleChart
                title="Daily Active Users"
                data={[85, 92, 88, 95, 102, 98, 105, 99, 107, 103, 110, 106, 113, 108, 115, 111, 118, 114, 121, 117, 124, 119, 126, 122]}
                color="green"
              />
            </div>
          </div>
        )}

        {selectedTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Page Load Time"
                value={metrics.performance.pageLoad}
                unit="s"
                icon={Clock}
                trend={-8}
                color="blue"
              />
              <MetricCard
                title="API Response"
                value={metrics.performance.apiResponse}
                unit="ms"
                icon={Zap}
                trend={-12}
                color="green"
              />
              <MetricCard
                title="Error Rate"
                value={metrics.performance.errorRate}
                unit="%"
                icon={AlertTriangle}
                trend={-15}
                color="red"
              />
              <MetricCard
                title="Throughput"
                value={metrics.performance.throughput}
                unit="req/s"
                icon={TrendingUp}
                trend={20}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="Response Times (ms)"
                data={[245, 234, 198, 267, 223, 189, 256, 212, 234, 198, 223, 267, 189, 212, 234, 198, 267, 223, 189, 256]}
                color="blue"
              />
              <SimpleChart
                title="Error Rate (%)"
                data={[0.02, 0.015, 0.025, 0.018, 0.012, 0.028, 0.016, 0.022, 0.014, 0.019, 0.011, 0.026, 0.017, 0.021, 0.013, 0.024, 0.015, 0.020, 0.016, 0.023]}
                color="red"
              />
            </div>
          </div>
        )}

        {selectedTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Security Threats"
                value={metrics.security.threats}
                icon={Shield}
                color="red"
              />
              <MetricCard
                title="Blocked Attacks"
                value={metrics.security.blocked}
                icon={CheckCircle}
                trend={25}
                color="green"
              />
              <MetricCard
                title="Suspicious Activity"
                value={metrics.security.suspicious}
                icon={Eye}
                trend={-10}
                color="yellow"
              />
              <MetricCard
                title="Compliance Score"
                value={metrics.security.compliance}
                unit="%"
                icon={Target}
                trend={2}
                color="blue"
              />
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Events</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium text-green-900">SQL Injection Attempt Blocked</div>
                      <div className="text-sm text-green-700">IP: 192.168.1.100</div>
                    </div>
                  </div>
                  <span className="text-sm text-green-600">2 minutes ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-medium text-yellow-900">Unusual Login Pattern</div>
                      <div className="text-sm text-yellow-700">Multiple failed attempts from same IP</div>
                    </div>
                  </div>
                  <span className="text-sm text-yellow-600">15 minutes ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-blue-900">Security Scan Completed</div>
                      <div className="text-sm text-blue-700">All systems secure</div>
                    </div>
                  </div>
                  <span className="text-sm text-blue-600">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {alerts.filter(a => !a.resolved).length} active alerts
                  </span>
                  <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{metrics.errors.critical}</div>
                <div className="text-sm text-gray-600">Critical Errors</div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{metrics.errors.warnings}</div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{metrics.errors.resolved}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionDashboard;