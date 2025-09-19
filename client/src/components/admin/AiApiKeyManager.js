import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import {
  Key,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  Users,
  DollarSign
} from 'lucide-react';

const AiApiKeyManager = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [analytics, setAnalytics] = useState({});

  // Form state for creating/editing API keys
  const [keyForm, setKeyForm] = useState({
    name: '',
    provider: 'openai',
    api_key: '',
    max_requests_per_hour: 1000,
    max_requests_per_day: 10000,
    cost_per_token: 0.000002,
    is_active: true,
    rate_limit_strategy: 'sliding_window',
    allowed_users: [], // empty means all users
    allowed_plans: [], // empty means all plans
    priority: 'normal' // 'low', 'normal', 'high'
  });

  useEffect(() => {
    loadApiKeys();
    loadAnalytics();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);

      // In a real implementation, you'd fetch from a secure API keys table
      // For demo purposes, we'll use mock data
      const mockApiKeys = [
        {
          id: 'key_1',
          name: 'OpenAI Primary',
          provider: 'openai',
          api_key: 'sk-...abcd',
          max_requests_per_hour: 1000,
          max_requests_per_day: 10000,
          cost_per_token: 0.000002,
          is_active: true,
          rate_limit_strategy: 'sliding_window',
          allowed_users: [],
          allowed_plans: ['pro', 'enterprise'],
          priority: 'high',
          usage_today: 2500,
          usage_this_hour: 150,
          total_cost_today: 45.67,
          created_at: '2024-01-15T10:00:00Z',
          last_used: '2024-01-20T14:30:00Z'
        },
        {
          id: 'key_2',
          name: 'OpenAI Secondary',
          provider: 'openai',
          api_key: 'sk-...efgh',
          max_requests_per_hour: 500,
          max_requests_per_day: 5000,
          cost_per_token: 0.000002,
          is_active: true,
          rate_limit_strategy: 'fixed_window',
          allowed_users: [],
          allowed_plans: ['free', 'pro'],
          priority: 'normal',
          usage_today: 1200,
          usage_this_hour: 80,
          total_cost_today: 22.34,
          created_at: '2024-01-18T09:15:00Z',
          last_used: '2024-01-20T13:45:00Z'
        },
        {
          id: 'key_3',
          name: 'Anthropic Claude',
          provider: 'anthropic',
          api_key: 'sk-ant-...ijkl',
          max_requests_per_hour: 200,
          max_requests_per_day: 2000,
          cost_per_token: 0.000008,
          is_active: false,
          rate_limit_strategy: 'sliding_window',
          allowed_users: [],
          allowed_plans: ['enterprise'],
          priority: 'high',
          usage_today: 0,
          usage_this_hour: 0,
          total_cost_today: 0,
          created_at: '2024-01-10T11:30:00Z',
          last_used: null
        }
      ];

      setApiKeys(mockApiKeys);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Calculate analytics from API key usage
      const totalUsage = apiKeys.reduce((sum, key) => sum + key.usage_today, 0);
      const totalCost = apiKeys.reduce((sum, key) => sum + key.total_cost_today, 0);
      const activeKeys = apiKeys.filter(key => key.is_active).length;
      const avgResponseTime = 245; // ms

      setAnalytics({
        totalUsage,
        totalCost,
        activeKeys,
        avgResponseTime,
        usageByProvider: {
          openai: apiKeys.filter(k => k.provider === 'openai').reduce((sum, k) => sum + k.usage_today, 0),
          anthropic: apiKeys.filter(k => k.provider === 'anthropic').reduce((sum, k) => sum + k.usage_today, 0)
        },
        costByProvider: {
          openai: apiKeys.filter(k => k.provider === 'openai').reduce((sum, k) => sum + k.total_cost_today, 0),
          anthropic: apiKeys.filter(k => k.provider === 'anthropic').reduce((sum, k) => sum + k.total_cost_today, 0)
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreateKey = () => {
    setKeyForm({
      name: '',
      provider: 'openai',
      api_key: '',
      max_requests_per_hour: 1000,
      max_requests_per_day: 10000,
      cost_per_token: 0.000002,
      is_active: true,
      rate_limit_strategy: 'sliding_window',
      allowed_users: [],
      allowed_plans: [],
      priority: 'normal'
    });
    setEditingKey(null);
    setShowCreateModal(true);
  };

  const handleEditKey = (apiKey) => {
    setKeyForm({
      ...apiKey,
      api_key: '' // Don't show the actual key for security
    });
    setEditingKey(apiKey);
    setShowCreateModal(true);
  };

  const handleSaveKey = async () => {
    try {
      if (editingKey) {
        // Update existing key
        setApiKeys(apiKeys.map(k =>
          k.id === editingKey.id
            ? { ...keyForm, id: editingKey.id, api_key: keyForm.api_key || editingKey.api_key }
            : k
        ));
      } else {
        // Create new key
        const newKey = {
          ...keyForm,
          id: `key_${Date.now()}`,
          usage_today: 0,
          usage_this_hour: 0,
          total_cost_today: 0,
          created_at: new Date().toISOString(),
          last_used: null
        };
        setApiKeys([...apiKeys, newKey]);
      }

      setShowCreateModal(false);
      setEditingKey(null);
      loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
        loadAnalytics(); // Refresh analytics
      } catch (error) {
        console.error('Error deleting API key:', error);
      }
    }
  };

  const handleToggleKeyStatus = async (keyId) => {
    try {
      setApiKeys(apiKeys.map(k =>
        k.id === keyId
          ? { ...k, is_active: !k.is_active }
          : k
      ));
      loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error toggling API key status:', error);
    }
  };

  const handleCopyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      // You could show a toast notification here
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const toggleKeyVisibility = (keyId) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const handleRefreshUsage = async () => {
    // In a real implementation, this would fetch current usage from the API
    loadApiKeys();
    loadAnalytics();
  };

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'openai': return '#10b981';
      case 'anthropic': return '#8b5cf6';
      case 'google': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'normal': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="ai-api-key-manager loading">
        <div className="loading-spinner"></div>
        <p>Loading API keys...</p>
      </div>
    );
  }

  return (
    <div className="ai-api-key-manager">
      <div className="keys-header">
        <div className="header-content">
          <h2>AI API Key Management</h2>
          <p>Manage AI service API keys, usage limits, and cost tracking</p>
        </div>

        <div className="header-actions">
          <button className="btn-secondary" onClick={handleRefreshUsage}>
            <RefreshCw size={16} />
            Refresh Usage
          </button>
          <button
            className="btn-primary"
            onClick={handleCreateKey}
          >
            <Plus size={16} />
            Add API Key
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="analytics-overview">
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon">
              <Zap size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.totalUsage?.toLocaleString()}</h3>
              <p>Total Requests Today</p>
              <span className="analytics-trend positive">+12.5%</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <DollarSign size={24} />
            </div>
            <div className="analytics-content">
              <h3>${analytics.totalCost?.toFixed(2)}</h3>
              <p>Total Cost Today</p>
              <span className="analytics-trend negative">+8.2%</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <Key size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.activeKeys}</h3>
              <p>Active API Keys</p>
              <span className="analytics-trend neutral">Stable</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <BarChart3 size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.avgResponseTime}ms</h3>
              <p>Avg Response Time</p>
              <span className="analytics-trend positive">-5.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Usage Breakdown */}
      <div className="provider-breakdown">
        <h3>Usage by Provider</h3>
        <div className="provider-grid">
          <div className="provider-card">
            <div className="provider-header">
              <div
                className="provider-dot"
                style={{ backgroundColor: getProviderColor('openai') }}
              ></div>
              <span className="provider-name">OpenAI</span>
            </div>
            <div className="provider-stats">
              <div className="stat">
                <span className="value">{analytics.usageByProvider?.openai?.toLocaleString() || 0}</span>
                <span className="label">Requests</span>
              </div>
              <div className="stat">
                <span className="value">${analytics.costByProvider?.openai?.toFixed(2) || '0.00'}</span>
                <span className="label">Cost</span>
              </div>
            </div>
          </div>

          <div className="provider-card">
            <div className="provider-header">
              <div
                className="provider-dot"
                style={{ backgroundColor: getProviderColor('anthropic') }}
              ></div>
              <span className="provider-name">Anthropic</span>
            </div>
            <div className="provider-stats">
              <div className="stat">
                <span className="value">{analytics.usageByProvider?.anthropic?.toLocaleString() || 0}</span>
                <span className="label">Requests</span>
              </div>
              <div className="stat">
                <span className="value">${analytics.costByProvider?.anthropic?.toFixed(2) || '0.00'}</span>
                <span className="label">Cost</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="keys-table-container">
        <table className="keys-table">
          <thead>
            <tr>
              <th>API Key</th>
              <th>Provider</th>
              <th>Usage Today</th>
              <th>Cost Today</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((apiKey) => (
              <tr key={apiKey.id}>
                <td>
                  <div className="key-info">
                    <div className="key-name">{apiKey.name}</div>
                    <div className="key-value">
                      {visibleKeys.has(apiKey.id) ? apiKey.api_key : '••••••••••••••••'}
                      <button
                        className="visibility-toggle"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        className="copy-btn"
                        onClick={() => handleCopyKey(apiKey.api_key)}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="provider-info">
                    <div
                      className="provider-badge"
                      style={{ backgroundColor: getProviderColor(apiKey.provider) }}
                    >
                      {apiKey.provider}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="usage-info">
                    <div className="usage-value">
                      {apiKey.usage_today?.toLocaleString() || 0}
                      <span className="usage-limit">
                        / {apiKey.max_requests_per_day?.toLocaleString() || '∞'}
                      </span>
                    </div>
                    <div className="usage-bar">
                      <div
                        className="usage-fill"
                        style={{
                          width: `${Math.min((apiKey.usage_today / apiKey.max_requests_per_day) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="cost-value">
                    ${apiKey.total_cost_today?.toFixed(2) || '0.00'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${apiKey.is_active ? 'active' : 'inactive'}`}>
                    {apiKey.is_active ? (
                      <>
                        <CheckCircle size={14} />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Inactive
                      </>
                    )}
                  </span>
                </td>
                <td>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(apiKey.priority) }}
                  >
                    {apiKey.priority}
                  </span>
                </td>
                <td>
                  <div className="key-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditKey(apiKey)}
                      title="Edit API Key"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="action-btn toggle"
                      onClick={() => handleToggleKeyStatus(apiKey.id)}
                      title={apiKey.is_active ? 'Deactivate Key' : 'Activate Key'}
                    >
                      {apiKey.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteKey(apiKey.id)}
                      title="Delete API Key"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit API Key Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingKey ? 'Edit API Key' : 'Add New API Key'}</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Key Name</label>
                  <input
                    type="text"
                    value={keyForm.name}
                    onChange={(e) => setKeyForm({...keyForm, name: e.target.value})}
                    placeholder="e.g., OpenAI Primary"
                  />
                </div>

                <div className="form-group">
                  <label>Provider</label>
                  <select
                    value={keyForm.provider}
                    onChange={(e) => setKeyForm({...keyForm, provider: e.target.value})}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    value={keyForm.api_key}
                    onChange={(e) => setKeyForm({...keyForm, api_key: e.target.value})}
                    placeholder="sk-..."
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={keyForm.priority}
                    onChange={(e) => setKeyForm({...keyForm, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4>Rate Limits</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Max Requests per Hour</label>
                    <input
                      type="number"
                      value={keyForm.max_requests_per_hour}
                      onChange={(e) => setKeyForm({...keyForm, max_requests_per_hour: parseInt(e.target.value)})}
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Requests per Day</label>
                    <input
                      type="number"
                      value={keyForm.max_requests_per_day}
                      onChange={(e) => setKeyForm({...keyForm, max_requests_per_day: parseInt(e.target.value)})}
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rate Limit Strategy</label>
                    <select
                      value={keyForm.rate_limit_strategy}
                      onChange={(e) => setKeyForm({...keyForm, rate_limit_strategy: e.target.value})}
                    >
                      <option value="fixed_window">Fixed Window</option>
                      <option value="sliding_window">Sliding Window</option>
                      <option value="token_bucket">Token Bucket</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Cost per Token ($)</label>
                    <input
                      type="number"
                      value={keyForm.cost_per_token}
                      onChange={(e) => setKeyForm({...keyForm, cost_per_token: parseFloat(e.target.value)})}
                      step="0.000001"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Access Control</h4>
                <div className="access-control">
                  <div className="form-group">
                    <label>Allowed Plans (leave empty for all)</label>
                    <div className="checkbox-grid">
                      {['free', 'pro', 'enterprise'].map(plan => (
                        <label key={plan} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={keyForm.allowed_plans.includes(plan)}
                            onChange={(e) => {
                              const newPlans = e.target.checked
                                ? [...keyForm.allowed_plans, plan]
                                : keyForm.allowed_plans.filter(p => p !== plan);
                              setKeyForm({...keyForm, allowed_plans: newPlans});
                            }}
                          />
                          <span>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="toggle-group">
                      <input
                        type="checkbox"
                        checked={keyForm.is_active}
                        onChange={(e) => setKeyForm({...keyForm, is_active: e.target.checked})}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveKey}
                disabled={!keyForm.name || !keyForm.api_key}
              >
                {editingKey ? 'Update API Key' : 'Add API Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ai-api-key-manager {
          padding: 2rem;
        }

        .keys-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .header-content h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.875rem;
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

        .analytics-overview {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .analytics-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .analytics-icon {
          color: #3b82f6;
          background: #eff6ff;
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .analytics-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .analytics-content p {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .analytics-trend {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .analytics-trend.positive {
          background: #dcfce7;
          color: #166534;
        }

        .analytics-trend.negative {
          background: #fef2f2;
          color: #991b1b;
        }

        .analytics-trend.neutral {
          background: #e5e7eb;
          color: #374151;
        }

        .provider-breakdown {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .provider-breakdown h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .provider-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .provider-card {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .provider-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .provider-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .provider-name {
          font-weight: 600;
          color: #1f2937;
        }

        .provider-stats {
          display: flex;
          gap: 2rem;
        }

        .stat .value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat .label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .keys-table-container {
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .keys-table {
          width: 100%;
          border-collapse: collapse;
        }

        .keys-table th,
        .keys-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .keys-table th {
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
        }

        .key-info .key-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .key-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: monospace;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .visibility-toggle,
        .copy-btn {
          padding: 0.25rem;
          border: none;
          background: none;
          cursor: pointer;
          color: #6b7280;
          border-radius: 0.25rem;
        }

        .visibility-toggle:hover,
        .copy-btn:hover {
          background: #f3f4f6;
        }

        .provider-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
        }

        .usage-info .usage-value {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .usage-limit {
          color: #6b7280;
          font-weight: 400;
        }

        .usage-bar {
          width: 100px;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: #10b981;
          border-radius: 3px;
        }

        .cost-value {
          font-weight: 600;
          color: #1f2937;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background: #e5e7eb;
          color: #374151;
        }

        .priority-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
        }

        .key-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.edit {
          background: #eff6ff;
          color: #3b82f6;
        }

        .action-btn.edit:hover {
          background: #dbeafe;
        }

        .action-btn.toggle {
          background: #fef3c7;
          color: #d97706;
        }

        .action-btn.toggle:hover {
          background: #fde68a;
        }

        .action-btn.delete {
          background: #fef2f2;
          color: #dc2626;
        }

        .action-btn.delete:hover {
          background: #fecaca;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 0.5rem;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content.large {
          max-width: 1000px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .access-control {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-item input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
        }

        .checkbox-item span {
          font-size: 0.875rem;
          color: #374151;
        }

        .toggle-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .toggle-group input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
        }

        .toggle-group span {
          font-size: 0.875rem;
          color: #374151;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
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
          .ai-api-key-manager {
            padding: 1rem;
          }

          .keys-header {
            flex-direction: column;
            align-items: stretch;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .provider-grid {
            grid-template-columns: 1fr;
          }

          .keys-table {
            font-size: 0.875rem;
          }

          .keys-table th,
          .keys-table td {
            padding: 0.5rem;
          }

          .checkbox-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            margin: 1rem;
            max-width: none;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AiApiKeyManager;