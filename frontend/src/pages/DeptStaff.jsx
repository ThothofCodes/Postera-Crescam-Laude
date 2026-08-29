// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../admin/context/AdminAuthContext';
import { useChat } from '../hooks/useChat';
import ChatWidget from '../components/ChatWidget';
import { api } from '../utils/api';
import { Spinner, EmptyState } from '../components/UI';

const DeptStaff = () => {
  const { slug } = useParams();
  const { user } = useAdminAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('staff'); // 'staff', 'chat'
  const authToken = localStorage.getItem('adminToken');

  const { 
    connected, 
    adminOnline, 
    messages, 
    conversations,
    currentConversation,
    joinConversation
  } = useChat({ authToken });


  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/departments/${user.departmentSlug}/staff`);
        setStaff(data.staff);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.departmentSlug]);

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div>
                <h1 style={{ fontSize: '1.8rem', margin: 0, color: '#F4F1EA' }}>Department Staff</h1>
                <p style={{ color: '#A9C4BE', margin: '0.5rem 0 0' }}>Manage your team members</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Tab navigation */}
              <button 
                onClick={() => setSelectedTab('staff')}
                className={`btn ${selectedTab === 'staff' ? 'btn-primary' : 'btn-outline'}`}
              >
                Staff Members
              </button>
              <button 
                onClick={() => setSelectedTab('chat')}
                className={`btn ${selectedTab === 'chat' ? 'btn-primary' : 'btn-outline'}`}
              >
                Live Chat
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {selectedTab === 'staff' ? (
          <>
            {/* Staff Management Content */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Staff Members</h2>
                <p className="text-gray-400">Manage your department staff</p>
              </div>
              <button className="btn btn-primary">Add Staff</button>
            </div>

            {loading ? (
              <Spinner />
            ) : staff.length === 0 ? (
              <EmptyState icon="👥" message="No staff members found" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((member) => (
                  <div 
                    key={member._id} 
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{member.name}</h3>
                        <p className="text-gray-400 text-sm">{member.email}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                          member.isActive 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Chat Module
          <div style={{ 
            height: '70vh', 
            border: '1px solid rgba(240, 238, 255, 0.1)', 
            borderRadius: '12px', 
            background: 'var(--bg-surface)',
            overflow: 'hidden'
          }}>
            <ChatWidget isAdmin={true} authToken={authToken} />
          </div>
        )}
      </div>
    </div>
  );
}

export default DeptStaff;