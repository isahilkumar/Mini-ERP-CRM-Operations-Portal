import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Package, FileText, LogOut, LayoutDashboard, History } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Package size={24} color="#ea580c" />
          Mini ERP
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS') && (
            <NavLink to="/customers" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Users size={20} />
              Customers
            </NavLink>
          )}
          
          {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE' || user?.role === 'SALES') && (
            <NavLink to="/products" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Package size={20} />
              Products
            </NavLink>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS') && (
            <NavLink to="/challans" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <FileText size={20} />
              Challans
            </NavLink>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
            <NavLink to="/stock-logs" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <History size={20} />
              Stock Logs
            </NavLink>
          )}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 500 }}>{user?.name} ({user?.role})</span>
            <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: '#dc2626' }}>
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
