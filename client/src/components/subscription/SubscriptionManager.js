import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '5 projects',
      'Basic circuit designer',
      'Limited AI generations',
      'Community support'
    ],
    stripePriceId: null
  },
  pro: {
    name: 'Pro',
    price: 19,
    features: [
      'Unlimited projects',
      'Advanced circuit designer',
      'Unlimited AI generations',
      'Real-time collaboration',
      'Priority support',
      'Hardware integration'
    ],
    stripePriceId: 'price_pro_monthly'
  },
  enterprise: {
    name: 'Enterprise',
    price: 49,
    features: [
      'Everything in Pro',
      'Team management',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    stripePriceId: 'price_enterprise_monthly'
  }
};

const CheckoutForm = ({ selectedPlan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment method
      const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (paymentError) {
        setError(paymentError.message);
        return;
      }

      // Call your backend to create subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          priceId: SUBSCRIPTION_PLANS[selectedPlan].stripePriceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);

      if (confirmError) {
        setError(confirmError.message);
        return;
      }

      toast.success('Subscription created successfully!');
      onSuccess();

    } catch (err) {
      setError(err.message);
      console.error('Subscription error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="subscription-form">
      <div className="form-group">
        <label>Card Information</label>
        <div className="card-element-container">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Subscribe for $${SUBSCRIPTION_PLANS[selectedPlan].price}/month`}
        </button>
      </div>
    </form>
  );
};

const SubscriptionManager = () => {
  const { user, profile } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      const subscription = await db.subscriptions.get(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planKey) => {
    if (planKey === 'free' && currentSubscription?.status === 'active') {
      // Handle downgrade to free
      handleDowngrade();
    } else {
      setSelectedPlan(planKey);
      setShowCheckout(true);
    }
  };

  const handleDowngrade = async () => {
    try {
      await db.subscriptions.update(user.id, { status: 'canceled' });
      setCurrentSubscription(prev => ({ ...prev, status: 'canceled' }));
      toast.success('Downgraded to free plan');
    } catch (error) {
      console.error('Error downgrading:', error);
      toast.error('Failed to downgrade');
    }
  };

  const handleSubscriptionSuccess = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    loadSubscriptionData();
  };

  const getCurrentPlan = () => {
    if (!currentSubscription || currentSubscription.status !== 'active') {
      return 'free';
    }
    return profile?.role || 'free';
  };

  const canUpgrade = (planKey) => {
    const currentPlan = getCurrentPlan();
    const planOrder = { free: 0, pro: 1, enterprise: 2 };
    return planOrder[planKey] > planOrder[currentPlan];
  };

  if (isLoading) {
    return <div className="loading">Loading subscription...</div>;
  }

  if (showCheckout && selectedPlan) {
    return (
      <div className="subscription-checkout">
        <div className="checkout-header">
          <h2>Subscribe to {SUBSCRIPTION_PLANS[selectedPlan].name}</h2>
          <p>${SUBSCRIPTION_PLANS[selectedPlan].price}/month</p>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            selectedPlan={selectedPlan}
            onSuccess={handleSubscriptionSuccess}
            onCancel={() => setShowCheckout(false)}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="subscription-manager">
      <div className="subscription-header">
        <h2>Subscription Plans</h2>
        <div className="current-plan">
          <span>Current Plan: </span>
          <span className={`plan-badge ${getCurrentPlan()}`}>
            {SUBSCRIPTION_PLANS[getCurrentPlan()].name}
          </span>
          {currentSubscription?.status === 'canceled' && (
            <span className="canceled-notice"> (Canceled)</span>
          )}
        </div>
      </div>

      <div className="plans-grid">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
          <div key={key} className={`plan-card ${key === getCurrentPlan() ? 'current' : ''}`}>
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="amount">${plan.price}</span>
                <span className="period">/month</span>
              </div>
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>

            <div className="plan-actions">
              {key === getCurrentPlan() ? (
                <button className="btn-current" disabled>
                  Current Plan
                </button>
              ) : canUpgrade(key) ? (
                <button
                  className="btn-upgrade"
                  onClick={() => handlePlanSelect(key)}
                >
                  Upgrade
                </button>
              ) : (
                <button
                  className="btn-downgrade"
                  onClick={() => handlePlanSelect(key)}
                >
                  Downgrade
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentSubscription && (
        <div className="subscription-details">
          <h3>Subscription Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className={`value status-${currentSubscription.status}`}>
                {currentSubscription.status}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Plan:</span>
              <span className="value">{currentSubscription.plan_name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Price:</span>
              <span className="value">${currentSubscription.plan_price}/month</span>
            </div>
            {currentSubscription.current_period_end && (
              <div className="detail-item">
                <span className="label">Next Billing:</span>
                <span className="value">
                  {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {currentSubscription.status === 'active' && (
            <div className="subscription-actions">
              <button
                className="btn-danger"
                onClick={handleDowngrade}
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .subscription-manager {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .subscription-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .current-plan {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .plan-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .plan-badge.free {
          background: #e5e7eb;
          color: #374151;
        }

        .plan-badge.pro {
          background: #3b82f6;
          color: white;
        }

        .plan-badge.enterprise {
          background: #7c3aed;
          color: white;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .plan-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 2rem;
          background: white;
          transition: all 0.2s ease;
        }

        .plan-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .plan-card.current {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .plan-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .plan-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
        }

        .amount {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .period {
          font-size: 1rem;
          color: #6b7280;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
        }

        .plan-features li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
        }

        .plan-features li:before {
          content: "✓";
          color: #10b981;
          font-weight: bold;
          margin-right: 0.5rem;
        }

        .plan-actions {
          text-align: center;
        }

        .btn-current {
          background: #e5e7eb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .btn-upgrade {
          background: #3b82f6;
          color: white;
        }

        .btn-downgrade {
          background: #ef4444;
          color: white;
        }

        .subscription-details {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 2rem;
        }

        .subscription-details h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.375rem;
        }

        .label {
          font-weight: 500;
          color: #374151;
        }

        .value {
          font-weight: 600;
          color: #1f2937;
        }

        .status-active {
          color: #10b981;
        }

        .status-canceled {
          color: #ef4444;
        }

        .subscription-actions {
          text-align: center;
        }

        .subscription-checkout {
          max-width: 500px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 2rem;
        }

        .checkout-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .checkout-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .checkout-header p {
          margin: 0;
          color: #6b7280;
          font-size: 1.125rem;
        }

        .subscription-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
        }

        .card-element-container {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          padding: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .subscription-manager {
            padding: 1rem;
          }

          .plans-grid {
            grid-template-columns: 1fr;
          }

          .subscription-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionManager;