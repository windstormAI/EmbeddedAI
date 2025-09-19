import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { supabase } from '../../utils/supabase';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Settings,
  Save,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const SubscriptionPlansManager = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [analytics, setAnalytics] = useState({});

  // Form state for creating/editing plans
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'usd',
    interval: 'month',
    features: [],
    max_projects: null,
    max_ai_requests: null,
    max_collaborators: null,
    has_3d_visualization: false,
    has_hardware_integration: true,
    has_priority_support: false,
    has_team_features: false,
    is_popular: false,
    is_active: true,
    stripe_price_id: '',
    trial_days: 0
  });

  useEffect(() => {
    loadPlans();
    loadAnalytics();
  }, []);

  const loadPlans = async () => {
    try {
      // In a real implementation, you'd have a plans table
      // For now, we'll use a predefined set of plans
      const defaultPlans = [
        {
          id: 'free',
          name: 'Free',
          description: 'Perfect for getting started with embedded design',
          price: 0,
          currency: 'usd',
          interval: 'month',
          features: [
            '5 projects',
            'Basic circuit designer',
            'Limited AI generations (10/month)',
            'Community support'
          ],
          max_projects: 5,
          max_ai_requests: 10,
          max_collaborators: 1,
          has_3d_visualization: false,
          has_hardware_integration: true,
          has_priority_support: false,
          has_team_features: false,
          is_popular: false,
          is_active: true,
          stripe_price_id: null,
          trial_days: 0,
          subscriber_count: 860,
          revenue: 0
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'Professional tools for serious embedded development',
          price: 19,
          currency: 'usd',
          interval: 'month',
          features: [
            'Unlimited projects',
            'Advanced circuit designer',
            'Unlimited AI generations',
            '3D visualization',
            'Real-time collaboration',
            'Hardware integration',
            'Priority support'
          ],
          max_projects: null,
          max_ai_requests: null,
          max_collaborators: 5,
          has_3d_visualization: true,
          has_hardware_integration: true,
          has_priority_support: true,
          has_team_features: false,
          is_popular: true,
          is_active: true,
          stripe_price_id: 'price_pro_monthly',
          trial_days: 14,
          subscriber_count: 320,
          revenue: 6080
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Complete solution for teams and organizations',
          price: 49,
          currency: 'usd',
          interval: 'month',
          features: [
            'Everything in Pro',
            'Unlimited team members',
            'Advanced analytics',
            'Custom integrations',
            'Dedicated support',
            'SLA guarantee',
            'White-label options'
          ],
          max_projects: null,
          max_ai_requests: null,
          max_collaborators: null,
          has_3d_visualization: true,
          has_hardware_integration: true,
          has_priority_support: true,
          has_team_features: true,
          is_popular: false,
          is_active: true,
          stripe_price_id: 'price_enterprise_monthly',
          trial_days: 30,
          subscriber_count: 67,
          revenue: 3283
        }
      ];

      setPlans(defaultPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Calculate analytics from subscription data
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan_name, plan_price, created_at, status');

      const analytics = {
        totalRevenue: subscriptions?.reduce((sum, sub) => sum + (sub.plan_price || 0), 0) || 0,
        activeSubscriptions: subscriptions?.filter(sub => sub.status === 'active').length || 0,
        monthlyRecurringRevenue: subscriptions?.filter(sub => sub.status === 'active')
          .reduce((sum, sub) => sum + (sub.plan_price || 0), 0) || 0,
        churnRate: 2.3, // This would be calculated from historical data
        averageRevenuePerUser: 0,
        planDistribution: {}
      };

      // Calculate plan distribution
      subscriptions?.forEach(sub => {
        if (sub.status === 'active') {
          analytics.planDistribution[sub.plan_name] =
            (analytics.planDistribution[sub.plan_name] || 0) + 1;
        }
      });

      analytics.averageRevenuePerUser = analytics.activeSubscriptions > 0
        ? analytics.monthlyRecurringRevenue / analytics.activeSubscriptions
        : 0;

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreatePlan = () => {
    setPlanForm({
      name: '',
      description: '',
      price: '',
      currency: 'usd',
      interval: 'month',
      features: [],
      max_projects: null,
      max_ai_requests: null,
      max_collaborators: null,
      has_3d_visualization: false,
      has_hardware_integration: true,
      has_priority_support: false,
      has_team_features: false,
      is_popular: false,
      is_active: true,
      stripe_price_id: '',
      trial_days: 0
    });
    setEditingPlan(null);
    setShowCreateModal(true);
  };

  const handleEditPlan = (plan) => {
    setPlanForm({
      ...plan,
      features: plan.features || []
    });
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  const handleSavePlan = async () => {
    try {
      // In a real implementation, this would save to a database
      if (editingPlan) {
        // Update existing plan
        setPlans(plans.map(p =>
          p.id === editingPlan.id
            ? { ...planForm, id: editingPlan.id }
            : p
        ));
      } else {
        // Create new plan
        const newPlan = {
          ...planForm,
          id: `plan_${Date.now()}`,
          subscriber_count: 0,
          revenue: 0
        };
        setPlans([...plans, newPlan]);
      }

      setShowCreateModal(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      try {
        // In a real implementation, this would delete from database
        setPlans(plans.filter(p => p.id !== planId));
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleTogglePlanStatus = async (planId) => {
    try {
      setPlans(plans.map(p =>
        p.id === planId
          ? { ...p, is_active: !p.is_active }
          : p
      ));
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  const addFeature = () => {
    setPlanForm({
      ...planForm,
      features: [...planForm.features, '']
    });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...planForm.features];
    newFeatures[index] = value;
    setPlanForm({
      ...planForm,
      features: newFeatures
    });
  };

  const removeFeature = (index) => {
    setPlanForm({
      ...planForm,
      features: planForm.features.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="subscription-plans-manager loading">
        <div className="loading-spinner"></div>
        <p>Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div className="subscription-plans-manager">
      <div className="plans-header">
        <div className="header-content">
          <h2>Subscription Plans Management</h2>
          <p>Configure pricing, features, and limits for all subscription tiers</p>
        </div>

        <div className="header-actions">
          <button className="btn-secondary">
            <BarChart3 size={16} />
            Analytics
          </button>
          <button
            className="btn-primary"
            onClick={handleCreatePlan}
          >
            <Plus size={16} />
            Create Plan
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="analytics-overview">
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon">
              <DollarSign size={24} />
            </div>
            <div className="analytics-content">
              <h3>${analytics.monthlyRecurringRevenue?.toLocaleString()}</h3>
              <p>Monthly Recurring Revenue</p>
              <span className="analytics-trend positive">+15.3%</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <Users size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.activeSubscriptions?.toLocaleString()}</h3>
              <p>Active Subscriptions</p>
              <span className="analytics-trend positive">+8.2%</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <TrendingUp size={24} />
            </div>
            <div className="analytics-content">
              <h3>${analytics.averageRevenuePerUser?.toFixed(2)}</h3>
              <p>Average Revenue per User</p>
              <span className="analytics-trend positive">+5.7%</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.churnRate}%</h3>
              <p>Monthly Churn Rate</p>
              <span className="analytics-trend negative">-0.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="plans-table-container">
        <table className="plans-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Pricing</th>
              <th>Subscribers</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <div className="plan-info">
                    <h4>{plan.name}</h4>
                    <p>{plan.description}</p>
                    {plan.is_popular && (
                      <span className="popular-badge">Most Popular</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="pricing-info">
                    <span className="price">
                      ${plan.price}
                      <span className="interval">/{plan.interval}</span>
                    </span>
                    {plan.trial_days > 0 && (
                      <span className="trial">{plan.trial_days} day free trial</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="subscriber-count">
                    {plan.subscriber_count?.toLocaleString() || 0}
                  </span>
                </td>
                <td>
                  <span className="revenue-amount">
                    ${plan.revenue?.toLocaleString() || 0}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${plan.is_active ? 'active' : 'inactive'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="plan-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditPlan(plan)}
                      title="Edit Plan"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="action-btn toggle"
                      onClick={() => handleTogglePlanStatus(plan.id)}
                      title={plan.is_active ? 'Deactivate Plan' : 'Activate Plan'}
                    >
                      {plan.is_active ? <X size={16} /> : <Check size={16} />}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeletePlan(plan.id)}
                      title="Delete Plan"
                      disabled={plan.subscriber_count > 0}
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

      {/* Create/Edit Plan Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
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
                  <label>Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                    placeholder="e.g., Pro Plan"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                    placeholder="Brief description of the plan"
                  />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={planForm.currency}
                    onChange={(e) => setPlanForm({...planForm, currency: e.target.value})}
                  >
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Billing Interval</label>
                  <select
                    value={planForm.interval}
                    onChange={(e) => setPlanForm({...planForm, interval: e.target.value})}
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trial Days</label>
                  <input
                    type="number"
                    value={planForm.trial_days}
                    onChange={(e) => setPlanForm({...planForm, trial_days: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Limits & Features</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Max Projects</label>
                    <input
                      type="number"
                      value={planForm.max_projects || ''}
                      onChange={(e) => setPlanForm({
                        ...planForm,
                        max_projects: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Max AI Requests</label>
                    <input
                      type="number"
                      value={planForm.max_ai_requests || ''}
                      onChange={(e) => setPlanForm({
                        ...planForm,
                        max_ai_requests: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Collaborators</label>
                    <input
                      type="number"
                      value={planForm.max_collaborators || ''}
                      onChange={(e) => setPlanForm({
                        ...planForm,
                        max_collaborators: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                </div>

                <div className="feature-toggles">
                  <label className="toggle-group">
                    <input
                      type="checkbox"
                      checked={planForm.has_3d_visualization}
                      onChange={(e) => setPlanForm({...planForm, has_3d_visualization: e.target.checked})}
                    />
                    <span>3D Visualization</span>
                  </label>

                  <label className="toggle-group">
                    <input
                      type="checkbox"
                      checked={planForm.has_hardware_integration}
                      onChange={(e) => setPlanForm({...planForm, has_hardware_integration: e.target.checked})}
                    />
                    <span>Hardware Integration</span>
                  </label>

                  <label className="toggle-group">
                    <input
                      type="checkbox"
                      checked={planForm.has_priority_support}
                      onChange={(e) => setPlanForm({...planForm, has_priority_support: e.target.checked})}
                    />
                    <span>Priority Support</span>
                  </label>

                  <label className="toggle-group">
                    <input
                      type="checkbox"
                      checked={planForm.has_team_features}
                      onChange={(e) => setPlanForm({...planForm, has_team_features: e.target.checked})}
                    />
                    <span>Team Features</span>
                  </label>

                  <label className="toggle-group">
                    <input
                      type="checkbox"
                      checked={planForm.is_popular}
                      onChange={(e) => setPlanForm({...planForm, is_popular: e.target.checked})}
                    />
                    <span>Mark as Popular</span>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h4>Features List</h4>
                <div className="features-editor">
                  {planForm.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature description"
                      />
                      <button
                        className="remove-feature"
                        onClick={() => removeFeature(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button className="add-feature" onClick={addFeature}>
                    <Plus size={16} />
                    Add Feature
                  </button>
                </div>
              </div>

              <div className="form-section">
                <h4>Stripe Configuration</h4>
                <div className="form-group">
                  <label>Stripe Price ID</label>
                  <input
                    type="text"
                    value={planForm.stripe_price_id}
                    onChange={(e) => setPlanForm({...planForm, stripe_price_id: e.target.value})}
                    placeholder="price_xxx"
                  />
                  <small>Leave empty for free plans</small>
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
                onClick={handleSavePlan}
                disabled={!planForm.name || !planForm.description}
              >
                <Save size={16} />
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .subscription-plans-manager {
          padding: 2rem;
        }

        .plans-header {
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

        .plans-table-container {
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .plans-table {
          width: 100%;
          border-collapse: collapse;
        }

        .plans-table th,
        .plans-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .plans-table th {
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
        }

        .plan-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .plan-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .popular-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.5rem;
        }

        .pricing-info .price {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .pricing-info .interval {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .pricing-info .trial {
          display: block;
          color: #059669;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .subscriber-count,
        .revenue-amount {
          font-weight: 600;
          color: #1f2937;
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

        .status-badge.inactive {
          background: #e5e7eb;
          color: #374151;
        }

        .plan-actions {
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

        .action-btn.delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .feature-toggles {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
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

        .features-editor {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feature-item {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .feature-item input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .remove-feature {
          padding: 0.5rem;
          border: 1px solid #ef4444;
          border-radius: 0.375rem;
          background: #fef2f2;
          color: #ef4444;
          cursor: pointer;
        }

        .add-feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          color: #374151;
          cursor: pointer;
          align-self: flex-start;
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
          .subscription-plans-manager {
            padding: 1rem;
          }

          .plans-header {
            flex-direction: column;
            align-items: stretch;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .plans-table {
            font-size: 0.875rem;
          }

          .plans-table th,
          .plans-table td {
            padding: 0.5rem;
          }

          .modal-content {
            margin: 1rem;
            max-width: none;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .feature-toggles {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPlansManager;