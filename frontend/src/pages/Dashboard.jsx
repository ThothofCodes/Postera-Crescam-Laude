// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../admin/context/AdminAuthContext';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Spinner } from '../components/UI';
import { api } from '../utils/api';
import ChatMonitor from '../admin/components/ChatMonitor';

const COLORS = ['#EE6100', '#ff3366', '#7a5aff', '#00ff88', '#ffaa00'];
const STATUS_COLORS = { pending: '#ffaa00', processing: '#EE6100', shipped: '#00ff88', delivered: '#7a5aff', cancelled: '#ff3366' };

export default function Dashboard() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatModule, setShowChatModule] = useState(false);


  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: statsRes }, { data: revRes }] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/revenue')
        ]);
        setStats(statsRes);
        setRevenueData(revRes.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  // Format the sales by category data to handle both old and new structures
  const formattedSalesByCategory = Object.entries(stats.salesByCategory || {}).map(([name, value]) => {
    // Check if value is an object with count and revenue (new structure) or just a number (old structure)
    if (typeof value === 'object' && value !== null) {
      return { name, value: value.count || 0, revenue: value.revenue || 0 };
    } else {
      return { name, value: value || 0, revenue: (value || 0) * 1500 }; // Fallback calculation
    }
  });

  const ordersByStatus = Object.entries(stats.ordersByStatus || {}).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ padding: '2rem', background: 'var(--bg-void)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, color: '#F4F1EA' }}>Dashboard</h1>
          <p style={{ color: '#A9C4BE', margin: '0.5rem 0 0' }}>Welcome back, {user?.name || user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setShowChatModule(!showChatModule)}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(238,97,0,0.1)',
              color: '#EE6100',
              border: '1px solid rgba(238,97,0,0.3)',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            💬 Support Chat
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#A9C4BE' }}>Total Revenue</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#EE6100' }}>
            KSh {(stats.totalRevenue || 0).toLocaleString()}
          </p>
        </div>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#A9C4BE' }}>Total Orders</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#ff3366' }}>
            {stats.totalOrders || 0}
          </p>
        </div>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#A9C4BE' }}>Pending Orders</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#ffaa00' }}>
            {stats.pendingOrders || 0}
          </p>
        </div>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#A9C4BE' }}>Active Clients</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#00ff88' }}>
            {stats.activeClients || 0}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid rgba(240, 238, 255, 0.1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: 0, marginBottom: '1rem', color: '#F4F1EA' }}>Revenue Trend</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,241,234,0.1)" />
              <XAxis dataKey="date" stroke="#A9C4BE" />
              <YAxis stroke="#A9C4BE" tickFormatter={(value) => `KSh ${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value) => [`KSh ${parseInt(value).toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(244,241,234,0.1)' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#EE6100" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column layout for Products & Services and Order Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Product and Services Table */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: 0, marginBottom: '1rem', color: '#F4F1EA' }}>Products & Services</h3>
          <div style={{ height: '300px', overflowY: 'auto' }}>
            {formattedSalesByCategory.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(244,241,234,0.2)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem', color: '#A9C4BE', fontSize: '0.9rem' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem', color: '#A9C4BE', fontSize: '0.9rem' }}>Count</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem', color: '#A9C4BE', fontSize: '0.9rem' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedSalesByCategory.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(244,241,234,0.1)' }}>
                      <td style={{ padding: '0.5rem', color: '#F4F1EA' }}>{item.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: '#EE6100' }}>{item.value}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: '#00ff88' }}>KSh {item.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#A9C4BE' }}>
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: 0, marginBottom: '1rem', color: '#F4F1EA' }}>Order Status</h3>
          {ordersByStatus.length > 0 ? (
            <>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Count']}
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(244,241,234,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {ordersByStatus.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', background: STATUS_COLORS[item.name] || COLORS[index % COLORS.length], borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.8rem', color: '#A9C4BE' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#F4F1EA', marginLeft: 'auto' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px', color: '#A9C4BE' }}>
              No order status data available
            </div>
          )}
        </div>
      </div>

      {/* Sales by Category Bar Chart */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid rgba(240, 238, 255, 0.1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ margin: 0, marginBottom: '1rem', color: '#F4F1EA' }}>Sales by Category</h3>
        {formattedSalesByCategory.length > 0 ? (
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedSalesByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,241,234,0.1)" />
                <XAxis dataKey="name" stroke="#A9C4BE" />
                <YAxis stroke="#A9C4BE" />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(244,241,234,0.1)' }}
                />
                <Bar dataKey="value" fill="#ff3366" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#A9C4BE' }}>
            No sales by category data available
          </div>
        )}
      </div>

      {/* Chat Module Overlay - Updated to use new ChatMonitor */}
      {showChatModule && (
        <ChatMonitor 
          authToken={localStorage.getItem('adminToken')}
          onClose={() => setShowChatModule(false)}
        />
      )}
    </div>
  );
}
