import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import {
  DollarSign,
  Percent,
  TrendingUp,
  Users,
  Settings,
  Save,
  Calculator,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Trash2
} from 'lucide-react';

const CommissionManager = () => {
  const { user } = useAuth();
  const [commissionRules, setCommissionRules] = useState([]);
  const [platformFees, setPlatformFees] = useState({});
  const [revenueData, setRevenueData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form state for creating/editing commission rules
  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'percentage', // 'percentage' or 'fixed'
    value: '',
    currency: 'usd',
    applicable_to: 'all', // 'all', 'subscription', 'ai_usage', 'hardware'
    min_amount: '',
    max_amount: '',
    description: '',
    is_active: true,
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: null
  });

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    try {
      setLoading(true);

      // Load commission rules
      const rules = await loadCommissionRules();
      setCommissionRules(rules);

      // Load platform fees configuration
      const fees = await loadPlatformFees();
      setPlatformFees(fees);

      // Load revenue analytics
      const revenue = await loadRevenueData();
      setRevenueData(revenue);

    } catch (error) {
      console.error('Error loading commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommissionRules = async () => {
    // In a real implementation, this would fetch from database
    const mockRules = [
      {
        id: 'rule_1',
        name: 'Standard Subscription Commission',
        type: 'percentage',
        value: 15,
        currency: 'usd',
        applicable_to: 'subscription',
        min_amount: 0,
        max_amount: null,
        description: '15% commission on all subscription payments',
        is_active: true,
        effective_date: '2024-01-01',
        expiry_date: null,
        total_collected: 15420.50,
        transactions_count: 1247
      },
      {
        id: 'rule_2',
        name: 'AI Usage Fee',
        type: 'percentage',
        value: 10,
        currency: 'usd',
        applicable_to: 'ai_usage',
        min_amount: 0,
        max_amount: null,
        description: '10% commission on AI API usage costs',
        is_active: true,
        effective_date: '2024-01-01',
        expiry_date: null,
        total_collected: 8750.30,
        transactions_count: 2156
      },
      {
        id: 'rule_3',
        name: 'Hardware Sales Commission',
        type: 'percentage',
        value: 8,
        currency: 'usd',
        applicable_to: 'hardware',
        min_amount: 50,
        max_amount: null,
        description: '8% commission on hardware sales over $50',
        is_active: true,
        effective_date: '2024-01-01',
        expiry_date: null,
        total_collected: 3240.75,
        transactions_count: 89
      },
      {
        id: 'rule_4',
        name: 'Enterprise Setup Fee',
        type: 'fixed',
        value: 500,
        currency: 'usd',
        applicable_to: 'subscription',
        min_amount: 0,
        max_amount: null,
        description: 'Fixed $500 setup fee for enterprise accounts',
        is_active: true,
        effective_date: '2024-01-01',
        expiry_date: null,
        total_collected: 2500.00,
        transactions_count: 5
      }
    ];

    return mockRules;
  };

  const loadPlatformFees = async () => {
    // Platform-wide fee configuration
    return {
      payment_processing_fee: 2.9, // Percentage
      currency_conversion_fee: 1.5, // Percentage
      refund_processing_fee: 5.0, // Fixed amount in USD
      dispute_resolution_fee: 15.0, // Fixed amount in USD
      monthly_platform_fee: 99.00, // Fixed monthly fee
      transaction_fee_cap: 10.00, // Maximum transaction fee
      international_fee_multiplier: 1.2, // Multiplier for international transactions
      premium_support_fee: 49.00 // Monthly premium support fee
    };
  };

  const loadRevenueData = async () => {
    // Revenue analytics data
    return {
      total_revenue: 45678.90,
      total_commissions: 26911.55,
      total_platform_fees: 12567.35,
      net_profit: 61200.00,
      monthly_revenue: 15420.50,
      monthly_commissions: 8750.30,
      monthly_platform_fees: 3240.75,
      commission_rate: 15.2, // Average commission rate
      fee_to_revenue_ratio: 27.5, // Platform fees as % of total revenue
      profit_margin: 58.3, // Net profit as % of total revenue
      top_revenue_sources: [
        { source: 'Subscriptions', amount: 25678.90, percentage: 56.2 },
        { source: 'AI Usage', amount: 12567.35, percentage: 27.5 },
        { source: 'Hardware Sales', amount: 7432.65, percentage: 16.3 }
      ]
    };
  };

  const handleCreateRule = () => {
    setRuleForm({
      name: '',
      type: 'percentage',
      value: '',
      currency: 'usd',
      applicable_to: 'all',
      min_amount: '',
      max_amount: '',
      description: '',
      is_active: true,
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: null
    });
    setEditingRule(null);
    setShowCreateModal(true);
  };

  const handleEditRule = (rule) => {
    setRuleForm({
      ...rule,
      effective_date: rule.effective_date,
      expiry_date: rule.expiry_date
    });
    setEditingRule(rule);
    setShowCreateModal(true);
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        // Update existing rule
        setCommissionRules(commissionRules.map(r =>
          r.id === editingRule.id
            ? { ...ruleForm, id: editingRule.id }
            : r
        ));
      } else {
        // Create new rule
        const newRule = {
          ...ruleForm,
          id: `rule_${Date.now()}`,
          total_collected: 0,
          transactions_count: 0
        };
        setCommissionRules([...commissionRules, newRule]);
      }

      setShowCreateModal(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Error saving commission rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this commission rule? This action cannot be undone.')) {
      try {
        setCommissionRules(commissionRules.filter(r => r.id !== ruleId));
      } catch (error) {
        console.error('Error deleting commission rule:', error);
      }
    }
  };

  const handleToggleRuleStatus = async (ruleId) => {
    try {
      setCommissionRules(commissionRules.map(r =>
        r.id === ruleId
          ? { ...r, is_active: !r.is_active }
          : r
      ));
    } catch (error) {
      console.error('Error toggling rule status:', error);
    }
  };

  const handleUpdatePlatformFee = async (feeKey, value) => {
    try {
      setPlatformFees({
        ...platformFees,
        [feeKey]: parseFloat(value)
      });
    } catch (error) {
      console.error('Error updating platform fee:', error);
    }
  };

  const calculateCommission = (amount, rule) => {
    if (!rule.is_active) return 0;

    if (rule.type === 'percentage') {
      return (amount * rule.value) / 100;
    } else {
      return Math.min(rule.value, amount); // Fixed amount, but not more than transaction
    }
  };

  if (loading) {
    return (
      <div className="commission-manager loading">
        <div className="loading-spinner"></div>
        <p>Loading commission data...</p>
      </div>
    );
  }

  return (
    <div className="commission-manager">
      <div className="commission-header">
        <div className="header-content">
          <h2>Commission & Revenue Management</h2>
          <p>Configure commission rules, platform fees, and revenue analytics</p>
        </div>

        <div className="header-actions">
          <button className="btn-secondary">
            <Calculator size={16} />
            Revenue Calculator
          </button>
          <button
            className="btn-primary"
            onClick={handleCreateRule}
          >
            <Plus size={16} />
            Add Commission Rule
          </button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="revenue-overview">
        <div className="overview-grid">
          <div className="overview-card">
            <div className="card-icon">
              <DollarSign size={24} />
            </div>
            <div className="card-content">
              <h3>${revenueData.total_revenue?.toLocaleString()}</h3>
              <p>Total Revenue</p>
              <span className="trend positive">+12.5%</span>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">
              <Percent size={24} />
            </div>
            <div className="card-content">
              <h3>${revenueData.total_commissions?.toLocaleString()}</h3>
              <p>Total Commissions</p>
              <span className="trend positive">+8.2%</span>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">
              <TrendingUp size={24} />
            </div>
            <div className="card-content">
              <h3>${revenueData.net_profit?.toLocaleString()}</h3>
              <p>Net Profit</p>
              <span className="trend positive">+15.3%</span>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">
              <PieChart size={24} />
            </div>
            <div className="card-content">
              <h3>{revenueData.profit_margin}%</h3>
              <p>Profit Margin</p>
              <span className="trend positive">+2.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Sources Breakdown */}
      <div className="revenue-breakdown">
        <h3>Revenue Sources</h3>
        <div className="breakdown-chart">
          {revenueData.top_revenue_sources?.map((source, index) => (
            <div key={index} className="source-item">
              <div className="source-info">
                <span className="source-name">{source.source}</span>
                <span className="source-amount">${source.amount.toLocaleString()}</span>
              </div>
              <div className="source-bar">
                <div
                  className="source-fill"
                  style={{ width: `${source.percentage}%` }}
                ></div>
              </div>
              <span className="source-percentage">{source.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Rules Table */}
      <div className="commission-rules">
        <div className="rules-header">
          <h3>Commission Rules</h3>
          <div className="rules-stats">
            <span className="stat">
              {commissionRules.filter(r => r.is_active).length} Active Rules
            </span>
            <span className="stat">
              ${commissionRules.reduce((sum, r) => sum + r.total_collected, 0).toLocaleString()} Total Collected
            </span>
          </div>
        </div>

        <div className="rules-table-container">
          <table className="rules-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Applicable To</th>
                <th>Total Collected</th>
                <th>Transactions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissionRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <div className="rule-info">
                      <div className="rule-name">{rule.name}</div>
                      <div className="rule-description">{rule.description}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`rule-type ${rule.type}`}>
                      {rule.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </span>
                  </td>
                  <td>
                    <span className="rule-value">
                      {rule.type === 'percentage' ? `${rule.value}%` : `$${rule.value}`}
                    </span>
                  </td>
                  <td>
                    <span className="applicable-to">{rule.applicable_to}</span>
                  </td>
                  <td>
                    <span className="total-collected">
                      ${rule.total_collected?.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="transactions-count">
                      {rule.transactions_count?.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${rule.is_active ? 'active' : 'inactive'}`}>
                      {rule.is_active ? (
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
                    <div className="rule-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditRule(rule)}
                        title="Edit Rule"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn toggle"
                        onClick={() => handleToggleRuleStatus(rule.id)}
                        title={rule.is_active ? 'Deactivate Rule' : 'Activate Rule'}
                      >
                        {rule.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteRule(rule.id)}
                        title="Delete Rule"
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
      </div>

      {/* Platform Fees Configuration */}
      <div className="platform-fees">
        <div className="fees-header">
          <h3>Platform Fees Configuration</h3>
          <p>Configure platform-wide fees and charges</p>
        </div>

        <div className="fees-grid">
          <div className="fee-item">
            <label>Payment Processing Fee (%)</label>
            <input
              type="number"
              value={platformFees.payment_processing_fee}
              onChange={(e) => handleUpdatePlatformFee('payment_processing_fee', e.target.value)}
              step="0.1"
              min="0"
              max="10"
            />
          </div>

          <div className="fee-item">
            <label>Currency Conversion Fee (%)</label>
            <input
              type="number"
              value={platformFees.currency_conversion_fee}
              onChange={(e) => handleUpdatePlatformFee('currency_conversion_fee', e.target.value)}
              step="0.1"
              min="0"
              max="5"
            />
          </div>

          <div className="fee-item">
            <label>Refund Processing Fee ($)</label>
            <input
              type="number"
              value={platformFees.refund_processing_fee}
              onChange={(e) => handleUpdatePlatformFee('refund_processing_fee', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="fee-item">
            <label>Dispute Resolution Fee ($)</label>
            <input
              type="number"
              value={platformFees.dispute_resolution_fee}
              onChange={(e) => handleUpdatePlatformFee('dispute_resolution_fee', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="fee-item">
            <label>Monthly Platform Fee ($)</label>
            <input
              type="number"
              value={platformFees.monthly_platform_fee}
              onChange={(e) => handleUpdatePlatformFee('monthly_platform_fee', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="fee-item">
            <label>Transaction Fee Cap ($)</label>
            <input
              type="number"
              value={platformFees.transaction_fee_cap}
              onChange={(e) => handleUpdatePlatformFee('transaction_fee_cap', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="fee-item">
            <label>International Fee Multiplier</label>
            <input
              type="number"
              value={platformFees.international_fee_multiplier}
              onChange={(e) => handleUpdatePlatformFee('international_fee_multiplier', e.target.value)}
              step="0.1"
              min="1"
            />
          </div>

          <div className="fee-item">
            <label>Premium Support Fee ($/month)</label>
            <input
              type="number"
              value={platformFees.premium_support_fee}
              onChange={(e) => handleUpdatePlatformFee('premium_support_fee', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Commission Calculator */}
      <div className="commission-calculator">
        <div className="calculator-header">
          <h3>Commission Calculator</h3>
          <p>Test commission calculations for different scenarios</p>
        </div>

        <div className="calculator-form">
          <div className="calc-inputs">
            <div className="input-group">
              <label>Transaction Amount ($)</label>
              <input
                type="number"
                placeholder="100.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="input-group">
              <label>Transaction Type</label>
              <select>
                <option value="subscription">Subscription</option>
                <option value="ai_usage">AI Usage</option>
                <option value="hardware">Hardware Sales</option>
              </select>
            </div>

            <button className="btn-primary calc-btn">
              <Calculator size={16} />
              Calculate Commission
            </button>
          </div>

          <div className="calc-results">
            <div className="result-item">
              <span className="label">Base Amount:</span>
              <span className="value">$100.00</span>
            </div>
            <div className="result-item">
              <span className="label">Commission (15%):</span>
              <span className="value">$15.00</span>
            </div>
            <div className="result-item">
              <span className="label">Platform Fee (2.9%):</span>
              <span className="value">$2.90</span>
            </div>
            <div className="result-item total">
              <span className="label">Total Fees:</span>
              <span className="value">$17.90</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Commission Rule Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRule ? 'Edit Commission Rule' : 'Create New Commission Rule'}</h3>
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
                  <label>Rule Name</label>
                  <input
                    type="text"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})}
                    placeholder="e.g., Standard Subscription Commission"
                  />
                </div>

                <div className="form-group">
                  <label>Commission Type</label>
                  <select
                    value={ruleForm.type}
                    onChange={(e) => setRuleForm({...ruleForm, type: e.target.value})}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    value={ruleForm.value}
                    onChange={(e) => setRuleForm({...ruleForm, value: e.target.value})}
                    placeholder={ruleForm.type === 'percentage' ? '15' : '10.00'}
                    step={ruleForm.type === 'percentage' ? '0.1' : '0.01'}
                    min="0"
                  />
                  <span className="input-suffix">
                    {ruleForm.type === 'percentage' ? '%' : '$'}
                  </span>
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={ruleForm.currency}
                    onChange={(e) => setRuleForm({...ruleForm, currency: e.target.value})}
                  >
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Applicable To</label>
                  <select
                    value={ruleForm.applicable_to}
                    onChange={(e) => setRuleForm({...ruleForm, applicable_to: e.target.value})}
                  >
                    <option value="all">All Transactions</option>
                    <option value="subscription">Subscriptions</option>
                    <option value="ai_usage">AI Usage</option>
                    <option value="hardware">Hardware Sales</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Minimum Amount ($)</label>
                  <input
                    type="number"
                    value={ruleForm.min_amount}
                    onChange={(e) => setRuleForm({...ruleForm, min_amount: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Amount ($)</label>
                  <input
                    type="number"
                    value={ruleForm.max_amount}
                    onChange={(e) => setRuleForm({...ruleForm, max_amount: e.target.value})}
                    placeholder="No limit"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Effective Date</label>
                  <input
                    type="date"
                    value={ruleForm.effective_date}
                    onChange={(e) => setRuleForm({...ruleForm, effective_date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={ruleForm.expiry_date || ''}
                    onChange={(e) => setRuleForm({...ruleForm, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Description</h4>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({...ruleForm, description: e.target.value})}
                  placeholder="Describe this commission rule..."
                  rows={3}
                />
              </div>

              <div className="form-section">
                <label className="toggle-group">
                  <input
                    type="checkbox"
                    checked={ruleForm.is_active}
                    onChange={(e) => setRuleForm({...ruleForm, is_active: e.target.checked})}
                  />
                  <span>Active Rule</span>
                </label>
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
                onClick={handleSaveRule}
                disabled={!ruleForm.name || !ruleForm.value}
              >
                <Save size={16} />
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .commission-manager {
          padding: 2rem;
        }

        .commission-header {
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

        .revenue-overview {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .overview-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .card-icon {
          color: #3b82f6;
          background: #eff6ff;
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .card-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .card-content p {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .trend {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .trend.positive {
          background: #dcfce7;
          color: #166534;
        }

        .trend.negative {
          background: #fef2f2;
          color: #991b1b;
        }

        .revenue-breakdown {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .revenue-breakdown h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .breakdown-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .source-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .source-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
          margin-right: 1rem;
        }

        .source-name {
          font-weight: 500;
          color: #374151;
        }

        .source-amount {
          font-weight: 600;
          color: #1f2937;
        }

        .source-bar {
          flex: 2;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .source-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
        }

        .source-percentage {
          width: 60px;
          text-align: right;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .commission-rules {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .rules-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .rules-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .rules-stats {
          display: flex;
          gap: 2rem;
        }

        .rules-stats .stat {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .rules-table-container {
          overflow-x: auto;
        }

        .rules-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rules-table th,
        .rules-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .rules-table th {
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
        }

        .rule-info .rule-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .rule-info .rule-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .rule-type {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .rule-type.percentage {
          background: #dbeafe;
          color: #1e40af;
        }

        .rule-type.fixed {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .rule-value {
          font-weight: 600;
          color: #1f2937;
        }

        .applicable-to {
          text-transform: capitalize;
          color: #6b7280;
        }

        .total-collected,
        .transactions-count {
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

        .rule-actions {
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

        .platform-fees {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .fees-header {
          margin-bottom: 2rem;
        }

        .fees-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .fees-header p {
          margin: 0;
          color: #6b7280;
        }

        .fees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .fee-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .fee-item label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .fee-item input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .fee-item input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .commission-calculator {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .calculator-header {
          margin-bottom: 2rem;
        }

        .calculator-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .calculator-header p {
          margin: 0;
          color: #6b7280;
        }

        .calculator-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .calc-inputs {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .input-group input,
        .input-group select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .calc-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .calc-results {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .result-item.total {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .result-item .label {
          font-weight: 500;
          color: #374151;
        }

        .result-item .value {
          font-weight: 600;
          color: #1f2937;
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
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
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
          .commission-manager {
            padding: 1rem;
          }

          .commission-header {
            flex-direction: column;
            align-items: stretch;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .fees-grid {
            grid-template-columns: 1fr;
          }

          .calculator-form {
            grid-template-columns: 1fr;
          }

          .rules-table {
            font-size: 0.875rem;
          }

          .rules-table th,
          .rules-table td {
            padding: 0.5rem;
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

export default CommissionManager;