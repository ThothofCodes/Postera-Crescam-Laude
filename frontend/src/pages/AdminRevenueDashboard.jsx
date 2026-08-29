// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../admin/context/AdminAuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Spinner } from '../components/UI';
import { api } from '../utils/api';

const COLORS = ['#EE6100', '#ff3366', '#7a5aff', '#00ff88', '#ffaa00'];
const STATUS_COLORS = { 
  pending: '#ffaa00', 
  processing: '#EE6100', 
  shipped: '#00ff88', 
  delivered: '#7a5aff', 
  cancelled: '#ff3366' 
};

export default function AdminRevenueDashboard() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');


  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: statsRes }, { data: revRes }] = await Promise.all([
          api.get(`/admin/stats?range=${timeRange}`),
          api.get(`/admin/revenue?range=${timeRange}`)
        ]);
        setStats(statsRes.data || statsRes);
        setRevenueData(revRes.data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeRange]);

  if (loading) return <Spinner />;

  const ordersByStatus = Object.entries(stats.ordersByStatus || {}).map(([name, value]) => ({ name, value }));
  const salesByCategory = Object.entries(stats.salesByCategory || {}).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'var(--bg-void)', 
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            margin: 0, 
            color: '#F4F1EA',
            fontWeight: 700
          }}>
            Revenue Analytics Dashboard
          </h1>
          <p style={{ 
            color: '#A9C4BE', 
            margin: '0.5rem 0 0',
            fontSize: '1rem'
          }}>
            Business financial performance overview
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid rgba(240, 238, 255, 0.2)',
              borderRadius: '8px',
              color: '#F4F1EA',
              fontSize: '0.9rem'
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginBottom: '0.5rem' }}>Total Revenue</div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            color: '#EE6100' 
          }}>
            KSh {stats.totalRevenue?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#00ff88', marginTop: '0.25rem' }}>
            +12.3% from last period
          </div>
        </div>
        
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginBottom: '0.5rem' }}>Total Orders</div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            color: '#ff3366' 
          }}>
            {stats.totalOrders || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#ffaa00', marginTop: '0.25rem' }}>
            +8.2% from last period
          </div>
        </div>
        
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginBottom: '0.5rem' }}>Pending Orders</div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            color: '#ffaa00' 
          }}>
            {stats.pendingOrders || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#ff3366', marginTop: '0.25rem' }}>
            Requires attention
          </div>
        </div>
        
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginBottom: '0.5rem' }}>Active Clients</div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            color: '#00ff88' 
          }}>
            {stats.activeClients || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#EE6100', marginTop: '0.25rem' }}>
            +5.1% from last period
          </div>
        </div>
      </div>

      {/* Main Revenue Chart */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(240, 238, 255, 0.1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          margin: '0 0 1.5rem 0', 
          color: '#F4F1EA', 
          fontSize: '1.3rem',
          fontWeight: 600 
        }}>
          Revenue Trend Analysis
        </h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,241,234,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#A9C4BE" 
                tick={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#A9C4BE" 
                tickFormatter={(value) => `KSh ${(value / 1000).toFixed(0)}k`} 
                tick={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value) => [`KSh ${parseInt(value).toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ 
                  background: 'var(--bg-surface)', 
                  border: '1px solid rgba(244,241,234,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#EE6100" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#EE6100' }} 
                activeDot={{ r: 8, stroke: '#EE6100', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Orders by Status */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#F4F1EA', 
            fontSize: '1.3rem',
            fontWeight: 600 
          }}>
            Orders by Status
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,241,234,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#A9C4BE" 
                  tick={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#A9C4BE" 
                  tick={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-surface)', 
                    border: '1px solid rgba(244,241,234,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#EE6100"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Category */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#F4F1EA', 
            fontSize: '1.3rem',
            fontWeight: 600 
          }}>
            Sales by Category
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{ 
                    background: 'var(--bg-surface)', 
                    border: '1px solid rgba(244,241,234,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid rgba(240, 238, 255, 0.1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          margin: '0 0 1.5rem 0', 
          color: '#F4F1EA', 
          fontSize: '1.3rem',
          fontWeight: 600 
        }}>
          Key Performance Indicators
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(0, 212, 255, 0.1)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#EE6100' }}>
              {(stats.avgOrderValue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginTop: '0.5rem' }}>
              Avg. Order Value
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(0, 255, 136, 0.1)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ff88' }}>
              {stats.conversionRate || 0}%
            </div>
            <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginTop: '0.5rem' }}>
              Conversion Rate
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(255, 51, 102, 0.1)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff3366' }}>
              {stats.returningCustomers || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginTop: '0.5rem' }}>
              Returning Customers
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(122, 90, 255, 0.1)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7a5aff' }}>
              {stats.customerSatisfaction || 0}%
            </div>
            <div style={{ fontSize: '0.9rem', color: '#A9C4BE', marginTop: '0.5rem' }}>
              Satisfaction Score
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}