import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Edit, Plus, Package, Search, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { getApiUrl, getImageUrl } from '../api';

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

// ── Image placeholder ──────────────────────────────────────────────────────

const ProductImage = ({
  imageUrl, name, size = 48, radius = 8,
}: { imageUrl: string | null; name: string; size?: number; radius?: number }) => {
  const [errored, setErrored] = useState(false);
  const src = imageUrl ? getImageUrl(imageUrl) : '';

  if (!src || errored) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6366f1', flexShrink: 0,
      }}>
        <Package size={size * 0.45} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, background: '#f1f5f9' }}
    />
  );
};

// ── Stock badge ────────────────────────────────────────────────────────────

const StockBadge = ({ stock, min }: { stock: number; min: number }) => {
  const low  = stock <= min;
  const out  = stock === 0;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
      background: out ? '#fee2e2' : low ? '#fef3c7' : '#d1fae5',
      color:      out ? '#991b1b' : low ? '#92400e' : '#065f46',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      {out && <AlertTriangle size={10} />}
      {stock} {out ? 'Out of stock' : low ? '(Low)' : 'units'}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const Products = () => {
  const { user } = useAuth();

  const [products,  setProducts]  = useState<Product[]>([]);
  const [search,    setSearch]    = useState('');
  const [view,      setView]      = useState<'grid' | 'list'>('grid');

  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unitPrice: '',
    currentStock: '', minStockAlert: '10', location: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(getApiUrl('/products?limit=200'), {
        headers: { Authorization: `Bearer ${user?.token}` },
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
      minStockAlert: p.minStockAlert.toString(), location: p.location || '',
    });
    setPreviewUrl(p.imageUrl ? getImageUrl(p.imageUrl) : null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (imageFile) form.append('image', imageFile);

      if (editingId) {
        await axios.put(getApiUrl(`/products/${editingId}`), form, {
          headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post(getApiUrl('/products'), form, {
          headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowForm(false);
      setEditingId(null);
      setPreviewUrl(null);
      setImageFile(null);
      setFormData({ name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStockAlert: '10', location: '' });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const canEdit = user?.role !== 'SALES';

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Products & Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{products.length} products total</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--surface-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setView('grid')}
              style={{ padding: '0.45rem 0.75rem', border: 'none', cursor: 'pointer', background: view === 'grid' ? 'var(--primary-color)' : '#fff', color: view === 'grid' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            ><LayoutGrid size={16} /></button>
            <button
              onClick={() => setView('list')}
              style={{ padding: '0.45rem 0.75rem', border: 'none', cursor: 'pointer', background: view === 'list' ? 'var(--primary-color)' : '#fff', color: view === 'list' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--surface-border)' }}
            ><List size={16} /></button>
          </div>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => { setShowForm(!showForm); setEditingId(null); setPreviewUrl(null); setFormData({ name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStockAlert: '10', location: '' }); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {showForm ? 'Cancel' : <><Plus size={18} /> Add Product</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">SKU / Code *</label>
                <input type="text" className="form-input" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Location / Warehouse</label>
                <input type="text" className="form-input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Price (₹) *</label>
                <input type="number" step="0.01" className="form-input" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Current Stock *</label>
                <input type="number" className="form-input" value={formData.currentStock} onChange={e => setFormData({ ...formData, currentStock: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Min Stock Alert *</label>
                <input type="number" className="form-input" value={formData.minStockAlert} onChange={e => setFormData({ ...formData, minStockAlert: e.target.value })} required />
              </div>

              {/* Image upload with preview */}
              <div className="form-group">
                <label className="form-label">Product Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--surface-border)' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 8, border: '2px dashed var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <Package size={24} />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="form-input" style={{ flex: 1 }} onChange={handleImageChange} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">{editingId ? 'Update Product' : 'Save Product'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search bar ── */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by name, SKU or category…"
          className="form-input"
          style={{ paddingLeft: '2.25rem' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {filtered.map(p => (
            <div
              key={p.id}
              className="card"
              style={{ padding: 0, overflow: 'hidden', marginBottom: 0, display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
            >
              {/* Product image area */}
              <div style={{ height: '160px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {p.imageUrl ? (
                  <img
                    src={getImageUrl(p.imageUrl)}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                    <Package size={40} />
                    <span style={{ fontSize: '0.75rem' }}>No image</span>
                  </div>
                )}
                {/* Stock badge overlay */}
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                  <StockBadge stock={p.currentStock} min={p.minStockAlert} />
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color)', lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                {p.category && <div style={{ fontSize: '0.75rem', color: '#6366f1', background: '#eef2ff', padding: '1px 7px', borderRadius: '999px', alignSelf: 'flex-start' }}>{p.category}</div>}
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669' }}>₹{p.unitPrice.toFixed(2)}</span>
                  {canEdit && (
                    <button
                      className="btn"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', background: 'var(--primary-light)', color: 'var(--primary-color)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => handleEdit(p)}
                    >
                      <Edit size={13} /> Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Package size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div>No products found.</div>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Image', 'SKU', 'Name', 'Category', 'Location', 'Price', 'Stock', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--surface-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--surface-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <ProductImage imageUrl={p.imageUrl} name={p.name} size={48} radius={8} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.sku}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.category || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.location || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#059669' }}>₹{p.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StockBadge stock={p.currentStock} min={p.minStockAlert} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {canEdit && (
                      <button
                        className="btn"
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', background: 'var(--primary-light)', color: 'var(--primary-color)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => handleEdit(p)}
                      >
                        <Edit size={13} /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Products;
