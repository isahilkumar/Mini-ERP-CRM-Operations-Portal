import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Edit, Eye, Search, Plus } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  mobileNumber: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: string;
  address: string | null;
  status: string;
  followUpDate: string | null;
  notes: string | null;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', mobileNumber: '', email: '', businessName: '', gstNumber: '',
    customerType: 'RETAIL', address: '', status: 'LEAD', followUpDate: '', notes: ''
  });

  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/customers?limit=100', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setCustomers(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      name: c.name, mobileNumber: c.mobileNumber, email: c.email || '', businessName: c.businessName || '',
      gstNumber: c.gstNumber || '', customerType: c.customerType, address: c.address || '',
      status: c.status, followUpDate: c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '', notes: c.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/customers/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/customers', payload, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', mobileNumber: '', email: '', businessName: '', gstNumber: '', customerType: 'RETAIL', address: '', status: 'LEAD', followUpDate: '', notes: '' });
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save customer. You may not have permission.');
    }
  };

  const handleAddNote = async () => {
    if (!viewingCustomer || !newNote.trim()) return;
    try {
      const updatedNotes = viewingCustomer.notes 
        ? `${viewingCustomer.notes}\n[${new Date().toLocaleDateString()}]: ${newNote}`
        : `[${new Date().toLocaleDateString()}]: ${newNote}`;
      
      const payload = { ...viewingCustomer, notes: updatedNotes };
      await axios.put(`http://localhost:5000/api/customers/${viewingCustomer.id}`, payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      setViewingCustomer({ ...viewingCustomer, notes: updatedNotes });
      setNewNote('');
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobileNumber.includes(search) || 
    (c.businessName && c.businessName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Customers CRM</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search customers..." 
              style={{ paddingLeft: '35px', width: '250px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {showForm ? 'Cancel' : <><Plus size={18}/> Add Customer</>}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input type="text" className="form-input" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input type="text" className="form-input" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input type="text" className="form-input" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Type</label>
              <select className="form-input" value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value})}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input type="date" className="form-input" value={formData.followUpDate} onChange={e => setFormData({...formData, followUpDate: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Address</label>
              <input type="text" className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Follow-up Notes</label>
              <textarea className="form-input" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">{editingId ? 'Update Customer' : 'Save Customer'}</button>
        </form>
      )}

      {viewingCustomer ? (
        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2>Customer Details</h2>
            <button className="btn" onClick={() => setViewingCustomer(null)}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <p><strong>Name:</strong> {viewingCustomer.name}</p>
            <p><strong>Business:</strong> {viewingCustomer.businessName || 'N/A'}</p>
            <p><strong>Mobile:</strong> {viewingCustomer.mobileNumber}</p>
            <p><strong>Email:</strong> {viewingCustomer.email || 'N/A'}</p>
            <p><strong>Type:</strong> {viewingCustomer.customerType}</p>
            <p><strong>Status:</strong> {viewingCustomer.status}</p>
            <p><strong>GST:</strong> {viewingCustomer.gstNumber || 'N/A'}</p>
            <p><strong>Follow-up:</strong> {viewingCustomer.followUpDate ? new Date(viewingCustomer.followUpDate).toLocaleDateString() : 'None'}</p>
            <p style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {viewingCustomer.address || 'N/A'}</p>
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
              <strong>Follow-up Notes:</strong>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', whiteSpace: 'pre-wrap', minHeight: '60px', marginTop: '0.5rem', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                {viewingCustomer.notes || 'No notes yet.'}
              </div>
              {user?.role !== 'ACCOUNTS' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Type a new follow-up note..." 
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={handleAddNote}>Add Note</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Business</th>
                <th>Mobile</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.businessName || '-'}</td>
                  <td>{c.mobileNumber}</td>
                  <td>{c.customerType}</td>
                  <td><span className={`status-badge ${c.status === 'ACTIVE' ? 'status-confirmed' : 'status-draft'}`}>{c.status}</span></td>
                  <td>
                    <button className="btn" style={{ padding: '0.25rem', marginRight: '0.5rem', background: 'transparent', color: 'var(--primary-color)' }} onClick={() => setViewingCustomer(c)} title="View Details">
                      <Eye size={18} />
                    </button>
                    {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
                      <button className="btn" style={{ padding: '0.25rem', background: 'transparent', color: '#10b981' }} onClick={() => handleEdit(c)} title="Edit Customer">
                        <Edit size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Customers;
