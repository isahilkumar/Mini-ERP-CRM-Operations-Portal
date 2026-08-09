import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Package, FileText, LogOut, LayoutDashboard, History, UserCog, ShieldAlert, ArrowLeft } from 'lucide-react';

const Layout = () => {
  const { user, originalAdminUser, exitImpersonation, logout } = useAuth();
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

          {user?.role === 'ADMIN' && (
            <NavLink to="/accounts" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <UserCog size={20} />
              Accounts
            </NavLink>
          )}
        </nav>
      </aside>
      <main className="main-content">
        {originalAdminUser && (
          <div style={{
            background: 'linear-gradient(90deg, #ea580c 0%, #c2410c 100%)',
            color: '#ffffff',
            padding: '0.6rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} />
              <span>
                Viewing as <strong>{user?.name}</strong> ({user?.role}) — Logged in via Admin (<strong>{originalAdminUser.name}</strong>)
              </span>
            </div>
            <button
              onClick={() => {
                exitImpersonation();
                navigate('/accounts');
              }}
              style={{
                background: '#ffffff',
                color: '#c2410c',
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }}
            >
              <ArrowLeft size={16} /> Exit & Return to Admin
            </button>
          </div>
        )}
        <header className="topbar" style={{
          height: '70px',
          background: '#ffffff',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0 2.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-color)' }}>{user?.name}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '2px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: user?.role === 'ADMIN' ? '#ffedd5' : user?.role === 'SALES' ? '#eff6ff' : user?.role === 'WAREHOUSE' ? '#f0fdf4' : '#f5f5f4',
                  color: user?.role === 'ADMIN' ? '#c2410c' : user?.role === 'SALES' ? '#1d4ed8' : user?.role === 'WAREHOUSE' ? '#166534' : '#57534e',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}>
                  {user?.role}
                </span>
              </div>
            </div>

            {(() => {
              const initials = user?.name
                ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U';
              return (
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.2)',
                  userSelect: 'none',
                }}>
                  {initials}
                </div>
              );
            })()}

            <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }} />

            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              <LogOut size={18} />
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
