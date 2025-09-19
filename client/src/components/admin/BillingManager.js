import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import {
  DollarSign,
  CreditCard,
  FileText,
  Download,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Mail
} from 'lucide-react';

const BillingManager = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Billing analytics
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    outstandingInvoices: 0,
    overdueInvoices: 0,
    averageInvoiceValue: 0,
    paymentSuccessRate: 0
  });

  useEffect(() => {
    loadBillingData();
  }, [dateRange]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load invoices
      const invoicesData = await loadInvoices();
      setInvoices(invoicesData);

      // Load subscriptions
      const subscriptionsData = await loadSubscriptions();
      setSubscriptions(subscriptionsData);

      // Calculate analytics
      const billingAnalytics = calculateAnalytics(invoicesData, subscriptionsData);
      setAnalytics(billingAnalytics);

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Return empty array on error to prevent UI crash
      return [];
    }
  };

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/billing/subscriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      // Return empty array on error to prevent UI crash
      return [];
    }
  };

  const calculateAnalytics = (invoicesData, subscriptionsData) => {
    const totalRevenue = invoicesData
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const monthlyRecurringRevenue = subscriptionsData
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + sub.amount, 0);

    const outstandingInvoices = invoicesData
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueInvoices = invoicesData
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const paidInvoices = invoicesData.filter(inv => inv.status === 'paid');
    const averageInvoiceValue = paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => sum + inv.amount, 0) / paidInvoices.length
      : 0;

    const paymentSuccessRate = invoicesData.length > 0
      ? (paidInvoices.length / invoicesData.length) * 100
      : 0;

    return {
      totalRevenue,
      monthlyRecurringRevenue,
      outstandingInvoices,
      overdueInvoices,
      averageInvoiceValue,
      paymentSuccessRate
    };
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send invoice');
      }

      alert('Invoice sent successfully!');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice. Please try again.');
    }
  };

  const handleMarkAsPaid = async (invoice) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/mark-paid`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark invoice as paid');
      }

      loadBillingData(); // Refresh data
      alert('Invoice marked as paid successfully!');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to mark invoice as paid. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'overdue': return <AlertTriangle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="billing-manager loading">
        <div className="loading-spinner"></div>
        <p>Loading billing data...</p>
      </div>
    );
  }

  return (
    <div className="billing-manager">
      <div className="billing-header">
        <div className="header-content">
          <h2>Billing & Invoicing Management</h2>
          <p>Manage subscriptions, invoices, and payment processing</p>
        </div>

        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={16} />
            Export Data
          </button>
          <button className="btn-primary">
            <FileText size={16} />
            Generate Report
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
              <h3>${analytics.totalRevenue.toFixed(2)}</h3>
              <p>Total Revenue</p>
              <span className="analytics-trend positive">+12.5%</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <TrendingUp size={24} />
            </div>
            <div className="analytics-content">
              <h3>${analytics.monthlyRecurringRevenue.toFixed(2)}</h3>
              <p>Monthly Recurring Revenue</p>
              <span className="analytics-trend positive">+8.2%</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <Clock size={24} />
            </div>
            <div className="analytics-content">
              <h3>${analytics.outstandingInvoices.toFixed(2)}</h3>
              <p>Outstanding Invoices</p>
              <span className="analytics-trend warning">Pending</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="analytics-content">
              <h3>${analytics.overdueInvoices.toFixed(2)}</h3>
              <p>Overdue Invoices</p>
              <span className="analytics-trend negative">Action Required</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <FileText size={24} />
            </div>
            <div className="analytics-content">
              <h3>${analytics.averageInvoiceValue.toFixed(2)}</h3>
              <p>Average Invoice Value</p>
              <span className="analytics-trend neutral">Stable</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <CheckCircle size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.paymentSuccessRate.toFixed(1)}%</h3>
              <p>Payment Success Rate</p>
              <span className="analytics-trend positive">+2.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="billing-tabs">
        <button
          className={activeTab === 'invoices' ? 'billing-tab active' : 'billing-tab'}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={16} />
          Invoices
        </button>
        <button
          className={activeTab === 'subscriptions' ? 'billing-tab active' : 'billing-tab'}
          onClick={() => setActiveTab('subscriptions')}
        >
          <CreditCard size={16} />
          Subscriptions
        </button>
        <button
          className={activeTab === 'analytics' ? 'billing-tab active' : 'billing-tab'}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} />
          Analytics
        </button>
      </div>

      <div className="billing-content">
        {activeTab === 'invoices' && (
          <div className="invoices-tab">
            <div className="invoices-header">
              <div className="filters">
                <div className="search-bar">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="date-filter"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>

            <div className="invoices-table-container">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <div className="invoice-info">
                          <div className="invoice-number">{invoice.invoice_number}</div>
                          <div className="invoice-description">{invoice.description}</div>
                        </div>
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{invoice.customer_name}</div>
                          <div className="customer-email">{invoice.customer_email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="amount-info">
                          <span className="amount">${invoice.amount.toFixed(2)}</span>
                          <span className="currency">{invoice.currency.toUpperCase()}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(invoice.status) }}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </td>
                      <td>
                        <span className="due-date">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="invoice-actions">
                          <button
                            className="action-btn view"
                            onClick={() => handleViewInvoice(invoice)}
                            title="View Invoice"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="action-btn download"
                            onClick={() => handleDownloadInvoice(invoice)}
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="action-btn send"
                            onClick={() => handleSendInvoice(invoice)}
                            title="Send Invoice"
                          >
                            <Mail size={16} />
                          </button>
                          {invoice.status === 'pending' && (
                            <button
                              className="action-btn mark-paid"
                              onClick={() => handleMarkAsPaid(invoice)}
                              title="Mark as Paid"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </div>
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
              <h3>Active Subscriptions</h3>
              <div className="subscription-stats">
                <div className="stat">
                  <span className="stat-number">{subscriptions.length}</span>
                  <span className="stat-label">Active Subscriptions</span>
                </div>
                <div className="stat">
                  <span className="stat-number">
                    {subscriptions.filter(s => s.cancel_at_period_end).length}
                  </span>
                  <span className="stat-label">Cancelling Soon</span>
                </div>
              </div>
            </div>

            <div className="subscriptions-grid">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="subscription-card">
                  <div className="subscription-header">
                    <div className="customer-info">
                      <h4>{subscription.customer_name}</h4>
                      <span className="plan-badge">{subscription.plan_name}</span>
                    </div>
                    <div className="subscription-status">
                      <span className={`status-badge ${subscription.status}`}>
                        {subscription.status}
                      </span>
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
                    <div className="detail-item">
                      <span className="label">Payment Method:</span>
                      <span className="value">{subscription.payment_method}</span>
                    </div>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="cancellation-notice">
                      <AlertTriangle size={16} />
                      <span>Will cancel at period end</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <h3>Detailed Billing Analytics</h3>
            <div className="analytics-charts">
              <div className="chart-placeholder">
                <TrendingUp size={48} />
                <h4>Revenue Trends</h4>
                <p>Revenue over time chart would be displayed here</p>
              </div>

              <div className="chart-placeholder">
                <FileText size={48} />
                <h4>Invoice Status Distribution</h4>
                <p>Invoice status breakdown chart would be displayed here</p>
              </div>

              <div className="chart-placeholder">
                <CreditCard size={48} />
                <h4>Payment Methods</h4>
                <p>Payment method usage chart would be displayed here</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invoice {selectedInvoice.invoice_number}</h3>
              <button
                className="modal-close"
                onClick={() => setShowInvoiceModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="invoice-details">
                <div className="invoice-header">
                  <div className="invoice-info">
                    <h4>{selectedInvoice.customer_name}</h4>
                    <p>{selectedInvoice.customer_email}</p>
                    <p className="invoice-date">
                      Created: {new Date(selectedInvoice.created_at).toLocaleDateString()}
                    </p>
                    <p className="due-date">
                      Due: {new Date(selectedInvoice.due_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="invoice-summary">
                    <div className="total-amount">
                      <span className="label">Total Amount</span>
                      <span className="amount">${selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="invoice-status">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(selectedInvoice.status) }}
                      >
                        {getStatusIcon(selectedInvoice.status)}
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="invoice-items">
                  <h4>Items</h4>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.line_items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>${item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedInvoice.payment_method && (
                  <div className="payment-info">
                    <h4>Payment Information</h4>
                    <p>Payment Method: {selectedInvoice.payment_method}</p>
                    {selectedInvoice.paid_at && (
                      <p>Paid At: {new Date(selectedInvoice.paid_at).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => handleDownloadInvoice(selectedInvoice)}
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleSendInvoice(selectedInvoice)}
              >
                <Mail size={16} />
                Send Invoice
              </button>
              {selectedInvoice.status === 'pending' && (
                <button
                  className="btn-primary"
                  onClick={() => handleMarkAsPaid(selectedInvoice)}
                >
                  <CheckCircle size={16} />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .billing-manager {
          padding: 2rem;
        }

        .billing-header {
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

        .analytics-trend.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .analytics-trend.neutral {
          background: #e5e7eb;
          color: #374151;
        }

        .billing-tabs {
          display: flex;
          background: white;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .billing-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .billing-tab:hover {
          color: #374151;
          background: #f9fafb;
        }

        .billing-tab.active {
          color: #3b82f6;
          background: #eff6ff;
        }

        .billing-content {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .invoices-header {
          margin-bottom: 2rem;
        }

        .filters {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          min-width: 250px;
        }

        .search-bar input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 0.875rem;
          background: transparent;
        }

        .status-filter,
        .date-filter {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          font-size: 0.875rem;
        }

        .invoices-table-container {
          overflow-x: auto;
        }

        .invoices-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoices-table th,
        .invoices-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoices-table th {
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
        }

        .invoice-info .invoice-number {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .invoice-info .invoice-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .customer-info .customer-name {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .customer-info .customer-email {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .amount-info .amount {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .amount-info .currency {
          font-size: 0.875rem;
          color: #6b7280;
          margin-left: 0.25rem;
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

        .due-date {
          font-size: 0.875rem;
          color: #374151;
        }

        .invoice-actions {
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

        .action-btn.view {
          background: #eff6ff;
          color: #3b82f6;
        }

        .action-btn.view:hover {
          background: #dbeafe;
        }

        .action-btn.download {
          background: #f3e8ff;
          color: #8b5cf6;
        }

        .action-btn.download:hover {
          background: #e9d5ff;
        }

        .action-btn.send {
          background: #fef3c7;
          color: #d97706;
        }

        .action-btn.send:hover {
          background: #fde68a;
        }

        .action-btn.mark-paid {
          background: #dcfce7;
          color: #166534;
        }

        .action-btn.mark-paid:hover {
          background: #bbf7d0;
        }

        .subscriptions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .subscription-stats {
          display: flex;
          gap: 2rem;
        }

        .stat .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .subscriptions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .subscription-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .subscription-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .customer-info h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .plan-badge {
          padding: 0.125rem 0.5rem;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .subscription-status .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .subscription-status .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .subscription-details {
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
          font-size: 0.875rem;
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

        .analytics-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .chart-placeholder {
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

        .chart-placeholder h4 {
          margin: 1rem 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .chart-placeholder p {
          margin: 0;
          color: #6b7280;
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

        .invoice-details {
          max-width: none;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-info h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .invoice-info p {
          margin: 0 0 0.25rem 0;
          color: #6b7280;
        }

        .invoice-summary {
          text-align: right;
        }

        .total-amount .label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .total-amount .amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .invoice-items {
          margin-bottom: 2rem;
        }

        .invoice-items h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .items-table th,
        .items-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .items-table th {
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
        }

        .payment-info {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.375rem;
        }

        .payment-info h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .payment-info p {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
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
          .billing-manager {
            padding: 1rem;
          }

          .billing-header {
            flex-direction: column;
            align-items: stretch;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .filters {
            flex-direction: column;
            align-items: stretch;
          }

          .search-bar {
            min-width: auto;
          }

          .invoices-table {
            font-size: 0.875rem;
          }

          .invoices-table th,
          .invoices-table td {
            padding: 0.5rem;
          }

          .subscriptions-grid {
            grid-template-columns: 1fr;
          }

          .analytics-charts {
            grid-template-columns: 1fr;
          }

          .invoice-header {
            flex-direction: column;
            gap: 1rem;
          }

          .invoice-summary {
            text-align: left;
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

export default BillingManager;