import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Package, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { getApiUrl } from '../api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ customers: 0, products: 0, challans: 0 });

  const canSeeCustomers = user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS';
  const canSeeProducts = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE' || user?.role === 'SALES';
  const canSeeChallans = user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let cCount = 0, pCount = 0, chCount = 0;
        
        if (canSeeCustomers) {
          const res = await axios.get(getApiUrl('/customers?limit=1000'), { headers: { Authorization: `Bearer ${user?.token}` } });
          cCount = res.data.pagination ? res.data.pagination.total : res.data.length;
        }
        
        if (canSeeProducts) {
          const res = await axios.get(getApiUrl('/products?limit=1000'), { headers: { Authorization: `Bearer ${user?.token}` } });
          pCount = res.data.pagination ? res.data.pagination.total : res.data.length;
        }
        
        if (canSeeChallans) {
          const res = await axios.get(getApiUrl('/challans?limit=1000'), { headers: { Authorization: `Bearer ${user?.token}` } });
          chCount = (res.data.data || res.data).filter((c: any) => c.status === 'DRAFT').length;
        }

        setStats({ customers: cCount, products: pCount, challans: chCount });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [user, canSeeCustomers, canSeeProducts, canSeeChallans]);
  
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: '0.5rem' }}>
            Welcome back, <span style={{ color: 'var(--primary-color)' }}>{user?.name}</span>!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Here is what's happening with your operations today.</p>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.2s', animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, badgePulse 2s infinite', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', color: '#10b981', fontWeight: 600 }}>
          <TrendingUp size={18} /> System Online
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {canSeeCustomers && (
          <div className="stat-card animate-slide-up" style={{ borderTop: '4px solid #ea580c', animationDelay: '0.3s' }}>
            <Users className="stat-icon" size={120} color="#ea580c" />
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Customers</h3>
            <p style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0' }}>{stats.customers}</p>
            <Link to="/customers" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              View Database <ArrowRight size={16} />
            </Link>
          </div>
        )}
        
        {canSeeProducts && (
          <div className="stat-card animate-slide-up" style={{ borderTop: '4px solid #10B981', animationDelay: '0.4s' }}>
            <Package className="stat-icon" size={120} color="#10B981" />
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Products in Stock</h3>
            <p style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0' }}>{stats.products}</p>
            <Link to="/products" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              View Inventory <ArrowRight size={16} />
            </Link>
          </div>
        )}
        
        {canSeeChallans && (
          <div className="stat-card animate-slide-up" style={{ borderTop: '4px solid #F59E0B', animationDelay: '0.5s' }}>
            <FileText className="stat-icon" size={120} color="#F59E0B" />
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Challans</h3>
            <p style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0' }}>{stats.challans}</p>
            <Link to="/challans" style={{ color: '#F59E0B', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Process Orders <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {user?.role !== 'ACCOUNTS' && (
        <div style={{ marginTop: '2rem' }}>
          <h2 className="animate-slide-up" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-color)', animationDelay: '0.6s' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
              <Link to="/customers" className="quick-action-card animate-slide-up" style={{ animationDelay: '0.7s' }}>
                <div className="qa-icon-wrapper" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
                  <Users size={24} />
                </div>
                <div className="qa-text-wrapper">
                  <h4>Add New Customer</h4>
                  <p>Create a new CRM profile</p>
                </div>
              </Link>
            )}
            
            {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
              <Link to="/products" className="quick-action-card animate-slide-up" style={{ animationDelay: '0.8s' }}>
                <div className="qa-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  <Package size={24} />
                </div>
                <div className="qa-text-wrapper">
                  <h4>Update Inventory</h4>
                  <p>Add new products to stock</p>
                </div>
              </Link>
            )}
            
            {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
              <Link to="/challans" className="quick-action-card animate-slide-up" style={{ animationDelay: '0.9s' }}>
                <div className="qa-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                  <FileText size={24} />
                </div>
                <div className="qa-text-wrapper">
                  <h4>Create Sales Challan</h4>
                  <p>Draft a new delivery order</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
