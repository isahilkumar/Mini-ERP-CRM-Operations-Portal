import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Edit, Plus } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string | null;
  imageUrl: string | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStockAlert: '10', location: '' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/products?limit=100', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setProducts(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, sku: p.sku, category: p.category || '', 
      unitPrice: p.unitPrice.toString(), currentStock: p.currentStock.toString(), 
      minStockAlert: p.minStockAlert.toString(), location: p.location || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('sku', formData.sku);
      form.append('category', formData.category);
      form.append('unitPrice', formData.unitPrice);
      form.append('currentStock', formData.currentStock);
      form.append('minStockAlert', formData.minStockAlert);
      form.append('location', formData.location);
      if (imageFile) form.append('image', imageFile);

      if (editingId) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, form, {
          headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:5000/api/products', form, {
          headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStockAlert: '10', location: '' });
      setImageFile(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Products & Inventory</h1>
        {user?.role !== 'SALES' && (
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {showForm ? 'Cancel' : <><Plus size={18}/> Add Product</>}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">SKU/Code *</label>
              <input type="text" className="form-input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input type="text" className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Location / Warehouse</label>
              <input type="text" className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price ($) *</label>
              <input type="number" step="0.01" className="form-input" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Current Stock *</label>
              <input type="number" className="form-input" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock Alert *</label>
              <input type="number" className="form-input" value={formData.minStockAlert} onChange={e => setFormData({...formData, minStockAlert: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Product Image</label>
              <input type="file" className="form-input" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">{editingId ? 'Update Product' : 'Save Product'}</button>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  {p.imageUrl ? 
                    <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `http://localhost:5000${p.imageUrl}`} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /> 
                    : <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                  }
                </td>
                <td style={{ fontWeight: 500 }}>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.category || '-'}</td>
                <td>{p.location || '-'}</td>
                <td>${p.unitPrice.toFixed(2)}</td>
                <td>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: p.currentStock <= p.minStockAlert ? '#ef4444' : '#10b981' 
                  }}>
                    {p.currentStock}
                  </span>
                  {p.currentStock <= p.minStockAlert && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: '#ef4444' }}>(Low)</span>}
                </td>
                <td>
                  {user?.role !== 'SALES' && (
                    <button className="btn" style={{ padding: '0.25rem', background: 'transparent', color: '#10b981' }} onClick={() => handleEdit(p)} title="Edit Product">
                      <Edit size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
