// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy DepartmentLanding

const features = [
  { icon: '📊', label: 'Overview', desc: 'View department statistics and performance metrics' },
  { icon: '📋', label: 'Orders', desc: 'Manage and track all orders for your department' },
  { icon: '👥', label: 'Clients', desc: 'Access client information and communication history' },
  { icon: '📅', label: 'Bookings', desc: 'Schedule and manage appointments and consultations' },
  { icon: '💬', label: 'Messages', desc: 'Real-time chat with clients and team members' },
  { icon: '📈', label: 'Revenue', desc: 'Track revenue, expenses, and financial reports' },
  { icon: '📦', label: 'Inventory', desc: 'Manage products and stock levels' },
  { icon: '🎫', label: 'Tickets', desc: 'Handle support tickets and customer inquiries' },
];

const DepartmentLanding = ({ color = '#EE6100' }) => {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", color: '#F4F1EA', margin: '0 0 0.5rem' }}>
          Department Dashboard
        </h1>
        <p style={{ color: '#6A8A82', fontSize: 14, fontFamily: "'Poppins',sans-serif" }}>
          Welcome back. Here's an overview of your department.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {features.map(({ icon, label, desc }) => (
          <div key={label} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem', transition: 'all 0.2s ease', cursor: 'pointer' }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 20px ${color}22`; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(36,74,68,0.4)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: 28, marginBottom: '0.75rem' }}>{icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: '0 0 0.25rem' }}>{label}</h3>
            <p style={{ fontSize: 13, color: '#6A8A82', fontFamily: "'Poppins',sans-serif", margin: 0, lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentLanding;
