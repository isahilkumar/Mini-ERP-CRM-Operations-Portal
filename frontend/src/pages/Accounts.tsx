import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, Search, Plus, ShieldAlert, LogIn, ToggleLeft, ToggleRight } from 'lucide-react';
import { getApiUrl } from '../api';

interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

const Accounts = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES',
    isActive: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user: currentUser, impersonate } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(getApiUrl('/users'), {
        headers: { Authorization: `Bearer ${currentUser?.token}` }
      });
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (u: UserAccount) => {
    setEditingId(u.id);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // Password empty on edit unless user types a new one
      role: u.role,
      isActive: u.isActive !== undefined ? u.isActive : true,
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleToggleStatus = async (u: UserAccount) => {
    if (u.id === currentUser?.id) {
      alert('You cannot turn OFF your own admin account.');
      return;
    }
    const newStatus = u.isActive === false ? true : false;
    try {
      setError('');
      setSuccess('');
      await axios.put(getApiUrl(`/users/${u.id}`), { isActive: newStatus }, {
        headers: { Authorization: `Bearer ${currentUser?.token}` }
      });
      setSuccess(`Status for ${u.name} toggled to ${newStatus ? 'ON (Active)' : 'OFF (Inactive)'}`);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleImpersonate = async (u: UserAccount) => {
    if (u.id === currentUser?.id) {
      alert('You are already logged in as this Admin account.');
      return;
    }
    if (u.isActive === false) {
      alert('Cannot enter a deactivated (OFF) account. Please toggle status to ON first.');
      return;
    }
    try {
      setError('');
      const { data } = await axios.post(getApiUrl(`/users/${u.id}/impersonate`), {}, {
        headers: { Authorization: `Bearer ${currentUser?.token}` }
      });
      impersonate(data);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to enter account view');
    }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user account?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const { data } = await axios.delete(getApiUrl(`/users/${id}`), {
        headers: { Authorization: `Bearer ${currentUser?.token}` }
      });
      setSuccess(data.message || 'User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      setError('Name, email, and role are required fields.');
      return;
    }
    if (!editingId && !formData.password) {
      setError('Password is required for new accounts.');
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await axios.put(getApiUrl(`/users/${editingId}`), payload, {
          headers: { Authorization: `Bearer ${currentUser?.token}` }
        });
        setSuccess('User updated successfully');
      } else {
        await axios.post(getApiUrl('/users'), payload, {
          headers: { Authorization: `Bearer ${currentUser?.token}` }
        });
        setSuccess('User created successfully');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', role: 'SALES', isActive: true });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h1>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          You do not have the required permissions to view this page. Admin access only.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { background: '#ffedd5', color: '#c2410c' };
      case 'SALES':
        return { background: '#eff6ff', color: '#1d4ed8' };
      case 'WAREHOUSE':
        return { background: '#f0fdf4', color: '#166534' };
      case 'ACCOUNTS':
        return { background: '#f5f5f4', color: '#57534e' };
      default:
        return { background: '#f5f5f4', color: '#57534e' };
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Accounts Control Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Full admin control: Toggle ON/OFF account status, enter other user accounts, edit details and reset roles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search users..."
              style={{ paddingLeft: '35px', width: '250px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', email: '', password: '', role: 'SALES', isActive: true });
              setError('');
              setSuccess('');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {showForm ? 'Cancel' : <><Plus size={18} /> Add User</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="animate-slide-up" style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', color: '#991b1b' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="animate-slide-up" style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', color: '#065f46' }}>
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fafaf9', border: '1px solid var(--surface-border)', borderRadius: '1rem' }} className="animate-fade-in">
          <h2 style={{ marginBottom: '1.25rem' }}>{editingId ? 'Edit User Account' : 'Create User Account'}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Password {editingId ? '(Leave blank to keep unchanged)' : '*'}
              </label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingId ? '••••••••' : 'Enter password'}
                required={!editingId}
              />
            </div>
            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select
                className="form-input"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="SALES">Sales</option>
                <option value="WAREHOUSE">Warehouse</option>
                <option value="ACCOUNTS">Accounts</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Account Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: 0
                  }}
                >
                  {formData.isActive ? (
                    <ToggleRight size={32} color="#10b981" />
                  ) : (
                    <ToggleLeft size={32} color="#9ca3af" />
                  )}
                </button>
                <span style={{ fontWeight: 600, color: formData.isActive ? '#10b981' : '#6b7280' }}>
                  {formData.isActive ? 'Active (ON)' : 'Inactive (OFF)'}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save Changes' : 'Create Account'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: '', email: '', password: '', role: 'SALES', isActive: true });
                setError('');
              }}
              style={{ background: '#f5f5f4', color: '#57534e' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status (ON/OFF)</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading user accounts...
                </td>
              </tr>
            ) : filteredUsers.map(u => (
              <tr key={u.id} style={{ background: u.id === currentUser?.id ? '#fffbeb' : 'none' }}>
                <td>{u.id}</td>
                <td style={{ fontWeight: 600 }}>
                  {u.name} {u.id === currentUser?.id && <span style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: 'bold' }}>(You)</span>}
                </td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      ...getRoleBadgeStyle(u.role)
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(u)}
                    disabled={u.id === currentUser?.id}
                    title={u.id === currentUser?.id ? 'Cannot turn OFF your own admin account' : 'Click to toggle status ON/OFF'}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      transition: 'background 0.2s',
                    }}
                  >
                    {u.isActive !== false ? (
                      <span style={{
                        background: '#d1fae5',
                        color: '#047857',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> ON
                      </span>
                    ) : (
                      <span style={{
                        background: '#f3f4f6',
                        color: '#4b5563',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ca3af' }} /> OFF
                      </span>
                    )}
                  </button>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {u.id !== currentUser?.id && (
                      <button
                        className="btn"
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: '#fff7ed',
                          color: '#ea580c',
                          border: '1px solid #ffedd5',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        onClick={() => handleImpersonate(u)}
                        title={`Go Inside ${u.name}'s account view`}
                      >
                        <LogIn size={15} /> Go Inside
                      </button>
                    )}
                    <button
                      className="btn"
                      style={{ padding: '0.25rem', background: 'transparent', color: '#10b981' }}
                      onClick={() => handleEdit(u)}
                      title="Edit User"
                    >
                      <Edit size={18} />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        className="btn"
                        style={{ padding: '0.25rem', background: 'transparent', color: '#ef4444' }}
                        onClick={() => handleDelete(u.id)}
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  No user accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounts;
