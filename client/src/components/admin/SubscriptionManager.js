import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Settings,
  Shield,
  Zap
} from 'lucide-react';

const SubscriptionManager = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [clientSecret, setClientSecret] = useState('');
  const [stripeConfig, setStripeConfig] = useState(null);

  // Subscription plans
  const plans = {
    free: {
      name: 'Free',
      price: 0,
      features: ['Basic circuit design', 'Limited simulations', 'Community support'],
      color: 'gray'
    },
    pro: {
      name: 'Pro',
      price: 19.99,
      features: ['Advanced circuit design', 'Unlimited simulations', 'AI code generation', 'Priority support'],
      color: 'blue'
    },
    enterprise: {
      name: 'Enterprise',
      price: 49.99,
      features: ['All Pro features', 'Team collaboration', 'Custom integrations', 'Dedicated support'],
      color: 'purple'
    }
  };

  useEffect(() => {
    loadSubscriptionData();
    loadStripeConfig();
  }, []);

  const loadStripeConfig = async () => {
    try {
      const response = await fetch('/api/stripe/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStripeConfig(data.data);
      }
    } catch (error) {
      console.error('Error loading Stripe config:', error);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Load subscriptions
      const subsResponse = await fetch('/api/billing/subscriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        setSubscriptions(subsData.data || []);
      }

      // Load payment methods
      const pmResponse = await fetch('/api/stripe/payment-methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (pmResponse.ok) {
        const pmData = await pmResponse.json();
        setPaymentMethods(pmData.data || []);
      }

    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planName: selectedPlan
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();

      if (data.data.clientSecret) {
        setClientSecret(data.data.clientSecret);
        // Here you would integrate with Stripe Elements to complete the payment
        alert('Subscription created! In a real app, you would complete the payment with Stripe Elements.');
      }

      setShowCreateModal(false);
      loadSubscriptionData();

    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription. Please try again.');
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      alert('Subscription will be cancelled at the end of the current period.');
      loadSubscriptionData();

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const handleUpdateSubscription = async (subscriptionId, newPlan) => {
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId,
          newPlanName: newPlan
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      alert('Subscription updated successfully!');
      loadSubscriptionData();

    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'canceled': return '#ef4444';
      case 'past_due': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'canceled': return <XCircle size={16} />;
      case 'past_due': return <AlertTriangle size={16} />;
      default: return <Settings size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="subscription-manager loading">
        <div className="loading-spinner"></div>
        <p>Loading subscription data...</p>
      </div>
    );
  }

  return (
    <div className="subscription-manager">
      <div className="subscription-header">
        <div className="header-content">
          <h2>Subscription Management</h2>
          <p>Manage your subscriptions, billing, and payment methods</p>
        </div>

        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            New Subscription
          </button>
        </div>
      </div>

      {/* Current Subscriptions */}
      <div className="subscriptions-section">
        <h3>Current Subscriptions</h3>

        {subscriptions.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} />
            <h4>No active subscriptions</h4>
            <p>Get started with one of our plans</p>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Choose a Plan
            </button>
          </div>
        ) : (
          <div className="subscriptions-grid">
            {subscriptions.map((subscription) => (
              <div key={subscription._id} className="subscription-card">
                <div className="subscription-header">
                  <div className="plan-info">
                    <h4>{plans[subscription.plan_name]?.name || subscription.plan_name}</h4>
                    <span className={`status-badge ${subscription.status}`}>
                      {getStatusIcon(subscription.status)}
                      {subscription.status}
                    </span>
                  </div>

                  <div className="subscription-actions">
                    {subscription.status === 'active' && (
                      <>
                        <button
                          className="btn-secondary"
                          onClick={() => handleUpdateSubscription(subscription._id, 'enterprise')}
                        >
                          <Zap size={16} />
                          Upgrade
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleCancelSubscription(subscription._id)}
                        >
                          <XCircle size={16} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="subscription-details">
                  <div className="detail-item">
                    <span className="label">Amount:</span>
                    <span className="value">${subscription.amount}/{subscription.interval}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">Current Period:</span>
                    <span className="value">
                      {new Date(subscription.current_period_start).toLocaleDateString()} -
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="cancellation-notice">
                      <AlertTriangle size={16} />
                      <span>Will cancel on {new Date(subscription.current_period_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="payment-methods-section">
        <h3>Payment Methods</h3>

        <div className="payment-methods-grid">
          {paymentMethods.map((method) => (
            <div key={method.id} className="payment-method-card">
              <div className="card-header">
                <CreditCard size={24} />
                <span className="card-brand">{method.card.brand.toUpperCase()}</span>
                <span className="card-last4">•••• {method.card.last4}</span>
              </div>

              <div className="card-details">
                <div className="detail-item">
                  <span className="label">Expires:</span>
                  <span className="value">{method.card.exp_month}/{method.card.exp_year}</span>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn-secondary">
                  <Edit size={16} />
                  Edit
                </button>
                <button className="btn-danger">
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="add-payment-method-card">
            <Plus size={48} />
            <h4>Add Payment Method</h4>
            <p>Add a new credit card for billing</p>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="plans-section">
        <h3>Available Plans</h3>

        <div className="plans-grid">
          {Object.entries(plans).map(([key, plan]) => (
            <div key={key} className={`plan-card ${plan.color}`}>
              <div className="plan-header">
                <h4>{plan.name}</h4>
                <div className="plan-price">
                  <span className="amount">${plan.price}</span>
                  <span className="period">/month</span>
                </div>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <CheckCircle size={16} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedPlan(key);
                  setShowCreateModal(true);
                }}
                disabled={subscriptions.some(s => s.plan_name === key && s.status === 'active')}
              >
                {subscriptions.some(s => s.plan_name === key && s.status === 'active')
                  ? 'Current Plan'
                  : 'Choose Plan'
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Subscription</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="plan-selection">
                <h4>Choose a Plan</h4>
                <div className="plan-options">
                  {Object.entries(plans).map(([key, plan]) => (
                    <div
                      key={key}
                      className={`plan-option ${selectedPlan === key ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(key)}
                    >
                      <div className="plan-info">
                        <h5>{plan.name}</h5>
                        <p>${plan.price}/month</p>
                      </div>
                      <div className="plan-radio">
                        {selectedPlan === key && <CheckCircle size={20} />}
                      </div>
                    </div>
                  ))}
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
                onClick={handleCreateSubscription}
              >
                Create Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .subscription-manager {
          padding: 2rem;
        }

        .subscription-header {
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

        .subscriptions-section,
        .payment-methods-section,
        .plans-section {
          margin-bottom: 3rem;
        }

        .subscriptions-section h3,
        .payment-methods-section h3,
        .plans-section h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          text-align: center;
        }

        .empty-state h4 {
          margin: 1rem 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          color: #6b7280;
        }

        .subscriptions-grid,
        .payment-methods-grid,
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .subscription-card,
        .payment-method-card,
        .plan-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .subscription-header,
        .card-header,
        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .plan-info h4,
        .plan-header h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
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
          color: white;
        }

        .status-badge.active {
          background: #10b981;
        }

        .status-badge.canceled {
          background: #ef4444;
        }

        .subscription-actions,
        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .subscription-details,
        .card-details {
          margin-bottom: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .detail-item .label {
          font-weight: 500;
          color: #374151;
        }

        .detail-item .value {
          color: #6b7280;
        }

        .cancellation-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #dc2626;
          font-size: 0.875rem;
        }

        .add-payment-method-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-payment-method-card:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .add-payment-method-card h4 {
          margin: 1rem 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .add-payment-method-card p {
          margin: 0;
          color: #6b7280;
        }

        .plan-price {
          text-align: right;
        }

        .plan-price .amount {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .plan-price .period {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
        }

        .plan-features li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .plan-features li svg {
          color: #10b981;
          flex-shrink: 0;
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
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
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

        .plan-selection h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .plan-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .plan-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .plan-option:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .plan-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .plan-info h5 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .plan-info p {
          margin: 0;
          color: #6b7280;
        }

        .plan-radio {
          color: #3b82f6;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary,
        .btn-secondary,
        .btn-danger {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #f3f4f6;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
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
          .subscription-manager {
            padding: 1rem;
          }

          .subscription-header {
            flex-direction: column;
            align-items: stretch;
          }

          .subscriptions-grid,
          .payment-methods-grid,
          .plans-grid {
            grid-template-columns: 1fr;
          }

          .subscription-header,
          .card-header {
            flex-direction: column;
            gap: 1rem;
          }

          .subscription-actions,
          .card-actions {
            justify-content: center;
          }

          .modal-content {
            margin: 1rem;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionManager;