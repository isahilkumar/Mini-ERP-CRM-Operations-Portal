import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Package, ArrowRight } from 'lucide-react';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('SALES');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isRegistering) {
        const { data } = await axios.post('http://localhost:5000/api/auth/register', { name, email, password, role });
        login(data);
      } else {
        const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        login(data);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div className="animate-float" style={{ background: 'var(--primary-color)', padding: '1rem', borderRadius: '16px', boxShadow: 'var(--shadow-glow)' }}>
            <Package size={40} color="#fff" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>Mini ERP</span>
        </div>
        <h1 className="login-title animate-slide-up" style={{ animationDelay: '0.1s' }}>Manage your business seamlessly.</h1>
        <p className="login-subtitle animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Welcome to the ultimate Operations Portal. Manage your customers, track inventory in real-time, and process sales challans with a beautiful, lightning-fast interface.
        </p>
      </div>
      
      <div className="login-right">
        <div className="login-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
            {isRegistering ? 'Register to get access to the portal' : 'Enter your credentials to access the portal'}
          </p>
          
          {error && (
            <div className="animate-slide-up" style={{ animationDelay: '0.35s', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', color: '#fca5a5' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <div className="form-group animate-slide-up" style={{ animationDelay: '0.38s' }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group animate-slide-up" style={{ animationDelay: '0.39s' }}>
                  <label className="form-label">Role</label>
                  <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="ADMIN">Admin</option>
                    <option value="SALES">Sales</option>
                    <option value="WAREHOUSE">Warehouse</option>
                    <option value="ACCOUNTS">Accounts</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group animate-slide-up" style={{ marginBottom: '2.5rem', animationDelay: '0.5s' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary animate-slide-up" style={{ animationDelay: '0.6s', width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={isLoading}>
              {isLoading ? 'Authenticating...' : (
                <>{isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight size={20} /></>
              )}
            </button>
          </form>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.65s', marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isRegistering ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          {!isRegistering && (
            <div className="animate-slide-up" style={{ animationDelay: '0.7s', marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <p>Demo Credentials:</p>
              <p>Email: <strong>admin@example.com</strong> | Password: <strong>password123</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
