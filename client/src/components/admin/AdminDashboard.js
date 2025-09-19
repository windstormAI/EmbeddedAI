import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Settings,
  Shield,
  Database,
  Zap,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load key metrics
      const metrics = await loadMetrics();
      setStats(metrics);

      // Load recent activity
      const activity = await loadRecentActivity();
      setRecentActivity(activity);

      // Load subscription analytics
      const subscriptions = await loadSubscriptionData();
      setSubscriptionData(subscriptions);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    // Get user count
    const { count: userCount } = await db.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active subscriptions
    const { count: activeSubscriptions } = await db.supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total revenue
    const { data: revenueData } = await db.supabase
      .from('subscriptions')
      .select('plan_price')
      .eq('status', 'active');

    const totalRevenue = revenueData?.reduce((sum, sub) => sum + (sub.plan_price || 0), 0) || 0;

    // Get project count
    const { count: projectCount } = await db.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Get AI usage
    const { count: aiInteractions } = await db.supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true });

    return {
      users: userCount || 0,
      activeSubscriptions: activeSubscriptions || 0,
      totalRevenue,
      projects: projectCount || 0,
      aiInteractions: aiInteractions || 0,
      conversionRate: userCount > 0 ? ((activeSubscriptions / userCount) * 100).toFixed(1) : 0
    };
  };

  const loadRecentActivity = async () => {
    const { data } = await db.supabase
      .from('ai_interactions')
      .select(`
        *,
        profiles:user_id (username, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    return data || [];
  };

  const loadSubscriptionData = async () => {
    const { data } = await db.supabase
      .from('subscriptions')
      .select(`
        *,
        profiles:user_id (username, full_name, created_at)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-header">
        <div className="stat-icon">
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Platform overview and management</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Shield size={16} />
            Security
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          className={activeTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Users
        </button>
        <button
          className={activeTab === 'subscriptions' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('subscriptions')}
        >
          <DollarSign size={16} />
          Subscriptions
        </button>
        <button
          className={activeTab === 'analytics' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} />
          Analytics
        </button>
        <button
          className={activeTab === 'system' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('system')}
        >
          <Database size={16} />
          System
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <StatCard
                title="Total Users"
                value={stats.users?.toLocaleString() || '0'}
                icon={Users}
                trend={12.5}
                color="blue"
              />
              <StatCard
                title="Active Subscriptions"
                value={stats.activeSubscriptions?.toLocaleString() || '0'}
                icon={DollarSign}
                trend={8.2}
                color="green"
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${stats.totalRevenue?.toLocaleString() || '0'}`}
                icon={TrendingUp}
                trend={15.3}
                color="purple"
              />
              <StatCard
                title="Total Projects"
                value={stats.projects?.toLocaleString() || '0'}
                icon={Activity}
                trend={22.1}
                color="orange"
              />
              <StatCard
                title="AI Interactions"
                value={stats.aiInteractions?.toLocaleString() || '0'}
                icon={Zap}
                trend={-2.1}
                color="yellow"
              />
              <StatCard
                title="Conversion Rate"
                value={`${stats.conversionRate}%`}
                icon={PieChart}
                trend={5.7}
                color="red"
              />
            </div>

            <div className="dashboard-charts">
              <div className="chart-container">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-user">
                        {activity.profiles?.username || 'Unknown User'}
                      </div>
                      <div className="activity-action">
                        used AI assistant
                      </div>
                      <div className="activity-time">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-container">
                <h3>Subscription Overview</h3>
                <div className="subscription-summary">
                  <div className="summary-item">
                    <span className="label">Free Users:</span>
                    <span className="value">{stats.users - stats.activeSubscriptions}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Pro Subscribers:</span>
                    <span className="value">
                      {subscriptionData.filter(s => s.plan_name?.toLowerCase().includes('pro')).length}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Enterprise:</span>
                    <span className="value">
                      {subscriptionData.filter(s => s.plan_name?.toLowerCase().includes('enterprise')).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="users-header">
              <h2>User Management</h2>
              <div className="user-stats">
                <div className="stat">
                  <span className="number">{stats.users}</span>
                  <span className="label">Total Users</span>
                </div>
                <div className="stat">
                  <span className="number">{stats.activeSubscriptions}</span>
                  <span className="label">Active Subs</span>
                </div>
                <div className="stat">
                  <span className="number">{stats.conversionRate}%</span>
                  <span className="label">Conversion</span>
                </div>
              </div>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionData.map((subscription) => (
                    <tr key={subscription.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-name">
                            {subscription.profiles?.full_name || subscription.profiles?.username}
                          </div>
                          <div className="user-email">
                            {subscription.user_id}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge ${subscription.plan_name?.toLowerCase()}`}>
                          {subscription.plan_name}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${subscription.status}`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td>
                        {new Date(subscription.profiles?.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button className="btn-sm">View</button>
                        <button className="btn-sm danger">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="subscriptions-tab">
            <div className="subscriptions-header">
              <h2>Subscription Management</h2>
              <div className="subscription-metrics">
                <div className="metric">
                  <h3>${stats.totalRevenue}</h3>
                  <p>Monthly Recurring Revenue</p>
                </div>
                <div className="metric">
                  <h3>{stats.activeSubscriptions}</h3>
                  <p>Active Subscriptions</p>
                </div>
                <div className="metric">
                  <h3>2.3%</h3>
                  <p>Churn Rate</p>
                </div>
              </div>
            </div>

            <div className="subscription-analytics">
              <div className="analytics-chart">
                <h3>Revenue Trends</h3>
                <div className="chart-placeholder">
                  <BarChart3 size={48} />
                  <p>Revenue chart will be displayed here</p>
                </div>
              </div>

              <div className="analytics-chart">
                <h3>Plan Distribution</h3>
                <div className="plan-distribution">
                  <div className="plan-item">
                    <span className="plan-name">Free</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${((stats.users - stats.activeSubscriptions) / stats.users) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="plan-count">{stats.users - stats.activeSubscriptions}</span>
                  </div>
                  <div className="plan-item">
                    <span className="plan-name">Pro</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill pro"
                        style={{
                          width: `${(subscriptionData.filter(s => s.plan_name?.toLowerCase().includes('pro')).length / stats.users) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="plan-count">
                      {subscriptionData.filter(s => s.plan_name?.toLowerCase().includes('pro')).length}
                    </span>
                  </div>
                  <div className="plan-item">
                    <span className="plan-name">Enterprise</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill enterprise"
                        style={{
                          width: `${(subscriptionData.filter(s => s.plan_name?.toLowerCase().includes('enterprise')).length / stats.users) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="plan-count">
                      {subscriptionData.filter(s => s.plan_name?.toLowerCase().includes('enterprise')).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <h2>Advanced Analytics</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>User Engagement</h3>
                <div className="metric-grid">
                  <div className="metric-item">
                    <span className="metric-value">85%</span>
                    <span className="metric-label">Daily Active Users</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">4.2</span>
                    <span className="metric-label">Avg Session Duration</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">12.5</span>
                    <span className="metric-label">Projects per User</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>Feature Usage</h3>
                <div className="feature-usage">
                  <div className="feature-item">
                    <span className="feature-name">Circuit Designer</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '78%' }}></div>
                    </div>
                    <span className="usage-percent">78%</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-name">AI Assistant</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '65%' }}></div>
                    </div>
                    <span className="usage-percent">65%</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-name">Hardware Integration</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '42%' }}></div>
                    </div>
                    <span className="usage-percent">42%</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-name">3D Visualization</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '38%' }}></div>
                    </div>
                    <span className="usage-percent">38%</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>System Performance</h3>
                <div className="performance-metrics">
                  <div className="performance-item">
                    <span className="metric-label">API Response Time</span>
                    <span className="metric-value">245ms</span>
                    <span className="metric-trend positive">↓ 12%</span>
                  </div>
                  <div className="performance-item">
                    <span className="metric-label">Page Load Time</span>
                    <span className="metric-value">1.2s</span>
                    <span className="metric-trend positive">↓ 8%</span>
                  </div>
                  <div className="performance-item">
                    <span className="metric-label">Error Rate</span>
                    <span className="metric-value">0.02%</span>
                    <span className="metric-trend positive">↓ 15%</span>
                  </div>
                  <div className="performance-item">
                    <span className="metric-label">Uptime</span>
                    <span className="metric-value">99.98%</span>
                    <span className="metric-trend positive">↑ 0.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="system-tab">
            <h2>System Administration</h2>
            <div className="system-grid">
              <div className="system-card">
                <h3>Database Status</h3>
                <div className="status-indicator healthy">
                  <div className="status-dot"></div>
                  <span>Healthy</span>
                </div>
                <div className="system-metrics">
                  <div className="metric">
                    <span className="label">Connections:</span>
                    <span className="value">23/100</span>
                  </div>
                  <div className="metric">
                    <span className="label">Storage Used:</span>
                    <span className="value">2.4GB / 10GB</span>
                  </div>
                  <div className="metric">
                    <span className="label">Backup Status:</span>
                    <span className="value">Last: 2 hours ago</span>
                  </div>
                </div>
              </div>

              <div className="system-card">
                <h3>API Status</h3>
                <div className="status-indicator healthy">
                  <div className="status-dot"></div>
                  <span>Healthy</span>
                </div>
                <div className="api-metrics">
                  <div className="metric">
                    <span className="label">Requests/min:</span>
                    <span className="value">1,247</span>
                  </div>
                  <div className="metric">
                    <span className="label">Avg Response:</span>
                    <span className="value">245ms</span>
                  </div>
                  <div className="metric">
                    <span className="label">Error Rate:</span>
                    <span className="value">0.02%</span>
                  </div>
                </div>
              </div>

              <div className="system-card">
                <h3>Security Alerts</h3>
                <div className="alerts-list">
                  <div className="alert-item warning">
                    <AlertTriangle size={16} />
                    <span>Failed login attempts from IP 192.168.1.100</span>
                    <span className="alert-time">5 min ago</span>
                  </div>
                  <div className="alert-item info">
                    <Shield size={16} />
                    <span>Security scan completed successfully</span>
                    <span className="alert-time">1 hour ago</span>
                  </div>
                </div>
              </div>

              <div className="system-card">
                <h3>Recent Backups</h3>
                <div className="backup-list">
                  <div className="backup-item">
                    <span className="backup-name">Database Backup</span>
                    <span className="backup-size">2.4GB</span>
                    <span className="backup-time">2 hours ago</span>
                    <span className="backup-status success">Success</span>
                  </div>
                  <div className="backup-item">
                    <span className="backup-name">File Storage Backup</span>
                    <span className="backup-size">156MB</span>
                    <span className="backup-time">2 hours ago</span>
                    <span className="backup-status success">Success</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="system-actions">
              <button className="btn-primary">
                <Database size={16} />
                Run Database Maintenance
              </button>
              <button className="btn-secondary">
                <Shield size={16} />
                Security Scan
              </button>
              <button className="btn-secondary">
                <Calendar size={16} />
                Schedule Backup
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .header-content p {
          margin: 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .dashboard-tabs {
          display: flex;
          background: white;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 0.5rem;
        }

        .tab:hover {
          background: #f3f4f6;
        }

        .tab.active {
          background: #3b82f6;
          color: white;
        }

        .dashboard-content {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .stat-card.blue {
          border-left: 4px solid #3b82f6;
        }

        .stat-card.green {
          border-left: 4px solid #10b981;
        }

        .stat-card.purple {
          border-left: 4px solid #8b5cf6;
        }

        .stat-card.orange {
          border-left: 4px solid #f59e0b;
        }

        .stat-card.yellow {
          border-left: 4px solid #eab308;
        }

        .stat-card.red {
          border-left: 4px solid #ef4444;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .stat-icon {
          color: #6b7280;
        }

        .stat-trend {
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .stat-trend.positive {
          background: #dcfce7;
          color: #166534;
        }

        .stat-trend.negative {
          background: #fef2f2;
          color: #991b1b;
        }

        .stat-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-content p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .dashboard-charts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .chart-container {
          background: #f9fafb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .chart-container h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .activity-user {
          font-weight: 500;
          color: #1f2937;
        }

        .activity-action {
          color: #6b7280;
        }

        .activity-time {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .subscription-summary {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .summary-item .label {
          font-weight: 500;
          color: #374151;
        }

        .summary-item .value {
          font-weight: 600;
          color: #1f2937;
        }

        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .user-stats {
          display: flex;
          gap: 2rem;
        }

        .user-stats .stat {
          text-align: center;
        }

        .user-stats .number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .user-stats .label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .users-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th,
        .users-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .users-table th {
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
        }

        .user-info .user-name {
          font-weight: 500;
          color: #1f2937;
        }

        .user-info .user-email {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .plan-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .plan-badge.free {
          background: #e5e7eb;
          color: #374151;
        }

        .plan-badge.pro {
          background: #dbeafe;
          color: #1e40af;
        }

        .plan-badge.enterprise {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.canceled {
          background: #fef2f2;
          color: #991b1b;
        }

        .status-badge.past_due {
          background: #fef3c7;
          color: #92400e;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          background: white;
          cursor: pointer;
          margin-right: 0.5rem;
        }

        .btn-sm.danger {
          border-color: #ef4444;
          color: #ef4444;
        }

        .subscriptions-header {
          margin-bottom: 2rem;
        }

        .subscription-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .subscription-metrics .metric {
          text-align: center;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .subscription-metrics .metric h3 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .subscription-metrics .metric p {
          margin: 0;
          color: #6b7280;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .analytics-card {
          background: #f9fafb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .analytics-card h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .metric-item {
          text-align: center;
          padding: 1rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .metric-item .metric-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .metric-item .metric-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .feature-usage {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .feature-name {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }

        .usage-bar {
          flex: 2;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
        }

        .usage-percent {
          width: 60px;
          text-align: right;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .performance-metrics {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .performance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .performance-item .metric-trend {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .performance-item .metric-trend.positive {
          background: #dcfce7;
          color: #166534;
        }

        .system-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .system-card {
          background: #f9fafb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .system-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .status-indicator.healthy .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .status-indicator.warning .status-dot {
          background: #f59e0b;
        }

        .status-indicator.error .status-dot {
          background: #ef4444;
        }

        .system-metrics,
        .api-metrics {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric .label {
          font-weight: 500;
          color: #374151;
        }

        .metric .value {
          font-weight: 600;
          color: #1f2937;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .alert-item.warning {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .alert-item.info {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .alert-time {
          margin-left: auto;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .backup-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .backup-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .backup-name {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }

        .backup-size,
        .backup-time {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .backup-status {
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .backup-status.success {
          background: #dcfce7;
          color: #166534;
        }

        .backup-status.failed {
          background: #fef2f2;
          color: #991b1b;
        }

        .system-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .dashboard-tabs {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-charts {
            grid-template-columns: 1fr;
          }

          .subscription-metrics {
            grid-template-columns: 1fr;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .system-grid {
            grid-template-columns: 1fr;
          }

          .system-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;